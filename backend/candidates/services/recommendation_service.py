from ..models import Candidate, Resume, Job, JobSwipe
from ..utils.recommendation import get_candidate_preferred_skills


# =====================================
# SKILL NORMALIZATION
# =====================================

def normalize_skills(skills):
    """
    Convert comma/newline/semicolon separated skills
    into a normalized set.

    Example:
        Python, Django, React
        ->
        {"python", "django", "react"}
    """

    if not skills:
        return set()

    value = str(skills)

    value = value.replace("\n", ",")
    value = value.replace(";", ",")

    return {
        skill.strip().lower()
        for skill in value.split(",")
        if skill.strip()
        and skill.strip().lower() != "nan"
    }


# =====================================
# SKILL DISPLAY
# =====================================

def display_skill(skill):
    """
    Convert normalized skill into a clean display name.
    """

    replacements = {
        "python": "Python",
        "django": "Django",
        "react": "React",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "nodejs": "Node.js",
        "node.js": "Node.js",
        "sql": "SQL",
        "mysql": "MySQL",
        "postgresql": "PostgreSQL",
        "mongodb": "MongoDB",
        "aws": "AWS",
        "azure": "Azure",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "git": "Git",
        "html": "HTML",
        "css": "CSS",
        "c++": "C++",
        "c#": "C#",
        "java": "Java",
        "angular": "Angular",
        "flask": "Flask",
    }

    return replacements.get(
        skill.lower(),
        skill.title()
    )


# =====================================
# RECOMMENDATION SERVICE
# =====================================

class RecommendationService:

    @staticmethod
    def get_recommendations(user):

        # =====================================
        # FIND CANDIDATE
        # =====================================

        candidate = (
            Candidate.objects
            .select_related("resume")
            .filter(
                email__iexact=user.email
            )
            .first()
        )

        if not candidate:
            return []

        # =====================================
        # RESUME
        # =====================================

        resume = getattr(
            candidate,
            "resume",
            None
        )

        if not resume:
            return []

        # =====================================
        # CANDIDATE SKILLS
        # =====================================

        candidate_skills = normalize_skills(
            candidate.skills
        )

        # Also use skills extracted from resume
        resume_skills = normalize_skills(
            resume.extracted_skills
        )

        all_resume_skills = (
            candidate_skills
            | resume_skills
        )

        # =====================================
        # PREFERRED SKILLS
        # =====================================

        preferred_skills = {
            str(skill).strip().lower()
            for skill in (
                get_candidate_preferred_skills(
                    candidate
                ) or []
            )
            if str(skill).strip()
            and str(skill).strip().lower() != "nan"
        }

        # =====================================
        # SWIPED JOBS
        # =====================================

        swiped_job_ids = set(
            JobSwipe.objects
            .filter(candidate=candidate)
            .values_list(
                "job_id",
                flat=True
            )
        )

        # =====================================
        # AVAILABLE JOBS
        # =====================================

        available_jobs = (
            Job.objects
            .exclude(
                id__in=swiped_job_ids
            )
            .only(
                "id",
                "title",
                "company",
                "location",
                "description",
                "required_skills",
                "min_ats",
            )
        )

        # =====================================
        # ATS FILTER
        # =====================================

        if resume.ats_score is not None:

            available_jobs = available_jobs.filter(
                min_ats__lte=resume.ats_score
            )

        recommendations = []

        # =====================================
        # CALCULATE
        # =====================================

        for job in available_jobs:

            required_skills = normalize_skills(
                job.required_skills
            )

            if not required_skills:
                continue

            # ---------------------------------
            # MATCHED
            # ---------------------------------

            matched = (
                required_skills
                & all_resume_skills
            )

            # ---------------------------------
            # MISSING
            # ---------------------------------

            missing = (
                required_skills
                - matched
            )

            # ---------------------------------
            # INTEREST
            # ---------------------------------

            interest_matches = (
                required_skills
                & preferred_skills
            )

            # ---------------------------------
            # SKILL %
            # ---------------------------------

            skill_percentage = round(
                (
                    len(matched)
                    /
                    len(required_skills)
                ) * 100
            )

            # ---------------------------------
            # OVERALL SCORE
            # ---------------------------------

            ats_score = resume.ats_score or 0

            overall_score = round(
                (ats_score * 0.60)
                +
                (skill_percentage * 0.40)
            )

            # ---------------------------------
            # RECOMMENDATION SCORE
            # ---------------------------------

            recommendation_score = (
                len(matched) * 2
                +
                len(interest_matches)
            )

            # ---------------------------------
            # AI REASONS
            # ---------------------------------

            reasons = []

            if matched:
                reasons.append(
                    f"Your resume matches "
                    f"{len(matched)} of "
                    f"{len(required_skills)} required skills."
                )

            if resume.extracted_skills:

                if matched:
                    first_skill = display_skill(
                        sorted(matched)[0]
                    )

                    reasons.append(
                        f"Your resume contains "
                        f"{first_skill}."
                    )

            if interest_matches:

                first_interest = display_skill(
                    sorted(interest_matches)[0]
                )

                reasons.append(
                    f"{first_interest} matches "
                    f"your career interests."
                )

            if resume.ats_score:

                reasons.append(
                    f"Your resume ATS score is "
                    f"{resume.ats_score}%."
                )

            if not reasons:

                reasons.append(
                    "This job matches your "
                    "current career profile."
                )

            # ---------------------------------
            # STORE
            # ---------------------------------

            recommendations.append({
                "job": job,
                "match_score": overall_score,
                "skill_match_percentage": skill_percentage,
                "recommendation_score": recommendation_score,
                "matched_skills": [
                    display_skill(skill)
                    for skill in sorted(matched)
                ],
                "missing_skills": [
                    display_skill(skill)
                    for skill in sorted(missing)
                ],
                "resume_skills": [
                    display_skill(skill)
                    for skill in sorted(all_resume_skills)
                ],
                "reasons": reasons,
            })

        # =====================================
        # SORT
        # =====================================

        recommendations.sort(
            key=lambda item: (
                item["match_score"],
                item["recommendation_score"],
                len(item["matched_skills"]),
            ),
            reverse=True
        )

        return recommendations[:20]

    # =====================================
    # OLD METHOD COMPATIBILITY
    # =====================================

    @staticmethod
    def get_recommended_jobs(user):

        recommendations = (
            RecommendationService
            .get_recommendations(user)
        )

        return [
            item["job"]
            for item in recommendations
        ]
