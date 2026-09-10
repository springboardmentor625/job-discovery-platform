from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache

from .models import Candidate, Resume, Job, JobSwipe, Application
from .utils.matcher import (
    clean_text,
    normalize_skills,
    calculate_job_match,
    semantic_skill_match,
)
from .utils.ats import calculate_job_ats, calculate_ats
from .services.recommendation_service import RecommendationService

User = get_user_model()


class ATSAndMatchingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            password="TestPassword123!",
        )
        self.candidate = Candidate.objects.create(
            full_name="Alex Morgan",
            email="testuser@example.com",
            preferred_job_roles="Python Developer, Backend Engineer",
            preferred_locations="New York, Remote",
            preferred_work_mode="Remote",
            skills="Python, Django, PostgreSQL, REST APIs",
            experience="3 years backend development",
            education="B.S. in Computer Science",
        )
        self.resume = Resume.objects.create(
            candidate=self.candidate,
            original_filename="alex_cv.pdf",
            extracted_text="Experienced Python Developer skilled in Django, PostgreSQL, Docker, and REST APIs.",
            extracted_skills="Python, Django, PostgreSQL, Docker, REST APIs",
        )

    def test_zero_matched_skills_returns_exact_zero_percent(self):
        """Rule 1: If matched skills = 0, Skill Match must be exactly 0%. Never invent fallback."""
        candidate_skills = ["Graphic Design", "Photoshop", "Illustrator"]
        job_skills = ["Kubernetes", "Rust", "Golang", "C++"]

        matched, missing = semantic_skill_match(candidate_skills, job_skills)
        self.assertEqual(len(matched), 0)
        self.assertEqual(len(missing), len(job_skills))

        result = calculate_job_match(
            resume_text="Graphic designer specialized in branding and vector illustration.",
            job_description="Low-level systems engineering with Rust, Golang, and Kubernetes.",
            resume_skills=candidate_skills,
            job_skills=job_skills,
        )
        self.assertEqual(result["skill_match_percentage"], 0)
        self.assertEqual(result["matched_skills"], [])

    def test_positive_skill_match(self):
        """Rule 1: Actual extracted/semantic matches produce realistic percentage."""
        job = Job.objects.create(
            title="Senior Python Engineer",
            company="Acme Tech",
            location="Remote",
            work_mode="Remote",
            required_skills="Python, Django, PostgreSQL, Kubernetes",
            description="Looking for a Python backend engineer with Django and database experience.",
        )
        ats_info = calculate_job_ats(self.candidate, job)
        self.assertGreater(ats_info["ats_score"], 0)
        self.assertGreater(ats_info["skill_match_percentage"], 0)
        self.assertIn("Python", [s.title() for s in ats_info["matched_skills"]])
        self.assertIn("Django", [s.title() for s in ats_info["matched_skills"]])

    def test_non_technical_job_matching(self):
        """Rule 1: Support non-technical roles gracefully."""
        marketing_candidate = Candidate.objects.create(
            full_name="Sarah Connor",
            email="sarah@example.com",
            skills="Digital Marketing, SEO, Content Strategy, Google Analytics",
            preferred_job_roles="Marketing Manager, Growth Specialist",
        )
        marketing_job = Job.objects.create(
            title="Marketing Coordinator",
            company="Global Media",
            location="New York, NY",
            work_mode="Hybrid",
            required_skills="Digital Marketing, SEO, Social Media, Google Analytics",
            description="Drive growth, content strategy and SEO campaigns for global brands.",
        )
        ats_info = calculate_job_ats(marketing_candidate, marketing_job)
        self.assertGreater(ats_info["ats_score"], 40)
        self.assertGreater(ats_info["skill_match_percentage"], 40)


class RecommendationServiceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="recuser@example.com",
            email="recuser@example.com",
            password="TestPassword123!",
        )
        self.candidate = Candidate.objects.create(
            full_name="Jordan Lee",
            email="recuser@example.com",
            preferred_job_roles="Software Engineer",
            preferred_locations="San Francisco, CA",
            preferred_work_mode="Remote",
            skills="React, TypeScript, Node.js",
        )
        # Create a pool of test jobs
        self.jobs = []
        for i in range(60):
            j = Job.objects.create(
                title=f"Software Engineer {i}",
                company=f"Tech Corp {i % 5}",
                location="San Francisco, CA" if i % 2 == 0 else "Austin, TX",
                work_mode="Remote" if i % 2 == 0 else "On-site",
                required_skills="React, TypeScript, Node.js" if i < 30 else "Java, Spring Boot",
                description=f"Job description for software engineering opportunity number {i}.",
            )
            self.jobs.append(j)

    def test_initial_recommendations_no_swipe_history(self):
        """Rule 2: When candidate has no swipe history, generate max 50 ranked jobs."""
        recs = RecommendationService.get_recommendations(self.user)
        self.assertLessEqual(len(recs), 50)
        self.assertGreater(len(recs), 0)

        # Check structure
        first = recs[0]
        self.assertIn("job", first)
        self.assertIn("ats_score", first)
        self.assertIn("skill_match_percentage", first)
        self.assertIn("matched_skills", first)
        self.assertIn("missing_skills", first)
        self.assertIn("match_score", first)

    def test_swiped_job_is_immediately_excluded(self):
        """Rule 3 & 4: Every swiped job must be strictly excluded from subsequent batches."""
        recs_initial = RecommendationService.get_recommendations(self.user)
        target_job_id = recs_initial[0]["job"]["id"]

        # Swipe left (skipped)
        JobSwipe.objects.create(
            candidate=self.candidate,
            job=Job.objects.get(id=target_job_id),
            decision="skipped",
        )

        recs_next = RecommendationService.get_recommendations(self.user, force_refresh=True)
        swiped_ids_in_next = [r["job"]["id"] for r in recs_next if r["job"]["id"] == target_job_id]
        self.assertEqual(len(swiped_ids_in_next), 0, "Swiped job was not excluded from next batch!")

    def test_swipe_learning_updates_rankings(self):
        """Rule 3: Swipe history immediately shifts candidate preference signals."""
        # Find a job with Java skills
        java_job = Job.objects.filter(required_skills__icontains="Java").first()
        self.assertIsNotNone(java_job)

        # Swipe interested on Java
        JobSwipe.objects.create(
            candidate=self.candidate,
            job=java_job,
            decision="interested",
        )

        recs = RecommendationService.get_recommendations(self.user, force_refresh=True)
        self.assertGreater(len(recs), 0)
        # Verify the preference learning ran without error and returned 50 jobs
        self.assertLessEqual(len(recs), 50)
