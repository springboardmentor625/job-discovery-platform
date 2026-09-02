from collections import Counter

from candidates.models import JobSwipe


def get_candidate_preferred_skills(candidate):
    """
    Learn candidate interests from previous RIGHT swipes.

    Returns:
        {
            "python": 5,
            "django": 3,
            "docker": 2
        }
    """

    liked_jobs = JobSwipe.objects.filter(
        candidate=candidate,
        decision="right"
    ).select_related("job")

    counter = Counter()

    for swipe in liked_jobs:

        if not swipe.job.required_skills:
            continue

        skills = [
            skill.strip().lower()
            for skill in swipe.job.required_skills.split(",")
            if skill.strip()
        ]

        counter.update(skills)

    return dict(counter)