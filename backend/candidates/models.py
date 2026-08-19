from django.db import models


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

    experience = models.CharField(
        max_length=20,
        blank=True,
        default=""
    )

    education = models.TextField(
        blank=True
    )

    projects = models.TextField(
        blank=True
    )

    certifications = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.full_name


# =====================================
# RESUME
# =====================================

class Resume(models.Model):

    candidate = models.OneToOneField(
        Candidate,
        on_delete=models.CASCADE,
        related_name="resume"
    )

    resume_file = models.FileField(
        upload_to="resumes/"
    )

    # Parsed resume information
    extracted_text = models.TextField(
        blank=True,
        default=""
    )

    extracted_skills = models.TextField(
        blank=True,
        default=""
    )

    extracted_experience = models.TextField(
        blank=True,
        default=""
    )

    extracted_education = models.TextField(
        blank=True,
        default=""
    )

    # ATS result
    ats_score = models.IntegerField(
        default=0
    )

    missing_skills = models.TextField(
        blank=True,
        default=""
    )

    ats_suggestions = models.TextField(
        blank=True,
        default=""
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.candidate.full_name} - "
            f"{self.resume_file.name}"
        )

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
        on_delete=models.CASCADE,
        related_name="applications"
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications"
    )

    applied_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.candidate.full_name} - "
            f"{self.job.title}"
        )
