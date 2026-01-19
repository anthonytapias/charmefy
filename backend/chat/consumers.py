import json
import uuid
import traceback
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from openai import AsyncOpenAI
from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.character_id = self.scope['url_route']['kwargs']['character_id']
        self.messages = []
        self.system_prompt = None
        self.character_name = None
        self.character_avatar = None
        self.conversation = None
        self.initialized = False
        self.session_id = None  # Will be set from init message

        # Initialize DeepSeek client
        self.client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com"
        )

        await self.accept()
        print(f"WebSocket connected for character {self.character_id}")

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected: {close_code}")

    @database_sync_to_async
    def get_or_create_conversation(self):
        conversation, created = Conversation.objects.get_or_create(
            user_session=self.session_id,
            character_id=int(self.character_id),
            defaults={
                'character_name': self.character_name,
                'character_avatar': self.character_avatar or '',
            }
        )
        print(f"Conversation {'created' if created else 'loaded'}: {conversation.id}")
        return conversation

    @database_sync_to_async
    def save_message(self, sender, content):
        if self.conversation:
            msg = Message.objects.create(
                conversation=self.conversation,
                sender=sender,
                content=content
            )
            # Update conversation timestamp
            self.conversation.save()
            print(f"Message saved: {sender} - {content[:50]}...")
            return msg
        return None

    @database_sync_to_async
    def load_messages(self):
        if self.conversation:
            messages = list(self.conversation.messages.all().values('sender', 'content'))
            print(f"Loaded {len(messages)} messages from history")
            return messages
        return []

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            print(f"Received message type: {message_type}")

            if message_type == 'init':
                # Get session ID from client
                self.session_id = data.get('sessionId')
                if not self.session_id:
                    self.session_id = str(uuid.uuid4())

                # Store character info
                character = data.get('character', {})
                self.system_prompt = character.get('systemPrompt', '')
                self.character_name = character.get('name', 'AI')
                self.character_avatar = character.get('avatar', '')

                print(f"Initializing chat with {self.character_name}, session {self.session_id[:8]}...")

                # Get or create conversation
                self.conversation = await self.get_or_create_conversation()

                # Load existing messages from database
                saved_messages = await self.load_messages()

                # Initialize conversation with system prompt
                self.messages = [
                    {"role": "system", "content": self.system_prompt}
                ]

                # Add saved messages to context
                for msg in saved_messages:
                    role = "user" if msg['sender'] == 'user' else "assistant"
                    self.messages.append({"role": role, "content": msg['content']})

                self.initialized = True

                # Send saved messages to client
                if saved_messages:
                    await self.send(text_data=json.dumps({
                        'type': 'history',
                        'messages': saved_messages
                    }))

                # Send ready confirmation
                await self.send(text_data=json.dumps({
                    'type': 'ready'
                }))

            elif message_type == 'message':
                content = data.get('content', '')
                print(f"User message: {content[:50]}...")

                if not self.initialized or not self.conversation:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Chat not initialized. Please refresh the page.'
                    }))
                    return

                # Add user message to history
                self.messages.append({"role": "user", "content": content})

                # Save user message to database
                await self.save_message('user', content)

                # Send typing indicator
                await self.send(text_data=json.dumps({
                    'type': 'typing'
                }))

                try:
                    print("Calling DeepSeek API...")
                    # Call DeepSeek API
                    response = await self.client.chat.completions.create(
                        model="deepseek-chat",
                        messages=self.messages,
                        max_tokens=500,
                        temperature=0.8,
                    )

                    # Get AI response
                    ai_message = response.choices[0].message.content
                    print(f"AI response: {ai_message[:50]}...")

                    # Add AI response to history
                    self.messages.append({"role": "assistant", "content": ai_message})

                    # Save AI response to database
                    await self.save_message('character', ai_message)

                    # Send response to client
                    await self.send(text_data=json.dumps({
                        'type': 'message',
                        'content': ai_message
                    }))

                except Exception as e:
                    error_msg = str(e)
                    print(f"DeepSeek API error: {error_msg}")
                    traceback.print_exc()
                    # Send error message
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f'AI Error: {error_msg}'
                    }))

        except Exception as e:
            print(f"Error processing message: {e}")
            traceback.print_exc()
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
