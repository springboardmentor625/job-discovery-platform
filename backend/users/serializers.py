from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    phone = serializers.CharField(
        max_length=15,
        required=True
    )

    class Meta:
        model = User
        fields = [
            "full_name",
            "phone",
            "email",
            "password",
        ]
        extra_kwargs = {
            "phone": {"required": True},
        }

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "This mobile number is already registered. Please login instead."
            )

        return value
        
    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            role="candidate",
            **validated_data
        )

        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        user = User.objects.filter(email=email).first()

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        data["user"] = user
        return data

class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)

    def validate(self, data):
        email = data["email"]
        otp = data["otp"]

        user = User.objects.filter(email=email).first()

        if user is None:
            raise serializers.ValidationError(
                "User with this email does not exist."
            )

        if user.email_verified:
            raise serializers.ValidationError(
                "Email is already verified."
            )

        if user.email_otp != otp:
            raise serializers.ValidationError(
                "Invalid OTP."
            )

        data["user"] = user
        return data