from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Candidate


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    full_name = serializers.CharField(
        write_only=True
    )

    phone = serializers.CharField(
        write_only=True
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

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def create(self, validated_data):

        full_name = validated_data.pop("full_name")
        phone = validated_data.pop("phone")

        email = validated_data["email"].lower().strip()
        password = validated_data["password"]

        # Create Django authentication user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=full_name,
        )

        # Create candidate profile
        Candidate.objects.create(
            full_name=full_name,
            email=email,
            phone=phone,
            skills="",
            experience="",
            education="",
            projects="",
            certifications="",
        )

        return user
