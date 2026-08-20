from sqlalchemy.orm import Session
from . import models, schemas

def create_application(db: Session, application: schemas.ApplicationCreate):
    db_application = models.Application(
        user_id=application.user_id,
        job_id=application.job_id,
        resume_id=application.resume_id,
        status=application.status
    )

    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    return db_application


def get_applications(db: Session):
    return db.query(models.Application).all()


def get_application(db: Session, application_id: int):
    return db.query(models.Application).filter(
        models.Application.application_id == application_id
    ).first()