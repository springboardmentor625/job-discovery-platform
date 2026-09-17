from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.views import View
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from decouple import config
from .models import Profile
from .serializers import RegisterSerializer, EmailTokenObtainPairSerializer, ProfileSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
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


class SocialLoginRedirectView(LoginRequiredMixin, View):
    """
    django-allauth handles the actual Google/GitHub OAuth handshake using
    Django's own session-based auth. Once that succeeds, allauth redirects
    here — we issue the same JWT tokens the rest of the app uses, then hand
    off to the frontend with them in the URL, exactly like a normal login
    response. This is a plain Django view (not a DRF APIView) specifically
    because our DRF config only recognizes JWT bearer tokens — it wouldn't
    see allauth's session cookie as "authenticated" at all, even though
    Django's own session middleware correctly does.
    """

    def handle_no_permission(self):
        frontend_url = config("FRONTEND_URL", default="http://localhost:5173")
        return redirect(f"{frontend_url}/login?error=oauth_failed")

    def get(self, request):
        user = request.user
        refresh = RefreshToken.for_user(user)
        frontend_url = config("FRONTEND_URL", default="http://localhost:5173")
        return redirect(
            f"{frontend_url}/auth/callback?access={str(refresh.access_token)}&refresh={str(refresh)}"
        )