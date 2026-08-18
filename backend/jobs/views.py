from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from resumes.models import Resume
from recommendations.models import Recommendation
from swipes.models import Swipe

from .models import Job
from .serializers import JobSerializer, RecommendedJobSerializer


class JobListView(generics.ListAPIView):
    """GET /api/jobs/  — browse all postings (no ATS scoring)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobSerializer
    queryset = Job.objects.all().order_by("-posted_at")


class RecommendedJobsView(generics.ListAPIView):
    """
    GET /api/jobs/recommended/
    'ATS Analysis' + 'View Recommended Jobs' in the candidate workflow.

    Match score = % of a job's required skills found in the user's most
    recently uploaded resume. Jobs the user has already swiped on (left,
    right, or save) are excluded so the swipe deck always shows new jobs.
    Results are cached into the Recommendation table as they're computed.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecommendedJobSerializer

    def get_queryset(self):
        latest_resume = (
            Resume.objects.filter(user=self.request.user).order_by("-uploaded_at").first()
        )
        if latest_resume is None:
            raise ValidationError(
                "Upload a resume first — recommendations are based on your extracted skills."
            )

        resume_skills = set(s.lower() for s in latest_resume.extracted_skills)
        already_swiped_job_ids = Swipe.objects.filter(
            user=self.request.user
        ).values_list("job_id", flat=True)

        jobs = Job.objects.exclude(id__in=already_swiped_job_ids).order_by("-posted_at")

        scored_jobs = []
        for job in jobs:
            job_skills = set(s.lower() for s in job.skills_required)
            if job_skills:
                overlap = resume_skills & job_skills
                score = round(len(overlap) / len(job_skills) * 100, 1)
            else:
                score = 0.0

            job.match_score = score
            scored_jobs.append(job)

            Recommendation.objects.update_or_create(
                user=self.request.user, job=job, defaults={"match_score": score}
            )

        scored_jobs.sort(key=lambda j: j.match_score, reverse=True)
        return scored_jobs