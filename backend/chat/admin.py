from django.contrib import admin
from .models import Conversation, Message, Subscription

admin.site.register(Conversation)
admin.site.register(Message)
admin.site.register(Subscription)
