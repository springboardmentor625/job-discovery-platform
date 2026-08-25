from sqlalchemy.orm import Session
from . import models, schemas

def create_application(
    db: Session,
    application: schemas.ApplicationCreate,
    user_id: int
):
    resume = db.query(models.Resume).filter(
        models.Resume.resume_id == application.resume_id,
        models.Resume.user_id == user_id
    ).first()

    if resume is None:
        return None

    db_application = models.Application(
        user_id=user_id,
        job_id=application.job_id,
        resume_id=application.resume_id,
        status=application.status
    )

    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    return db_application


def get_applications(db: Session, user_id: int):
    return db.query(models.Application).filter(
        models.Application.user_id == user_id
    ).all()


def get_application(db: Session, application_id: int, user_id: int):
    return db.query(models.Application).filter(
        models.Application.application_id == application_id,
        models.Application.user_id == user_id
    ).first()