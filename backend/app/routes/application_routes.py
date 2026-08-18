from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Application, Job
from ..auth import get_current_user


router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"]
)


# ==========================================
# APPLY FOR JOB
# ==========================================

@router.post("")
def apply_for_job(
    job_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # Check whether job exists
    # --------------------------------------

    job = db.query(Job).filter(
        Job.job_id == job_id,
        Job.status == "active"
    ).first()

    if not job:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )


    # --------------------------------------
    # Check duplicate application
    # --------------------------------------

    existing_application = db.query(
        Application
    ).filter(
        Application.user_id == user_id,
        Application.job_id == job_id
    ).first()

    if existing_application:

        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )


    # --------------------------------------
    # Create application
    # --------------------------------------

    application = Application(

        user_id=user_id,

        job_id=job_id,

        status="submitted"
    )


    db.add(application)

    db.commit()

    db.refresh(application)


    return {

        "message": "Application submitted successfully",

        "application_id":
            application.application_id,

        "job_id":
            application.job_id,

        "status":
            application.status

    }


# ==========================================
# GET MY APPLICATIONS
# ==========================================

@router.get("")
def get_my_applications(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    results = (
        db.query(Application, Job)
        .join(
            Job,
            Application.job_id == Job.job_id
        )
        .filter(
            Application.user_id == user_id
        )
        .order_by(
            Application.applied_at.desc()
        )
        .all()
    )


    return [

        {
            "application_id":
                application.application_id,

            "job_id":
                job.job_id,

            "title":
                job.title,

            "company":
                job.company,

            "location":
                job.location,

            "employment_type":
                job.employment_type,

            "experience_required":
                job.experience_required,

            "salary":
                job.salary,

            "skills":
                job.skills,

            "status":
                application.status,

            "applied_at":
                application.applied_at,

            "updated_at":
                application.updated_at
        }

        for application, job in results

    ]
# ==========================================
# GET SINGLE APPLICATION
# ==========================================

@router.get("/{application_id}")
def get_application(
    application_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    application = db.query(
        Application
    ).filter(
        Application.application_id ==
            application_id,

        Application.user_id ==
            user_id
    ).first()


    if not application:

        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )


    return {

        "application_id":
            application.application_id,

        "job_id":
            application.job_id,

        "status":
            application.status,

        "applied_at":
            application.applied_at,

        "updated_at":
            application.updated_at

    }