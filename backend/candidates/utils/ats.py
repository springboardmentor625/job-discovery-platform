"""
AI/NLP based ATS and resume-job matching.

Provides:

    calculate_ats(candidate, job=None)
        Used by the resume/ATS workflow.

    calculate_job_ats(candidate, job)
        Used by recommendations and job-details.

Job-specific ATS uses:

    45% Required Skill Coverage
    30% Semantic Resume ↔ Job Fit
    20% Experience Compatibility
     5% Lexical Relevance

Skill Match is:

    matched required skills / recognized required skills * 100

Important:

- Preferred skills do not reduce the main Skill Match.
- Zero recognized required skills => Skill Match = 0.
- Zero matched skills => Skill Match = 0.
- No artificial score boosting.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from .matcher import (
    clean_text,
    normalize_skills,
    calculate_job_match,
    extract_skills_from_job,
    extract_required_skills_from_job_description,
)


class AIAtsService:
    """
    AI/NLP ATS service.

    Calculates how well a candidate's resume + profile
    matches a specific job.
    """

    # =====================================================
    # CANDIDATE TEXT
    # =====================================================

    @staticmethod
    def _get_candidate_profile_text(candidate) -> str:
        """Build a complete candidate representation."""

        if candidate is None:
            return ""

        if isinstance(candidate, dict):
            parts = [
                candidate.get("text", ""),
                candidate.get("experience", ""),
                candidate.get("education", ""),
                candidate.get("projects", ""),
                candidate.get("certifications", ""),
                candidate.get("skills", ""),
            ]

            return "\n".join(
                clean_text(part)
                for part in parts
                if clean_text(part)
            )

        parts = []

        resume = getattr(candidate, "resume", None)

        if resume:
            extracted_text = getattr(
                resume,
                "extracted_text",
                "",
            )

            if extracted_text:
                parts.append(
                    str(extracted_text)
                )

        profile_fields = [
            getattr(
                candidate,
                "preferred_job_roles",
                "",
            ),
            getattr(
                candidate,
                "career_interests",
                "",
            ),
            getattr(
                candidate,
                "experience",
                "",
            ),
            getattr(
                candidate,
                "education",
                "",
            ),
            getattr(
                candidate,
                "projects",
                "",
            ),
            getattr(
                candidate,
                "certifications",
                "",
            ),
            getattr(
                candidate,
                "bio",
                "",
            ),
            getattr(
                candidate,
                "skills",
                "",
            ),
        ]

        for field in profile_fields:
            value = clean_text(field)

            if value:
                parts.append(value)

        return "\n".join(parts)

    # =====================================================
    # CANDIDATE SKILLS
    # =====================================================

    @staticmethod
    def _get_candidate_skills(candidate) -> list[str]:
        """Get normalized skills from profile + resume."""

        if candidate is None:
            return []

        skills: list[str] = []

        if isinstance(candidate, dict):
            skills.extend(
                normalize_skills(
                    candidate.get("skills", [])
                )
            )

        else:
            profile_skills = getattr(
                candidate,
                "skills",
                "",
            )

            if profile_skills:
                skills.extend(
                    normalize_skills(
                        profile_skills
                    )
                )

            resume = getattr(
                candidate,
                "resume",
                None,
            )

            if resume:
                extracted_skills = getattr(
                    resume,
                    "extracted_skills",
                    "",
                )

                if extracted_skills:
                    skills.extend(
                        normalize_skills(
                            extracted_skills
                        )
                    )

        # Canonical de-duplication
        result = []
        seen = set()

        for skill in skills:
            normalized = normalize_skills([skill])

            if not normalized:
                continue

            key = clean_text(normalized[0]).lower()

            if not key or key in seen:
                continue

            seen.add(key)
            result.append(normalized[0])

        return result

    # =====================================================
    # JOB TEXT
    # =====================================================

    @staticmethod
    def _get_job_description_text(job) -> str:
        """
        Build the job representation used for matching.

        The description and requirements receive the main
        semantic weight. Company/location metadata is included
        only as contextual information.
        """

        if job is None:
            return ""

        parts = [
            getattr(job, "title", ""),
            getattr(job, "experience", ""),
            getattr(job, "required_skills", ""),
            getattr(job, "preferred_skills", ""),
            getattr(job, "description", ""),
        ]

        return "\n".join(
            clean_text(part)
            for part in parts
            if clean_text(part)
        )

    # =====================================================
    # ALL JOB SKILLS
    # =====================================================

    @staticmethod
    def _get_job_skills(job) -> list[str]:
        """
        Return all recognized job skills.

        Used for general job analysis.

        Sources:
        1. required_skills
        2. preferred_skills
        3. recognized skills in description
        """

        if job is None:
            return []

        required = (
            getattr(
                job,
                "required_skills",
                "",
            )
            or ""
        )

        preferred = (
            getattr(
                job,
                "preferred_skills",
                "",
            )
            or ""
        )

        description = (
            getattr(
                job,
                "description",
                "",
            )
            or ""
        )

        job_id = getattr(
            job,
            "id",
            None,
        )

        collected: list[str] = []

        if required:
            collected.extend(
                normalize_skills(
                    required
                )
            )

        if preferred:
            collected.extend(
                normalize_skills(
                    preferred
                )
            )

        if description:
            collected.extend(
                extract_skills_from_job(
                    description,
                    raw_skills=None,
                    job_id=job_id,
                )
            )

        result = []
        seen = set()

        for skill in collected:
            cleaned = clean_text(skill)

            if not cleaned:
                continue

            key = cleaned.lower()

            if key in seen:
                continue

            seen.add(key)
            result.append(cleaned)

        return result

    # =====================================================
    # REQUIRED JOB SKILLS
    # =====================================================

    @staticmethod
    def _get_required_job_skills(job) -> list[str]:
        """
        Return skills used as the Skill Match denominator.

        Priority:

        1. Explicit required_skills field
        2. Explicit required/must-have/essential sections
           in the description
        3. Recognized skills from the description as a final
           fallback when no structured requirement exists

        Preferred-only skills are NOT added when an explicit
        required skill list exists.
        """

        if job is None:
            return []

        required_field = (
            getattr(
                job,
                "required_skills",
                "",
            )
            or ""
        )

        description = (
            getattr(
                job,
                "description",
                "",
            )
            or ""
        )

        job_id = getattr(
            job,
            "id",
            None,
        )

        required_skills: list[str] = []

        # -------------------------------------------------
        # 1. Explicit structured required skills
        # -------------------------------------------------

        if required_field:
            required_skills=normalize_skills(required_field)

        # -------------------------------------------------
        # 2. Explicit required sections from description
        # -------------------------------------------------

        description_required = (
            extract_required_skills_from_job_description(
                description
            )
            if description
            else []
        )

        # If structured field exists, only add description
        # requirements that are not already represented.
        #
        # This avoids turning every technology mentioned in
        # the description into a required skill.
        required_skills.extend(
            description_required
        )

        # -------------------------------------------------
        # 3. Final fallback
        # -------------------------------------------------

        if not required_skills and description:
            required_skills.extend(
                extract_skills_from_job(
                    description,
                    raw_skills=None,
                    job_id=job_id,
                )
            )

        # -------------------------------------------------
        # 4. Final normalized de-duplication
        # -------------------------------------------------

        normalized = normalize_skills(
            required_skills
        )

        result = []
        seen = set()

        for skill in normalized:
            key = clean_text(skill).lower()

            if not key or key in seen:
                continue

            seen.add(key)
            result.append(skill)

        return result

    # =====================================================
    # JOB-SPECIFIC ATS
    # =====================================================

    @classmethod
    def calculate_job_ats(
        cls,
        candidate,
        job,
        candidate_embedding: np.ndarray | None = None,
        job_embedding: np.ndarray | None = None,
    ) -> dict[str, Any]:
        """
        Calculate job-specific ATS.
        """

        candidate_text = (
            cls._get_candidate_profile_text(
                candidate
            )
        )

        job_description = (
            cls._get_job_description_text(
                job
            )
        )

        candidate_skills = (
            cls._get_candidate_skills(
                candidate
            )
        )

        job_skills = (
            cls._get_job_skills(
                job
            )
        )

        required_job_skills = (
            cls._get_required_job_skills(
                job
            )
        )

        return calculate_job_match(
            resume_text=candidate_text,
            job_description=job_description,
            resume_skills=candidate_skills,
            job_skills=job_skills,
            required_job_skills=required_job_skills,
            candidate_embedding=candidate_embedding,
            job_embedding=job_embedding,
            candidate=candidate,
            job=job,
        )

    # =====================================================
    # GENERAL ATS / RESUME COMPLETENESS
    # =====================================================

    @classmethod
    def calculate(
        cls,
        candidate,
        job=None,
    ) -> dict[str, Any]:
        """
        General ATS entry point.

        When job is supplied:
            calculate actual job-specific ATS.

        When job is not supplied:
            calculate a simple resume/profile completeness score.
        """

        if job is not None:
            return cls.calculate_job_ats(
                candidate,
                job,
            )

        candidate_text = (
            cls._get_candidate_profile_text(
                candidate
            )
        )

        candidate_skills = (
            cls._get_candidate_skills(
                candidate
            )
        )

        if (
            not candidate_text
            and not candidate_skills
        ):
            return {
                "score": 0,
                "ats_score": 0,
                "skill_match_percentage": 0,
                "matched_skills": [],
                "missing_skills": [],
                "keyword_match_score": 0,
                "skill_count": 0,
                "semantic_similarity": 0,
                "text_similarity": 0,
            }

        score = 0

        if candidate_text:
            score += 30

        if candidate_skills:
            score += 25

        if isinstance(candidate, dict):
            if candidate.get("experience"):
                score += 15

            if candidate.get("education"):
                score += 15

            if candidate.get("projects"):
                score += 15

        else:
            if getattr(
                candidate,
                "experience",
                None,
            ):
                score += 15

            if getattr(
                candidate,
                "education",
                None,
            ):
                score += 15

            if getattr(
                candidate,
                "projects",
                None,
            ):
                score += 15

        score = max(
            0,
            min(100, score),
        )

        skill_count = len(
            candidate_skills
        )

        keyword_score = min(
            100,
            skill_count * 5,
        )

        return {
            "score": score,
            "ats_score": score,
            "skill_match_percentage": 0,
            "matched_skills": [],
            "missing_skills": [],
            "keyword_match_score": keyword_score,
            "skill_count": skill_count,
            "semantic_similarity": 0,
            "text_similarity": 0,
        }


# =========================================================
# PUBLIC COMPATIBILITY FUNCTIONS
# =========================================================

def calculate_job_ats(
    candidate,
    job,
    candidate_embedding: np.ndarray | None = None,
    job_embedding: np.ndarray | None = None,
) -> dict[str, Any]:
    """Public job-specific ATS function."""

    return AIAtsService.calculate_job_ats(
        candidate,
        job,
        candidate_embedding=candidate_embedding,
        job_embedding=job_embedding,
    )


def calculate_ats(
    candidate,
    job=None,
) -> dict[str, Any]:
    """Public compatibility function."""

    return AIAtsService.calculate(
        candidate,
        job,
    )