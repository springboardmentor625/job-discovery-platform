from rest_framework import serializers

from .models import Swipe


class SwipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Swipe
        fields = ["id", "job", "direction", "created_at"]
        read_only_fields = ["created_at"]