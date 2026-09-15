import os
import pandas as pd
from django.core.management.base import BaseCommand
from candidates.models import Job


DEFAULT_JOBS = [
    {
        "title": "Full Stack Software Engineer",
        "company": "Stripe",
        "location": "San Francisco, CA (Remote Allowed)",
        "work_mode": "Remote",
        "salary": "$135,000 - $175,000 / yr",
        "experience": "2 - 5 years",
        "description": "We are looking for a Full Stack Engineer to build reliable, high-performance financial infrastructure. You will develop modern web interfaces using React and robust backend APIs using Python/Django, ensuring high availability, security, and exceptional user experience across global payments.",
        "required_skills": "Python, React, TypeScript, Django, PostgreSQL, REST API, Git",
        "preferred_skills": "Docker, Redis, AWS, Kubernetes, GraphQL",
        "application_url": "https://stripe.com/jobs",
        "min_ats": 50,
    },
    {
        "title": "Senior Backend Developer",
        "company": "Datadog",
        "location": "New York, NY",
        "work_mode": "Hybrid",
        "salary": "$150,000 - $190,000 / yr",
        "experience": "4 - 8 years",
        "description": "Join Datadog's core engineering team to scale distributed backend microservices handling billions of events per day. You will design, implement, and optimize scalable RESTful and gRPC services using Python, Go, and PostgreSQL.",
        "required_skills": "Python, PostgreSQL, Microservices, Docker, Redis, REST API, Git",
        "preferred_skills": "Go, AWS, Kubernetes, Kafka, Linux",
        "application_url": "https://careers.datadoghq.com",
        "min_ats": 55,
    },
    {
        "title": "Frontend Engineer (React / Next.js)",
        "company": "Vercel",
        "location": "Remote, USA",
        "work_mode": "Remote",
        "salary": "$125,000 - $160,000 / yr",
        "experience": "2 - 4 years",
        "description": "Build next-generation developer tooling and web platforms. You will craft accessible, pixel-perfect user experiences using React, TypeScript, Next.js, and modern CSS architecture, collaborating closely with design and product teams.",
        "required_skills": "React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Next.js, Git",
        "preferred_skills": "GraphQL, Webpack, Vite, Testing Library, Node.js",
        "application_url": "https://vercel.com/careers",
        "min_ats": 45,
    },
    {
        "title": "Machine Learning Engineer",
        "company": "OpenAI",
        "location": "San Francisco, CA",
        "work_mode": "On-site",
        "salary": "$180,000 - $240,000 / yr",
        "experience": "3 - 6 years",
        "description": "Collaborate with research scientists to deploy and scale cutting-edge generative models. You will build model evaluation pipelines, optimize inference latency, and integrate deep learning models into production cloud infrastructure.",
        "required_skills": "Python, PyTorch, Machine Learning, Scikit-learn, Docker, NumPy, Pandas",
        "preferred_skills": "TensorFlow, CUDA, AWS, MLOps, HuggingFace",
        "application_url": "https://openai.com/careers",
        "min_ats": 60,
    },
    {
        "title": "DevOps & Cloud Infrastructure Engineer",
        "company": "HashiCorp",
        "location": "Austin, TX (Remote)",
        "work_mode": "Remote",
        "salary": "$140,000 - $175,000 / yr",
        "experience": "3 - 6 years",
        "description": "Manage multi-cloud infrastructure, automated CI/CD deployment pipelines, and Kubernetes clusters. Ensure observability, automated disaster recovery, and infrastructure-as-code compliance across enterprise deployments.",
        "required_skills": "Docker, Kubernetes, AWS, Terraform, CI/CD, Linux, Python, Bash",
        "preferred_skills": "Prometheus, Grafana, Ansible, GCP, Helm",
        "application_url": "https://hashicorp.com/jobs",
        "min_ats": 50,
    },
    {
        "title": "Data Scientist & Analytics Specialist",
        "company": "Spotify",
        "location": "Boston, MA",
        "work_mode": "Hybrid",
        "salary": "$130,000 - $165,000 / yr",
        "experience": "2 - 5 years",
        "description": "Leverage behavioral data and experimentation models to discover listener insights and drive recommendation algorithms. You will design statistical A/B tests, build predictive models, and deliver executive dashboards.",
        "required_skills": "Python, SQL, Data Science, Pandas, NumPy, Data Analysis, Machine Learning",
        "preferred_skills": "Tableau, BigQuery, Spark, Scikit-learn, A/B Testing",
        "application_url": "https://spotifyjobs.com",
        "min_ats": 50,
    },
    {
        "title": "Python Developer",
        "company": "Reddit",
        "location": "San Francisco, CA (Remote)",
        "work_mode": "Remote",
        "salary": "$120,000 - $155,000 / yr",
        "experience": "1 - 4 years",
        "description": "Develop and maintain core API services powering millions of daily active community members. Work with Django, FastAPI, PostgreSQL, and Redis to build scalable endpoints and background processing queues.",
        "required_skills": "Python, Django, FastAPI, PostgreSQL, REST API, Git, Docker",
        "preferred_skills": "Celery, Redis, Elasticsearch, Pytest",
        "application_url": "https://redditinc.com/careers",
        "min_ats": 45,
    },
    {
        "title": "Mobile App Developer (Flutter / React Native)",
        "company": "Duolingo",
        "location": "Pittsburgh, PA",
        "work_mode": "Hybrid",
        "salary": "$125,000 - $160,000 / yr",
        "experience": "2 - 5 years",
        "description": "Deliver joyful, gamified educational experiences on mobile devices. Build cross-platform features, smooth 60fps animations, and offline-first state synchronization for iOS and Android.",
        "required_skills": "JavaScript, TypeScript, React Native, Mobile Development, REST API, Git",
        "preferred_skills": "Flutter, Dart, iOS, Android, Redux",
        "application_url": "https://careers.duolingo.com",
        "min_ats": 45,
    },
    {
        "title": "Junior Software Engineer",
        "company": "Atlassian",
        "location": "Seattle, WA",
        "work_mode": "Hybrid",
        "salary": "$95,000 - $125,000 / yr",
        "experience": "0 - 2 years",
        "description": "Kickstart your software engineering career with great mentorship. Contribute to team collaboration features across Jira and Confluence, write clean unit tests, and ship production code.",
        "required_skills": "JavaScript, Python, HTML, CSS, Git, Problem Solving",
        "preferred_skills": "React, TypeScript, Java, SQL",
        "application_url": "https://atlassian.com/company/careers",
        "min_ats": 40,
    },
    {
        "title": "Product Manager - Developer Platform",
        "company": "GitHub",
        "location": "Remote, Global",
        "work_mode": "Remote",
        "salary": "$145,000 - $185,000 / yr",
        "experience": "3 - 7 years",
        "description": "Define the future of developer workflows. Work cross-functionally with engineering, design, and developer relations to roadmap and launch features empowering open-source maintainers.",
        "required_skills": "Product Management, Agile, User Research, Data Analysis, Roadmapping",
        "preferred_skills": "Git, Technical Writing, API Design, Jira",
        "application_url": "https://github.com/about/careers",
        "min_ats": 45,
    },
    {
        "title": "Cybersecurity & Security Engineer",
        "company": "CrowdStrike",
        "location": "Sunnyvale, CA",
        "work_mode": "On-site",
        "salary": "$145,000 - $180,000 / yr",
        "experience": "3 - 6 years",
        "description": "Protect critical infrastructure against sophisticated adversaries. Conduct penetration testing, vulnerability assessments, security code reviews, and automate incident detection rules.",
        "required_skills": "Cybersecurity, Python, Linux, Network Security, Vulnerability Assessment",
        "preferred_skills": "SIEM, AWS Security, Cryptography, Reverse Engineering",
        "application_url": "https://crowdstrike.com/careers",
        "min_ats": 55,
    },
    {
        "title": "UI/UX Product Designer",
        "company": "Figma",
        "location": "San Francisco, CA (Remote)",
        "work_mode": "Remote",
        "salary": "$130,000 - $165,000 / yr",
        "experience": "2 - 5 years",
        "description": "Design delightful user journeys and intuitive design systems. Create interactive prototypes, conduct usability research, and collaborate closely with frontend engineers to implement clean UI components.",
        "required_skills": "UI/UX Design, Figma, Prototyping, Wireframing, User Research",
        "preferred_skills": "Design Systems, HTML/CSS, Accessibility (a11y), Micro-interactions",
        "application_url": "https://figma.com/careers",
        "min_ats": 40,
    }
]


class Command(BaseCommand):
    help = "Seed database with realistic, high-quality production job postings"

    def handle(self, *args, **kwargs):
        existing_count = Job.objects.count()

        if existing_count >= 15:
            self.stdout.write(self.style.SUCCESS(f"Database already contains {existing_count} jobs. Skipping seed."))
            return

        self.stdout.write("Seeding jobs into database...")

        jobs_to_create = []

        # 1. Add our curated tech roles
        for job_data in DEFAULT_JOBS:
            if not Job.objects.filter(title=job_data["title"], company=job_data["company"]).exists():
                jobs_to_create.append(Job(**job_data))

        # 2. If postings.csv exists, import additional diverse real-world postings
        csv_path = "dataset/postings.csv"
        if os.path.exists(csv_path):
            try:
                self.stdout.write("Found dataset/postings.csv. Importing additional postings...")
                for chunk in pd.read_csv(csv_path, chunksize=80):
                    for _, row in chunk.iterrows():
                        title = str(row.get("title", "") or "").strip()
                        company = str(row.get("company_name", "Tech Innovations") or "").strip()
                        if not title or title.lower() == "nan" or len(title) < 3:
                            continue

                        location = str(row.get("location", "Remote") or "Remote").strip()
                        if location.lower() == "nan":
                            location = "Remote"

                        desc = str(row.get("description", "") or "").strip()
                        if desc.lower() == "nan":
                            desc = f"Exciting opportunity for a {title} at {company}. Join an ambitious team tackling complex problems."

                        # Exclude inactive / closed jobs if closed_time exists
                        closed_time = row.get("closed_time")
                        if pd.notna(closed_time) and str(closed_time).strip() not in ("", "nan", "0"):
                            continue

                        work_type = str(row.get("formatted_work_type", "") or "").lower()
                        remote_allowed = row.get("remote_allowed")

                        if remote_allowed == 1 or "remote" in work_type or "remote" in location.lower():
                            work_mode = "Remote"
                        elif "hybrid" in work_type or "hybrid" in location.lower():
                            work_mode = "Hybrid"
                        else:
                            work_mode = "On-site"

                        min_sal = row.get("min_salary")
                        max_sal = row.get("max_salary")
                        pay_period = str(row.get("pay_period", "") or "").strip().upper()
                        period_str = "yr" if pay_period in ("YEARLY", "YR", "") else "hr" if pay_period in ("HOURLY", "HR") else pay_period.lower()
                        if pd.notna(min_sal) and pd.notna(max_sal):
                            salary = f"${int(min_sal):,} - ${int(max_sal):,} / {period_str}"
                        elif pd.notna(max_sal):
                            salary = f"Up to ${int(max_sal):,} / {period_str}"
                        elif pd.notna(min_sal):
                            salary = f"From ${int(min_sal):,} / {period_str}"
                        else:
                            salary = ""

                        exp = str(row.get("formatted_experience_level", "") or "").strip()
                        if not exp or exp.lower() == "nan":
                            exp = "2 - 4 years"

                        skills_raw = str(row.get("skills_desc", "") or "").strip()
                        if not skills_raw or skills_raw.lower() == "nan":
                            skills_raw = "Python, JavaScript, SQL, Git, Problem Solving, Communication"

                        app_url = str(row.get("application_url", "") or "").strip()
                        if not app_url.startswith("http"):
                            app_url = str(row.get("job_posting_url", "") or "").strip()
                        if not app_url.startswith("http"):
                            app_url = ""

                        jobs_to_create.append(Job(
                            title=title[:200],
                            company=company[:200],
                            location=location[:200],
                            work_mode=work_mode,
                            salary=salary,
                            experience=exp,
                            description=desc[:2500],
                            required_skills=skills_raw[:500],
                            preferred_skills="Agile, Cloud, Teamwork",
                            application_url=app_url[:1000],
                            min_ats=50,
                        ))

                        if len(jobs_to_create) >= 60:
                            break
                    break
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"CSV import warning: {e}"))

        if jobs_to_create:
            Job.objects.bulk_create(jobs_to_create)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded database! Total jobs: {Job.objects.count()}"))
