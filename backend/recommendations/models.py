from django.conf import settings
from django.db import models
from jobs.models import Job


class Recommendation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recommendations"
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="recommendations")
    match_score = models.FloatField()  # TF-IDF similarity score

    # Groq AI ATS scoring — cached so we don't re-call the API unnecessarily
    ats_score = models.IntegerField(null=True, blank=True)
    matching_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    suggestion = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "job")
        ordering = ["-match_score"]

    def __str__(self):
        return f"{self.user.email} <-> {self.job.title} ({self.match_score}%)"