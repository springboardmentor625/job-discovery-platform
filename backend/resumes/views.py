from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser

from .models import Resume
from .parsing import parse_resume
from .serializers import ResumeSerializer, ResumeUploadSerializer


class ResumeListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/resumes/  — list the logged-in user's resumes (newest first)
    POST /api/resumes/  — upload a resume file (multipart/form-data, field name "file")

    Upload Resume -> AI Resume Parsing -> Extract Skills & Experience all
    happen inside this one POST, matching the candidate workflow.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user).order_by("-uploaded_at")

    def get_serializer_class(self):
        return ResumeUploadSerializer if self.request.method == "POST" else ResumeSerializer

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES["file"]
        next_version = (
            Resume.objects.filter(user=self.request.user).count() + 1
        )
        resume = serializer.save(
            user=self.request.user,
            version=next_version,
        )

        # AI Resume Parsing + Extract Skills & Experience
        uploaded_file.seek(0)
        result = parse_resume(uploaded_file, uploaded_file.name)
        resume.parsed_text = result["parsed_text"]
        resume.extracted_skills = result["extracted_skills"]
        resume.save(update_fields=["parsed_text", "extracted_skills"])

        # Return the fully-parsed resume in the response, not just the upload echo
        self._created_instance = resume

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = ResumeSerializer(self._created_instance).data
        return response