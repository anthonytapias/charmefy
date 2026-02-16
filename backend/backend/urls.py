from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from chat.views import (
    recent_chats, register, login, get_profile, update_profile, delete_account,
    create_checkout_session, stripe_webhook, subscription_status, cancel_subscription
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth API routes
    path('api/auth/register/', register, name='register'),
    path('api/auth/login/', login, name='login'),
    path('api/auth/profile/', get_profile, name='get_profile'),
    path('api/auth/profile/update/', update_profile, name='update_profile'),
    path('api/auth/profile/delete/', delete_account, name='delete_account'),
    # Chat API routes
    path('api/chats/recent/', recent_chats, name='recent_chats'),
    # Stripe API routes
    path('api/stripe/create-checkout-session/', create_checkout_session, name='create_checkout_session'),
    path('api/stripe/webhook/', stripe_webhook, name='stripe_webhook'),
    path('api/stripe/subscription-status/', subscription_status, name='subscription_status'),
    path('api/stripe/cancel-subscription/', cancel_subscription, name='cancel_subscription'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])

# Catch-all for React Router - must be last
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='frontend'),
]
