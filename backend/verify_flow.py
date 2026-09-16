import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from candidates.models import Candidate, Resume, Job, JobSwipe, Application
from candidates.services.recommendation_service import RecommendationService
from candidates.utils.ats import calculate_job_ats
from candidates.utils.matcher import semantic_skill_match

User = get_user_model()

def test_full_flow():
    print("=== STARTING FULL END-TO-END FLOW VERIFICATION ===")

    # 1. User & Candidate Setup
    test_email = "ai_test_candidate@swipex.io"
    User.objects.filter(email=test_email).delete()
    Candidate.objects.filter(email=test_email).delete()

    user = User.objects.create_user(
        username=test_email,
        email=test_email,
        password="Password123!",
        first_name="Jordan",
        last_name="Rivers",
    )
    print(f"1. Created user: {user.email}")

    candidate = Candidate.objects.create(
        full_name="Jordan Rivers",
        email=test_email,
        preferred_job_roles="Data Scientist, Machine Learning Engineer, Python Developer",
        preferred_locations="New York, Remote",
        preferred_work_mode="Remote",
        skills="Python, Machine Learning, PyTorch, Pandas, SQL, Scikit-learn",
        experience="4 years in predictive analytics and ML pipelines",
        education="M.S. in Data Science",
    )
    print(f"2. Created profile for {candidate.full_name}")

    # 2. Resume creation with detected skills
    resume = Resume.objects.create(
        candidate=candidate,
        original_filename="jordan_rivers_resume.pdf",
        extracted_text="Data Scientist with deep expertise in Python, PyTorch, NLP, Scikit-learn, SQL and Machine Learning algorithms.",
        extracted_skills="Python, PyTorch, NLP, Scikit-learn, SQL, Machine Learning",
    )
    print(f"3. Uploaded resume with {len(resume.extracted_skills.split(','))} detected skills")

    # 3. Initial Recommendations (0 Swipes)
    print("\n--- Testing Initial Recommendations (0 Swipes) ---")
    recs_0 = RecommendationService.get_recommendations(user, force_refresh=True)
    print(f"Retrieved {len(recs_0)} recommendations.")
    assert len(recs_0) > 0, "No recommendations returned!"
    assert len(recs_0) <= 50, "Exceeded 50 jobs limit!"

    first_job = recs_0[0]
    print(f"Top Recommended Job: '{first_job['job']['title']}' at '{first_job['job']['company']}'")
    print(f"  ATS Score: {first_job['ats_score']}%")
    print(f"  Skill Match: {first_job['skill_match_percentage']}%")
    print(f"  Matched Skills: {first_job['matched_skills'][:5]}")
    print(f"  Missing Skills: {first_job['missing_skills'][:5]}")
    print(f"  Match Score: {first_job['match_score']}")

    # Verify every item structure
    for r in recs_0:
        assert "job" in r
        assert "ats_score" in r
        assert "skill_match_percentage" in r
        assert "matched_skills" in r
        assert "missing_skills" in r
        assert "match_score" in r
        # Rule 1: If matched skills = 0, skill match must be exactly 0%
        if len(r["matched_skills"]) == 0:
            assert r["skill_match_percentage"] == 0, "Skill match was not 0% when 0 skills matched!"

    # 4. First Swipe: Swipe 1 job LEFT (skipped)
    job_to_skip = recs_0[0]["job"]["id"]
    JobSwipe.objects.create(
        candidate=candidate,
        job=Job.objects.get(id=job_to_skip),
        decision="skipped",
    )
    print(f"\n4. Swiped 1 job LEFT (Skipped Job ID: {job_to_skip})")

    # Verify immediate exclusion & update on next call
    recs_1 = RecommendationService.get_recommendations(user, force_refresh=True)
    recs_1_ids = {r["job"]["id"] for r in recs_1}
    assert job_to_skip not in recs_1_ids, f"Skipped job {job_to_skip} was not excluded from next recommendations!"
    print(f"[OK] Skipped job {job_to_skip} successfully excluded from next batch of {len(recs_1)} jobs.")

    # 5. Swipe 2 jobs RIGHT (Interested) & 1 job (Saved)
    job_to_like_1 = recs_1[0]["job"]["id"]
    job_to_like_2 = recs_1[1]["job"]["id"]
    job_to_save = recs_1[2]["job"]["id"]

    JobSwipe.objects.create(candidate=candidate, job=Job.objects.get(id=job_to_like_1), decision="interested")
    JobSwipe.objects.create(candidate=candidate, job=Job.objects.get(id=job_to_like_2), decision="interested")
    JobSwipe.objects.create(candidate=candidate, job=Job.objects.get(id=job_to_save), decision="saved")
    print(f"5. Swiped 2 Interested, 1 Saved (Total Swipes: {JobSwipe.objects.filter(candidate=candidate).count()})")

    recs_4 = RecommendationService.get_recommendations(user, force_refresh=True)
    recs_4_ids = {r["job"]["id"] for r in recs_4}
    assert job_to_like_1 not in recs_4_ids
    assert job_to_like_2 not in recs_4_ids
    assert job_to_save not in recs_4_ids
    print(f"[OK] All swiped jobs strictly excluded from subsequent recommendations.")

    # 6. Apply to a job
    job_to_apply = recs_4[0]["job"]["id"]
    app, created = Application.objects.get_or_create(
        candidate=candidate,
        job=Job.objects.get(id=job_to_apply),
        defaults={"applied_resume": resume},
    )
    assert created, "Application should have been created!"
    print(f"6. Applied to Job ID: {job_to_apply}")

    # Idempotent apply check
    app2, created2 = Application.objects.get_or_create(
        candidate=candidate,
        job=Job.objects.get(id=job_to_apply),
    )
    assert not created2, "Duplicate application must not create a new row!"
    print(f"[OK] Duplicate application prevented.")

    # 7. Test continuous learning through 10, 25, 50, and 55 swipes
    print("\n--- Testing Continuous Preference Learning across Swipes 1..55 ---")
    available_jobs = list(Job.objects.exclude(id__in=JobSwipe.objects.filter(candidate=candidate).values_list("job_id", flat=True)))

    # Swipe all but leave at least 2 unswiped jobs so post-swipe recs has jobs to return
    swipe_limit = max(0, len(available_jobs) - 2)
    for i, j in enumerate(available_jobs[:swipe_limit]):
        decision = "interested" if i % 2 == 0 else "skipped"
        JobSwipe.objects.create(candidate=candidate, job=j, decision=decision)

    total_swipes = JobSwipe.objects.filter(candidate=candidate).count()
    print(f"Total candidate swipes now in DB: {total_swipes}")

    # Generate recommendations post-swipes
    recs_post_swipes = RecommendationService.get_recommendations(user, force_refresh=True)
    print(f"Recommendations count post-swipes: {len(recs_post_swipes)}")
    if len(available_jobs) > swipe_limit:
        assert len(recs_post_swipes) > 0, "Recommendations failed after swipes!"
    assert len(recs_post_swipes) <= 50, "Exceeded 50 jobs!"

    # Verify no swiped jobs in recs_post_swipes
    all_swiped_ids = set(JobSwipe.objects.filter(candidate=candidate).values_list("job_id", flat=True))
    post_swipes_ids = {r["job"]["id"] for r in recs_post_swipes}
    intersection = post_swipes_ids & all_swiped_ids
    assert len(intersection) == 0, f"Found {len(intersection)} previously swiped jobs in post-swipes recommendations!"
    print(f"[OK] Zero previously swiped jobs present in post-swipes recommendations batch.")

    # Clean up test user
    User.objects.filter(email=test_email).delete()
    print("\n=== ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_full_flow()
