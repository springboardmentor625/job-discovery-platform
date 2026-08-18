from django.conf import settings
from django.db import models
from jobs.models import Job


class Recommendation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recommendations"
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="recommendations")
    match_score = models.FloatField()  # AI-generated match percentage (Milestone 3)

    class Meta:
        unique_together = ("user", "job")
        ordering = ["-match_score"]

    def __str__(self):
        return f"{self.user.email} <-> {self.job.title} ({self.match_score}%)"
