from django.conf import settings
from django.db import models


class Resume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes")
    file = models.FileField(upload_to="resumes/")
    version = models.PositiveIntegerField(default=1)
    target_role = models.CharField(max_length=255, blank=True)  # e.g. "Frontend Developer"
    is_active = models.BooleanField(default=False)  # which resume matching currently uses
    parsed_text = models.TextField(blank=True)
    extracted_skills = models.JSONField(default=list, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        role = f" ({self.target_role})" if self.target_role else ""
        return f"Resume<{self.user.email} v{self.version}{role}>"