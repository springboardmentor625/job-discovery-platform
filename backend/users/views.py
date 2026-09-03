from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated

from .recommendation_engine import get_recommended_jobs

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Resume, JobSwipe
from .serializers import ResumeSerializer, JobSwipeSerializer
from .llm.resume_extractor import extract_resume_information

from .serializers import LoginSerializer
from .serializers import RegisterSerializer
from .serializers import VerifyEmailSerializer

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Job
from .ats.matcher import match_resume_to_job
from .serializers import JobSerializer

import random

from .models import CandidateProfile
from .serializers import CandidateProfileSerializer

from django.core.mail import send_mail
from django.utils import timezone

from django.utils import timezone

import os
from pypdf import PdfReader
from docx import Document


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

            send_mail(
                subject="SWIPEX Email Verification",
                message=f"Your SWIPEX verification OTP is: {otp}",
                from_email=None,
                recipient_list=[user.email],
            )

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

            token, created = Token.objects.get_or_create(user=user)

            return Response(
                {
                    "message": "Login successful",
                    "token": token.key,
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

def extract_resume_text(file):
    extension = os.path.splitext(file.name)[1].lower()

    if extension == ".pdf":
        reader = PdfReader(file)
        return "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    elif extension == ".docx":
        document = Document(file)
        return "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
        )

    else:
        return ""

class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resume = Resume.objects.filter(
            user=request.user
        ).first()

        if not resume:
            return Response(
                {
                    "error": "Resume not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "resume": ResumeSerializer(resume).data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        resume = Resume.objects.filter(user=request.user).first()

        if resume:
            serializer = ResumeSerializer(
                resume,
                data=request.data,
                partial=True
            )
        else:
            serializer = ResumeSerializer(data=request.data)

        if serializer.is_valid():
            resume = serializer.save(user=request.user)

            resume_file = resume.resume_file

            try:
                resume_file.open("rb")

                extracted_text = extract_resume_text(resume_file)

                resume_file.close()

                parsed_data = extract_resume_information(extracted_text)

                resume.extracted_text = extracted_text
                resume.skills = parsed_data["skills"]
                resume.experience = parsed_data["experience"]
                resume.education = parsed_data["education"]
                resume.projects = parsed_data["projects"]

                resume.save(
                    update_fields=[
                        "extracted_text",
                        "skills",
                        "experience",
                        "education",
                        "projects",
                    ]
                )

            except Exception as e:
                return Response(
                    {
                        "error": "Resume uploaded, but text extraction failed.",
                        "details": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "message": "Resume uploaded and text extracted successfully.",
                    "resume": ResumeSerializer(resume).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class ResumeDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        resume = Resume.objects.filter(user=request.user).first()

        if not resume:
            return Response(
                {"error": "No resume found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        resume.delete()

        return Response(
            {"message": "Resume removed successfully."},
            status=status.HTTP_200_OK,
        )

class CandidateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, created = CandidateProfile.objects.get_or_create(
            user=request.user
        )

        serializer = CandidateProfileSerializer(
            profile,
            context={"request": request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def post(self, request):
        profile, created = CandidateProfile.objects.get_or_create(
            user=request.user
        )

        serializer = CandidateProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Profile updated successfully.",
                    "profile": serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class ATSMatchView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):

        # Get logged-in candidate's resume
        try:
            resume = request.user.resume
        except Exception:
            return Response(
                {
                    "error": "Resume not found. Please upload your resume first."
                },
                status=404
            )

        # Get requested job
        try:
            job = Job.objects.get(job_id=job_id)
        except Job.DoesNotExist:
            return Response(
                {
                    "error": "Job not found."
                },
                status=404
            )

        # Run ATS matching
        result = match_resume_to_job(
            resume,
            job
        )

        return Response(result)

class JobListView(APIView):

    def get(self, request):
        jobs = Job.objects.all().order_by("-created_at")

        serializer = JobSerializer(
            jobs,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class JobSwipeView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        job_id = request.data.get("job_id")
        swipe_direction = request.data.get("swipe_direction")

        # -----------------------------
        # Validate input
        # -----------------------------

        if not job_id:
            return Response(
                {"error": "job_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if swipe_direction not in ["left", "right", "down"]:
            return Response(
                {
                    "error": "swipe_direction must be either 'left' or 'right' or 'down'."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------
        # Get job
        # -----------------------------

        try:
            job = Job.objects.get(job_id=job_id)
        except Job.DoesNotExist:

            return Response(
                {"error": "Job not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # -----------------------------
        # Create / update swipe
        # -----------------------------

        swipe, created = JobSwipe.objects.update_or_create(
            user=request.user,
            job=job,
            defaults={
                "swipe_direction": swipe_direction
            }
        )

        return Response(
            {
                "message": (
                    "Job swipe recorded successfully."
                    if created
                    else "Job swipe updated successfully."
                ),
                "job_id": job.job_id,
                "job_title": job.title,
                "swipe_direction": swipe.swipe_direction,
            },
            status=status.HTTP_201_CREATED
            if created
            else status.HTTP_200_OK
        )

class SavedJobsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        saved_swipes = JobSwipe.objects.filter(
            user=request.user,
            swipe_direction="down"
        ).select_related("job").order_by("-created_at")

        jobs = [swipe.job for swipe in saved_swipes]

        serializer = JobSerializer(
            jobs,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get candidate profile
        profile, _ = CandidateProfile.objects.get_or_create(
            user=request.user
        )

        # Get resume
        try:
            resume = Resume.objects.get(user=request.user)
        except Resume.DoesNotExist:
            return Response(
                {
                    "error": "Please upload your resume before getting recommendations."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all jobs
        jobs = Job.objects.all()

        # Generate recommendations
        recommendations = get_recommended_jobs(
            resume_skills=resume.skills,
            preferred_role=profile.preferred_job_role,
            preferred_locations=profile.preferred_locations,
            candidate_job_type=profile.job_type,
            jobs=jobs,
            limit=10,
        )

        return Response(
            {
                "recommendations": recommendations
            },
            status=status.HTTP_200_OK
        )