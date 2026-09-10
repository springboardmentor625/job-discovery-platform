from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Candidate


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    full_name = serializers.CharField(
        write_only=True,
        required=True
    )

    phone = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default=""
    )

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "phone",
            "password",
        ]

    def validate_email(self, value):
        value = value.lower().strip()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "").strip()
        phone = validated_data.pop("phone", "").strip()
        email = validated_data["email"].lower().strip()
        password = validated_data["password"]

        # Create authentication user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=full_name,
        )

        # Create candidate profile automatically populated from registration
        Candidate.objects.get_or_create(
            email__iexact=email,
            defaults={
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "skills": "",
                "experience": "",
                "education": "",
                "current_location": "",
                "preferred_job_roles": "",
                "preferred_locations": "",
                "preferred_work_mode": "Any",
                "career_interests": "",
                "bio": "",
            }
        )

        return user