from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Resume
from .parsing import parse_resume
from .serializers import ResumeSerializer, ResumeUploadSerializer


class ResumeListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return ResumeUploadSerializer if self.request.method == "POST" else ResumeSerializer

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES["file"]
        next_version = Resume.objects.filter(user=self.request.user).count() + 1

        Resume.objects.filter(user=self.request.user, is_active=True).update(is_active=False)

        resume = serializer.save(user=self.request.user, version=next_version, is_active=True)

        uploaded_file.seek(0)
        result = parse_resume(uploaded_file, uploaded_file.name)
        resume.parsed_text = result["parsed_text"]
        resume.extracted_skills = result["extracted_skills"]
        resume.save(update_fields=["parsed_text", "extracted_skills"])

        self._created_instance = resume

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = ResumeSerializer(self._created_instance).data
        return response


class ActivateResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"detail": "Resume not found."}, status=404)

        Resume.objects.filter(user=request.user, is_active=True).update(is_active=False)
        resume.is_active = True
        resume.save(update_fields=["is_active"])
        return Response(ResumeSerializer(resume).data)


class ResumeDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ResumeSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        was_active = instance.is_active
        instance.delete()
        if was_active:
            fallback = Resume.objects.filter(user=self.request.user).order_by("-uploaded_at").first()
            if fallback:
                fallback.is_active = True
                fallback.save(update_fields=["is_active"])