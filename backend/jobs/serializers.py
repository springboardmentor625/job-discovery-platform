from rest_framework import serializers

from applications.models import Application

from .models import Job


class JobSerializer(serializers.ModelSerializer):
    applicant_count = serializers.SerializerMethodField()
    competition_level = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id", "company", "company_type", "title", "description", "job_type",
            "experience_level", "location", "salary_min", "salary_max",
            "skills_required", "posted_at", "applicant_count", "competition_level",
        ]

    def get_applicant_count(self, job):
        return Application.objects.filter(job=job, status=Application.Status.APPLIED).count()

    def get_competition_level(self, job):
        count = self.get_applicant_count(job)
        if count < 3:
            return "low"
        if count < 8:
            return "medium"
        return "high"


class RecommendedJobSerializer(JobSerializer):
    match_score = serializers.FloatField(read_only=True)

    class Meta(JobSerializer.Meta):
        fields = JobSerializer.Meta.fields + ["match_score"]