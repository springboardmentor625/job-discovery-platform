import os
# pyrefly: ignore [missing-import]
import fitz  # PyMuPDF
import re
from typing import Dict, List, Any

try:
    # pyrefly: ignore [missing-import]
    import spacy
    nlp = spacy.load("en_core_web_sm")
except (OSError, ImportError):
    nlp = None


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    text = ""
    try:
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text("text") + "\n"
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return text


# ─── Comprehensive Skills Database ────────────────────────────────────────────
KNOWN_SKILLS = [
    # Programming Languages
    "Python", "JavaScript", "JS", "TypeScript", "TS", "Java", "C++", "C#", "C",
    "Go", "Golang", "Rust", "Ruby", "PHP", "Kotlin", "Swift", "Scala",
    "R", "MATLAB", "Perl", "Dart", "Lua", "Objective-C", "Shell",
    "Bash", "PowerShell", "Haskell", "Elixir", "Clojure",

    # Frontend
    "React", "React.js", "ReactJS", "React JS", "Angular", "Vue", "Vue.js", "VueJS", "Next.js", "NextJS", "Nuxt.js",
    "Svelte", "jQuery", "HTML", "HTML5", "CSS", "CSS3", "SASS", "SCSS",
    "Less", "Tailwind", "TailwindCSS", "Bootstrap", "Material UI",
    "Chakra UI", "Ant Design", "Webpack", "Vite", "Babel", "Redux",
    "Zustand", "MobX", "Storybook", "Three.js", "D3.js", "Chart.js",

    # Backend & Frameworks
    "Node.js", "NodeJS", "Node", "Express", "Express.js", "FastAPI", "Django", "Flask",
    "Spring", "Spring Boot", ".NET", "DotNet", "ASP.NET", "Rails", "Ruby on Rails",
    "Laravel", "Gin", "Fiber", "NestJS", "Nest.js", "Koa", "Hapi", "Strapi",
    "GraphQL", "REST", "RESTful", "gRPC", "WebSocket", "Microservices",

    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",
    "SQLite", "Oracle", "SQL Server", "DynamoDB", "Cassandra", "Neo4j",
    "Firebase", "Firestore", "Supabase", "CouchDB", "MariaDB", "Postgres",
    "InfluxDB", "TimescaleDB", "Prisma", "Sequelize", "SQLAlchemy",
    "Mongoose", "NoSQL",

    # Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "Google Cloud", "Google Cloud Platform", "GCP",
    "Docker", "Kubernetes", "K8s", "Terraform", "Ansible", "Jenkins",
    "CI/CD", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI",
    "ArgoCD", "Helm", "Nginx", "Apache", "Linux", "Ubuntu",
    "Serverless", "Lambda", "EC2", "S3", "CloudFormation", "ECS", "EKS",
    "Heroku", "Vercel", "Netlify", "DigitalOcean",

    # Data Science & ML
    "Machine Learning", "Deep Learning", "NLP",
    "Natural Language Processing", "Computer Vision",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas",
    "NumPy", "SciPy", "Matplotlib", "Seaborn", "Plotly",
    "OpenCV", "YOLO", "Transformers", "Hugging Face", "LangChain",
    "GPT", "BERT", "LLM", "Generative AI", "Stable Diffusion",
    "Reinforcement Learning", "XGBoost", "LightGBM", "CatBoost",
    "Random Forest", "Neural Networks", "CNNs", "RNNs", "GANs",
    "Data Analysis", "Data Visualization", "Data Engineering",
    "Feature Engineering", "Model Deployment", "MLOps",
    "Apache Spark", "Hadoop", "Hive", "Kafka", "Airflow",
    "Power BI", "Tableau", "Looker", "Jupyter", "Google Colab",
    "Big Data", "ETL", "Data Pipeline", "Data Warehouse",
    "Snowflake", "Databricks", "dbt",

    # Mobile Development
    "React Native", "Flutter", "SwiftUI", "Jetpack Compose",
    "Android", "iOS", "Xamarin", "Ionic", "Capacitor",
    "Expo", "Mobile Development",

    # Testing
    "Jest", "Mocha", "Cypress", "Selenium", "Playwright",
    "JUnit", "pytest", "Unit Testing", "Integration Testing",
    "E2E Testing", "TDD", "BDD", "Postman", "Insomnia",

    # Tools & Version Control
    "Git", "GitHub", "GitLab", "Bitbucket", "SVN",
    "Jira", "Confluence", "Trello", "Notion", "Slack",
    "VS Code", "IntelliJ", "Eclipse", "Vim",
    "Figma", "Adobe XD", "Sketch", "Canva",

    # Security & Networking
    "Cybersecurity", "Penetration Testing", "OWASP",
    "OAuth", "JWT", "SSL/TLS", "Encryption", "Firewall",
    "VPN", "Network Security", "SIEM", "SOC",

    # Methodologies & Soft Skills
    "Agile", "Scrum", "Kanban", "Waterfall", "DevOps",
    "Communication", "Leadership", "Problem Solving",
    "Teamwork", "Critical Thinking", "Project Management",
    "Time Management", "Public Speaking", "Mentoring",

    # Other
    "Blockchain", "Web3", "Solidity", "Ethereum",
    "IoT", "Embedded Systems", "Arduino", "Raspberry Pi",
    "ROS", "FPGA", "VHDL", "Verilog",
    "SAP", "Salesforce", "ServiceNow", "Workday",
    "Robotic Process Automation", "RPA", "UiPath",
    "AutoCAD", "SolidWorks", "CATIA",
]

# Normalize skills for case-insensitive matching
_SKILLS_LOWER_MAP = {}
for skill in KNOWN_SKILLS:
    key = skill.lower().strip()
    if key not in _SKILLS_LOWER_MAP:
        _SKILLS_LOWER_MAP[key] = skill


def _extract_skills(text: str) -> List[str]:
    """Extract skills ONLY from the dedicated Skills section of the resume."""
    skills_section_headers = [
        "Skills", "Technical Skills", "Core Skills", "Key Skills",
        "Core Competencies", "Technical Proficiencies", "Competencies",
        "Areas of Expertise", "Technologies", "Tech Stack",
        "Programming Skills", "Professional Skills", "Skill Set",
    ]
    skills_stop_headers = [
        "Education", "Experience", "Work Experience", "Projects",
        "University Projects", "Academic Projects", "Certifications",
        "Certificates", "Languages", "Additional Information",
        "Achievements", "Awards", "Publications", "Volunteer",
        "Hobbies", "Interests", "References", "Summary", "Profile",
        "Objective", "Career Objective",
    ]

    # Use a line-anchored pattern so "Skills" must appear on its own line as a heading
    # (not inside a sentence like "...with exposure to skills...")
    pattern = r'(?:^|\n)[ \t]*(' + '|'.join(re.escape(h) for h in skills_section_headers) + r')[ \t]*(?:\n|$)'
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return []

    start_idx = match.end()
    stop_pattern = r'(?:^|\n)[ \t]*(' + '|'.join(re.escape(h) for h in skills_stop_headers) + r')[ \t]*(?:\n|$)'
    next_header = re.search(stop_pattern, text[start_idx:], re.IGNORECASE)

    if next_header:
        skills_section = text[start_idx:start_idx + next_header.start()].strip()
    else:
        skills_section = text[start_idx:start_idx + 1500].strip()

    if not skills_section:
        return []

    found = []
    seen = set()
    
    # Sort skills by length descending to match longest phrases first (e.g. "React Native" before "React")
    sorted_skills = sorted(_SKILLS_LOWER_MAP.items(), key=lambda x: len(x[0]), reverse=True)
    
    # Pad the text to handle word boundaries at the start and end of the string
    section_lower = " " + skills_section.lower() + " "

    for key, canonical in sorted_skills:
        escaped_key = re.escape(key)
        # Strict boundary match: not preceded or followed by alphanumeric characters
        pattern = r'(?<![a-z0-9])' + escaped_key + r'(?![a-z0-9])'
        
        if re.search(pattern, section_lower):
            if canonical not in seen:
                found.append(canonical)
                seen.add(canonical)
            # Remove the matched skill to prevent sub-string matching (e.g. preventing 'C' matching inside 'C++')
            section_lower = re.sub(pattern, ' ', section_lower)

    return sorted(found)




def _extract_section(text: str, section_headers: List[str], stop_headers: List[str], max_chars: int = 2000) -> str:
    """
    Generic section extractor. Finds the first matching section header,
    then extracts text until the next known header or max_chars.
    """
    pattern = r'\b(' + '|'.join(re.escape(h) for h in section_headers) + r')\b'
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return ""

    start_idx = match.end()
    stop_pattern = r'\n\s*(' + '|'.join(re.escape(h) for h in stop_headers) + r')\s*\n'
    next_header = re.search(stop_pattern, text[start_idx:], re.IGNORECASE)

    if next_header:
        end_idx = start_idx + next_header.start()
        return text[start_idx:end_idx].strip()
    else:
        return text[start_idx:start_idx + max_chars].strip()


def _extract_projects(text: str) -> str:
    """Extract and format projects section from resume text."""
    section_headers = [
        "Projects", "Project Portfolio", "University Projects",
        "Academic Projects", "Personal Projects", "Key Projects",
        "Project Experience", "Project Work"
    ]
    stop_headers = [
        "Education", "Certifications", "Certificates", "Experience",
        "Work Experience", "Skills", "Languages", "Additional Information",
        "Additional", "Achievements", "Awards", "Honors",
        "References", "Hobbies", "Interests", "Publications",
        "Volunteer", "Extracurricular"
    ]

    raw = _extract_section(text, section_headers, stop_headers, 4000)
    if not raw:
        return ""

    # ── Step 1: merge PDF-wrapped lines ──────────────────────────────
    # A line is a "continuation" if it doesn't start a bullet or a new
    # project title (doesn't start with a bullet marker, and the previous
    # line doesn't end with period/colon).
    raw_lines = raw.split('\n')
    merged_lines = []
    for raw_line in raw_lines:
        stripped = raw_line.strip()
        if not stripped:
            continue
        is_bullet_line = bool(re.match(r'^[•\*\-▪·➢►▸‣⁃]', stripped))
        # Merge into previous line if: not a bullet AND previous line exists
        # AND previous line didn't end a sentence (ends with comma or lowercase)
        if (merged_lines
                and not is_bullet_line
                and merged_lines[-1]
                and not merged_lines[-1].endswith('.')
                and not merged_lines[-1].endswith(':')
                and merged_lines[-1][-1].islower()
                and stripped[0].islower()):
            merged_lines[-1] += ' ' + stripped
        else:
            merged_lines.append(stripped)

    lines = merged_lines

    # ── Step 2: define helpers ────────────────────────────────────────
    skip_prefixes = (
        "technologies", "tech stack", "tools used", "tools:", "tech:",
        "languages used", "frameworks:", "platform:", "built with",
        "duration:", "github:", "repository:", "link:", "url:",
        "role:", "team size:", "description:", "• tools", "tools and technologies",
    )

    def is_bullet(line):
        return bool(re.match(r'^[•\*\-▪·➢►▸‣⁃]', line))

    def is_project_title(line):
        """True if line looks like a standalone project name (short, title-cased, no sentence structure)."""
        if is_bullet(line):
            return False
        lower = line.lower()
        if any(lower.startswith(p) for p in skip_prefixes):
            return False
        # Too long to be a title
        if len(line) > 80:
            return False
        # Single word that's a known tech skill → not a project title
        words = line.split()
        if len(words) == 1:
            if lower.strip() in _SKILLS_LOWER_MAP:
                return False
        # Strip pipe-separated suffix before word count (e.g. '| Repository')
        core = re.split(r'\s*[|]\s*', line)[0].strip()
        # Sentence-like (too many words)
        if len(core.split()) > 10:
            return False
        # Should start with capital
        if line and not (line[0].isupper() or line[0].isdigit()):
            return False
        # Reject lines that are clearly descriptive sentences
        sentence_words = {'developed', 'built', 'created', 'designed', 'implemented',
                          'integrated', 'deployed', 'established', 'used', 'using',
                          'this', 'the', 'a', 'an', 'with', 'to', 'from', 'for'}
        first_word = line.split()[0].lower().rstrip('.,') if line.split() else ''
        if first_word in sentence_words:
            return False
        return True

    # ── Step 3: parse projects ────────────────────────────────────────
    projects = []
    current_title = ""
    current_bullets = []

    for line in lines:
        lower = line.lower()
        # Skip tech-stack lines entirely
        if any(lower.startswith(p) for p in skip_prefixes) or any(lower.startswith('• ' + p) for p in skip_prefixes):
            continue

        if is_bullet(line):
            if current_title:
                clean_b = re.sub(r'^[•\*\-▪·➢►▸‣⁃]\s*', '', line).strip()
                if clean_b:
                    current_bullets.append(clean_b)
        elif is_project_title(line):
            if current_title:
                projects.append((current_title, current_bullets))
            clean = re.sub(r'^\d+[\.\)]\s*', '', line).strip()
            clean = re.split(r'\s*[|–—]\s*', clean)[0].strip()
            current_title = clean
            current_bullets = []
        # else: skip non-title, non-bullet prose (continuation already merged)

    if current_title:
        projects.append((current_title, current_bullets))

    # ── Step 4: format output ─────────────────────────────────────────
    extracted = []
    for i, (title, bullets) in enumerate(projects, 1):
        if not title:
            continue
        parts = [f"{i}. {title}"]
        for b in bullets[:4]:
            parts.append(f"   • {b}")
        extracted.append('\n'.join(parts))

    result = '\n\n'.join(extracted).strip()
    if len(result) > 1950:
        result = result[:1950] + "..."
    return result


def _extract_certifications(text: str) -> List[str]:
    """Extract certifications from resume text."""
    section_headers = [
        "Certifications", "Certification", "Certificates",
        "Certificate", "Professional Certifications",
        "Licenses & Certifications", "Licenses and Certifications"
    ]
    stop_headers = [
        "Education", "Experience", "Work Experience", "Skills",
        "Projects", "Languages", "Additional Information",
        "Additional", "Achievements", "Awards", "Honors",
        "References", "Hobbies", "Interests", "Publications"
    ]

    raw = _extract_section(text, section_headers, stop_headers, 500)
    if not raw:
        return []

    # Try bullet points first
    bullet_points = re.findall(
        r'(?:^|\n)\s*(?:[•\*\-▪·➢►▸‣⁃])\s*(.*?)(?=(?:\n\s*(?:[•\*\-▪·➢►▸‣⁃]))|$)',
        raw, re.DOTALL
    )

    if bullet_points:
        cert_lines = [c.replace('\n', ' ').replace(',', '').strip() for c in bullet_points if len(c.strip()) > 4]
    else:
        cert_lines = [c.replace(',', '').strip() for c in re.split(r'\n', raw) if len(c.strip()) > 4]

    # Deduplicate and limit
    return list(dict.fromkeys(cert_lines))[:8]


def _extract_education(text: str) -> str:
    """Extract education details from resume text."""
    section_headers = [
        "Education", "Academic Background", "Educational Qualifications",
        "Academic Qualifications", "Educational Background"
    ]
    stop_headers = [
        "Experience", "Work Experience", "Skills", "Projects",
        "Certifications", "Certificates", "Languages",
        "Additional Information", "Achievements", "Awards",
        "Publications", "Volunteer", "Hobbies", "Interests"
    ]

    raw = _extract_section(text, section_headers, stop_headers, 800)
    if not raw:
        return ""

    lines = [line.strip() for line in raw.split('\n') if line.strip()]

    # Look for degree patterns
    degree_patterns = [
        r'(B\.?Tech|B\.?E\.?|B\.?Sc|BCA|BBA|B\.?Com|M\.?Tech|MCA|M\.?Sc|MBA|Ph\.?D|M\.?E\.?|B\.?A\.?|M\.?A\.?)',
        r'(Bachelor|Master|Doctor|Diploma|Associate)',
    ]

    education_parts = []
    for line in lines[:6]:  # Usually education is within first 6 lines
        for pattern in degree_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                education_parts.append(line)
                break

    if education_parts:
        result = " | ".join(education_parts[:2])  # Max 2 degrees
        if len(result) > 250:
            result = result[:247] + "..."
        return result

    # Fallback: return first 2 non-empty lines
    return " | ".join(lines[:2]) if lines else ""


def _extract_experience_summary(text: str) -> str:
    """Extract a brief experience summary from resume text."""
    section_headers = [
        "Experience", "Work Experience", "Professional Experience",
        "Employment History", "Work History", "Career History"
    ]
    stop_headers = [
        "Education", "Skills", "Projects", "Certifications",
        "Certificates", "Languages", "Additional Information",
        "Achievements", "Awards", "Publications", "Volunteer",
        "Hobbies", "Interests"
    ]

    raw = _extract_section(text, section_headers, stop_headers, 1500)
    if not raw:
        return ""

    lines = [line.strip() for line in raw.split('\n') if line.strip()]

    # Try to extract job titles and companies (usually the non-bullet lines)
    roles = []
    for line in lines:
        is_bullet = bool(re.match(r'^[•\*\-▪·➢►▸‣⁃]', line))
        if not is_bullet and len(line) > 5 and len(line) < 120:
            # Likely a role title or company line
            roles.append(line)
        if len(roles) >= 4:
            break

    if roles:
        result = " | ".join(roles)
        if len(result) > 500:
            result = result[:497] + "..."
        return result

    return ""


def parse_resume(text: str) -> Dict[str, Any]:
    """
    Parse the resume text and extract all structured data.
    This is the single reusable function called every time a resume is uploaded or replaced.

    Returns:
        Dict with keys: skills, projects, certifications, education,
                        experience_summary, raw_text_length
    """
    return {
        "skills": _extract_skills(text),
        "projects": _extract_projects(text),
        "certifications": _extract_certifications(text),
        "education": _extract_education(text),
        "experience_summary": _extract_experience_summary(text),
        "raw_text_length": len(text),
    }
