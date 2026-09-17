import shutil
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
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
from .services.resume_service import (
    ResumeService,
    ResumeValidationError,
)
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

            return Resume.objects.filter(
                candidate=candidate
            )

        except Candidate.DoesNotExist:
            return Resume.objects.none()

    def get_candidate(self):
        candidate, _ = Candidate.objects.get_or_create(
            email__iexact=self.request.user.email,
            defaults={
                "full_name": (
                    self.request.user.get_full_name()
                    or self.request.user.username
                ),
                "email": self.request.user.email,
                "phone": "",
                "skills": "",
                "experience": "",
                "education": "",
                "preferred_job_roles": "",
                "preferred_locations": "",
                "preferred_work_mode": "Any",
                "career_interests": "",
                "bio": "",
            },
        )

        return candidate

    def perform_create(self, serializer):
        candidate = self.get_candidate()

        new_file = serializer.validated_data.get(
            "resume_file"
        )

        if not new_file:
            raise serializers.ValidationError(
                {
                    "resume_file": (
                        "Please upload a resume file."
                    )
                }
            )

        # ------------------------------------------------
        # IMPORTANT:
        # Validate the uploaded resume BEFORE changing
        # the existing database resume.
        # ------------------------------------------------

        try:
            parsed_result = (
                ResumeService.validate_uploaded_file(
                    new_file,
                    candidate,
                )
            )

        except ResumeValidationError as exc:
            raise serializers.ValidationError(
                {
                    "resume_file": str(exc)
                }
            )

        existing = (
            Resume.objects
            .filter(candidate=candidate)
            .first()
        )

        # =================================================
        # REPLACE EXISTING RESUME
        # =================================================

        if existing:

            old_resume_name = (
                existing.resume_file.name
                if existing.resume_file
                else None
            )

            old_preview_name = (
                existing.preview_pdf.name
                if existing.preview_pdf
                else None
            )

            old_original_filename = (
                existing.original_filename
            )

            # Assign the new file.
            # The old physical file is NOT deleted yet.
            existing.resume_file = new_file
            existing.original_filename = new_file.name
            existing.preview_pdf = None

            existing.save(
                update_fields=[
                    "resume_file",
                    "original_filename",
                    "preview_pdf",
                ]
            )

            new_resume_name = existing.resume_file.name

            try:
                try:
                    PreviewService.generate(
                        existing
                    )
                except Exception as preview_error:
                    print(
                        "Preview generate error:",
                        repr(preview_error)
                    )

                ResumeService.process_resume(
                    existing,
                    candidate,
                    parsed_result=parsed_result,
                )

            except ResumeValidationError as exc:

                # Remove newly uploaded files.
                current_resume_name = (
                    existing.resume_file.name
                )

                current_preview_name = (
                    existing.preview_pdf.name
                    if existing.preview_pdf
                    else None
                )

                storage = (
                    existing.resume_file.storage
                )

                if (
                    current_resume_name
                    and current_resume_name
                    != old_resume_name
                ):
                    storage.delete(
                        current_resume_name
                    )

                if (
                    current_preview_name
                    and current_preview_name
                    != old_preview_name
                ):
                    existing.preview_pdf.storage.delete(
                        current_preview_name
                    )

                # Restore old valid resume.
                existing.resume_file.name = (
                    old_resume_name
                    or ""
                )

                existing.preview_pdf.name = (
                    old_preview_name
                    if old_preview_name
                    else ""
                )

                existing.original_filename = (
                    old_original_filename
                )

                existing.save()

                raise serializers.ValidationError(
                    {
                        "resume_file": str(exc)
                    }
                )

            except Exception:

                # Restore old resume if processing fails.
                current_resume_name = (
                    existing.resume_file.name
                )

                current_preview_name = (
                    existing.preview_pdf.name
                    if existing.preview_pdf
                    else None
                )

                storage = (
                    existing.resume_file.storage
                )

                if (
                    current_resume_name
                    and current_resume_name
                    != old_resume_name
                ):
                    storage.delete(
                        current_resume_name
                    )

                if (
                    current_preview_name
                    and current_preview_name
                    != old_preview_name
                ):
                    existing.preview_pdf.storage.delete(
                        current_preview_name
                    )

                existing.resume_file.name = (
                    old_resume_name
                    or ""
                )

                existing.preview_pdf.name = (
                    old_preview_name
                    if old_preview_name
                    else ""
                )

                existing.original_filename = (
                    old_original_filename
                )

                existing.save()

                raise

            # ------------------------------------------------
            # New resume succeeded.
            # Now it is safe to delete the old files.
            # ------------------------------------------------

            if (
                old_resume_name
                and old_resume_name
                != existing.resume_file.name
            ):
                existing.resume_file.storage.delete(
                    old_resume_name
                )

            if (
                old_preview_name
                and (
                    not existing.preview_pdf
                    or old_preview_name
                    != existing.preview_pdf.name
                )
            ):
                storage = (
                    existing.preview_pdf.storage
                    if existing.preview_pdf
                    else Resume.objects.model._meta
                    .get_field("preview_pdf")
                    .storage
                )

                storage.delete(
                    old_preview_name
                )

            serializer.instance = existing
            return

        # =================================================
        # FIRST RESUME
        # =================================================

        resume = serializer.save(
            candidate=candidate,
            original_filename=new_file.name,
        )

        try:

            try:
                PreviewService.generate(
                    resume
                )

            except Exception as preview_error:
                print(
                    "Preview generate error:",
                    repr(preview_error)
                )

            ResumeService.process_resume(
                resume,
                candidate,
                parsed_result=parsed_result,
            )

            serializer.instance = resume

        except ResumeValidationError as exc:

            # Remove rejected resume.
            if resume.resume_file:
                try:
                    resume.resume_file.delete(
                        save=False
                    )
                except Exception:
                    pass

            if resume.preview_pdf:
                try:
                    resume.preview_pdf.delete(
                        save=False
                    )
                except Exception:
                    pass

            resume.delete()

            raise serializers.ValidationError(
                {
                    "resume_file": str(exc)
                }
            )

        except Exception:

            if resume.resume_file:
                try:
                    resume.resume_file.delete(
                        save=False
                    )
                except Exception:
                    pass

            if resume.preview_pdf:
                try:
                    resume.preview_pdf.delete(
                        save=False
                    )
                except Exception:
                    pass

            resume.delete()

            raise

    @action(
        detail=True,
        methods=["get"],
        url_path="file",
    )
    def file(self, request, pk=None):
        resume = self.get_object()

        download = (
            request.query_params
            .get("download", "")
            .lower()
            in ("true", "1", "yes")
        )

        return FileService.serve_resume_file(
            resume,
            download=download,
        )

    def perform_destroy(self, instance):

        if instance.resume_file:
            try:
                instance.resume_file.delete(
                    save=False
                )
            except Exception:
                pass

        if instance.preview_pdf:
            try:
                instance.preview_pdf.delete(
                    save=False
                )
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
        from django.utils import timezone
        now = timezone.now()
        queryset = (
            Job.objects.filter(is_active=True)
            .order_by("-id")
        )
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

        # Map swipe gestures to standard decisions
        if decision in ("right", "interested"):
            decision = "interested"
        elif decision in ("left", "skipped"):
            decision = "skipped"
        elif decision in ("up", "saved"):
            decision = "saved"

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

        # Invalidate preference cache so subsequent batch generations reflect updated preferences
        # Preserve CURRENT_BATCH_CACHE so browser refresh preserves current deck position
        try:
            from django.core.cache import cache
            from .services.recommendation_service import (
                PREFERENCE_CACHE_PREFIX,
            )
            cache.delete(f"{PREFERENCE_CACHE_PREFIX}{candidate.id}")
        except Exception:
            pass

    def perform_destroy(self, instance):
        candidate = instance.candidate
        # Delete only the candidate's JobSwipe record (job itself is never deleted)
        instance.delete()

        # Invalidate caches so the unswiped job can reappear in recommendations and Explore
        try:
            from django.core.cache import cache
            from .services.recommendation_service import (
                SERVED_JOBS_CACHE_PREFIX,
                PREFERENCE_CACHE_PREFIX,
                CURRENT_BATCH_CACHE_PREFIX,
            )
            cache.delete(f"{SERVED_JOBS_CACHE_PREFIX}{candidate.id}")
            cache.delete(f"{PREFERENCE_CACHE_PREFIX}{candidate.id}")
            cache.delete(f"{CURRENT_BATCH_CACHE_PREFIX}{candidate.id}")
        except Exception:
            pass

    @action(detail=False, methods=["post"], url_path="undo")
    def undo(self, request):
        candidate = Candidate.objects.filter(
            email__iexact=request.user.email
        ).first()
        if not candidate:
            return Response(
                {"detail": "Candidate profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        job_id = request.data.get("job_id")
        swipe_id = request.data.get("swipe_id")

        if swipe_id:
            swipe = JobSwipe.objects.filter(
                id=swipe_id, candidate=candidate
            ).first()
        elif job_id:
            swipe = JobSwipe.objects.filter(
                job_id=job_id, candidate=candidate
            ).first()
        else:
            # Undo most recent swipe
            swipe = (
                JobSwipe.objects.filter(candidate=candidate)
                .order_by("-created_at")
                .first()
            )

        if not swipe:
            return Response(
                {"detail": "No swipe found to undo."},
                status=status.HTTP_404_NOT_FOUND,
            )

        undone_job_id = swipe.job_id
        undone_decision = swipe.decision
        self.perform_destroy(swipe)

        return Response(
            {
                "detail": "Swipe undone successfully.",
                "job_id": undone_job_id,
                "decision": undone_decision,
            },
            status=status.HTTP_200_OK,
        )



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
        if (
    not job.is_active
    or (
        job.expires_at is not None
        and job.expires_at <= timezone.now()
    )
):
            return Response(
        {"detail": "This job is no longer accepting applications."},
        status=status.HTTP_400_BAD_REQUEST
    )
        status_val = request.data.get("status", "link_opened")
        if status_val not in ("link_opened", "applied"):
            status_val = "link_opened"

        # If application already exists, update status if requested and return it with 200 OK
        existing = Application.objects.filter(candidate=candidate, job=job).first()
        if existing:
            if existing.status != status_val:
                existing.status = status_val
                existing.save(update_fields=["status"])
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        resume = Resume.objects.filter(candidate=candidate).first()
        application = Application.objects.create(
            candidate=candidate,
            job=job,
            status=status_val,
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


# =====================================
# JOBS LAST-UPDATED INDICATOR
# =====================================

class JobsLastUpdatedView(APIView):
    """
    GET /api/jobs/last-updated/

    Returns the most recent import timestamp for live jobs, counts
    of jobs by source, and the total active job count.  Used by the
    frontend to show a "Refreshed X minutes ago" badge.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Max, Count
        from django.utils import timezone
        now = timezone.now()

        qs = Job.objects.filter(is_active=True).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )

        # Most recent posted_at among live-imported jobs
        live_qs = qs.exclude(source="dataset")
        last_updated = live_qs.aggregate(last=Max("posted_at"))["last"]

        # Per-source counts
        source_counts = list(
            qs.values("source").annotate(count=Count("id")).order_by("source")
        )

        return Response(
            {
                "last_updated": last_updated,
                "total_active": qs.count(),
                "sources": source_counts,
            }
        )
