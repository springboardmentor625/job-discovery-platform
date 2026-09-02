from django.db.models import Q

from ..models import Candidate, Resume, Job, JobSwipe
from ..utils.recommendation import get_candidate_preferred_skills


def normalize_skills(skills):
    """
    Convert comma-separated skills into a normalized set.
    Example:
        "Python, Django, React"
        ->
        {"python", "django", "react"}
    """

    return {
        skill.strip().lower()
        for skill in (skills or "").split(",")
        if skill.strip()
        and skill.strip().lower() != "nan"
    }


class RecommendationService:
    """
    Handles job recommendation logic.
    """

    @staticmethod
    def get_recommended_jobs(user):

        # ============================================
        # FIND CANDIDATE + RESUME
        # ============================================

        try:
            candidate = (
                Candidate.objects
                .select_related("resume")
                .get(email__iexact=user.email)
            )
        except Candidate.DoesNotExist:
            return Job.objects.none()

        try:
            resume = candidate.resume
        except Resume.DoesNotExist:
            return Job.objects.none()

        # ============================================
        # CANDIDATE SKILLS
        # ============================================

        candidate_skills = normalize_skills(
            candidate.skills
        )

        # ============================================
        # PREFERRED SKILLS
        # ============================================

        preferred_skills = {
            str(skill).strip().lower()
            for skill in (
                get_candidate_preferred_skills(candidate) or []
            )
            if str(skill).strip()
            and str(skill).strip().lower() != "nan"
        }

        # ============================================
        # SWIPED JOBS
        # ============================================

        swiped_job_ids = set(
            JobSwipe.objects
            .filter(candidate=candidate)
            .values_list(
                "job_id",
                flat=True
            )
        )

        # ============================================
        # AVAILABLE JOBS
        # ============================================

        available_jobs = (
            Job.objects
            .exclude(id__in=swiped_job_ids)
            .only(
                "id",
                "title",
                "company",
                "location",
                "required_skills",
                "min_ats",
            )
        )

        # ============================================
        # ATS FILTER
        # ============================================

        if resume.ats_score is not None:
            available_jobs = available_jobs.filter(
                Q(min_ats__isnull=True)
                | Q(min_ats__lte=resume.ats_score)
            )

        # ============================================
        # CALCULATE RECOMMENDATIONS
        # ============================================

        job_scores = []

        for job in available_jobs:

            # ----------------------------------------
            # REQUIRED SKILLS
            # ----------------------------------------

            required_skills = normalize_skills(
                job.required_skills
            )

            # Ignore jobs without skills
            if not required_skills:
                continue

            # ----------------------------------------
            # RESUME MATCH
            # ----------------------------------------

            resume_matches = len(
                required_skills & candidate_skills
            )

            # ----------------------------------------
            # INTEREST MATCH
            # ----------------------------------------

            interest_matches = len(
                required_skills & preferred_skills
            )

            # ----------------------------------------
            # SCORE
            # ----------------------------------------

            # Resume skills are weighted twice as much
            # as preferred/interest skills.
            score = (
                resume_matches * 2
                + interest_matches
            )

            # ----------------------------------------
            # KEEP EXISTING RESPONSE STRUCTURE
            # ----------------------------------------

            job.recommendation_score = score
            job.resume_match = resume_matches
            job.interest_match = interest_matches

            job_scores.append(job)

        # ============================================
        # SORT
        # ============================================

        job_scores.sort(
            key=lambda job: (
                job.recommendation_score,
                job.resume_match,
                job.interest_match,
            ),
            reverse=True
        )

        return job_scores
