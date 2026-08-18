from rest_framework import serializers

from .models import Job


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id", "company", "title", "description", "job_type", "location",
            "salary_min", "salary_max", "skills_required", "posted_at",
        ]


class RecommendedJobSerializer(JobSerializer):
    """Adds the ATS match_score for the requesting user's latest resume."""

    match_score = serializers.FloatField(read_only=True)

    class Meta(JobSerializer.Meta):
        fields = JobSerializer.Meta.fields + ["match_score"]