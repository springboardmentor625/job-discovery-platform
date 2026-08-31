from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from .database import get_db
from .models import Resume, User
from .schemas import ResumeCreate, ResumeResponse, ResumeUpdate
from .auth import get_current_user
from pypdf import PdfReader
import re

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)


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
    resume = db.query(Resume).filter(
        Resume.resume_id == resume_id,
        Resume.user_id == current_user.user_id
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    db.delete(resume)
    db.commit()

    return {
        "message": "Resume deleted successfully"
    }

def calculate_ats_score(resume_text: str, skills: list) -> int:
    text = resume_text.lower()

    score = 0

    # -------------------------
    # 1. Skills - 40 points
    # -------------------------
    skill_score = min(len(skills) * 5, 40)
    score += skill_score

    # -------------------------
    # 2. Important sections - 25 points
    # -------------------------
    sections = {
        "education": 5,
        "experience": 5,
        "skills": 5,
        "projects": 5,
        "certifications": 5
    }

    for section, points in sections.items():
        if section in text:
            score += points

    # -------------------------
    # 3. Experience / education - 20 points
    # -------------------------

    if re.search(r"\b\d+\s*(year|years|yr|yrs)\b", text):
        score += 10

    if any(word in text for word in [
        "b.tech",
        "btech",
        "bachelor",
        "degree",
        "master",
        "m.tech",
        "mtech"
    ]):
        score += 10

    # -------------------------
    # 4. Resume content - 15 points
    # -------------------------

    word_count = len(resume_text.split())

    if word_count >= 300:
        score += 15
    elif word_count >= 150:
        score += 10
    elif word_count >= 75:
        score += 5

    return min(score, 100)

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Read uploaded PDF
    file_content = await file.read()

    # Create upload directory
    import os

    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)

    # Create unique file name
    file_name = f"{current_user.user_id}_{file.filename}"
    file_path = os.path.join(upload_dir, file_name)

    # Save PDF
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    # Extract text from PDF
    extracted_text = ""

    try:
        reader = PdfReader(file_path)

        for page in reader.pages:
            text = page.extract_text()

            if text:
                extracted_text += text + "\n"

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read PDF: {str(e)}"
        )

    # Create resume record
    # Skills supported by SwipeX
    skill_list = [
        "Python",
        "SQL",
        "PostgreSQL",
        "MySQL",
        "FastAPI",
        "Django",
        "Flask",
        "Pandas",
        "NumPy",
        "PySpark",
        "Spark",
        "AWS",
        "Azure",
        "GCP",
        "Docker",
        "Kubernetes",
        "Git",
        "GitHub",
        "React",
        "JavaScript",
        "HTML",
        "CSS",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "Scikit-learn",
        "Power BI",
        "Tableau",
        "Excel"
    ]
    
    # Extract skills from resume text
    detected_skills = []
    
    resume_text_lower = extracted_text.lower()
    
    for skill in skill_list:
        if skill.lower() in resume_text_lower:
            detected_skills.append(skill)

    ats_score = calculate_ats_score(
    extracted_text,
    detected_skills
)

    print("\n========== ATS SCORE ==========")
    print(f"Score: {ats_score}/100")
    print(f"Skills: {detected_skills}")
    print("===============================\n")        
    
    # Create resume record
    new_resume = Resume(
        user_id=current_user.user_id,
        resume_name=file.filename,
        file_path=file_path,
        extracted_skills=detected_skills,
        is_default=False,
        ats_score = ats_score
    )
    
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    print("\n========== RESUME TEXT ==========")
    print(extracted_text)
    print("=================================\n")

    return new_resume