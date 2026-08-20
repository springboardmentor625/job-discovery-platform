from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer
from .serializers import RegisterSerializer
from .serializers import VerifyEmailSerializer

import random
import os
import resend

from django.utils import timezone


class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            otp = str(random.randint(100000, 999999))

            user.email_otp = otp
            user.otp_created_at = timezone.now()
            user.email_verified = False
            user.save()

            resend.api_key = os.environ.get("RESEND_API_KEY")

            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": [user.email],
                "subject": "SWIPEX Email Verification",
                "text": f"Your SWIPEX verification OTP is: {otp}",
            })

            return Response(
                {
                    "message": "OTP sent to your email.",
                    "email": user.email,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            return Response(
                {
                    "message": "Login successful",
                    "user": {
                        "user_id": user.user_id,
                        "full_name": user.full_name,
                        "email": user.email,
                        "role": user.role,
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

class VerifyEmailView(APIView):

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            user.email_verified = True
            user.email_otp = None
            user.otp_created_at = None
            user.save()

            return Response(
                {
                    "message": "Email verified successfully.",
                    "email": user.email,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )