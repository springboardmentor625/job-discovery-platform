from django.conf import settings
from django.db import models


class Resume(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes"
    )
    file = models.FileField(upload_to="resumes/")
    version = models.PositiveIntegerField(default=1)
    parsed_text = models.TextField(blank=True)  # raw text extracted from the uploaded file
    extracted_skills = models.JSONField(default=list, blank=True)  # skills found by the parser
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resume<{self.user.email} v{self.version}>"
