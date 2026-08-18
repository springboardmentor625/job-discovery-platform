from rest_framework import serializers

from jobs.serializers import JobSerializer

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)

    class Meta:
        model = Application
        fields = ["id", "job", "status", "applied_at"]