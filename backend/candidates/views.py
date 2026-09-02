import shutil

from django.conf import settings
from django.contrib.auth.models import User

from rest_framework import generics, viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

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

from .services.preview_service import PreviewService
from .services.resume_service import ResumeService
from .services.recommendation_service import RecommendationService
from .services.file_service import FileService
from .services.application_service import ApplicationService

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Job
from .serializers import JobSerializer
from .services.recommendation_service import RecommendationService
# =====================================
# LIBREOFFICE PATH
# =====================================

SOFFICE_PATH = getattr(
    settings,
    "SOFFICE_PATH",
    shutil.which("soffice")
)


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
        return Candidate.objects.filter(
            email__iexact=self.request.user.email
        )

    def perform_create(self, serializer):

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

    def get_candidate(self):

        try:
            return Candidate.objects.get(
                email__iexact=self.request.user.email
            )

        except Candidate.DoesNotExist:

            raise serializers.ValidationError({
                "detail": "Candidate profile not found."
            })

    def perform_create(self, serializer):

        candidate = self.get_candidate()

        new_file = serializer.validated_data.get(
            "resume_file"
        )

        if not new_file:

            raise serializers.ValidationError({
                "resume_file":
                "Please upload a resume file."
            })

        try:

            resume = Resume.objects.get(
                candidate=candidate
            )

            if resume.resume_file:

                try:
                    resume.resume_file.delete(
                        save=False
                    )
                except Exception as e:
                    print(
                        "OLD FILE DELETE ERROR:",
                        repr(e)
                    )

            if resume.preview_pdf:

                try:
                    resume.preview_pdf.delete(
                        save=False
                    )
                except Exception as e:
                    print(
                        "OLD PREVIEW DELETE ERROR:",
                        repr(e)
                    )

            resume.resume_file = new_file

            resume.original_filename = (
                new_file.name
            )

            ResumeService.reset_resume(
                resume
            )

            resume.preview_pdf = None

            resume.save()

        except Resume.DoesNotExist:

            resume = serializer.save(
                candidate=candidate,
                original_filename=new_file.name,
            )

        PreviewService.generate(
            resume
        )

        ResumeService.process_resume(
            resume,
            candidate
        )

    def perform_update(self, serializer):

        candidate = self.get_candidate()

        resume = self.get_object()

        if resume.candidate_id != candidate.id:

            raise serializers.ValidationError({
                "detail":
                "You cannot modify this resume."
            })

        new_file = serializer.validated_data.get(
            "resume_file"
        )

        if new_file:

            if resume.resume_file:

                try:
                    resume.resume_file.delete(
                        save=False
                    )
                except Exception as e:
                    print(
                        "OLD FILE DELETE ERROR:",
                        repr(e)
                    )

            if resume.preview_pdf:

                try:
                    resume.preview_pdf.delete(
                        save=False
                    )
                except Exception as e:
                    print(
                        "OLD PREVIEW DELETE ERROR:",
                        repr(e)
                    )

            resume.resume_file = new_file

            resume.original_filename = (
                new_file.name
            )

            ResumeService.reset_resume(
                resume
            )

            resume.preview_pdf = None

            resume.save()

            PreviewService.generate(
                resume
            )

            ResumeService.process_resume(
                resume,
                candidate
            )

        else:

            serializer.save(
                candidate=candidate
            )

    @action(
        detail=True,
        methods=["get"],
        url_path="file"
    )
    def file(self, request, pk=None):

        resume = self.get_object()

        return FileService.serve_resume_file(
            resume
        )

    def perform_destroy(self, instance):

        if instance.resume_file:

            try:
                instance.resume_file.delete(
                    save=False
                )
            except Exception as e:
                print(
                    "RESUME FILE DELETE ERROR:",
                    repr(e)
                )

        if instance.preview_pdf:

            try:
                instance.preview_pdf.delete(
                    save=False
                )
            except Exception as e:
                print(
                    "PREVIEW PDF DELETE ERROR:",
                    repr(e)
                )

        instance.delete()


# =====================================
# JOB RECOMMENDATIONS
# =====================================
# =====================================
# JOBS
# =====================================

class JobViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.action == "retrieve":
            return Job.objects.all()

        try:
            jobs = RecommendationService.get_recommended_jobs(
                self.request.user
            )

            if isinstance(jobs, list):
                ids = [job.id for job in jobs]
                queryset = Job.objects.filter(id__in=ids)

                # preserve recommendation order
                queryset = sorted(
                    queryset,
                    key=lambda j: ids.index(j.id)
                )

                return queryset

            return jobs

        except Exception as e:
            print("Recommendation Error:", e)
            return Job.objects.all()

    def get_object(self):
        return Job.objects.get(pk=self.kwargs["pk"])

    
class JobSwipeViewSet(viewsets.ModelViewSet):
    serializer_class = JobSwipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        candidate = Candidate.objects.filter(
            email__iexact=self.request.user.email
        ).first()

        if not candidate:
            return JobSwipe.objects.none()

        return JobSwipe.objects.filter(
            candidate=candidate
        ).select_related("job")

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

        job = serializer.validated_data.get("job")

        if not job:

            raise serializers.ValidationError({
                "job_id":
                "Job is required."
            })

        # =====================================
        # UPDATE EXISTING SWIPE
        # =====================================

        existing_swipe = JobSwipe.objects.filter(
            candidate=candidate,
            job=job
        ).first()

        if existing_swipe:

            existing_swipe.decision = (
                serializer.validated_data.get(
                    "decision"
                )
            )

            existing_swipe.save(
                update_fields=[
                    "decision"
                ]
            )

            serializer.instance = existing_swipe

            return

        # =====================================
        # CREATE NEW SWIPE
        # =====================================

        serializer.save(
            candidate=candidate
        )

    def perform_update(self, serializer):

        swipe = self.get_object()

        serializer.save(
            candidate=swipe.candidate
        )


# =====================================
# APPLICATION
# =====================================

class ApplicationViewSet(viewsets.ModelViewSet):

    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        candidate = Candidate.objects.filter(
            email__iexact=self.request.user.email
        ).first()

        if not candidate:
            return Application.objects.none()

        return (
            Application.objects.filter(candidate=candidate)
            .select_related("job")
        )

    def perform_create(self, serializer):

        ApplicationService.create_application(
            self.request.user,
            serializer
        )

    def perform_update(self, serializer):

        application = self.get_object()

        serializer.save(
            candidate=application.candidate
        )
