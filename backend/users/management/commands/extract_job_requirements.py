import re

from django.core.management.base import BaseCommand
from users.models import Job


class Command(BaseCommand):

    help = "Extract technical skills from job descriptions"

    # ---------------------------------------------------------
    # SKILL VOCABULARY
    # ---------------------------------------------------------

    SKILL_VOCABULARY = {
        # Programming languages
        "python",
        "java",
        "javascript",
        "typescript",
        "c",
        "c++",
        "c#",
        "go",
        "golang",
        "ruby",
        "php",
        "kotlin",
        "swift",
        "scala",
        "r",

        # Web
        "html",
        "html5",
        "css",
        "css3",
        "react",
        "angular",
        "vue",
        "nodejs",
        "node.js",
        "next.js",
        "nextjs",
        "jquery",
        "ajax",

        # Backend / frameworks
        "django",
        "flask",
        "spring",
        "spring boot",
        "express",
        "express.js",
        ".net",
        ".net core",
        "asp.net",
        "mvc",

        # Databases
        "sql",
        "mysql",
        "postgresql",
        "postgres",
        "mongodb",
        "redis",
        "oracle",
        "sqlite",
        "elasticsearch",
        "solr",

        # Cloud
        "aws",
        "azure",
        "gcp",
        "google cloud",
        "amazon web services",
        "microsoft azure",

        # DevOps / infrastructure
        "docker",
        "kubernetes",
        "jenkins",
        "terraform",
        "ansible",
        "maven",
        "gradle",
        "git",
        "github",
        "gitlab",
        "bitbucket",
        "devops",
        "ci/cd",
        "ci cd",

        # APIs / architecture
        "rest",
        "rest api",
        "rest apis",
        "restful api",
        "graphql",
        "microservices",
        "distributed systems",
        "system design",

        # Data / AI / ML
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "data science",
        "data analysis",
        "tensorflow",
        "pytorch",
        "spark",
        "apache spark",
        "pandas",
        "numpy",
        "scikit-learn",
        "scikit learn",
        "keras",
        "nlp",
        "natural language processing",

        # Software engineering
        "data structures",
        "algorithms",
        "data structures and algorithms",
        "object oriented programming",
        "oop",
        "debugging",
        "testing",
        "unit testing",
        "automation testing",
        "selenium",
        "appium",

        # Mobile
        "android",
        "android development",
        "ios",
        "react native",
        "flutter",

        # Other common technical skills
        "linux",
        "unix",
        "bash",
        "powershell",
        "json",
        "xml",
        "web technologies",
        "web development",
        "frontend",
        "front end",
        "backend",
        "back end",
        "full stack",
        "fullstack",
    }

    # ---------------------------------------------------------
    # NORMALIZE SKILL NAMES
    # ---------------------------------------------------------

    SKILL_NORMALIZATION = {

        "react.js": "react",
        "reactjs": "react",
        "react js": "react",

        "node.js": "nodejs",
        "node js": "nodejs",

        "vue.js": "vue",
        "vuejs": "vue",

        "angular.js": "angular",
        "angularjs": "angular",

        "postgres": "postgresql",

        "golang": "go",

        "c sharp": "c#",

        "rest api": "rest apis",
        "restful api": "rest apis",
        "restful apis": "rest apis",

        "ci cd": "ci/cd",

        "scikit learn": "scikit-learn",

        "apache spark": "spark",
    }

    # ---------------------------------------------------------
    # CLEAN TEXT
    # ---------------------------------------------------------

    def clean_text(self, text):

        text = text or ""

        text = text.replace("&amp;", "&")
        text = text.replace("\xa0", " ")

        # Normalize common punctuation
        text = text.replace("–", "-")
        text = text.replace("—", "-")

        text = re.sub(r"\s+", " ", text)

        return text.strip().lower()

    # ---------------------------------------------------------
    # NORMALIZE SKILL
    # ---------------------------------------------------------

    def normalize_skill(self, skill):

        skill = skill.strip().lower()

        return self.SKILL_NORMALIZATION.get(
            skill,
            skill
        )

    # ---------------------------------------------------------
    # EXTRACT SKILLS
    # ---------------------------------------------------------

    def extract_skills(self, text):

        text = self.clean_text(text)

        found = set()

        # Sort longest skills first.
        # This helps detect "machine learning"
        # before "learning", etc.
        skills = sorted(
            self.SKILL_VOCABULARY,
            key=len,
            reverse=True
        )

        for skill in skills:

            normalized_skill = self.normalize_skill(skill)

            # Escape the skill for regex
            escaped_skill = re.escape(skill)

            # Word-boundary matching
            pattern = rf"(?<![\w]){escaped_skill}(?![\w])"

            if re.search(
                pattern,
                text,
                re.IGNORECASE
            ):

                found.add(normalized_skill)

        # -----------------------------------------------------
        # REMOVE DUPLICATES AFTER NORMALIZATION
        # -----------------------------------------------------

        result = sorted(found)

        return result

    # ---------------------------------------------------------
    # HANDLE COMMAND
    # ---------------------------------------------------------

    def handle(self, *args, **options):

        jobs = Job.objects.all()

        if not jobs.exists():

            self.stdout.write(
                self.style.ERROR(
                    "No jobs found in database."
                )
            )

            return

        updated_count = 0

        for job in jobs:

            skills = self.extract_skills(
                job.description or ""
            )

            job.required_skills = skills

            job.save(
                update_fields=["required_skills"]
            )

            updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {updated_count} jobs."
            )
        )