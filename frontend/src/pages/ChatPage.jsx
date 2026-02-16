import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BaseChat } from '../components/chat';

// Character data - in production this would come from an API/database
const charactersData = {
  1: {
    id: 1,
    name: 'Jemma',
    avatar: 'https://images.unsplash.com/photo-1597072622260-42c5db534535?w=400&h=500&fit=crop',
    tags: ['Friend', '26', 'Playful', 'Cute'],
    description: 'Jemma is your best friend who just went through a breakup. She invited you over for a movie night to take her mind off things. Between the laughter and late-night talks, there might be more to your friendship than you thought.',
    systemPrompt: 'You are Jemma, a 26-year-old woman who just went through a breakup. You invited your best friend over for comfort and company. You are playful, warm, and a little vulnerable right now. You enjoy teasing your friend and have a naturally flirty personality. Use casual speech and occasionally include *actions* in asterisks.',
  },
  2: {
    id: 2,
    name: 'Amelia',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop',
    tags: ['Your Boss', 'Confident', '32', 'Professional'],
    description: 'Amelia is your boss at a prestigious law firm. She\'s known for her sharp mind and even sharper suits. Late nights at the office have led to interesting conversations and undeniable chemistry.',
    systemPrompt: 'You are Amelia, a 32-year-old successful lawyer and boss at a prestigious law firm. You are confident, intelligent, and charismatic. You have a commanding presence and enjoy witty banter. Be professional but with underlying warmth and chemistry. Use sophisticated language and occasionally include *actions* in asterisks.',
  },
  3: {
    id: 3,
    name: 'Sanisha Mander',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop',
    tags: ['Teacher', '24', 'Charming', 'Witty'],
    description: 'Sanisha is a young literature teacher who just started at your college. Her passion for books is contagious, and her classes are always packed.',
    systemPrompt: 'You are Sanisha, a 24-year-old literature teacher at a college. You are charming, witty, and deeply intellectual. You love discussing books and connecting with people through literature. Be warm, engaging, and include literary references. Use *actions* in asterisks occasionally.',
  },
  4: {
    id: 4,
    name: 'Heather',
    avatar: 'https://images.unsplash.com/photo-1760552069335-07d43ca826f4?w=400&h=500&fit=crop',
    tags: ['Nurse', '27', 'Caring', 'Patient'],
    description: 'Heather is a night shift nurse who\'s been taking care of you during your hospital stay. Her warm smile and gentle nature make the long nights a little more bearable.',
    systemPrompt: 'You are Heather, a 27-year-old night shift nurse. You are caring, patient, and have a warm bedside manner. You genuinely enjoy looking after people and making them feel comfortable. Be warm, attentive, and naturally charming. Use *actions* in asterisks.',
  },
  5: {
    id: 5,
    name: 'Emma Thompson',
    avatar: 'https://images.unsplash.com/photo-1576779814519-d1eaffec2a3f?w=400&h=500&fit=crop',
    tags: ['Neighbor', '25', 'Friendly', 'Sweet'],
    description: 'Emma just moved in next door. She\'s always baking cookies and finding excuses to come over. Her sunny personality is impossible not to fall for.',
    systemPrompt: 'You are Emma, a 25-year-old who just moved next door. You are sweet, friendly, and love baking. You find excuses to visit your neighbor and enjoy getting to know new people. Be cheerful, warm, and genuinely interested. Use *actions* in asterisks.',
  },
  7: {
    id: 7,
    name: 'Amanda Black',
    avatar: 'https://images.unsplash.com/photo-1771149873368-782ddf96092c?w=400&h=500&fit=crop',
    tags: ['Artist', '29', 'Creative', 'Bold', 'Mysterious'],
    description: 'Amanda is an avant-garde artist whose work explores the depths of human emotion. She\'s invited you to her studio for a private showing.',
    systemPrompt: 'You are Amanda, a 29-year-old avant-garde artist. You are creative, bold, and mysterious. Your art explores raw human emotion and connection. Be artistic in your speech, use metaphors, and have an intellectually captivating presence. Use *actions* in asterisks.',
  },
  8: {
    id: 8,
    name: 'Jessica Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
    tags: ['Cheerleader', '22', 'Energetic', 'Fun'],
    description: 'Jessica is the head cheerleader at your college. Beneath the pom-poms and school spirit is someone looking for genuine connection.',
    systemPrompt: 'You are Jessica, a 22-year-old head cheerleader at college. You are energetic, fun, and outgoing. Despite appearances, you want genuine connection beyond superficial interactions. Be bubbly but show depth. Use *actions* in asterisks.',
  },
};

// Default character if none specified
const defaultCharacter = charactersData[1];

// Helper to get/set session ID - includes user ID when logged in
const getSessionId = () => {
  const user = localStorage.getItem('user');
  const userId = user ? JSON.parse(user).id : null;

  // Use user-specific session key if logged in
  const sessionKey = userId ? `session_id_user_${userId}` : 'session_id_guest';

  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = userId ? `user_${userId}_${crypto.randomUUID()}` : `guest_${crypto.randomUUID()}`;
    localStorage.setItem(sessionKey, sessionId);
  }
  return sessionId;
};

// Check if user is logged in
const isLoggedIn = () => !!localStorage.getItem('token');

const ChatPage = () => {
  const { characterId } = useParams();
  const character = characterId ? charactersData[characterId] || defaultCharacter : defaultCharacter;

  const [messages, setMessages] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef(null);
  const messageIdRef = useRef(1);
  const characterRef = useRef(character);
  const loggedIn = isLoggedIn();
  const sessionId = loggedIn ? getSessionId() : null;

  // Keep character ref updated
  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  // Ref to store fetchRecentChats to avoid useEffect dependency issues
  const fetchRecentChatsRef = useRef(null);

  // Fetch recent chats from API
  const fetchRecentChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats/recent/', {
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      const data = await response.json();
      setRecentChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    }
  }, [sessionId]);

  // Keep ref updated
  useEffect(() => {
    fetchRecentChatsRef.current = fetchRecentChats;
  }, [fetchRecentChats]);

  // Fetch recent chats on mount only (only if logged in)
  useEffect(() => {
    if (loggedIn) {
      fetchRecentChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // Connect to WebSocket when character changes (only if logged in)
  useEffect(() => {
    // Reset messages when character changes
    setMessages([]);
    messageIdRef.current = 1;

    // Don't connect WebSocket if not logged in
    if (!loggedIn) {
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Create WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat/${character.id}/`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Send character info and session ID to backend
      const currentChar = characterRef.current;
      ws.send(JSON.stringify({
        type: 'init',
        sessionId: sessionId,
        character: {
          id: currentChar.id,
          name: currentChar.name,
          avatar: currentChar.avatar,
          systemPrompt: currentChar.systemPrompt,
        }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'session') {
        // Store session ID if provided by server
        if (data.session_id) {
          localStorage.setItem('session_id', data.session_id);
        }
      } else if (data.type === 'history') {
        // Load message history
        const historyMessages = data.messages.map((msg) => ({
          id: messageIdRef.current++,
          sender: msg.sender,
          content: msg.content,
        }));
        setMessages(historyMessages);
      } else if (data.type === 'message') {
        setIsTyping(false);
        const newMessage = {
          id: messageIdRef.current++,
          sender: 'character',
          content: data.content,
        };
        setMessages(prev => [...prev, newMessage]);
        // Refresh recent chats after receiving a message (use ref to avoid dependency)
        if (fetchRecentChatsRef.current) {
          fetchRecentChatsRef.current();
        }
      } else if (data.type === 'typing') {
        setIsTyping(true);
      } else if (data.type === 'error') {
        console.error('WebSocket error:', data.message);
        setIsTyping(false);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // Cleanup on unmount or character change
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, loggedIn]);

  const handleSendMessage = (content) => {
    // Don't allow sending messages if not logged in
    if (!loggedIn) {
      return;
    }

    // Add user message to UI
    const userMessage = {
      id: messageIdRef.current++,
      sender: 'user',
      content,
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: content,
      }));
      setIsTyping(true);
    } else {
      console.error('WebSocket not connected');
    }
  };

  const handleGenerateImage = () => {
    console.log('Generate image clicked');
    // TODO: Implement image generation
  };

  return (
    <BaseChat
      character={character}
      messages={messages}
      recentChats={recentChats}
      onSendMessage={handleSendMessage}
      onGenerateImage={handleGenerateImage}
      isTyping={isTyping}
      isLoggedIn={loggedIn}
    />
  );
};

export default ChatPage;
