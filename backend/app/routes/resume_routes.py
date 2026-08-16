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


UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx"
}


def extract_pdf_text(file_path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


def extract_docx_text(file_path):

    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:

        text += paragraph.text + "\n"

    return text


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -----------------------------
    # Check file extension
    # -----------------------------

    original_name = file.filename or ""

    extension = os.path.splitext(
        original_name
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )


    # -----------------------------
    # Generate unique file name
    # -----------------------------

    unique_name = (
        f"{uuid.uuid4()}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_name
    )


    # -----------------------------
    # Save file
    # -----------------------------

    with open(
        file_path,
        "wb"
    ) as buffer:

        content = await file.read()

        buffer.write(content)


    # -----------------------------
    # Extract text
    # -----------------------------

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

        os.remove(file_path)

        raise HTTPException(
            status_code=400,
            detail="Could not read the resume file"
        )


    # -----------------------------
    # Save database record
    # -----------------------------

    resume = Resume(

        user_id=user_id,

        file_name=original_name,

        file_path=file_path,

        file_type=extension,

        extracted_text=extracted_text,

        is_primary=True
    )

    db.add(resume)

    db.commit()

    db.refresh(resume)


    return {

        "message": "Resume uploaded successfully",

        "resume_id": resume.resume_id,

        "file_name": resume.file_name,

        "file_type": resume.file_type,

        "text_length": len(extracted_text)

    }