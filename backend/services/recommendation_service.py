from ..models import Candidate, Resume, Job, JobSwipe
from ..utils.recommendation import get_candidate_preferred_skills


class RecommendationService:
    """
    Handles job recommendation logic.
    """

    @staticmethod
    def get_recommended_jobs(user):
        # ============================================
        # FIND CANDIDATE
        # ============================================

        try:
            candidate = Candidate.objects.get(
                email__iexact=user.email
            )
        except Candidate.DoesNotExist:
            return Job.objects.none()

        # ============================================
        # GET RESUME
        # ============================================

        try:
            resume = candidate.resume
        except Resume.DoesNotExist:
            return Job.objects.none()

        # ============================================
        # CANDIDATE SKILLS
        # ============================================

        candidate_skills = {
            skill.strip().lower()
            for skill in (candidate.skills or "").split(",")
            if skill.strip()
        }

        # ============================================
        # PREFERRED SKILLS
        # ============================================

        preferred_skills = {
            str(skill).strip().lower()
            for skill in (
                get_candidate_preferred_skills(candidate) or []
            )
            if str(skill).strip()
        }

        # ============================================
        # SWIPED JOBS
        # ============================================

        swiped_job_ids = set(
            JobSwipe.objects.filter(
                candidate=candidate
            ).values_list(
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
        # CALCULATE SCORES
        # ============================================

        job_scores = []

        resume_ats = resume.ats_score

        for job in available_jobs:

            # ----------------------------------------
            # ATS FILTER
            # ----------------------------------------

            if (
                resume_ats is not None
                and job.min_ats is not None
                and resume_ats < job.min_ats
            ):
                continue

            # ----------------------------------------
            # REQUIRED SKILLS
            # ----------------------------------------

            required_skills = {
                skill.strip().lower()
                for skill in (job.required_skills or "").split(",")
                if (
                    skill.strip()
                    and skill.strip().lower() != "nan"
                )
            }

            # ----------------------------------------
            # MATCH SKILLS
            # ----------------------------------------

            resume_matches = len(
                required_skills & candidate_skills
            )

            interest_matches = len(
                required_skills & preferred_skills
            )

            # ----------------------------------------
            # SCORE
            # ----------------------------------------

            score = (
                resume_matches * 2
                + interest_matches
            )

            # ----------------------------------------
            # ATTACH RECOMMENDATION DATA
            # ----------------------------------------

            job.recommendation_score = score
            job.resume_match = resume_matches
            job.interest_match = interest_matches

            job_scores.append(job)

        # ============================================
        # SORT
        # ============================================

        job_scores.sort(
            key=lambda job: job.recommendation_score,
            reverse=True
        )

        return job_scores
