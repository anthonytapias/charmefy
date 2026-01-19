from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
import jwt
from django.conf import settings
from datetime import datetime, timedelta
from functools import wraps
from .models import Conversation


def get_user_from_token(request):
    """Extract user from JWT token in Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id=payload['user_id'])
        return user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
        return None


def generate_token(user):
    """Generate JWT token for user."""
    payload = {
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user."""
    data = request.data
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        username=username,
        email=email,
        password=make_password(password)
    )

    token = generate_token(user)

    return Response({
        'message': 'Registration successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT token."""
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Find user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check password
    user = authenticate(username=user.username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    token = generate_token(user)

    return Response({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
    })


@api_view(['GET'])
def get_profile(request):
    """Get current user's profile."""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    # Get user stats
    session_id = request.headers.get('X-Session-ID', '')
    chat_count = Conversation.objects.filter(user_session=session_id).count()

    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'dateJoined': user.date_joined.strftime('%B %Y'),
            'stats': {
                'chats': chat_count,
                'characters': 0,
                'images': 0,
                'favorites': 0,
            }
        }
    })


@api_view(['PUT'])
def update_profile(request):
    """Update user's profile."""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # Check if username is taken by another user
    if username and username != user.username:
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
        user.username = username

    # Check if email is taken by another user
    if email and email != user.email:
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = email

    # Update password if provided
    if password:
        user.password = make_password(password)

    user.save()

    return Response({
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
    })


@api_view(['DELETE'])
def delete_account(request):
    """Delete user's account."""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    user.delete()

    return Response({'message': 'Account deleted successfully'})


@api_view(['GET'])
def recent_chats(request):
    """Get recent conversations for a user session."""
    session_id = request.COOKIES.get('session_id') or request.headers.get('X-Session-ID')

    if not session_id:
        return Response({'chats': []})

    conversations = Conversation.objects.filter(
        user_session=session_id
    ).order_by('-updated_at')[:10]

    chats = []
    for conv in conversations:
        # Get the last message
        last_message = conv.messages.last()
        last_message_preview = ''
        if last_message:
            last_message_preview = last_message.content[:40] + '...' if len(last_message.content) > 40 else last_message.content

        chats.append({
            'id': conv.character_id,
            'name': conv.character_name,
            'avatar': conv.character_avatar,
            'lastMessage': last_message_preview or 'Start a conversation...',
            'time': conv.updated_at.strftime('%H:%M') if last_message else '',
        })

    return Response({'chats': chats})
