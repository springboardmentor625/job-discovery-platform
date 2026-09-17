from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from resumes.models import Resume
from recommendations.models import Recommendation
from swipes.models import Swipe
from notifications.signals import notify_high_match

from .ats_scoring import get_ats_score, clean_job_description
from .filters import apply_advanced_filters, apply_basic_filters, apply_skill_filter
from .matching import rank_jobs_for_resume
from .models import Job
from .serializers import JobSerializer, RecommendedJobSerializer


class JobPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class JobListView(generics.ListAPIView):
    """GET /api/jobs/  — browse/search all postings (no ATS scoring). Paginated
    (20 per page by default) since the dataset can be thousands of rows."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobSerializer
    pagination_class = JobPagination

    def get_queryset(self):
        queryset = apply_basic_filters(Job.objects.all(), self.request).order_by("-posted_at")
        jobs = list(queryset)
        jobs = apply_skill_filter(jobs, self.request)
        jobs = apply_advanced_filters(jobs, self.request)
        return jobs

class RecommendedJobsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecommendedJobSerializer

    def get_queryset(self):
        latest_resume = (
                        (Resume.objects.filter(user=self.request.user, is_active=True).first()
            or Resume.objects.filter(user=self.request.user).order_by("-uploaded_at").first())
        )
        if latest_resume is None:
            raise ValidationError(
                "Upload a resume first — recommendations are based on your resume text."
            )

        resume_text = latest_resume.parsed_text or " ".join(latest_resume.extracted_skills)
        if not resume_text.strip():
            raise ValidationError("Your resume didn't contain any readable text to match on.")

        already_swiped_job_ids = list(
            Swipe.objects.filter(user=self.request.user).values_list("job_id", flat=True)
        )

        try:
            scores_by_job_id = rank_jobs_for_resume(
                resume_text, exclude_job_ids=already_swiped_job_ids
            )
        except FileNotFoundError as exc:
            raise ValidationError(str(exc))

        queryset = apply_basic_filters(
            Job.objects.filter(id__in=scores_by_job_id.keys()), self.request
        )
        jobs = list(queryset)
        jobs = apply_skill_filter(jobs, self.request)
        jobs = apply_advanced_filters(jobs, self.request)

        for job in jobs:
            job.match_score = scores_by_job_id[job.id]
        jobs.sort(key=lambda j: j.match_score, reverse=True)

        # Limit to a sensible deck size — default 20, capped at 50 via ?limit=
        try:
            limit = min(int(self.request.query_params.get("limit", 20)), 50)
        except ValueError:
            limit = 20
        jobs = jobs[:limit]

        # Only cache/notify for the jobs actually being returned, not every
        # matching job in the database (which could be 1000+)
        for job in jobs:
            Recommendation.objects.update_or_create(
                user=self.request.user, job=job, defaults={"match_score": job.match_score}
            )
            notify_high_match(self.request.user, job, job.match_score)

        return jobs

        jobs.sort(key=lambda j: j.match_score, reverse=True)
        return jobs


class JobAtsScoreView(APIView):
    """
    GET /api/jobs/<id>/ats-score/
    Calls Groq to generate a real AI ATS score + skill gap analysis for one
    specific job against the user's latest resume. Called on-demand (not for
    the whole list) since an LLM call per job would be slow and costly.

    Result is cached in the Recommendation table: if this job was already
    scored for the user's CURRENT resume, the cached result is returned
    instantly instead of calling Groq again. A new resume upload
    automatically invalidates the cache (checked via timestamp).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({"detail": "Job not found."}, status=404)

        latest_resume = (
                        (Resume.objects.filter(user=request.user, is_active=True).first()
            or Resume.objects.filter(user=request.user).order_by("-uploaded_at").first())
        )
        if latest_resume is None:
            raise ValidationError("Upload a resume first.")

        recommendation, _ = Recommendation.objects.get_or_create(
            user=request.user, job=job, defaults={"match_score": 0.0}
        )

        is_cached = (
            recommendation.ats_score is not None
            and recommendation.updated_at >= latest_resume.uploaded_at
        )
        if is_cached:
            return Response(
                {
                    "match_score": recommendation.ats_score,
                    "matching_skills": recommendation.matching_skills,
                    "missing_skills": recommendation.missing_skills,
                    "suggestion": recommendation.suggestion,
                    "cached": True,
                }
            )

        result = get_ats_score(latest_resume.parsed_text, job)

        if "error" not in result:
            recommendation.ats_score = result.get("match_score")
            recommendation.matching_skills = result.get("matching_skills", [])
            recommendation.missing_skills = result.get("missing_skills", [])
            recommendation.suggestion = result.get("suggestion", "")
            recommendation.save()
            result["cached"] = False

        return Response(result)

class JobDescriptionView(APIView):
    """
    GET /api/jobs/<id>/description/  — returns an AI-cleaned version of a
    job's scraped description, generated once via Groq and cached on the
    Job row from then on. Falls back to the raw description if Groq isn't
    configured or the call fails, so this never blocks the user from seeing
    something.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            raise ValidationError(["Job not found."])

        if job.cleaned_description:
            return Response({"description": job.cleaned_description, "cleaned": True})

        cleaned = clean_job_description(job)
        if cleaned:
            job.cleaned_description = cleaned
            job.save(update_fields=["cleaned_description"])
            return Response({"description": cleaned, "cleaned": True})

        return Response({"description": job.description, "cleaned": False})


class CompanyListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Job.objects.only("company", "company_type", "skills_required", "location")
        company_type = request.query_params.get("company_type")
        if company_type:
            queryset = queryset.filter(company_type=company_type)

        companies = {}
        for job in queryset:
            entry = companies.setdefault(
                job.company,
                {
                    "company": job.company,
                    "company_type": job.company_type,
                    "open_jobs": 0,
                    "skills": set(),
                    "locations": set(),
                },
            )
            entry["open_jobs"] += 1
            entry["skills"].update(job.skills_required)
            if job.location:
                entry["locations"].add(job.location)

        results = [
            {
                "company": c["company"],
                "company_type": c["company_type"],
                "open_jobs": c["open_jobs"],
                "skills": sorted(c["skills"]),
                "locations": sorted(c["locations"]),
            }
            for c in companies.values()
        ]
        results.sort(key=lambda c: c["open_jobs"], reverse=True)
        return Response(results)