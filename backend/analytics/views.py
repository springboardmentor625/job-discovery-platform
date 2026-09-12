from collections import Counter

from django.db.models import Avg, Count
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import Application
from jobs.models import Job
from recommendations.models import Recommendation
from swipes.models import Swipe


class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        applications_by_status = dict(
            Application.objects.filter(user=user)
            .values("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )

        swipes_by_direction = dict(
            Swipe.objects.filter(user=user)
            .values("direction")
            .annotate(count=Count("id"))
            .values_list("direction", "count")
        )

        avg_match = Recommendation.objects.filter(user=user).aggregate(avg=Avg("match_score"))[
            "avg"
        ]

        applied_job_ids = Application.objects.filter(user=user).values_list("job_id", flat=True)
        skill_counter = Counter()
        for job in Job.objects.filter(id__in=applied_job_ids):
            skill_counter.update(s.lower() for s in job.skills_required)
        top_skills = [{"skill": s, "count": c} for s, c in skill_counter.most_common(8)]

        return Response(
            {
                "applications_by_status": applications_by_status,
                "swipes_by_direction": swipes_by_direction,
                "average_match_score": round(avg_match, 1) if avg_match else None,
                "top_skills_in_your_applications": top_skills,
                "total_jobs_in_platform": Job.objects.count(),
            }
        )