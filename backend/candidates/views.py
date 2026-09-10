import shutil
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework import generics, viewsets, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()

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
    RecommendationSerializer,
)

from .auth_serializers import RegisterSerializer
from .services.preview_service import PreviewService
from .services.resume_service import ResumeService
from .services.recommendation_service import RecommendationService
from .services.file_service import FileService
from .services.application_service import ApplicationService
from rest_framework.pagination import PageNumberPagination

# =====================================
# REGISTER
# =====================================

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


# =====================================
# CANDIDATE ME
# =====================================

class CandidateMeView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_candidate(self, user):
        candidate, _ = Candidate.objects.get_or_create(
            email__iexact=user.email,
            defaults={
                "full_name": user.get_full_name() or user.first_name or user.username.split("@")[0],
                "email": user.email,
                "phone": "",
                "skills": "",
                "experience": "",
                "education": "",
                "current_location": "",
                "preferred_job_roles": "",
                "preferred_locations": "",
                "preferred_work_mode": "Any",
                "career_interests": "",
                "bio": "",
            }
        )
        return candidate

    def get(self, request):
        candidate = self._get_candidate(request.user)
        serializer = CandidateSerializer(candidate, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        candidate = self._get_candidate(request.user)
        serializer = CandidateSerializer(
            candidate,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        # Keep User first_name synchronized if full_name was updated
        if "full_name" in request.data:
            request.user.first_name = updated.full_name
            request.user.save(update_fields=["first_name"])

        return Response(CandidateSerializer(updated, context={"request": request}).data)

    def put(self, request):
        return self.patch(request)


# =====================================
# CANDIDATE VIEWSET
# =====================================

class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Candidate.objects.filter(
            email__iexact=self.request.user.email
        )

    def perform_create(self, serializer):
        serializer.save(email=self.request.user.email)

    def perform_update(self, serializer):
        serializer.save(email=self.request.user.email)


# =====================================
# RESUME VIEWSET
# =====================================

class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            candidate = Candidate.objects.get(
                email__iexact=self.request.user.email
            )
            return Resume.objects.filter(candidate=candidate)
        except Candidate.DoesNotExist:
            return Resume.objects.none()

    def get_candidate(self):
        candidate, _ = Candidate.objects.get_or_create(
            email__iexact=self.request.user.email,
            defaults={
                "full_name": self.request.user.get_full_name() or self.request.user.username,
                "email": self.request.user.email,
            }
        )
        return candidate

    def perform_create(self, serializer):
        candidate = self.get_candidate()
        new_file = serializer.validated_data.get("resume_file")

        if not new_file:
            raise serializers.ValidationError({"resume_file": "Please upload a resume file."})

        # Remove previous resume file if exists
        existing = Resume.objects.filter(candidate=candidate).first()
        if existing:
            if existing.resume_file:
                try:
                    existing.resume_file.delete(save=False)
                except Exception:
                    pass

            if existing.preview_pdf:
                try:
                    existing.preview_pdf.delete(save=False)
                except Exception:
                    pass

            existing.resume_file = new_file
            existing.original_filename = new_file.name
            existing.preview_pdf = None

            ResumeService.reset_resume(existing)

            resume = existing

            # IMPORTANT:
            # DRF must serialize the actual Resume model instance
            # after replacement instead of the validated-data dict.
            serializer.instance = resume

        else:
            resume = serializer.save(
                candidate=candidate,
                original_filename=new_file.name,
            )

        try:
            PreviewService.generate(resume)
        except Exception as e:
            print("Preview generate error:", repr(e))

        ResumeService.process_resume(resume, candidate)

    @action(detail=True, methods=["get"], url_path="file")
    def file(self, request, pk=None):
        resume = self.get_object()
        download = request.query_params.get("download", "").lower() in ("true", "1", "yes")
        return FileService.serve_resume_file(resume, download=download)

    def perform_destroy(self, instance):
        if instance.resume_file:
            try:
                instance.resume_file.delete(save=False)
            except Exception:
                pass
        if instance.preview_pdf:
            try:
                instance.preview_pdf.delete(save=False)
            except Exception:
                pass
        instance.delete()

class JobPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = None
    max_page_size = 6


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = JobPagination

    def get_queryset(self):
        queryset = Job.objects.all().order_by("-id")
        params = self.request.query_params

        # =========================
        # SEARCH
        # =========================
        search = params.get("search")

        if search:
            search = search.strip()

            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search)
                    | Q(company__icontains=search)
                    | Q(location__icontains=search)
                    | Q(required_skills__icontains=search)
                    | Q(preferred_skills__icontains=search)
                    | Q(description__icontains=search)
                )

        # =========================
        # SKILLS
        # =========================
        skills = params.get("skills")

        if skills:
            skill_list = [
                skill.strip()
                for skill in skills.split(",")
                if skill.strip()
            ]

            for skill in skill_list:
                queryset = queryset.filter(
                    Q(required_skills__icontains=skill)
                    | Q(preferred_skills__icontains=skill)
                )

        # =========================
        # LOCATION
        # =========================
        location = params.get("location")

        if location:
            queryset = queryset.filter(
                location__icontains=location.strip()
            )

        # =========================
        # WORK MODE
        # =========================
        work_mode = params.get("work_mode")

        if work_mode and work_mode.lower() != "all":
            queryset = queryset.filter(
                work_mode__iexact=work_mode.strip()
            )

        # =========================
        # EXPERIENCE
        # =========================
        experience = params.get("experience")

        if experience and experience.lower() != "all":

            experience = experience.lower().strip()

            if experience == "entry":
                queryset = queryset.filter(
                    Q(experience__icontains="0")
                    | Q(experience__icontains="1")
                    | Q(experience__icontains="entry")
                    | Q(experience__icontains="fresher")
                )

            elif experience == "mid":
                queryset = queryset.filter(
                    Q(experience__icontains="2")
                    | Q(experience__icontains="3")
                    | Q(experience__icontains="4")
                    | Q(experience__icontains="5")
                    | Q(experience__icontains="mid")
                )

            elif experience == "senior":
                queryset = queryset.filter(
                    Q(experience__icontains="senior")
                    | Q(experience__icontains="5+")
                    | Q(experience__icontains="6")
                    | Q(experience__icontains="7")
                    | Q(experience__icontains="8")
                    | Q(experience__icontains="9")
                    | Q(experience__icontains="10")
                )

        return queryset

# =====================================
# JOB SWIPES VIEWSET (SWIPE ACTIONS & HISTORY)
# =====================================

class JobSwipeViewSet(viewsets.ModelViewSet):
    serializer_class = JobSwipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        candidate = Candidate.objects.filter(
            email__iexact=self.request.user.email
        ).first()

        if not candidate:
            return JobSwipe.objects.none()

        qs = JobSwipe.objects.filter(candidate=candidate).select_related("job").order_by("-created_at")

        decision = self.request.query_params.get("decision")
        if decision:
            decision = decision.strip().lower()
            if decision == "interested":
                qs = qs.filter(decision__in=["interested", "right"])
            elif decision == "skipped":
                qs = qs.filter(decision__in=["skipped", "left"])
            elif decision == "saved":
                qs = qs.filter(decision="saved")

        return qs

    def perform_create(self, serializer):
        candidate, _ = Candidate.objects.get_or_create(
            email__iexact=self.request.user.email,
            defaults={
                "full_name": self.request.user.get_full_name() or self.request.user.username,
                "email": self.request.user.email,
            }
        )

        job = serializer.validated_data.get("job")
        decision = serializer.validated_data.get("decision", "interested").lower()

        # Map legacy swipes to standard
        if decision == "right":
            decision = "interested"
        elif decision == "left":
            decision = "skipped"

        existing_swipe = JobSwipe.objects.filter(
            candidate=candidate,
            job=job
        ).first()

        if existing_swipe:
            existing_swipe.decision = decision
            existing_swipe.save(update_fields=["decision"])
            serializer.instance = existing_swipe
        else:
            serializer.save(
                candidate=candidate,
                decision=decision
            )

        # Invalidate served jobs cache so the next recommendation reflects newest swipe behavior
        try:
            from django.core.cache import cache
            from .services.recommendation_service import SERVED_JOBS_CACHE_PREFIX
            cache.delete(f"{SERVED_JOBS_CACHE_PREFIX}{candidate.id}")
        except Exception:
            pass


# =====================================
# APPLICATIONS VIEWSET
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

        return Application.objects.filter(
            candidate=candidate
        ).select_related("job", "applied_resume").order_by("-applied_at")

    def create(self, request, *args, **kwargs):
        candidate, _ = Candidate.objects.get_or_create(
            email__iexact=request.user.email,
            defaults={
                "full_name": request.user.get_full_name() or request.user.username,
                "email": request.user.email,
            }
        )

        job_id = request.data.get("job_id")
        if not job_id:
            return Response({"job_id": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        # Idempotent: If application already exists, return it with 200 OK
        existing = Application.objects.filter(candidate=candidate, job=job).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        resume = Resume.objects.filter(candidate=candidate).first()
        application = Application.objects.create(
            candidate=candidate,
            job=job,
            applied_resume=resume,
            cover_letter=request.data.get("cover_letter", ""),
            portfolio_url=request.data.get("portfolio_url", ""),
            linkedin_url=request.data.get("linkedin_url", ""),
            github_url=request.data.get("github_url", ""),
        )

        serializer = self.get_serializer(application)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# =====================================
# AI RECOMMENDATIONS VIEW
# =====================================

class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        refresh = request.query_params.get("refresh", "").lower() in ("true", "1", "yes")
        recommendations = RecommendationService.get_recommendations(request.user, force_refresh=refresh)
        return Response(recommendations)
