from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
import jwt
import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from datetime import datetime, timedelta, timezone
from functools import wraps
from .models import Conversation, Subscription


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


@api_view(['POST'])
@permission_classes([AllowAny])
def create_checkout_session(request):
    """Create a Stripe Checkout Session for subscription."""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        subscription = Subscription.objects.filter(user=user).first()

        if subscription and subscription.stripe_customer_id:
            customer_id = subscription.stripe_customer_id
        else:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={'user_id': user.id}
            )
            customer_id = customer.id

            if not subscription:
                subscription = Subscription.objects.create(
                    user=user,
                    stripe_customer_id=customer_id,
                )
            else:
                subscription.stripe_customer_id = customer_id
                subscription.save()

        if subscription.is_active:
            return Response({'error': 'Already subscribed'}, status=status.HTTP_400_BAD_REQUEST)

        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': settings.STRIPE_PRICE_ID,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.build_absolute_uri('/profile?tab=subscription&status=success'),
            cancel_url=request.build_absolute_uri('/profile?tab=subscription&status=canceled'),
            metadata={'user_id': user.id},
        )

        return Response({'checkout_url': checkout_session.url})

    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    event_type = event['type']
    data = event['data']['object']

    if event_type == 'checkout.session.completed':
        customer_id = data.get('customer')
        subscription_id = data.get('subscription')
        user_id = data.get('metadata', {}).get('user_id')

        if user_id:
            try:
                sub, created = Subscription.objects.get_or_create(
                    user_id=int(user_id),
                    defaults={'stripe_customer_id': customer_id}
                )
                sub.stripe_subscription_id = subscription_id
                sub.stripe_customer_id = customer_id
                sub.status = 'active'
                sub.save()
            except Exception as e:
                print(f"Webhook error (checkout.session.completed): {e}")

    elif event_type == 'customer.subscription.updated':
        subscription_id = data.get('id')
        sub_status = data.get('status')
        current_period_end = data.get('current_period_end')

        try:
            sub = Subscription.objects.get(stripe_subscription_id=subscription_id)
            sub.status = sub_status
            if current_period_end:
                sub.current_period_end = datetime.fromtimestamp(current_period_end, tz=timezone.utc)
            sub.save()
        except Subscription.DoesNotExist:
            pass

    elif event_type == 'customer.subscription.deleted':
        subscription_id = data.get('id')
        try:
            sub = Subscription.objects.get(stripe_subscription_id=subscription_id)
            sub.status = 'canceled'
            sub.save()
        except Subscription.DoesNotExist:
            pass

    return HttpResponse(status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def subscription_status(request):
    """Get current user's subscription status."""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        sub = Subscription.objects.get(user=user)
        return Response({
            'subscribed': sub.is_active,
            'status': sub.status,
            'current_period_end': sub.current_period_end.isoformat() if sub.current_period_end else None,
        })
    except Subscription.DoesNotExist:
        return Response({
            'subscribed': False,
            'status': 'none',
            'current_period_end': None,
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_subscription(request):
    """Cancel the user's subscription at period end."""
    user = get_user_from_token(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        sub = Subscription.objects.get(user=user)
        if not sub.stripe_subscription_id:
            return Response({'error': 'No active subscription'}, status=status.HTTP_400_BAD_REQUEST)

        stripe.Subscription.modify(
            sub.stripe_subscription_id,
            cancel_at_period_end=True,
        )

        return Response({'message': 'Subscription will cancel at end of billing period'})

    except Subscription.DoesNotExist:
        return Response({'error': 'No subscription found'}, status=status.HTTP_404_NOT_FOUND)
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
