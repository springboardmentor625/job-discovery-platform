"""Authoritative skill vocabulary and normalization helpers."""

COMMON_SKILLS = {
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust",
    "php", "kotlin", "swift", "ruby", "scala", "r", "react", "angular", "vue",
    "html", "css", "tailwind", "bootstrap", "sass", "next.js", "redux", "jquery",
    "webpack", "node.js", "express", "fastapi", "django", "flask", "spring boot",
    "spring", "laravel", "ruby on rails", "asp.net", "graphql", "rest api",
    "microservices", "mysql", "postgresql", "mongodb", "redis", "sql", "sqlite",
    "oracle", "cassandra", "dynamodb", "elasticsearch", "firebase", "aws", "azure",
    "gcp", "docker", "kubernetes", "git", "github", "gitlab", "jenkins", "ci/cd",
    "terraform", "ansible", "linux", "nginx", "bash", "shell scripting",
    "machine learning", "deep learning", "artificial intelligence", "data science",
    "data analysis", "data engineering", "pandas", "numpy", "scikit-learn", "tensorflow",
    "pytorch", "keras", "nlp", "computer vision", "opencv", "spacy",
    "sentence-transformers", "power bi", "tableau", "excel", "android", "ios",
    "react native", "flutter", "swiftui", "selenium", "pytest", "jest", "junit",
    "cypress", "postman", "figma", "sketch", "adobe xd", "ui/ux", "photoshop",
    "illustrator", "jira", "confluence", "agile", "scrum", "kanban", "seo",
    "digital marketing", "content writing", "market research", "negotiation", "salesforce",
    "google analytics", "social media", "video editing", "email marketing",
}

SKILL_ALIASES = {
    "js": "javascript", "ts": "typescript", "react.js": "react", "reactjs": "react",
    "node": "node.js", "nodejs": "node.js", "fast api": "fastapi", "fast-api": "fastapi",
    "mongo": "mongodb", "mongo db": "mongodb", "postgres": "postgresql",
    "postgres db": "postgresql", "restful": "rest api", "restful api": "rest api",
    "ml": "machine learning", "golang": "go", "k8s": "kubernetes", "nextjs": "next.js",
    "scikit learn": "scikit-learn", "sklearn": "scikit-learn", "powerbi": "power bi",
    "ui ux": "ui/ux", "angular.js": "angular", "angularjs": "angular", "vue.js": "vue",
    "vuejs": "vue", "express.js": "express", "py": "python", "c sharp": "c#",
    "cpp": "c++", "ci cd": "ci/cd", "natural language processing": "nlp",
}


def normalize_skill(raw):
    cleaned = " ".join(str(raw or "").strip().lower().split())
    cleaned = cleaned.replace("–", "-").replace("—", "-")
    return SKILL_ALIASES.get(cleaned, cleaned)


def normalize_skills(raw):
    if not raw:
        return set()
    values = raw if not isinstance(raw, str) else raw.split(",")
    return {
        normalize_skill(value)
        for value in values
        if str(value).strip() and normalize_skill(value) != "api"
    }


def merge_skills(*skill_sets):
    return {normalize_skill(skill) for skills in skill_sets for skill in (skills or set())}


def split_skills(raw):
    """Convert a comma-separated skill string into normalized skill names."""
    return normalize_skills(raw)


SKILL_CATEGORIES = {
    "programming": {"python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust", "php", "kotlin", "swift", "ruby", "scala", "r"},
    "frontend": {"react", "angular", "vue", "html", "css", "tailwind", "bootstrap", "sass", "next.js", "redux", "jquery", "webpack"},
    "backend": {"node.js", "express", "fastapi", "django", "flask", "spring boot", "spring", "laravel", "ruby on rails", "asp.net", "graphql", "rest api", "microservices"},
    "database": {"mysql", "postgresql", "mongodb", "redis", "sql", "sqlite", "oracle", "cassandra", "dynamodb", "elasticsearch", "firebase"},
    "cloud_devops": {"aws", "azure", "gcp", "docker", "kubernetes", "git", "github", "gitlab", "jenkins", "ci/cd", "terraform", "ansible", "linux", "nginx", "bash", "shell scripting"},
    "data_ai": {"machine learning", "deep learning", "artificial intelligence", "data science", "data analysis", "data engineering", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "nlp", "computer vision", "opencv", "spacy", "sentence-transformers", "power bi", "tableau", "excel"},
    "mobile": {"android", "ios", "react native", "flutter", "swiftui"},
    "testing": {"selenium", "pytest", "jest", "junit", "cypress", "postman"},
    "design": {"figma", "sketch", "adobe xd", "ui/ux", "photoshop", "illustrator"},
    "business": {"jira", "confluence", "agile", "scrum", "kanban", "seo", "digital marketing", "content writing", "market research", "negotiation", "salesforce", "google analytics", "social media", "video editing", "email marketing"},
}


def categorize_skills(raw_skills):
    skills = normalize_skills(raw_skills)
    return {
        category for category, vocabulary in SKILL_CATEGORIES.items()
        if skills.intersection(vocabulary)
    }
