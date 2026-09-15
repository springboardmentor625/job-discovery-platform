import os
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pypdf import PdfReader

from .database import get_db
from .models import Resume, User, ATSReport, Application, Notification
from .schemas import ResumeCreate, ResumeResponse, ResumeUpdate
from .auth import get_current_user

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)

# Comprehensive vocabulary of modern tech skills
TECH_SKILLS_VOCAB = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "R", "Dart",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "Elasticsearch", "DynamoDB", "Oracle", "SQLite",
    "FastAPI", "Django", "Flask", "Spring Boot", "Express", "Node.js", "NestJS", "GraphQL", "REST API",
    "React", "Vue", "Angular", "Next.js", "Svelte", "Tailwind", "TailwindCSS", "Bootstrap", "HTML", "CSS", "Redux",
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "Terraform", "Linux",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Computer Vision", "Pandas", "NumPy", "OpenCV",
    "Power BI", "Tableau", "Excel", "Data Analysis", "Data Engineering", "PySpark", "Spark", "Hadoop", "Kafka", "Airflow", "Snowflake", "BigQuery",
    "Git", "GitHub", "GitLab", "Jira", "Agile", "Scrum", "Postman"
]

ACTION_VERBS = [
    "developed", "built", "engineered", "led", "designed", "implemented", "optimized",
    "deployed", "architected", "spearheaded", "managed", "created", "delivered",
    "integrated", "reduced", "increased", "improved", "scaled", "automated", "launched",
    "orchestrated", "analyzed", "configured", "refactored", "maintained", "streamlined",
    "authored", "trained", "established", "formulated", "collaborated", "resolved"
]


def resolve_resume_path(file_path: str) -> Optional[str]:
    """Helper to find the existing PDF file path across different CWD contexts."""
    if not file_path:
        return None
    candidates = [
        file_path,
        os.path.join(os.getcwd(), file_path),
        os.path.join("backend", file_path),
        os.path.join(os.getcwd(), "backend", file_path),
        os.path.join("..", file_path),
    ]
    for c in candidates:
        if os.path.exists(c) and os.path.isfile(c):
            return c
    return None


def extract_pdf_text(path: str) -> str:
    """Extract all text pages from a PDF file."""
    text = ""
    try:
        reader = PdfReader(path)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    except Exception as e:
        print(f"Error reading PDF at {path}: {e}")
    return text


def analyze_resume_ats(resume_text: str, detected_skills: Optional[list] = None) -> tuple[int, dict, list, list]:
    """
    Evaluates a resume against 5 independent ATS dimensions (0-100 total):
    1. Structure & Contact Info (0-20)
    2. Core Sections (0-20)
    3. Skills Breadth & Depth (0-20)
    4. Action Verbs & Measurable Impact (0-20)
    5. Formatting & Readability (0-20)

    Returns: (total_score, breakdown_dict, suggestions_list, detected_skills_list)
    """
    if not resume_text or len(resume_text.strip()) < 30:
        return 0, {
            "structure": 0,
            "sections": 0,
            "skills": 0,
            "keywords": 0,
            "readability": 0,
            "total": 0
        }, [{
            "category": "General",
            "type": "error",
            "message": "ATS score unavailable — resume content could not be analyzed. Please ensure your PDF contains searchable text, or click Recalculate."
        }], []

    text_lower = resume_text.lower()
    words = resume_text.split()
    word_count = len(words)
    suggestions = []

    # -------------------------------------------------------------
    # 1. Structure & Contact Info (Max 20 pts)
    # -------------------------------------------------------------
    structure_score = 0

    # Email (+6 pts)
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text))
    if has_email:
        structure_score += 6
    else:
        suggestions.append({
            "category": "Contact Info",
            "type": "warning",
            "message": "Add a professional email address for recruiter contact."
        })

    # Phone (+6 pts)
    has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}', resume_text))
    if has_phone:
        structure_score += 6
    else:
        suggestions.append({
            "category": "Contact Info",
            "type": "warning",
            "message": "Include a direct contact phone number."
        })

    # Online Presence (LinkedIn / GitHub / Portfolio) (+4 pts)
    has_profile = bool(re.search(r'linkedin\.com|github\.com|gitlab\.com|portfolio|\.dev|\.me', text_lower))
    if has_profile:
        structure_score += 4
    else:
        suggestions.append({
            "category": "Online Presence",
            "type": "info",
            "message": "Include your LinkedIn or GitHub profile link for portfolio and code verification."
        })

    # Location (+4 pts)
    has_location = bool(re.search(r'(location|address|city|state|india|usa|bangalore|hyderabad|chennai|pune|delhi|mumbai|tirupati|remote|[a-zA-Z\s]+,\s*[a-zA-Z\s]+)', text_lower))
    if has_location:
        structure_score += 4
    else:
        suggestions.append({
            "category": "Contact Info",
            "type": "info",
            "message": "Specify your location (City, Country or Remote)."
        })

    structure_score = min(structure_score, 20)

    # -------------------------------------------------------------
    # 2. Core Sections (Max 20 pts - 4 pts each)
    # -------------------------------------------------------------
    sections_score = 0

    # Education (+4 pts)
    has_edu = bool(re.search(r'\b(education|academic|academics|university|college|b\.tech|bachelor|master|m\.tech|degree|cgpa|gpa)\b', text_lower))
    if has_edu:
        sections_score += 4
    else:
        suggestions.append({
            "category": "Sections",
            "type": "warning",
            "message": "Add an Education section highlighting your degree and graduation details."
        })

    # Experience / Work History (+4 pts)
    has_exp = bool(re.search(r'\b(experience|work experience|employment|work history|internship|internships|professional experience)\b', text_lower))
    if has_exp:
        sections_score += 4
    else:
        suggestions.append({
            "category": "Sections",
            "type": "warning",
            "message": "Add an Experience / Internships section detailing your past roles and contributions."
        })

    # Skills section (+4 pts)
    has_skills_sec = bool(re.search(r'\b(skills|technical skills|technologies|tech stack|core competencies|competencies|tools)\b', text_lower))
    if has_skills_sec:
        sections_score += 4
    else:
        suggestions.append({
            "category": "Sections",
            "type": "warning",
            "message": "Add a dedicated Technical Skills section organized by categories."
        })

    # Projects section (+4 pts)
    has_proj = bool(re.search(r'\b(projects|project work|key projects|academic projects|personal projects|portfolio)\b', text_lower))
    if has_proj:
        sections_score += 4
    else:
        suggestions.append({
            "category": "Sections",
            "type": "warning",
            "message": "Add a Projects section showcasing key technical builds with tech stacks used."
        })

    # Summary / Certifications (+4 pts)
    has_cert_sum = bool(re.search(r'\b(certifications|certificates|certified|summary|professional summary|about me|objective|profile)\b', text_lower))
    if has_cert_sum:
        sections_score += 4
    else:
        suggestions.append({
            "category": "Sections",
            "type": "info",
            "message": "Include a Professional Summary or Certifications section for quick career context."
        })

    sections_score = min(sections_score, 20)

    # -------------------------------------------------------------
    # 3. Skills Breadth & Depth (Max 20 pts)
    # -------------------------------------------------------------
    extracted_skills_list = []
    for skill in TECH_SKILLS_VOCAB:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            extracted_skills_list.append(skill)

    skill_count = len(extracted_skills_list)
    if skill_count >= 10:
        skills_score = 20
    elif skill_count >= 7:
        skills_score = 16
    elif skill_count >= 4:
        skills_score = 12
    elif skill_count >= 2:
        skills_score = 8
    elif skill_count == 1:
        skills_score = 4
    else:
        skills_score = 0

    if skill_count < 4:
        suggestions.append({
            "category": "Skills",
            "type": "warning",
            "message": f"Only {skill_count} tech skills recognized. Include more industry-standard keywords and tools."
        })
    elif skill_count < 8:
        suggestions.append({
            "category": "Skills",
            "type": "info",
            "message": f"Good skills breadth ({skill_count} detected). Consider adding related libraries, databases, or cloud platforms."
        })

    # -------------------------------------------------------------
    # 4. Action Verbs & Quantifiable Impact (Max 20 pts)
    # -------------------------------------------------------------
    found_verbs = [v for v in ACTION_VERBS if re.search(r'\b' + v + r'\b', text_lower)]
    verb_count = len(found_verbs)

    if verb_count >= 8:
        verb_pts = 14
    elif verb_count >= 5:
        verb_pts = 11
    elif verb_count >= 3:
        verb_pts = 8
    elif verb_count >= 1:
        verb_pts = 4
    else:
        verb_pts = 0

    metric_matches = re.findall(r'(\d+%\s*|\d+x|\$\d+|\d+\+\s*(users|clients|requests|qps|endpoints|models|records|datasets|downloads|stars)?|\b\d{2,}\b)', resume_text)
    metric_count = len(metric_matches)
    if metric_count >= 3:
        metric_pts = 6
    elif metric_count >= 1:
        metric_pts = 3
    else:
        metric_pts = 0

    keywords_score = min(verb_pts + metric_pts, 20)

    if verb_count < 4:
        suggestions.append({
            "category": "Action Verbs",
            "type": "warning",
            "message": "Start bullet points with impactful action verbs like Developed, Engineered, Optimized, Architected."
        })
    if metric_count < 1:
        suggestions.append({
            "category": "Impact",
            "type": "info",
            "message": "Include quantifiable metrics (e.g. percentages, scale numbers, latency reductions) to prove measurable impact."
        })

    # -------------------------------------------------------------
    # 5. Readability, Formatting & Length (Max 20 pts)
    # -------------------------------------------------------------
    if 350 <= word_count <= 850:
        read_pts = 14
    elif 250 <= word_count < 350 or 850 < word_count <= 1100:
        read_pts = 10
    elif 150 <= word_count < 250 or 1100 < word_count <= 1400:
        read_pts = 6
    elif 50 <= word_count < 150:
        read_pts = 3
    else:
        read_pts = 0

    has_bullets = bool(re.search(r'[•\-\*▪–]|\n\s*[A-Z]', resume_text))
    format_pts = 6 if has_bullets else 3
    readability_score = min(read_pts + format_pts, 20)

    if word_count < 250:
        suggestions.append({
            "category": "Length & Detail",
            "type": "warning",
            "message": f"Resume is concise ({word_count} words). Aim for 350–700 words to provide enough technical depth for ATS parsers."
        })
    elif word_count > 1000:
        suggestions.append({
            "category": "Length & Detail",
            "type": "info",
            "message": f"Resume is lengthy ({word_count} words). Consider condensing to 1–2 pages (under 800 words) for clean readability."
        })

    if not suggestions:
        suggestions.append({
            "category": "ATS Optimization",
            "type": "success",
            "message": "Outstanding ATS readiness! Your resume includes all key sections, contact channels, tech skills, and strong action verbs."
        })

    total_score = structure_score + sections_score + skills_score + keywords_score + readability_score
    total_score = min(max(total_score, 0), 100)

    breakdown = {
        "structure": structure_score,
        "sections": sections_score,
        "skills": skills_score,
        "keywords": keywords_score,
        "readability": readability_score,
        "total": total_score
    }

    return total_score, breakdown, suggestions, extracted_skills_list


def calculate_ats_score(resume_text: str, skills: list) -> int:
    """Legacy helper maintained for backward compatibility."""
    score, _, _, _ = analyze_resume_ats(resume_text, skills)
    return score


# CREATE RESUME
@router.post("/", response_model=ResumeResponse)
def create_resume(
    resume: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_resume = Resume(
        user_id=current_user.user_id,
        resume_name=resume.resume_name,
        file_path=resume.file_path,
        extracted_skills=resume.extracted_skills,
        is_default=resume.is_default
    )

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return new_resume


# GET ALL MY RESUMES
@router.get("/", response_model=list[ResumeResponse])
def get_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.user_id
    ).all()

    # Auto-backfill any legacy resumes that don't have ats_breakdown calculated
    updated_any = False
    for r in resumes:
        if r.ats_breakdown is None:
            raw_text = r.raw_text
            if not raw_text:
                real_path = resolve_resume_path(r.file_path)
                if real_path:
                    raw_text = extract_pdf_text(real_path)
            
            if raw_text and len(raw_text.strip()) >= 30:
                score, breakdown, suggestions, skills = analyze_resume_ats(raw_text)
                r.ats_score = score
                r.ats_breakdown = breakdown
                r.ats_suggestions = suggestions
                r.raw_text = raw_text
                if not r.extracted_skills:
                    r.extracted_skills = skills
                updated_any = True
            elif not raw_text:
                # If no text extractable, set breakdown to 0 and explanation suggestion
                r.ats_score = 0
                r.ats_breakdown = {"structure": 0, "sections": 0, "skills": 0, "keywords": 0, "readability": 0, "total": 0}
                r.ats_suggestions = [{
                    "category": "General",
                    "type": "error",
                    "message": "ATS score unavailable — resume content could not be analyzed. Please ensure your PDF contains searchable text."
                }]
                updated_any = True

    if updated_any:
        try:
            db.commit()
            for r in resumes:
                db.refresh(r)
        except Exception as e:
            db.rollback()
            print(f"Error auto-backfilling ATS breakdowns: {e}")

    return resumes


# GET ONE MY RESUME
@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    return resume


# RECALCULATE ATS SCORE FOR A RESUME
@router.post("/{resume_id}/recalculate-ats", response_model=ResumeResponse)
def recalculate_resume_ats(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # Extract text from disk or cached raw_text
    extracted_text = ""
    real_path = resolve_resume_path(resume.file_path)
    if real_path:
        extracted_text = extract_pdf_text(real_path)
    
    if not extracted_text and resume.raw_text:
        extracted_text = resume.raw_text

    if not extracted_text or len(extracted_text.strip()) < 30:
        resume.ats_score = 0
        resume.ats_breakdown = {
            "structure": 0,
            "sections": 0,
            "skills": 0,
            "keywords": 0,
            "readability": 0,
            "total": 0
        }
        resume.ats_suggestions = [{
            "category": "General",
            "type": "error",
            "message": "ATS score unavailable — resume content could not be analyzed. Please ensure your PDF contains searchable text."
        }]
    else:
        score, breakdown, suggestions, skills = analyze_resume_ats(extracted_text)
        resume.ats_score = score
        resume.ats_breakdown = breakdown
        resume.ats_suggestions = suggestions
        resume.extracted_skills = skills
        resume.raw_text = extracted_text

    db.commit()
    db.refresh(resume)

    return resume


# UPDATE MY RESUME
@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(
    resume_id: int,
    resume_data: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    update_data = resume_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(resume, key, value)

    db.commit()
    db.refresh(resume)

    return resume


# DELETE MY RESUME
@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch resume
    resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # 2. Check ownership
    if resume.user_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this resume"
        )

    was_default = resume.is_default
    file_path = resume.file_path

    # 3. Safely delete dependent ATS reports
    try:
        db.query(ATSReport).filter(ATSReport.resume_id == resume_id).delete(synchronize_session=False)
    except Exception as e:
        print(f"Error cleaning up ATS reports for resume {resume_id}: {e}")

    # 4. Safely delete dependent applications and unbind related notifications
    try:
        applications = db.query(Application).filter(Application.resume_id == resume_id).all()
        app_ids = [a.application_id for a in applications]
        if app_ids:
            db.query(Notification).filter(Notification.related_application_id.in_(app_ids)).update(
                {Notification.related_application_id: None},
                synchronize_session=False
            )
            db.query(Application).filter(Application.resume_id == resume_id).delete(synchronize_session=False)
    except Exception as e:
        print(f"Error cleaning up applications for resume {resume_id}: {e}")

    # 5. Delete physical file from disk if it exists
    real_path = resolve_resume_path(file_path)
    if real_path and os.path.exists(real_path) and os.path.isfile(real_path):
        try:
            os.remove(real_path)
            print(f"Removed physical resume file: {real_path}")
        except Exception as e:
            print(f"Warning: Could not remove file {real_path}: {e}")

    # 6. Delete resume database record
    db.delete(resume)

    # 7. If deleted resume was default, assign new default if other resumes exist
    if was_default:
        other_resume = db.query(Resume).filter(
            Resume.user_id == current_user.user_id,
            Resume.resume_id != resume_id
        ).order_by(Resume.uploaded_at.desc()).first()
        if other_resume:
            other_resume.is_default = True

    db.commit()

    return {
        "message": "Resume deleted successfully",
        "resume_id": resume_id
    }


# UPLOAD RESUME
@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    file_content = await file.read()

    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)

    file_name = f"{current_user.user_id}_{file.filename}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    # Extract text from PDF
    extracted_text = extract_pdf_text(file_path)

    # Analyze ATS dimensions
    ats_score, ats_breakdown, ats_suggestions, detected_skills = analyze_resume_ats(extracted_text)

    # Create resume record
    new_resume = Resume(
        user_id=current_user.user_id,
        resume_name=file.filename,
        file_path=file_path,
        extracted_skills=detected_skills,
        is_default=False,
        ats_score=ats_score,
        ats_breakdown=ats_breakdown,
        ats_suggestions=ats_suggestions,
        raw_text=extracted_text
    )

    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return new_resume
