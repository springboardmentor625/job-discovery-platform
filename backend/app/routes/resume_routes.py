import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from pypdf import PdfReader
from docx import Document

from ..database import get_db
from ..models import Resume
from ..auth import get_current_user


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
# EXTRACT PDF TEXT
# ==========================================

def extract_pdf_text(file_path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# ==========================================
# EXTRACT DOCX TEXT
# ==========================================

def extract_docx_text(file_path):

    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:

        text += paragraph.text + "\n"

    return text


# ==========================================
# GET CURRENT RESUME
# ==========================================

@router.get("/resume")
def get_resume(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

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

    return {

        "resume_id": resume.resume_id,

        "file_name": resume.file_name,

        "file_type": resume.file_type,

        "file_path": resume.file_path,

        "text_length": len(
            resume.extracted_text or ""
        ),

        "uploaded_at": resume.uploaded_at

    }


# ==========================================
# UPLOAD / REPLACE RESUME
# ==========================================

@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ======================================
    # CHECK FILE NAME
    # ======================================

    original_name = file.filename or ""

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

            extracted_text = extract_pdf_text(
                file_path
            )

        else:

            extracted_text = extract_docx_text(
                file_path
            )

    except Exception:

        if os.path.exists(file_path):

            os.remove(file_path)

        raise HTTPException(
            status_code=400,
            detail="Could not read the resume file"
        )


    # ======================================
    # FIND CURRENT PRIMARY RESUME
    # ======================================

    old_resume = db.query(Resume).filter(
        Resume.user_id == user_id,
        Resume.is_primary == True
    ).first()


    # ======================================
    # MARK OLD RESUME AS NON-PRIMARY
    # ======================================

    if old_resume:

        old_resume.is_primary = False


    # ======================================
    # CREATE NEW RESUME RECORD
    # ======================================

    resume = Resume(

        user_id=user_id,

        file_name=original_name,

        file_path=file_path,

        file_type=extension,

        extracted_text=extracted_text,

        is_primary=True

    )


    db.add(resume)


    # ======================================
    # SAVE DATABASE CHANGES
    # ======================================

    try:

        db.commit()

        db.refresh(resume)

    except Exception:

        db.rollback()

        if os.path.exists(file_path):

            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Could not save resume information"
        )


    # ======================================
    # DELETE OLD FILE
    # ======================================

    if old_resume:

        old_file_path = old_resume.file_path

        if (
            old_file_path
            and os.path.exists(old_file_path)
        ):

            try:

                os.remove(old_file_path)

            except Exception:

                # Don't fail the upload if
                # old file deletion fails.
                pass


    # ======================================
    # RESPONSE
    # ======================================

    return {

        "message": "Resume uploaded successfully",

        "resume_id": resume.resume_id,

        "file_name": resume.file_name,

        "file_type": resume.file_type,

        "text_length": len(
            extracted_text
        ),

        "uploaded_at": resume.uploaded_at

    }