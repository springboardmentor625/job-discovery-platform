from candidates.models import JobSwipe


def get_candidate_preferred_skills(candidate):
    """
    Collect skills from all jobs the candidate swiped RIGHT.
    """

    liked_swipes = JobSwipe.objects.filter(
        candidate=candidate,
        decision="right"
    ).select_related("job")

    preferred_skills = set()

    for swipe in liked_swipes:

        if not swipe.job.required_skills:
            continue

        skills = [
            skill.strip().lower()
            for skill in swipe.job.required_skills.split(",")
            if skill.strip()
        ]

        preferred_skills.update(skills)

    return list(preferred_skills)