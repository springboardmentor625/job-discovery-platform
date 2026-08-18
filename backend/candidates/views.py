import os
import subprocess
import tempfile

from django.contrib.auth.models import User
from django.http import FileResponse

from rest_framework import generics, viewsets, status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from parser.resume_parser import parse_resume
from parser.ats import calculate_ats

from .models import (
    Candidate,
    Resume,
    Job,
    JobSwipe,
    Application,
)

from .serializers import (
    CandidateSerializer,
    ResumeSerializer,
    JobSerializer,
    JobSwipeSerializer,
    ApplicationSerializer,
)

from .auth_serializers import RegisterSerializer


# =====================================
# LIBREOFFICE PATH
# =====================================

SOFFICE_PATH = r"C:\Program Files\LibreOffice\program\soffice.exe"


# =====================================
# REGISTER
# =====================================

class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()

    serializer_class = RegisterSerializer


# =====================================
# CANDIDATE
# =====================================

class CandidateViewSet(viewsets.ModelViewSet):

    serializer_class = CandidateSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Only return the candidate profile
        belonging to the logged-in user.
        """

        return Candidate.objects.filter(
            email__iexact=self.request.user.email
        )

    def perform_create(self, serializer):
        """
        Automatically use the logged-in user's email.
        """

        serializer.save(
            email=self.request.user.email
        )


# =====================================
# RESUME
# =====================================

class ResumeViewSet(viewsets.ModelViewSet):

    queryset = Resume.objects.all()

    serializer_class = ResumeSerializer

    permission_classes = [IsAuthenticated]

    # =====================================
    # GET LOGGED-IN USER RESUMES
    # =====================================

    def get_queryset(self):
        """
        Only show resumes belonging to
        the logged-in candidate.
        """

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            return Resume.objects.none()

        return Resume.objects.filter(
            candidate=candidate
        )

    # =====================================
    # CREATE / REPLACE RESUME
    # =====================================

    def perform_create(self, serializer):

        # =====================================
        # GET CANDIDATE
        # =====================================

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "detail":
                    "Candidate profile not found."
                }
            )

        # =====================================
        # GET UPLOADED FILE
        # =====================================

        new_file = serializer.validated_data.get(
            "resume_file"
        )

        if not new_file:

            raise serializers.ValidationError(
                {
                    "resume_file":
                    "Please upload a resume file."
                }
            )

        # =====================================
        # EXISTING RESUME -> REPLACE
        # =====================================

        try:

            resume = Resume.objects.get(
                candidate=candidate
            )

            print(
                "Existing resume found:",
                resume.id
            )

            # Delete old physical file
            if resume.resume_file:

                try:

                    resume.resume_file.delete(
                        save=False
                    )

                except Exception as e:

                    print(
                        "OLD FILE DELETE ERROR:",
                        e
                    )

            # Save new uploaded file
            resume.resume_file = new_file

            # Reset ATS score
            resume.ats_score = 0

            resume.save()

            print(
                "Resume replaced successfully:",
                resume.id
            )

        # =====================================
        # FIRST UPLOAD
        # =====================================

        except Resume.DoesNotExist:

            resume = serializer.save(
                candidate=candidate
            )

            print(
                "New resume created:",
                resume.id
            )

        # =====================================
        # PARSE RESUME + ATS
        # =====================================

        try:

            result = parse_resume(
                resume.resume_file.path
            )

            print(
                "RESUME PARSER RESULT:",
                result
            )

            # =====================================
            # CALCULATE ATS
            # =====================================

            ats = calculate_ats(result)

            resume.ats_score = ats["score"]

            resume.save()

            print(
                "ATS SCORE:",
                ats["score"]
            )

            print(
                "ATS FEEDBACK:",
                ats["feedback"]
            )

            # =====================================
            # UPDATE CANDIDATE SKILLS
            # =====================================

            if result.get("skills"):

                candidate.skills = ", ".join(
                    result["skills"]
                )

            # =====================================
            # UPDATE EMAIL
            # =====================================

            if result.get("email"):

                candidate.email = result["email"]

            # =====================================
            # UPDATE PHONE
            # =====================================

            if result.get("phone"):

                candidate.phone = result["phone"]

            # =====================================
            # UPDATE EXPERIENCE
            # =====================================

            if result.get("experience"):

                candidate.experience = result[
                    "experience"
                ]

            # =====================================
            # SAVE CANDIDATE
            # =====================================

            candidate.save()

            print(
                "Candidate updated successfully."
            )

        except Exception as e:

            # Do not destroy the uploaded resume
            # if parsing/ATS has a problem.

            print(
                "RESUME PARSING / ATS ERROR:",
                e
            )

    # =====================================
    # VIEW RESUME
    # =====================================

    @action(
        detail=True,
        methods=["get"],
        url_path="file"
    )
    def file(self, request, pk=None):

        resume = self.get_object()

        # =====================================
        # CHECK FILE
        # =====================================

        if not resume.resume_file:

            return Response(
                {
                    "detail":
                    "Resume file not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        original_path = resume.resume_file.path

        file_name = os.path.basename(
            original_path
        )

        extension = os.path.splitext(
            file_name
        )[1].lower()

        # =====================================
        # PDF
        # =====================================

        if extension == ".pdf":

            try:

                return FileResponse(
                    open(
                        original_path,
                        "rb"
                    ),
                    content_type="application/pdf",
                    as_attachment=False,
                    filename=file_name,
                )

            except FileNotFoundError:

                return Response(
                    {
                        "detail":
                        "Resume file not found."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        # =====================================
        # DOC / DOCX
        # =====================================

        elif extension in [
            ".doc",
            ".docx"
        ]:

            try:

                temp_directory = (
                    tempfile.mkdtemp()
                )

                subprocess.run(
                    [
                        SOFFICE_PATH,
                        "--headless",
                        "--convert-to",
                        "pdf",
                        "--outdir",
                        temp_directory,
                        original_path,
                    ],
                    check=True,
                    capture_output=True,
                    text=True,
                )

                pdf_name = (
                    os.path.splitext(
                        file_name
                    )[0]
                    + ".pdf"
                )

                pdf_path = os.path.join(
                    temp_directory,
                    pdf_name
                )

                # =====================================
                # CHECK CONVERSION
                # =====================================

                if not os.path.exists(
                    pdf_path
                ):

                    return Response(
                        {
                            "detail":
                            "Unable to convert Word document to PDF."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                return FileResponse(
                    open(
                        pdf_path,
                        "rb"
                    ),
                    content_type="application/pdf",
                    as_attachment=False,
                    filename=pdf_name,
                )

            except subprocess.CalledProcessError as error:

                print(
                    "LIBREOFFICE ERROR:",
                    error.stderr
                )

                return Response(
                    {
                        "detail":
                        "Word document conversion failed."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            except FileNotFoundError:

                return Response(
                    {
                        "detail":
                        "LibreOffice executable not found."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # =====================================
        # UNSUPPORTED FILE
        # =====================================

        return Response(
            {
                "detail":
                "Unsupported file type."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# =====================================
# JOB RECOMMENDATIONS
# =====================================

class JobViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = JobSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        # =====================================
        # GET CANDIDATE
        # =====================================

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            return Job.objects.none()

        # Store candidate so JobSerializer
        # can access it

        self.request._swipe_candidate = candidate

        # =====================================
        # CHECK RESUME
        # =====================================

        try:

            resume = candidate.resume

        except Resume.DoesNotExist:

            return Job.objects.none()

        # =====================================
        # CANDIDATE SKILLS
        # =====================================

        candidate_skills = [
            skill.strip().lower()
            for skill in candidate.skills.split(",")
            if skill.strip()
        ]

        recommended_jobs = []

        # =====================================
        # CHECK EVERY JOB
        # =====================================

        for job in Job.objects.all():

            # =====================================
            # ATS FILTER
            # =====================================

            if resume.ats_score < job.min_ats:

                continue

            # =====================================
            # REQUIRED SKILLS
            # =====================================

            required_skills = [
                skill.strip().lower()
                for skill in job.required_skills.split(",")
                if skill.strip()
            ]

            # =====================================
            # SKILL MATCH
            # =====================================

            matched_skills = [
                skill
                for skill in required_skills
                if skill in candidate_skills
            ]

            # =====================================
            # AT LEAST ONE MATCH
            # =====================================

            if matched_skills:

                recommended_jobs.append(
                    job.id
                )

        return Job.objects.filter(
            id__in=recommended_jobs
        )


# =====================================
# JOB SWIPE
# =====================================

class JobSwipeViewSet(viewsets.ModelViewSet):

    serializer_class = JobSwipeSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        # =====================================
        # GET CANDIDATE
        # =====================================

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            return JobSwipe.objects.none()

        return JobSwipe.objects.filter(
            candidate=candidate
        ).select_related("job")

    # =====================================
    # CREATE / UPDATE SWIPE
    # =====================================

    def perform_create(self, serializer):

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "detail":
                    "Candidate profile not found."
                }
            )

        job = serializer.validated_data[
            "job"
        ]

        decision = serializer.validated_data[
            "decision"
        ]

        JobSwipe.objects.update_or_create(
            candidate=candidate,
            job=job,
            defaults={
                "decision": decision
            }
        )


# =====================================
# APPLICATION
# =====================================

class ApplicationViewSet(viewsets.ModelViewSet):

    serializer_class = ApplicationSerializer

    permission_classes = [IsAuthenticated]

    # =====================================
    # GET APPLICATIONS
    # =====================================

    def get_queryset(self):

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

            return Application.objects.filter(
                candidate=candidate
            )

        except Candidate.DoesNotExist:

            return Application.objects.none()

    # =====================================
    # CREATE APPLICATION
    # =====================================

    def perform_create(self, serializer):

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "detail":
                    "Candidate profile not found."
                }
            )

        serializer.save(
            candidate=candidate
        )