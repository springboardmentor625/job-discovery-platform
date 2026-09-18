import os
import uuid
import re

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Resume,
    CandidateProfile
)
from ..auth import get_current_user
from .job_routes import invalidate_recommendation_cache
from ..services.resume_parser import (
    COMMON_SKILLS,
    extract_pdf_text,
    extract_docx_text,
    parse_resume
)


router = APIRouter(
    prefix="/api/candidate",
    tags=["Resume"]
)


# ==========================================
# UPLOAD DIRECTORY
# ==========================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# ==========================================
# ALLOWED FILE TYPES
# ==========================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx"
}


# ==========================================
# ALL PARSING LOGIC LIVES IN resume_parser.py
# (moved from here — this file used to have a
# duplicate, independently-maintained copy)
# ==========================================


@router.get("/resume")
def get_resume(

    user_id: int = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    resume = db.query(
        Resume
    ).filter(

        Resume.user_id == user_id,

        Resume.is_primary == True

    ).order_by(

        Resume.uploaded_at.desc()

    ).first()


    if not resume:

        raise HTTPException(

            status_code=404,

            detail="No resume uploaded"

        )


    return {

        "resume_id":
            resume.resume_id,

        "file_name":
            resume.file_name,

        "file_type":
            resume.file_type,

        "file_path":
            resume.file_path,

        "text_length":
            len(
                resume.extracted_text or ""
            ),

        "extracted_skills":
            resume.extracted_skills,

        "extracted_experience":
            resume.extracted_experience,

        "extracted_education":
            resume.extracted_education,

        "uploaded_at":
            resume.uploaded_at

    }


# ==========================================
# UPLOAD / REPLACE RESUME
# ==========================================

@router.post("/resume")
async def upload_resume(

    file: UploadFile = File(...),

    user_id: int = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    # ======================================
    # CHECK FILE NAME
    # ======================================

    original_name = (
        file.filename or ""
    )


    if not original_name:

        raise HTTPException(

            status_code=400,

            detail="Please select a resume file"

        )


    # ======================================
    # CHECK FILE EXTENSION
    # ======================================

    extension = os.path.splitext(
        original_name
    )[1].lower()


    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(

            status_code=400,

            detail="Only PDF and DOCX files are allowed"

        )


    # ======================================
    # READ FILE
    # ======================================

    content = await file.read()


    if not content:

        raise HTTPException(

            status_code=400,

            detail="The uploaded file is empty"

        )


    # ======================================
    # GENERATE UNIQUE FILE NAME
    # ======================================

    unique_name = (

        f"{uuid.uuid4()}{extension}"

    )


    file_path = os.path.join(

        UPLOAD_DIR,

        unique_name

    )


    # ======================================
    # SAVE FILE
    # ======================================

    try:

        with open(

            file_path,

            "wb"

        ) as buffer:

            buffer.write(content)


    except Exception:

        raise HTTPException(

            status_code=500,

            detail="Could not save the resume file"

        )


    # ======================================
    # EXTRACT TEXT
    # ======================================

    try:

        if extension == ".pdf":

            extracted_text = (
                extract_pdf_text(
                    file_path
                )
            )

        else:

            extracted_text = (
                extract_docx_text(
                    file_path
                )
            )


    except Exception:

        if os.path.exists(
            file_path
        ):

            os.remove(
                file_path
            )


        raise HTTPException(

            status_code=400,

            detail="Could not read the resume file"

        )


    # ======================================
    # PARSE RESUME
    # ======================================

    try:

        parsed_data = parse_resume(
            extracted_text
        )

    except Exception as parse_error:

        print(
            "Resume parsing error:",
            parse_error
        )

        parsed_data = {

            "extracted_text":
                extracted_text,

            "extracted_skills":
                "",

            "extracted_experience":
                "",

            "extracted_education":
                ""

        }


    # ======================================
    # FIND CURRENT PRIMARY RESUME
    # ======================================

    old_resume = db.query(
        Resume
    ).filter(

        Resume.user_id == user_id,

        Resume.is_primary == True

    ).first()


    # ======================================
    # MARK OLD RESUME NON-PRIMARY
    # ======================================

    if old_resume:

        old_resume.is_primary = False


    # ======================================
    # CREATE NEW RESUME
    # ======================================

    resume = Resume(

        user_id=user_id,

        file_name=original_name,

        file_path=file_path,

        file_type=extension,

        extracted_text=
            parsed_data[
                "extracted_text"
            ],

        extracted_skills=
            parsed_data[
                "extracted_skills"
            ],

        extracted_experience=
            parsed_data[
                "extracted_experience"
            ],

        extracted_education=
            parsed_data[
                "extracted_education"
            ],

        is_primary=True

    )


    db.add(resume)


    # ======================================
    # SAVE DATABASE CHANGES
    # ======================================

    try:

        db.commit()

        db.refresh(resume)
        invalidate_recommendation_cache(user_id)


    except Exception:

        db.rollback()


        if os.path.exists(
            file_path
        ):

            os.remove(
                file_path
            )


        raise HTTPException(

            status_code=500,

            detail="Could not save resume information"

        )


    # ======================================
    # DELETE OLD FILE
    # ======================================

    if old_resume:

        old_file_path = (
            old_resume.file_path
        )


        if (

            old_file_path

            and

            os.path.exists(
                old_file_path
            )

        ):

            try:

                os.remove(
                    old_file_path
                )

            except Exception:

                pass


    # ======================================
    # RESPONSE
    # ======================================

    return {

        "message":
            "Resume uploaded and parsed successfully",

        "resume_id":
            resume.resume_id,

        "file_name":
            resume.file_name,

        "file_type":
            resume.file_type,

        "text_length":
            len(
                parsed_data[
                    "extracted_text"
                ]
            ),

        "extracted_skills":
            resume.extracted_skills,

        "extracted_experience":
            resume.extracted_experience,

        "extracted_education":
            resume.extracted_education,

        "uploaded_at":
            resume.uploaded_at

    }
# ==========================================
# ATS RESUME ANALYSIS
# ==========================================

@router.get("/resume/ats")
def analyze_resume_ats(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ======================================
    # GET PRIMARY RESUME
    # ======================================

    resume = db.query(Resume).filter(
        Resume.user_id == user_id,
        Resume.is_primary == True
    ).order_by(
        Resume.uploaded_at.desc()
    ).first()

    if not resume:

        raise HTTPException(
            status_code=404,
            detail="No resume uploaded"
        )


    # ======================================
    # GET EXTRACTED TEXT
    # ======================================

    text = (
        resume.extracted_text
        or ""
    ).strip()


    if not text:

        raise HTTPException(
            status_code=400,
            detail="No text could be extracted from the resume"
        )


    # ======================================
    # NORMALIZE TEXT
    # ======================================

    normalized_text = text.lower()


    # ======================================
    # GET CANDIDATE PROFILE
    # ======================================

    profile = db.query(
        CandidateProfile
    ).filter(
        CandidateProfile.user_id == user_id
    ).first()


    # ======================================
    # SECTION DETECTION
    # ======================================

    sections = {

        "contact": False,

        "summary": False,

        "skills": False,

        "experience": False,

        "education": False,

        "projects": False,

        "certifications": False

    }


    # --------------------------------------
    # Contact information
    # --------------------------------------

    email_found = bool(
        re.search(
            r"[A-Za-z0-9._%+-]+@"
            r"[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
            text
        )
    )


    phone_found = bool(
        re.search(
            r"(?:\+91[\s-]?)?"
            r"[6-9]\d{9}",
            text
        )
    )


    if email_found or phone_found:

        sections["contact"] = True


    # --------------------------------------
    # Resume sections
    # --------------------------------------

    section_keywords = {

        "summary": [
            "summary",
            "professional summary",
            "profile",
            "objective"
        ],

        "skills": [
            "skills",
            "technical skills",
            "core skills",
            "technologies"
        ],

        "experience": [
            "experience",
            "work experience",
            "professional experience",
            "employment history"
        ],

        "education": [
            "education",
            "academic background",
            "qualification"
        ],

        "projects": [
            "projects",
            "academic projects",
            "personal projects"
        ],

        "certifications": [
            "certifications",
            "certificates",
            "licenses"
        ]

    }


    for section, keywords in section_keywords.items():

        for keyword in keywords:

            if keyword in normalized_text:

                sections[section] = True

                break


    # ======================================
    # SECTION SCORE
    # ======================================

    section_weights = {

        "contact": 15,

        "summary": 10,

        "skills": 20,

        "experience": 20,

        "education": 15,

        "projects": 10,

        "certifications": 10

    }


    section_score = 0


    for section, weight in section_weights.items():

        if sections[section]:

            section_score += weight


    # ======================================
    # PROFILE DATA BONUS
    # ======================================

    profile_score = 0

    profile_data = {

        "skills":
            profile.skills
            if profile else None,

        "experience_years":
            profile.experience_years
            if profile else None,

        "education":
            profile.education
            if profile else None,

        "location":
            profile.location
            if profile else None,

        "preferred_role":
            profile.preferred_role
            if profile else None

    }


    populated_profile_fields = sum(

        1

        for value in profile_data.values()

        if value and str(value).strip()

    )


    profile_score = min(

        populated_profile_fields * 2,

        10

    )


    # ======================================
    # KEYWORD / SKILL ANALYSIS
    # ======================================

    detected_skills = [

        skill

        for skill in COMMON_SKILLS

        if skill in normalized_text

    ]


    # ======================================
    # SKILL SCORE
    # ======================================

    skill_score = min(

        len(detected_skills) * 2,

        20

    )


    # ======================================
    # RESUME LENGTH ANALYSIS
    # ======================================

    character_count = len(text)

    word_count = len(
        text.split()
    )


    if word_count >= 300:

        length_score = 10

    elif word_count >= 150:

        length_score = 7

    elif word_count >= 75:

        length_score = 4

    else:

        length_score = 2


    # ======================================
    # FINAL ATS SCORE
    # ======================================

    raw_score = (

        section_score

        +

        profile_score

        +

        skill_score

        +

        length_score

    )


    # Normalize to 100

    ats_score = min(

        round(
            raw_score,
            2
        ),

        100

    )


    # ======================================
    # BUILD RECOMMENDATIONS
    # ======================================

    recommendations = []


    if not sections["contact"]:

        recommendations.append(
            "Add clear email and phone contact information."
        )


    if not sections["summary"]:

        recommendations.append(
            "Add a professional summary or career objective."
        )


    if not sections["skills"]:

        recommendations.append(
            "Add a clearly labelled skills section."
        )


    if not sections["experience"]:

        recommendations.append(
            "Add relevant work experience or internship details."
        )


    if not sections["education"]:

        recommendations.append(
            "Add your education or academic qualifications."
        )


    if not sections["projects"]:

        recommendations.append(
            "Add relevant academic or personal projects."
        )


    if not sections["certifications"]:

        recommendations.append(
            "Consider adding relevant certifications."
        )


    if len(detected_skills) < 5:

        recommendations.append(
            "Add more relevant technical skills and job-specific keywords."
        )


    if word_count < 150:

        recommendations.append(
            "Resume content appears short. Add more relevant details."
        )


    # ======================================
    # ATS STATUS
    # ======================================

    if ats_score >= 80:

        ats_status = "Excellent"

    elif ats_score >= 65:

        ats_status = "Good"

    elif ats_score >= 50:

        ats_status = "Needs Improvement"

    else:

        ats_status = "Weak"


    # ======================================
    # RESPONSE
    # ======================================

    return {

        "resume_id":
            resume.resume_id,

        "file_name":
            resume.file_name,

        "ats_score":
            ats_score,

        "ats_status":
            ats_status,

        "word_count":
            word_count,

        "character_count":
            character_count,

        "detected_skills":
            detected_skills,

        "sections":
            sections,

        "profile_fields_completed":
            populated_profile_fields,

        "recommendations":
            recommendations,

        "analysis": {

            "section_score":
                section_score,

            "profile_score":
                profile_score,

            "skill_score":
                skill_score,

            "length_score":
                length_score

        }

    }