from django.conf import settings
from django.db import models


class Job(models.Model):
    class JobType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        INTERNSHIP = "internship", "Internship"
        REMOTE = "remote", "Remote"

    class CompanyType(models.TextChoices):
        MNC = "mnc", "MNC"
        STARTUP = "startup", "Startup"
        NEW_STARTUP = "new_startup", "Newly founded startup"
        UNSPECIFIED = "unspecified", "Not specified"

    class ExperienceLevel(models.TextChoices):
        FRESHER = "fresher", "Fresher"
        MID = "mid", "Mid-level"
        SENIOR = "senior", "Senior"

    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="jobs_posted"
    )
    external_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    company = models.CharField(max_length=255)
    company_type = models.CharField(
        max_length=20, choices=CompanyType.choices, default=CompanyType.STARTUP
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    job_type = models.CharField(max_length=20, choices=JobType.choices, default=JobType.FULL_TIME)
    experience_level = models.CharField(
        max_length=20, choices=ExperienceLevel.choices, default=ExperienceLevel.FRESHER
    )
    location = models.CharField(max_length=255, blank=True)
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    skills_required = models.JSONField(default=list, blank=True)
    posted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} @ {self.company}"