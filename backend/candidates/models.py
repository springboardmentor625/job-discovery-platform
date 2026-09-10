from django.db import models
import os


# =====================================
# CANDIDATE
# =====================================

class Candidate(models.Model):

    full_name = models.CharField(
        max_length=150
    )

    email = models.EmailField(
        unique=True
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        default=""
    )

    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )

    current_location = models.CharField(
        max_length=150,
        blank=True,
        default=""
    )

    education = models.TextField(
        blank=True,
        default=""
    )

    experience = models.TextField(
        blank=True,
        default=""
    )

    preferred_job_roles = models.TextField(
        blank=True,
        default=""
    )

    preferred_locations = models.TextField(
        blank=True,
        default=""
    )

    preferred_work_mode = models.CharField(
        max_length=50,
        blank=True,
        default="Any"
    )

    career_interests = models.TextField(
        blank=True,
        default=""
    )

    skills = models.TextField(
        blank=True,
        default=""
    )

    bio = models.TextField(
        blank=True,
        default=""
    )

    projects = models.TextField(
        blank=True,
        default=""
    )

    certifications = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.full_name} ({self.email})"


# =====================================
# RESUME
# =====================================

def resume_upload_path(instance, filename):
    return f"resumes/{filename}"


class Resume(models.Model):
    candidate = models.OneToOneField(
        Candidate,
        on_delete=models.CASCADE,
        related_name="resume"
    )

    resume_file = models.FileField(upload_to=resume_upload_path)

    preview_pdf = models.FileField(
        upload_to="resume_previews/",
        blank=True,
        null=True,
    )

    original_filename = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    extracted_text = models.TextField(blank=True, default="")
    extracted_skills = models.TextField(blank=True, default="")
    extracted_experience = models.TextField(blank=True, default="")
    extracted_education = models.TextField(blank=True, default="")

    ats_score = models.IntegerField(default=0)
    probability_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )
    missing_skills = models.TextField(blank=True, default="")
    ats_suggestions = models.TextField(blank=True, default="")

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.candidate.full_name} - {self.original_filename or self.resume_file.name}"


# =====================================
# JOB
# =====================================

class Job(models.Model):

    title = models.CharField(
        max_length=255
    )

    company = models.CharField(
        max_length=255
    )

    location = models.CharField(
        max_length=255
    )

    work_mode = models.CharField(
        max_length=50,
        blank=True,
        default="On-site"
    )

    salary = models.CharField(
        max_length=100,
        blank=True,
        default="Competitive"
    )

    experience = models.CharField(
        max_length=100,
        blank=True,
        default="Entry to Mid Level"
    )

    description = models.TextField(
        blank=True,
        default=""
    )

    required_skills = models.TextField(
        blank=True,
        default=""
    )

    preferred_skills = models.TextField(
        blank=True,
        default=""
    )

    application_url = models.URLField(
        max_length=1000,
        blank=True,
        default=""
    )

    min_ats = models.IntegerField(
        default=50
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.title} at {self.company}"


# =====================================
# JOB SWIPE
# =====================================

class JobSwipe(models.Model):

    SWIPE_CHOICES = [
        ("interested", "Interested"),
        ("saved", "Saved"),
        ("skipped", "Skipped"),
        ("right", "Interested"),
        ("left", "Skipped"),
    ]

    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="job_swipes"
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="swipes"
    )

    decision = models.CharField(
        max_length=20,
        choices=SWIPE_CHOICES
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"],
                name="unique_candidate_job_swipe"
            )
        ]

    def __str__(self):
        return f"{self.candidate.full_name} - {self.job.title} - {self.decision}"


# =====================================
# APPLICATION
# =====================================

class Application(models.Model):

    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="applications"
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications"
    )

    cover_letter = models.TextField(
        blank=True,
        default=""
    )

    portfolio_url = models.URLField(
        blank=True,
        default=""
    )

    linkedin_url = models.URLField(
        blank=True,
        default=""
    )

    github_url = models.URLField(
        blank=True,
        default=""
    )

    expected_salary = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default=""
    )

    available_from = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        default=""
    )

    applied_resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    applied_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"],
                name="unique_candidate_job_application"
            )
        ]

    def __str__(self):
        return f"{self.candidate.full_name} applied to {self.job.title} ({self.job.company})"