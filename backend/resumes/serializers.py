from rest_framework import serializers

from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id", "file", "version", "target_role", "is_active",
            "parsed_text", "extracted_skills", "uploaded_at",
        ]
        read_only_fields = ["parsed_text", "extracted_skills", "uploaded_at", "version", "is_active"]


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["id", "file", "target_role"]