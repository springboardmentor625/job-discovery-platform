from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Profile
from .serializers import (
    RegisterSerializer,
    EmailTokenObtainPairSerializer,
    ProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/  — create a new user (any role)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/  — returns access + refresh JWTs plus user info."""

    permission_classes = [permissions.AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    """POST /api/auth/refresh/  — exchange a refresh token for a new access token."""

    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """
    GET   /api/auth/me/  — the logged-in user's profile.
    PATCH /api/auth/me/  — update bio / skills / experience / portfolio_url
                           ('Complete Profile' step of the candidate workflow).
    Requires a valid JWT.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
