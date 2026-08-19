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

    # =====================================
    # GET LOGGED-IN CANDIDATE
    # =====================================

    def get_queryset(self):

        return Candidate.objects.filter(
            email__iexact=self.request.user.email
        )

    # =====================================
    # CREATE PROFILE
    # =====================================

    def perform_create(self, serializer):

        # Prevent duplicate profile
        existing_candidate = Candidate.objects.filter(
            email__iexact=self.request.user.email
        ).first()

        if existing_candidate:

            raise serializers.ValidationError({
                "detail": "Candidate profile already exists."
            })

        serializer.save(
            email=self.request.user.email
        )

    # =====================================
    # UPDATE PROFILE
    # =====================================

    def perform_update(self, serializer):

        serializer.save(
            email=self.request.user.email
        )


# =====================================
# RESUME
# =====================================

class ResumeViewSet(viewsets.ModelViewSet):

    serializer_class = ResumeSerializer

    permission_classes = [IsAuthenticated]

    # =====================================
    # GET LOGGED-IN USER RESUME
    # =====================================

    def get_queryset(self):

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
    # GET LOGGED-IN CANDIDATE
    # =====================================

    def get_candidate(self):

        try:

            return Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            raise serializers.ValidationError({
                "detail": "Candidate profile not found."
            })

    # =====================================
    # PROCESS RESUME
    # =====================================

    def process_resume(
        self,
        resume,
        candidate
    ):

        try:

            print(
                "================================="
            )

            print(
                "STARTING RESUME PARSING"
            )

            print(
                "FILE:",
                resume.resume_file.path
            )

            print(
                "================================="
            )

            # =====================================
            # PARSE RESUME
            # =====================================

            result = parse_resume(
                resume.resume_file.path
            )

            print(
                "PARSER RESULT:",
                result
            )

            # =====================================
            # CALCULATE ATS
            # =====================================

            ats = calculate_ats(result)

            print(
                "ATS RESULT:",
                ats
            )

            resume.ats_score = ats.get(
                "score",
                0
            )

            resume.save(
                update_fields=[
                    "ats_score"
                ]
            )

            # =====================================
            # UPDATE SKILLS
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
                "CANDIDATE UPDATED SUCCESSFULLY"
            )

            print(
                "ATS SCORE:",
                resume.ats_score
            )

            print(
                "ATS FEEDBACK:",
                ats.get("feedback")
            )

            print(
                "================================="
            )

        except Exception as e:

            print(
                "================================="
            )

            print(
                "RESUME PARSING / ATS ERROR:",
                repr(e)
            )

            print(
                "================================="
            )

    # =====================================
    # CREATE / REPLACE RESUME
    # =====================================

    def perform_create(self, serializer):

        # =====================================
        # GET CANDIDATE
        # =====================================

        candidate = self.get_candidate()

        # =====================================
        # GET NEW FILE
        # =====================================

        new_file = serializer.validated_data.get(
            "resume_file"
        )

        if not new_file:

            raise serializers.ValidationError({
                "resume_file":
                "Please upload a resume file."
            })

        # =====================================
        # CHECK EXISTING RESUME
        # =====================================

        try:

            resume = Resume.objects.get(
                candidate=candidate
            )

            print(
                "EXISTING RESUME FOUND:",
                resume.id
            )

            # =====================================
            # DELETE OLD FILE
            # =====================================

            if resume.resume_file:

                old_file = resume.resume_file

                try:

                    old_file.delete(
                        save=False
                    )

                    print(
                        "OLD FILE DELETED"
                    )

                except Exception as e:

                    print(
                        "OLD FILE DELETE ERROR:",
                        repr(e)
                    )

            # =====================================
            # SAVE NEW FILE
            # =====================================

            resume.resume_file = new_file

            # Reset ATS before processing

            resume.ats_score = 0

            resume.save()

            print(
                "RESUME REPLACED:",
                resume.id
            )

        except Resume.DoesNotExist:

            # =====================================
            # FIRST UPLOAD
            # =====================================

            resume = serializer.save(
                candidate=candidate
            )

            print(
                "FIRST RESUME CREATED:",
                resume.id
            )

        # =====================================
        # PARSE + ATS
        # =====================================

        self.process_resume(
            resume,
            candidate
        )

    # =====================================
    # UPDATE / REPLACE RESUME
    # =====================================

    def perform_update(self, serializer):

        candidate = self.get_candidate()

        # =====================================
        # GET EXISTING RESUME
        # =====================================

        resume = self.get_object()

        # Security check
        # Make sure resume belongs to logged-in candidate

        if resume.candidate_id != candidate.id:

            raise serializers.ValidationError({
                "detail":
                "You cannot modify this resume."
            })

        # =====================================
        # GET NEW FILE
        # =====================================

        new_file = serializer.validated_data.get(
            "resume_file"
        )

        # =====================================
        # IF NEW FILE EXISTS
        # =====================================

        if new_file:

            print(
                "REPLACING RESUME:",
                resume.id
            )

            # =====================================
            # DELETE OLD FILE
            # =====================================

            if resume.resume_file:

                old_file = resume.resume_file

                try:

                    old_file.delete(
                        save=False
                    )

                    print(
                        "OLD RESUME FILE DELETED"
                    )

                except Exception as e:

                    print(
                        "OLD FILE DELETE ERROR:",
                        repr(e)
                    )

            # =====================================
            # ASSIGN NEW FILE
            # =====================================

            resume.resume_file = new_file

            # Reset ATS

            resume.ats_score = 0

            resume.save()

            print(
                "NEW RESUME FILE SAVED"
            )

            # =====================================
            # PARSE NEW RESUME
            # =====================================

            self.process_resume(
                resume,
                candidate
            )

        else:

            # =====================================
            # NORMAL UPDATE
            # =====================================

            serializer.save(
                candidate=candidate
            )

    # =====================================
    # VIEW RESUME FILE
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
                status=status.HTTP_404_NOT_FOUND
            )

        original_path = resume.resume_file.path

        # =====================================
        # CHECK PHYSICAL FILE
        # =====================================

        if not os.path.exists(original_path):

            return Response(
                {
                    "detail":
                    "Resume file does not exist."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # =====================================
        # FILE NAME
        # =====================================

        file_name = os.path.basename(
            original_path
        )

        # =====================================
        # EXTENSION
        # =====================================

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
                    filename=file_name
                )

            except FileNotFoundError:

                return Response(
                    {
                        "detail":
                        "Resume file not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        # =====================================
        # DOC / DOCX
        # =====================================

        elif extension in [
            ".doc",
            ".docx"
        ]:

            try:

                # =====================================
                # TEMP DIRECTORY
                # =====================================

                temp_directory = tempfile.mkdtemp()

                # =====================================
                # CONVERT TO PDF
                # =====================================

                result = subprocess.run(
                    [
                        SOFFICE_PATH,
                        "--headless",
                        "--convert-to",
                        "pdf",
                        "--outdir",
                        temp_directory,
                        original_path
                    ],
                    check=True,
                    capture_output=True,
                    text=True
                )

                print(
                    "LIBREOFFICE OUTPUT:",
                    result.stdout
                )

                # =====================================
                # PDF NAME
                # =====================================

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
                # CHECK PDF
                # =====================================

                if not os.path.exists(
                    pdf_path
                ):

                    return Response(
                        {
                            "detail":
                            "Unable to convert Word document to PDF."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                # =====================================
                # RETURN PDF
                # =====================================

                return FileResponse(
                    open(
                        pdf_path,
                        "rb"
                    ),
                    content_type="application/pdf",
                    as_attachment=False,
                    filename=pdf_name
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
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            except FileNotFoundError:

                return Response(
                    {
                        "detail":
                        "LibreOffice executable not found."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # =====================================
        # UNSUPPORTED FILE
        # =====================================

        return Response(
            {
                "detail":
                "Unsupported file type."
            },
            status=status.HTTP_400_BAD_REQUEST
        )


# =====================================
# JOB RECOMMENDATIONS
# =====================================

class JobViewSet(
    viewsets.ReadOnlyModelViewSet
):

    serializer_class = JobSerializer

    permission_classes = [IsAuthenticated]

    # =====================================
    # GET RECOMMENDED JOBS
    # =====================================

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

        # Store candidate for serializer

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

        # =====================================
        # RECOMMENDED JOB IDS
        # =====================================

        recommended_jobs = []

        # =====================================
        # CHECK JOBS
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
            # MATCH SKILLS
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

        # =====================================
        # RETURN JOBS
        # =====================================

        return Job.objects.filter(
            id__in=recommended_jobs
        )


# =====================================
# JOB SWIPE
# =====================================

class JobSwipeViewSet(
    viewsets.ModelViewSet
):

    serializer_class = JobSwipeSerializer

    permission_classes = [IsAuthenticated]

    # =====================================
    # GET SWIPES
    # =====================================

    def get_queryset(self):

        try:

            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            return JobSwipe.objects.none()

        return JobSwipe.objects.filter(
            candidate=candidate
        ).select_related(
            "job"
        )

    # =====================================
    # CREATE / UPDATE SWIPE
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

            raise serializers.ValidationError({
                "detail":
                "Candidate profile not found."
            })

        # =====================================
        # GET JOB
        # =====================================

        job = serializer.validated_data[
            "job"
        ]

        # =====================================
        # GET DECISION
        # =====================================

        decision = serializer.validated_data[
            "decision"
        ]

        # =====================================
        # CREATE OR UPDATE
        # =====================================

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

class ApplicationViewSet(
    viewsets.ModelViewSet
):

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
            ).select_related(
                "job"
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

            raise serializers.ValidationError({
                "detail":
                "Candidate profile not found."
            })

        # =====================================
        # SAVE APPLICATION
        # =====================================

        serializer.save(
            candidate=candidate
        )

    # =====================================
    # UPDATE APPLICATION
    # =====================================

    def perform_update(self, serializer):

        serializer.save()
