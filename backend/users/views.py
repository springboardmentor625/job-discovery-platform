from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Resume
from .serializers import ResumeSerializer

from .serializers import LoginSerializer
from .serializers import RegisterSerializer
from .serializers import VerifyEmailSerializer

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

def parse_resume_text(text):
    skills = []
    experience = []
    education = []

    skill_list = [
        "Python", "Java", "JavaScript", "SQL", "HTML", "CSS",
        "Flask", "Django", "React", "Angular", "MySQL",
        "PostgreSQL", "MongoDB", "GeoServer", "QGIS",
        "Leaflet.js", "GeoJSON", "REST APIs", "Git", "GitHub",
        "Postman", "Power BI"
    ]

    text_lower = text.lower()

    # ---------------- SKILLS ----------------

    for skill in skill_list:
        if skill.lower() in text_lower:
            skills.append(skill)

    # ---------------- EXPERIENCE ----------------

    experience_start = text_lower.find("\nexperience\n")
    projects_start = text_lower.find("\nprojects\n")

    if experience_start != -1:
        experience_start += len("\nexperience\n")

        if projects_start != -1:
            experience_text = text[
                experience_start:projects_start
            ]
        else:
            experience_text = text[experience_start:]

        experience.append(experience_text.strip())

    # ---------------- EDUCATION ----------------

    education_start = text_lower.find("\neducation\n")
    certifications_start = text_lower.find("\ncertifications\n")

    if education_start != -1:
        education_start += len("\neducation\n")

        if certifications_start != -1:
            education_text = text[
                education_start:certifications_start
            ]
        else:
            education_text = text[education_start:]

        education.append(education_text.strip())

    return {
        "skills": skills,
        "experience": experience,
        "education": education
    }

class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]

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

                parsed_data = parse_resume_text(extracted_text)

                resume.extracted_text = extracted_text
                resume.skills = parsed_data["skills"]
                resume.experience = parsed_data["experience"]
                resume.education = parsed_data["education"]

                resume.save(
                    update_fields=[
                        "extracted_text",
                        "skills",
                        "experience",
                        "education",
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