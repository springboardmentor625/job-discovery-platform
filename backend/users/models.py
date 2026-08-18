from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model with a role field.
    email is used as the login identifier (see USERNAME_FIELD below).
    """

    class Role(models.TextChoices):
        JOB_SEEKER = "job_seeker", "Job Seeker"
        RECRUITER = "recruiter", "Recruiter"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.JOB_SEEKER)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"


class Profile(models.Model):
    """Extended job-seeker info, kept separate from auth-focused User fields."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)  # list of skill strings
    experience = models.TextField(blank=True)
    portfolio_url = models.URLField(blank=True)

    def __str__(self):
        return f"Profile<{self.user.email}>"
