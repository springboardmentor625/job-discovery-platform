from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job.title", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = ["id", "notification_type", "message", "job", "job_title", "read", "created_at"]