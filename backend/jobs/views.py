from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from resumes.models import Resume
from recommendations.models import Recommendation
from swipes.models import Swipe
from notifications.signals import notify_high_match

from .ats_scoring import get_ats_score
from .filters import apply_advanced_filters, apply_basic_filters, apply_skill_filter
from .matching import rank_jobs_for_resume
from .models import Job
from .serializers import JobSerializer, RecommendedJobSerializer


class JobListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobSerializer

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
            Resume.objects.filter(user=self.request.user).order_by("-uploaded_at").first()
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
            Recommendation.objects.update_or_create(
                user=self.request.user, job=job, defaults={"match_score": job.match_score}
            )
            notify_high_match(self.request.user, job, job.match_score)

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
            Resume.objects.filter(user=request.user).order_by("-uploaded_at").first()
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


class CompanyListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Job.objects.all()
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