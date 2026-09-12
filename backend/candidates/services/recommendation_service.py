"""
Recommendation Service for SwipeX.

Features:
- Staged pipeline for 123,849 jobs:
  lightweight candidate retrieval -> AI/NLP scoring -> top 50.
- Initial cold-start ranking based on resume, detected skills, profile fields,
  preferred roles, preferred locations, work mode, career interests,
  semantic similarity, job ATS, and skill match.
- Continuous swipe-based learning starting immediately from swipe 1.
- Rocchio relevance feedback on Sentence Transformer embeddings +
  scikit-learn ML preference modeling.
- Refresh creates a new maximum 50-job batch excluding previously served jobs.
- Safe fallbacks for missing resumes, empty profiles, or incomplete descriptions.
- AI Match is the main overall recommendation score.
"""

from __future__ import annotations

import re
import random
from typing import Any

import numpy as np

from django.db.models import Q
from django.core.cache import cache

from sklearn.linear_model import LogisticRegression

from ..models import Candidate, Job, JobSwipe, Application

from ..utils.matcher import (
    clean_text,
    normalize_skills,
    get_embedding,
    get_batch_embeddings,
)

from ..utils.ats import (
    calculate_job_ats,
    AIAtsService,
)


SERVED_JOBS_CACHE_PREFIX = "swipex_served_jobs_"
PREFERENCE_CACHE_PREFIX = "swipex_preference_profile_"

class RecommendationService:
    """
    Production AI/ML recommendation service for SwipeX.
    """

    # =========================================================
    # HELPER FUNCTIONS
    # =========================================================

    @staticmethod
    def get_salary(job) -> str:
        """Extract or format readable salary for a job."""

        salary = getattr(job, "salary", None)

        if salary:
            salary_text = str(salary).strip()

            if salary_text.lower() not in {
                "nan",
                "none",
                "null",
                "not specified",
                "",
            }:
                return salary_text

        description = str(
            getattr(job, "description", "") or ""
        )

        min_match = re.search(
            r"Min\s+Hourly\s+Rate.*?\$?\s*([0-9]+(?:\.[0-9]+)?)",
            description,
            re.IGNORECASE,
        )

        max_match = re.search(
            r"Max\s+Hourly\s+Rate.*?\$?\s*([0-9]+(?:\.[0-9]+)?)",
            description,
            re.IGNORECASE,
        )

        if min_match and max_match:
            return (
                f"${min_match.group(1)} - "
                f"${max_match.group(1)}/hr"
            )

        if min_match:
            return f"From ${min_match.group(1)}/hr"

        if max_match:
            return f"Up to ${max_match.group(1)}/hr"

        return "Competitive"

    @staticmethod
    def clean_value(
        value: Any,
        default: str = "",
    ) -> str:
        """Clean database values safely."""

        if value is None:
            return default

        value = str(value).strip()

        if value.lower() in {
            "",
            "nan",
            "none",
            "null",
            "undefined",
        }:
            return default

        return value

    # =========================================================
    # CANDIDATE PREFERENCE MODEL
    # CONTINUOUS SWIPE-BASED LEARNING
    # =========================================================

    @classmethod
    def _build_candidate_preference_profile(
        cls,
        candidate: Candidate,
    ) -> tuple[
        np.ndarray | None,
        list[str],
        int,
        Any | None,
    ]:
        """
        Builds candidate preference representation using:

        1. Resume/profile embedding
        2. Swipe history
        3. Applications
        4. Saved jobs
        5. Interested jobs
        6. Skipped jobs

        Learning begins immediately from swipe 1.
        """

        resume = getattr(candidate, "resume", None)

        profile_parts = [
            getattr(candidate, "preferred_job_roles", ""),
            getattr(candidate, "career_interests", ""),
            getattr(candidate, "skills", ""),
            (
                getattr(resume, "extracted_skills", "")
                if resume
                else ""
            ),
            getattr(candidate, "education", ""),
            getattr(candidate, "experience", ""),
            (
                getattr(resume, "extracted_text", "")[:600]
                if resume
                else ""
            ),
        ]

        base_text = " ".join(
            str(part)
            for part in profile_parts
            if part
        ).strip()

        base_vector = (
            get_embedding(base_text)
            if base_text
            else None
        )

        # -----------------------------------------------------
        # SWIPE HISTORY
        # -----------------------------------------------------

        swipes = list(
            JobSwipe.objects.filter(
                candidate=candidate
            )
            .select_related("job")
            .order_by("-created_at")[:100]
        )

        total_swipes = len(swipes)

        # -----------------------------------------------------
        # APPLICATION HISTORY
        # -----------------------------------------------------

        applications = list(
            Application.objects.filter(
                candidate=candidate
            ).values_list(
                "job_id",
                flat=True,
            )
        )

        applied_job_ids = set(applications)

        positive_jobs = []
        positive_weights = []

        negative_jobs = []
        negative_weights = []

        positive_keywords: list[str] = []

        seen_job_ids = set()

        # -----------------------------------------------------
        # PROCESS SWIPES
        # -----------------------------------------------------

        for swipe in swipes:

            job = swipe.job

            if not job:
                continue

            if job.id in seen_job_ids:
                continue

            seen_job_ids.add(job.id)

            decision = (
                swipe.decision or ""
            ).lower()

            is_applied = (
                job.id in applied_job_ids
            )

            job_snippet = (
                f"{job.title} "
                f"{job.company} "
                f"{job.required_skills} "
                f"{str(job.description or '')[:200]}"
            )

            # Applied = strongest positive signal
            if is_applied:

                positive_jobs.append(
                    job_snippet
                )

                positive_weights.append(1.5)

                positive_keywords.extend(
                    str(job.title).split()
                )

            # Interested / Right swipe
            elif decision in {
                "interested",
                "right",
            }:

                positive_jobs.append(
                    job_snippet
                )

                positive_weights.append(1.0)

                positive_keywords.extend(
                    str(job.title).split()
                )

            # Saved
            elif decision == "saved":

                positive_jobs.append(
                    job_snippet
                )

                positive_weights.append(1.2)

                positive_keywords.extend(
                    str(job.title).split()
                )

            # Skipped / Left swipe
            elif decision in {
                "skipped",
                "left",
            }:

                negative_jobs.append(
                    job_snippet
                )

                negative_weights.append(0.8)

        # -----------------------------------------------------
        # EMPTY PROFILE FALLBACK
        # -----------------------------------------------------

        if (
            base_vector is None
            and not positive_jobs
            and not negative_jobs
        ):
            return None, [], 0, None

        # -----------------------------------------------------
        # BATCH EMBEDDINGS
        # -----------------------------------------------------

        all_swipe_texts = (
            positive_jobs
            + negative_jobs
        )

        swipe_embeddings = (
            get_batch_embeddings(
                all_swipe_texts,
                batch_size=64,
            )
            if all_swipe_texts
            else []
        )

        pos_count = len(positive_jobs)

        pos_vectors = [
            vec
            for vec in swipe_embeddings[:pos_count]
            if vec is not None
        ]

        neg_vectors = [
            vec
            for vec in swipe_embeddings[pos_count:]
            if vec is not None
        ]

        current_vector = base_vector

        # -----------------------------------------------------
        # POSITIVE CENTROID
        # -----------------------------------------------------

        pos_centroid = None

        if pos_vectors:

            weights = np.array(
                positive_weights[:len(pos_vectors)],
                dtype=np.float32,
            )

            weight_sum = np.sum(weights)

            if weight_sum > 0:
                weights /= weight_sum

            pos_centroid = np.average(
                np.array(pos_vectors),
                axis=0,
                weights=weights,
            )

        # -----------------------------------------------------
        # NEGATIVE CENTROID
        # -----------------------------------------------------

        neg_centroid = None

        if neg_vectors:

            weights = np.array(
                negative_weights[:len(neg_vectors)],
                dtype=np.float32,
            )

            weight_sum = np.sum(weights)

            if weight_sum > 0:
                weights /= weight_sum

            neg_centroid = np.average(
                np.array(neg_vectors),
                axis=0,
                weights=weights,
            )

        # -----------------------------------------------------
        # ROCCHIO PREFERENCE LEARNING
        # -----------------------------------------------------

        if total_swipes > 0:

            history_weight = min(
                0.70,
                0.20 + (
                    total_swipes * 0.01
                ),
            )

            base_weight = (
                1.0 - history_weight
            )

            # Use embedding dimension dynamically
            vector_size = 384

            if current_vector is not None:
                vector_size = len(current_vector)

            elif pos_centroid is not None:
                vector_size = len(pos_centroid)

            elif neg_centroid is not None:
                vector_size = len(neg_centroid)

            pref_vec = np.zeros(
                vector_size,
                dtype=np.float32,
            )

            if current_vector is not None:

                pref_vec += (
                    base_weight
                    * current_vector
                )

            if pos_centroid is not None:

                pref_vec += (
                    history_weight
                    * pos_centroid
                )

            if neg_centroid is not None:

                pref_vec -= (
                    history_weight
                    * 0.35
                    * neg_centroid
                )

            norm = np.linalg.norm(
                pref_vec
            )

            if norm > 1e-6:

                current_vector = (
                    pref_vec / norm
                )

        elif current_vector is not None:

            norm = np.linalg.norm(
                current_vector
            )

            if norm > 1e-6:

                current_vector = (
                    current_vector / norm
                )

        # =====================================================
        # ML CLASSIFIER
        # Requires enough positive and negative signals
        # =====================================================

        ml_model = None

        if (
            len(pos_vectors) >= 3
            and len(neg_vectors) >= 3
        ):

            try:

                X_train = []
                y_train = []

                # Positive examples
                for pv in pos_vectors:

                    sim_base = (
                        float(pv @ base_vector)
                        if base_vector is not None
                        else 0.5
                    )

                    sim_pos = (
                        float(pv @ pos_centroid)
                        if pos_centroid is not None
                        else 0.5
                    )

                    sim_neg = (
                        float(pv @ neg_centroid)
                        if neg_centroid is not None
                        else 0.0
                    )

                    X_train.append([
                        sim_base,
                        sim_pos,
                        sim_neg,
                    ])

                    y_train.append(1)

                # Negative examples
                for nv in neg_vectors:

                    sim_base = (
                        float(nv @ base_vector)
                        if base_vector is not None
                        else 0.5
                    )

                    sim_pos = (
                        float(nv @ pos_centroid)
                        if pos_centroid is not None
                        else 0.0
                    )

                    sim_neg = (
                        float(nv @ neg_centroid)
                        if neg_centroid is not None
                        else 0.5
                    )

                    X_train.append([
                        sim_base,
                        sim_pos,
                        sim_neg,
                    ])

                    y_train.append(0)

                clf = LogisticRegression(
                    max_iter=100,
                    C=1.0,
                )

                clf.fit(
                    X_train,
                    y_train,
                )

                ml_model = (
                    clf,
                    base_vector,
                    pos_centroid,
                    neg_centroid,
                )

            except Exception:

                ml_model = None

        # -----------------------------------------------------
        # CLEAN POSITIVE KEYWORDS
        # -----------------------------------------------------

        clean_pos_keywords = [

            keyword.lower()

            for keyword in positive_keywords

            if (
                len(keyword) >= 3
                and keyword.lower()
                not in {
                    "the",
                    "and",
                    "for",
                    "with",
                    "senior",
                    "junior",
                    "lead",
                }
            )
        ]

        return (
            current_vector,
            clean_pos_keywords,
            total_swipes,
            ml_model,
        )

    # =========================================================
    # STAGE 1
    # LIGHTWEIGHT CANDIDATE RETRIEVAL
    # =========================================================

    @classmethod
    def _retrieve_candidate_job_pool(
        cls,
        candidate: Candidate,
        swiped_job_ids: set[int],
        exclude_served_ids: set[int],
        positive_keywords: list[str],
        limit: int = 50,
    ) -> list[Job]:

        """
        Fast SQL candidate retrieval.

        Narrows the 123,849 job database
        to approximately 80 high-potential jobs.
        """

        all_excluded_ids = (
            swiped_job_ids
            | exclude_served_ids
        )

        roles_text = clean_text(
            getattr(
                candidate,
                "preferred_job_roles",
                "",
            )
        )

        locations_text = clean_text(
            getattr(
                candidate,
                "preferred_locations",
                "",
            )
        )

        work_mode = clean_text(
            getattr(
                candidate,
                "preferred_work_mode",
                "",
            )
        )

        resume = getattr(
            candidate,
            "resume",
            None,
        )

        extracted_skills = (

            normalize_skills(
                getattr(
                    resume,
                    "extracted_skills",
                    "",
                )
            )

            if resume

            else []
        )

        profile_skills = normalize_skills(
            getattr(
                candidate,
                "skills",
                "",
            )
        )

        all_skills = list(
            dict.fromkeys(
                extracted_skills
                + profile_skills
            )
        )

        role_tokens = [

            role.strip()

            for role in re.split(
                r"[,;/]+",
                roles_text,
            )

            if len(role.strip()) >= 3
        ]

        loc_tokens = [

            location.strip()

            for location in re.split(
                r"[,;/]+",
                locations_text,
            )

            if len(location.strip()) >= 3
        ]

        pool: list[Job] = []

        collected_ids: set[int] = set()

        # -----------------------------------------------------
        # ADD UNIQUE JOBS
        # -----------------------------------------------------

        def add_jobs(queryset):

            for job in queryset:

                if (
                    job.id not in collected_ids
                    and job.id not in all_excluded_ids
                ):

                    collected_ids.add(
                        job.id
                    )

                    pool.append(job)

                    if len(pool) >= limit:

                        return True

            return False

        # =====================================================
        # 1. LEARNED POSITIVE SWIPE KEYWORDS
        # =====================================================

        if positive_keywords:

            sample_pos = list(
                dict.fromkeys(
                    positive_keywords
                )
            )[:4]

            q_pos = Q()

            for keyword in sample_pos:

                q_pos |= (
                    Q(
                        title__icontains=keyword
                    )
                    |
                    Q(
                        required_skills__icontains=keyword
                    )
                )

            if q_pos:

                pos_qs = (

                    Job.objects.filter(q_pos)

                    .exclude(
                        id__in=all_excluded_ids
                    )

                    .order_by("-id")[:30]
                )

                if add_jobs(pos_qs):

                    return pool

        # =====================================================
        # 2. PREFERRED ROLES
        # =====================================================

        if role_tokens:

            q_roles = Q()

            for role in role_tokens[:3]:

                q_roles |= Q(
                    title__icontains=role
                )

            if q_roles:

                role_qs = (

                    Job.objects.filter(q_roles)

                    .exclude(
                        id__in=all_excluded_ids
                    )

                    .order_by("-id")[:30]
                )

                if add_jobs(role_qs):

                    return pool

        # =====================================================
        # 3. DETECTED SKILLS
        # =====================================================

        if all_skills:

            q_skills = Q()

            for skill in all_skills[:4]:

                if len(skill) >= 3:

                    q_skills |= (

                        Q(
                            required_skills__icontains=skill
                        )

                        |

                        Q(
                            preferred_skills__icontains=skill
                        )
                    )

            if q_skills:

                skill_qs = (

                    Job.objects.filter(q_skills)

                    .exclude(
                        id__in=all_excluded_ids
                    )

                    .order_by("-id")[:30]
                )

                if add_jobs(skill_qs):

                    return pool

        # =====================================================
        # 4. PREFERRED LOCATIONS
        # =====================================================

        if loc_tokens:

            q_loc = Q()

            for location in loc_tokens[:2]:

                q_loc |= Q(
                    location__icontains=location
                )

            if q_loc:

                loc_qs = (

                    Job.objects.filter(q_loc)

                    .exclude(
                        id__in=all_excluded_ids
                    )

                    .order_by("-id")[:20]
                )

                if add_jobs(loc_qs):

                    return pool

        # =====================================================
        # 5. WORK MODE
        # =====================================================

        if (
            work_mode
            and work_mode.lower()
            not in {
                "any",
                "all",
                "",
            }
        ):

            mode_qs = (

                Job.objects.filter(
                    work_mode__iexact=work_mode
                )

                .exclude(
                    id__in=all_excluded_ids
                )

                .order_by("-id")[:20]
            )

            if add_jobs(mode_qs):

                return pool

        # =====================================================
        # 6. GENERAL EXPLORATION
        # =====================================================

        remaining_needed = max(
            50,
            limit - len(pool),
        )

        total_remaining_jobs = (

            Job.objects

            .exclude(
                id__in=all_excluded_ids
            )

            .count()
        )

        if total_remaining_jobs > 0:

            max_offset = max(
                0,
                total_remaining_jobs
                - remaining_needed,
            )

            random_offset = (

                random.randint(
                    0,
                    min(
                        max_offset,
                        1500,
                    ),
                )

                if max_offset > 0

                else 0
            )

            general_qs = (

                Job.objects

                .exclude(
                    id__in=all_excluded_ids
                )

                .order_by("-id")[
                    random_offset:
                    random_offset
                    + remaining_needed
                ]
            )

            add_jobs(general_qs)

        return pool

    # =========================================================
    # MAIN RECOMMENDATION ENGINE
    # =========================================================
    @classmethod
    def get_recommendations(
        cls,
        user,
        force_refresh: bool = False,
    ) -> list[dict[str, Any]]:

        """
        Generate ranked recommendations.

        Always returns a maximum of 50 jobs.

        The recommendation ranking uses AI Match
        as the primary overall score.
        """

        # -----------------------------------------------------
        # AUTHENTICATION CHECK
        # -----------------------------------------------------

        if (
            not user
            or not user.is_authenticated
        ):
            return []

        # -----------------------------------------------------
        # GET CANDIDATE
        # -----------------------------------------------------

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

        # -----------------------------------------------------
        # CACHE KEY
        # -----------------------------------------------------

        cache_key = (
            f"{SERVED_JOBS_CACHE_PREFIX}"
            f"{candidate.id}"
        )

        # =====================================================
        # 1. SWIPED JOBS
        # =====================================================

        swiped_job_ids = set(

            JobSwipe.objects.filter(
                candidate=candidate
            )

            .values_list(
                "job_id",
                flat=True,
            )
        )

        # =====================================================
        # SAVED JOBS
        # =====================================================

        saved_job_ids = set(

            JobSwipe.objects.filter(
                candidate=candidate,
                decision="saved",
            )

            .values_list(
                "job_id",
                flat=True,
            )
        )

        # =====================================================
        # APPLIED JOBS
        # =====================================================

        applied_job_ids = set(

            Application.objects.filter(
                candidate=candidate
            )

            .values_list(
                "job_id",
                flat=True,
            )
        )

        # =====================================================
        # 2. PREVIOUSLY SERVED JOBS
        # =====================================================

        served_ids = cache.get(
            cache_key,
            set(),
        )

        if not isinstance(
            served_ids,
            set,
        ):

            served_ids = set(
                served_ids
            )

        # =====================================================
        # 3. BUILD PREFERENCE PROFILE
        # =====================================================

        preference_cache_key = (f"{PREFERENCE_CACHE_PREFIX}{candidate.id}")

        cached_preference = cache.get(preference_cache_key)

        if cached_preference is not None:
            (pref_vector,pos_keywords,total_swipes,ml_model,) = cached_preference
        else:
            (
            pref_vector,
            pos_keywords,
            total_swipes,
            ml_model,
            ) = cls._build_candidate_preference_profile(candidate)

            cache.set(
            preference_cache_key,
            (
            pref_vector,
            pos_keywords,
            total_swipes,
            ml_model,
            ),timeout=300,)

        # =====================================================
        # 4. STAGE 1
        # RETRIEVE ~80 CANDIDATE JOBS
        # =====================================================

        candidate_pool = (
            cls._retrieve_candidate_job_pool(

                candidate=candidate,

                swiped_job_ids=swiped_job_ids,

                exclude_served_ids=(
                    served_ids
                    if force_refresh
                    else set()
                ),

                positive_keywords=pos_keywords,

                limit=50,
            )
        )

        # -----------------------------------------------------
        # FALLBACK
        # -----------------------------------------------------

        if (
            not candidate_pool
            and served_ids
        ):

            cache.delete(
                cache_key
            )

            candidate_pool = (
                cls._retrieve_candidate_job_pool(

                    candidate=candidate,

                    swiped_job_ids=swiped_job_ids,

                    exclude_served_ids=set(),

                    positive_keywords=pos_keywords,

                    limit=50,
                )
            )

        if not candidate_pool:
            return []

        # =====================================================
        # 5. CANDIDATE PROFILE EMBEDDING
        # =====================================================

        candidate_profile_text = (
            AIAtsService
            ._get_candidate_profile_text(
                candidate
            )
        )

        cand_profile_vec = get_embedding(
            candidate_profile_text
        )

        # =====================================================
        # 6. BATCH JOB EMBEDDINGS
        # =====================================================

        job_texts = [

            (
                f"{job.title} "
                f"{job.company} "
                f"{job.location} "
                f"{job.work_mode} "
                f"{job.required_skills} "
                f"{str(job.description or '')[:300]}"
            )

            for job in candidate_pool
        ]

        job_embeddings = (
            get_batch_embeddings(
                job_texts,
                batch_size=64,
            )
        )

        # =====================================================
        # 7. AI/NLP SCORING
        # =====================================================

        recommendations = []

        for index, job in enumerate(
            candidate_pool
        ):

            job_vec = job_embeddings[index]

            # -------------------------------------------------
            # ATS CALCULATION
            # -------------------------------------------------

            try:

                ats_info = calculate_job_ats(

                    candidate,

                    job,

                    candidate_embedding=(
                        cand_profile_vec
                    ),

                    job_embedding=job_vec,
                )

            except Exception:

                ats_info = {

                    "ats_score": 0,

                    "skill_match_percentage": 0,

                    "matched_skills": [],

                    "missing_skills": [],

                    "semantic_similarity": 0,

                    "text_similarity": 0,

                    "experience_fit": 50,

                    "why_matches": [],

                    "tips": [],
                }

            # =================================================
            # EXTRACT SCORES
            # =================================================

            ats_score = float(
                ats_info.get(
                    "ats_score",
                    0,
                )
                or 0
            )

            skill_pct = float(
                ats_info.get(
                    "skill_match_percentage",
                    0,
                )
                or 0
            )

            experience_fit = float(
                ats_info.get(
                    "experience_fit",
                    50,
                )
            )

            semantic_fit = float(
                ats_info.get(
                    "semantic_similarity",
                    0,
                )
            )
            
            # Ensure all values stay 0-100
            ats_score = max(
                0,
                min(100, ats_score),
            )

            skill_pct = max(
                0,
                min(100, skill_pct),
            )

            experience_fit = max(
                0,
                min(100, experience_fit),
            )

            # semantic similarity may sometimes be 0-1
            if semantic_fit <= 1:
                semantic_fit *= 100

            semantic_fit = max(
                0,
                min(100, semantic_fit),
            )

            # =================================================
            # PREFERENCE ALIGNMENT SCORE
            # =================================================

            pref_score = 50.0

            if (
                pref_vector is not None
                and job_vec is not None
            ):

                similarity = float(
                    pref_vector @ job_vec
                )

                pref_score = max(
                    0.0,
                    min(
                        100.0,
                        (similarity + 0.2)
                        * 100.0,
                    ),
                )

            # =================================================
            # ML PREFERENCE MODEL
            # =================================================

            if (
                ml_model is not None
                and job_vec is not None
            ):

                try:

                    (
                        clf,
                        base_vec,
                        pos_cent,
                        neg_cent,
                    ) = ml_model

                    sim_base = (

                        float(
                            job_vec @ base_vec
                        )

                        if base_vec is not None

                        else 0.5
                    )

                    sim_pos = (

                        float(
                            job_vec @ pos_cent
                        )

                        if pos_cent is not None

                        else 0.5
                    )

                    sim_neg = (

                        float(
                            job_vec @ neg_cent
                        )

                        if neg_cent is not None

                        else 0.0
                    )

                    features = [[
                        sim_base,
                        sim_pos,
                        sim_neg,
                    ]]

                    if hasattr(
                        clf,
                        "predict_proba",
                    ):

                        probability = float(
                            clf.predict_proba(
                                features
                            )[0][1]
                        )

                    else:

                        probability = (
                            1.0

                            if clf.predict(
                                features
                            )[0] == 1

                            else 0.0
                        )

                    pref_score = (

                        pref_score * 0.40

                        +

                        probability
                        * 100.0
                        * 0.60
                    )

                except Exception:
                    pass

            pref_score = max(
                0,
                min(100, pref_score),
            )

            # =================================================
            # AI MATCH SCORE
            # =================================================
            #
            # AI Match is the main recommendation score.
            # ATS and Skill Match remain detailed metrics.
            # Experience is important to prevent senior jobs
            # from ranking too highly for junior candidates.
            # =================================================

            if total_swipes == 0:
                ai_match = round((ats_score * 0.35)+(skill_pct * 0.30)+(semantic_fit * 0.20)+(experience_fit * 0.15))
            else:
                ai_match = round((pref_score * 0.35)+(ats_score * 0.25)+(skill_pct * 0.20)+(semantic_fit * 0.10)+(experience_fit * 0.10))

            ai_match = max(0,min(100, ai_match),)

            # =================================================
            # SKILLS
            # =================================================

            matched_skills = [

                str(skill).title()

                for skill in ats_info.get(
                    "matched_skills",
                    [],
                )
            ]

            missing_skills = [

                str(skill).title()

                for skill in ats_info.get(
                    "missing_skills",
                    [],
                )
            ]

            # =================================================
            # RECOMMENDATION OBJECT
            # =================================================

            recommendations.append({

                "job": {

                    "id": job.id,

                    "title": cls.clean_value(
                        job.title,
                        "Job Opportunity",
                    ),

                    "company": cls.clean_value(
                        job.company,
                        "Company",
                    ),

                    "location": cls.clean_value(
                        job.location,
                        "Remote",
                    ),

                    "work_mode": cls.clean_value(
                        job.work_mode,
                        "On-site",
                    ),

                    "salary": cls.get_salary(
                        job
                    ),

                    "experience": cls.clean_value(
                        job.experience,
                        "Entry to Mid Level",
                    ),

                    "description": cls.clean_value(
                        job.description,
                        "",
                    ),

                    "required_skills": cls.clean_value(
                        job.required_skills,
                        "",
                    ),

                    "preferred_skills": cls.clean_value(
                        job.preferred_skills,
                        "",
                    ),

                    "application_url": cls.clean_value(
                        job.application_url,
                        "",
                    ),

                    "min_ats": getattr(
                        job,
                        "min_ats",
                        None,
                    ),
                },

                # ---------------------------------------------
                # MAIN RECOMMENDATION SCORE
                # ---------------------------------------------

                "ai_match": ai_match,

                # Backwards compatibility
                "match_score": ai_match,

                # ---------------------------------------------
                # DETAILED SCORES
                # ---------------------------------------------

                "ats_score": ats_score,

                "skill_match_percentage": skill_pct,

                "experience_fit": experience_fit,

                "semantic_similarity": semantic_fit,

                "preference_score": pref_score,

                # ---------------------------------------------
                # SKILLS
                # ---------------------------------------------

                "matched_skills": matched_skills,

                "missing_skills": missing_skills,

                # ---------------------------------------------
                # EXPLANATION
                # ---------------------------------------------

                "why_matches": ats_info.get(
                    "why_matches",
                    [],
                ),

                "tips": ats_info.get(
                    "tips",
                    [],
                ),

                "recognized_job_skill_count":
                    ats_info.get(
                        "recognized_job_skill_count",
                        0,
                    ),

                "text_similarity":
                    ats_info.get(
                        "text_similarity",
                        0,
                    ),

                # ---------------------------------------------
                # STATUS
                # ---------------------------------------------

                "is_applied":
                    job.id in applied_job_ids,

                "is_saved":
                    job.id in saved_job_ids,
            })

        # =====================================================
        # 8. SORT BY AI MATCH
        # =====================================================

        recommendations.sort(

            key=lambda item: (

                item["ai_match"],

                item["ats_score"],

                item[
                    "skill_match_percentage"
                ],
            ),

            reverse=True,
        )

        # =====================================================
        # 9. TOP 50
        # =====================================================

        final_batch = recommendations[:50]

        # =====================================================
        # 10. RECORD SERVED JOBS
        # =====================================================

        newly_served = {

            recommendation["job"]["id"]

            for recommendation
            in final_batch
        }

        cache.set(

            cache_key,

            served_ids | newly_served,

            timeout=3600,
        )

        return final_batch