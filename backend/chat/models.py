from django.db import models
from django.contrib.auth.models import User


class Conversation(models.Model):
    """Represents a conversation between a user and a character."""
    user_session = models.CharField(max_length=255)  # Session ID for anonymous users
    character_id = models.IntegerField()
    character_name = models.CharField(max_length=100)
    character_avatar = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user_session', 'character_id']

    def __str__(self):
        return f"Conversation with {self.character_name} ({self.user_session[:8]}...)"


class Message(models.Model):
    """Represents a single message in a conversation."""
    SENDER_CHOICES = [
        ('user', 'User'),
        ('character', 'Character'),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}..."


class Subscription(models.Model):
    """Tracks a user's Stripe subscription."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('canceled', 'Canceled'),
        ('past_due', 'Past Due'),
        ('incomplete', 'Incomplete'),
        ('trialing', 'Trialing'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='incomplete')
    current_period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"

    @property
    def is_active(self):
        return self.status in ('active', 'trialing')
