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
