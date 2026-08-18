from rest_framework import serializers

from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id", "file", "version", "parsed_text", "extracted_skills", "uploaded_at",
        ]
        read_only_fields = ["parsed_text", "extracted_skills", "uploaded_at", "version"]


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["id", "file"]