from collections import defaultdict


# =========================================================
# SWIPE PREFERENCE MODEL
# =========================================================

def calculate_swipe_preference(
    swipe_history,
    job
):
    """
    Calculate a personalization score from the user's
    previous swipe behaviour.

    This uses the user's actual swipe_history records.

    RIGHT / SAVE  -> positive preference
    LEFT          -> negative preference
    """

    if not swipe_history:
        return 0.0

    # -----------------------------------------------------
    # JOBS THE USER SHOWED POSITIVE INTEREST IN
    # -----------------------------------------------------

    positive_jobs = []
    negative_jobs = []

    for swipe in swipe_history:

        action = str(
            swipe.swipe_action or ""
        ).strip().lower()

        if action in {
            "right",
            "save",
            "saved",
            "favorite",
            "favourite",
        }:
            positive_jobs.append(
                swipe.job_id
            )

        elif action in {
            "left",
            "skip",
        }:
            negative_jobs.append(
                swipe.job_id
            )

    # -----------------------------------------------------
    # DIRECT JOB INTERACTION
    # -----------------------------------------------------

    if job.job_id in positive_jobs:
        return 10.0

    if job.job_id in negative_jobs:
        return -10.0

    # -----------------------------------------------------
    # NO DIRECT INTERACTION
    # -----------------------------------------------------

    return 0.0


# =========================================================
# LEARN USER PREFERENCE
# =========================================================

def learn_user_preferences(
    swipe_history,
    jobs
):
    """
    Learn basic user preferences from actual swipe history.

    Returns preference information that can be used
    by the recommendation engine.
    """

    preferences = {
        "preferred_job_types": defaultdict(int),
        "preferred_locations": defaultdict(int),
        "preferred_skills": defaultdict(int),
    }

    job_map = {
        job.job_id: job
        for job in jobs
    }

    for swipe in swipe_history:

        job = job_map.get(
            swipe.job_id
        )

        if not job:
            continue

        action = str(
            swipe.swipe_action or ""
        ).strip().lower()

        # -------------------------------------------------
        # POSITIVE ACTION
        # -------------------------------------------------

        if action in {
            "right",
            "save",
            "saved",
            "favorite",
            "favourite",
        }:

            if job.employment_type:

                preferences[
                    "preferred_job_types"
                ][
                    str(
                        job.employment_type
                    ).strip().lower()
                ] += 1

            if job.location:

                preferences[
                    "preferred_locations"
                ][
                    str(
                        job.location
                    ).strip().lower()
                ] += 1

            for skill in (
                job.required_skills
                or []
            ):

                skill_name = str(
                    skill
                ).strip().lower()

                if skill_name:

                    preferences[
                        "preferred_skills"
                    ][skill_name] += 1

    return preferences


# =========================================================
# CALCULATE PERSONALIZATION
# =========================================================

def calculate_personalization_score(
    swipe_history,
    job
):
    """
    Calculate a learned personalization score
    from historical user interactions.

    Score range:
        -10 to +10
    """

    if not swipe_history:
        return 0.0

    # -----------------------------------------------------
    # DIRECT INTERACTION
    # -----------------------------------------------------

    direct_score = (
        calculate_swipe_preference(
            swipe_history,
            job
        )
    )

    if direct_score != 0:
        return direct_score

    # -----------------------------------------------------
    # LEARN FROM OTHER JOBS
    # -----------------------------------------------------

    positive_count = 0
    negative_count = 0

    job_type = str(
        job.employment_type or ""
    ).strip().lower()

    job_location = str(
        job.location or ""
    ).strip().lower()

    job_skills = {
        str(skill).strip().lower()
        for skill in (
            job.required_skills
            or []
        )
    }

    for swipe in swipe_history:

        action = str(
            swipe.swipe_action or ""
        ).strip().lower()

        # We only use actual interacted jobs.
        if action not in {
            "right",
            "save",
            "saved",
            "favorite",
            "favourite",
            "left",
            "skip",
        }:
            continue

        # -------------------------------------------------
        # The recommendation layer will use job details
        # from swipe history.
        # -------------------------------------------------

        if action in {
            "right",
            "save",
            "saved",
            "favorite",
            "favourite",
        }:
            positive_count += 1

        elif action in {
            "left",
            "skip",
        }:
            negative_count += 1

    # -----------------------------------------------------
    # BASIC LEARNED SIGNAL
    # -----------------------------------------------------

    total = (
        positive_count
        + negative_count
    )

    if total == 0:
        return 0.0

    preference_ratio = (
        positive_count
        - negative_count
    ) / total

    score = (
        preference_ratio * 10
    )

    return round(
        max(
            -10.0,
            min(
                10.0,
                score
            )
        ),
        2
    )