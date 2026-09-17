from rest_framework import serializers

from .filters import get_competition_level
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    # applicant_count comes from a DB-level annotation (see jobs/filters.py) —
    # NOT a SerializerMethodField, so it costs zero extra queries per job.
    applicant_count = serializers.IntegerField(read_only=True, default=0)
    competition_level = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id", "company", "company_type", "title", "description", "job_type",
            "experience_level", "location", "salary_min", "salary_max",
            "skills_required", "posted_at", "applicant_count", "competition_level",
        ]

    def get_competition_level(self, job):
        # Reads the already-annotated count — no additional query.
        return get_competition_level(getattr(job, "applicant_count", 0))


class RecommendedJobSerializer(JobSerializer):
    match_score = serializers.FloatField(read_only=True)

    class Meta(JobSerializer.Meta):
        fields = JobSerializer.Meta.fields + ["match_score"]