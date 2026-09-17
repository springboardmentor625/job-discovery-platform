"""
Ensures every User has a Profile, regardless of how the account was
created — our own /register/ endpoint, or a Google/GitHub social login via
django-allauth (which creates the User directly, bypassing RegisterSerializer
entirely). A post_save signal is the one place both paths pass through.
"""
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile

User = get_user_model()


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)