from django.db import models
import os


# =====================================
# CANDIDATE
# =====================================

class Candidate(models.Model):

    full_name = models.CharField(
        max_length=100
    )

    email = models.EmailField(
        unique=True
    )

    phone = models.CharField(
        max_length=15
    )

    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )

    skills = models.TextField(
        blank=True,
        default=""
    )

    experience = models.TextField()

    education = models.TextField(
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
        return self.full_name


# =====================================
# RESUME
# =====================================

def resume_upload_path(instance, filename):
    """
    Store the resume using its original filename.
    The original filename is also preserved in original_filename.
    """

    return f"resumes/{filename}"

class Resume(models.Model):
    candidate = models.OneToOneField(
        Candidate,
        on_delete=models.CASCADE,
        related_name="resume"
    )

    resume_file = models.FileField(upload_to=resume_upload_path)

    # PDF generated from DOCX (used for viewing)
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

    # =====================================
    # PARSED RESUME INFORMATION
    # =====================================

    extracted_text = models.TextField(blank=True, default="")
    extracted_skills = models.TextField(blank=True, default="")
    extracted_experience = models.TextField(blank=True, default="")
    extracted_education = models.TextField(blank=True, default="")

    # =====================================
    # ATS RESULT
    # =====================================

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
        return f"{self.candidate.full_name} - {self.resume_file.name}"
# =====================================
# JOB
# =====================================

class Job(models.Model):

    title = models.CharField(
        max_length=100
    )

    company = models.CharField(
        max_length=100
    )

    location = models.CharField(
        max_length=100
    )

    required_skills = models.TextField()

    min_ats = models.IntegerField(
        default=50
    )

    def __str__(self):
        return self.title


# =====================================
# JOB SWIPE
# =====================================

class JobSwipe(models.Model):

    SWIPE_CHOICES = [
        ("left", "Left"),
        ("right", "Right"),
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
        max_length=10,
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
        return (
            f"{self.candidate.full_name} - "
            f"{self.job.title} - "
            f"{self.decision}"
        )


# =====================================
# APPLICATION
# =====================================

class Application(models.Model):

    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE
    )

    cover_letter = models.TextField(
        blank=True
    )

    portfolio_url = models.URLField(
        blank=True
    )

    linkedin_url = models.URLField(
        blank=True
    )

    github_url = models.URLField(
        blank=True
    )

    expected_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    available_from = models.DateField(
        null=True,
        blank=True
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