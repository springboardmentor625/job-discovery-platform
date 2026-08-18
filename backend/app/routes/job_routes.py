from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Job,
    CandidateProfile,
    JobSwipe
)
from ..auth import get_current_user


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)


# ==========================================
# CREATE JOB
# ==========================================

@router.post("")
def create_job(
    title: str,
    company: str,
    description: str,
    location: str,
    employment_type: str,
    experience_required: str = None,
    salary: str = None,
    skills: str = None,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    job = Job(

        recruiter_id=user_id,

        title=title,

        company=company,

        description=description,

        location=location,

        employment_type=employment_type,

        experience_required=experience_required,

        salary=salary,

        skills=skills,

        status="active"
    )

    db.add(job)

    db.commit()

    db.refresh(job)

    return {

        "message":
            "Job created successfully",

        "job_id":
            job.job_id

    }


# ==========================================
# GET ACTIVE JOBS
# ==========================================

@router.get("")
def get_jobs(
    db: Session = Depends(get_db)
):

    jobs = db.query(Job).filter(

        Job.status == "active"

    ).order_by(

        Job.created_at.desc()

    ).all()


    return [

        {

            "job_id":
                job.job_id,

            "title":
                job.title,

            "company":
                job.company,

            "description":
                job.description,

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

            "created_at":
                job.created_at

        }

        for job in jobs

    ]


# ==========================================
# GET MATCHED JOBS FOR CANDIDATE
# ==========================================

@router.get("/matched")
def get_matched_jobs(

    user_id: int = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    # ======================================
    # GET CANDIDATE PROFILE
    # ======================================

    profile = db.query(
        CandidateProfile
    ).filter(

        CandidateProfile.user_id
        == user_id

    ).first()


    if not profile:

        raise HTTPException(

            status_code=404,

            detail=
                "Candidate profile not found"

        )


    # ======================================
    # CANDIDATE SKILLS
    # ======================================

    candidate_skills = set()


    if profile.skills:

        candidate_skills = {

            skill.strip().lower()

            for skill
            in profile.skills.split(",")

            if skill.strip()

        }


    # ======================================
    # CANDIDATE EXPERIENCE
    # ======================================

    candidate_experience = (

        profile.experience
        or ""

    ).lower().strip()


    # ======================================
    # PREFERRED LOCATION
    # ======================================

    preferred_location = (

        profile.preferred_location

        or profile.location

        or ""

    ).lower().strip()


    # ======================================
    # EXPECTED SALARY
    # ======================================

    expected_salary = (

        profile.expected_salary
        or 0

    )


    # ======================================
    # GET ALREADY SWIPED JOBS
    # ======================================

    swiped_jobs = db.query(

        JobSwipe.job_id

    ).filter(

        JobSwipe.user_id == user_id

    ).all()


    swiped_job_ids = {

        swipe.job_id

        for swipe in swiped_jobs

    }


    # ======================================
    # GET ACTIVE UNSWIPED JOBS
    # ======================================

    jobs_query = db.query(
        Job
    ).filter(

        Job.status == "active"

    )


    # --------------------------------------
    # Exclude already swiped jobs
    # --------------------------------------

    if swiped_job_ids:

        jobs_query = jobs_query.filter(

            ~Job.job_id.in_(
                swiped_job_ids
            )

        )


    jobs = jobs_query.all()


    matched_jobs = []


    # ======================================
    # MATCH EACH JOB
    # ======================================

    for job in jobs:

        score = 0

        matched_skills = []


        # ==================================
        # JOB SKILLS
        # ==================================

        job_skills = set()


        if job.skills:

            job_skills = {

                skill.strip().lower()

                for skill
                in job.skills.split(",")

                if skill.strip()

            }


        # ==================================
        # SKILL MATCH — 50%
        # ==================================

        if (
            candidate_skills
            and job_skills
        ):

            matched_skills = sorted(

                candidate_skills.intersection(
                    job_skills
                )

            )


            skill_score = (

                len(matched_skills)

                /

                len(candidate_skills)

            ) * 50


            score += min(

                skill_score,

                50

            )


        # ==================================
        # EXPERIENCE MATCH — 20%
        # ==================================

        if (
            candidate_experience
            and job.experience_required
        ):

            job_experience = (

                str(
                    job.experience_required
                )

                .lower()

                .strip()

            )


            # --------------------------------
            # DIRECT MATCH
            # --------------------------------

            if (

                candidate_experience
                in job_experience

                or

                job_experience
                in candidate_experience

            ):

                score += 20


            else:

                # --------------------------------
                # COMPARE EXPERIENCE YEARS
                # --------------------------------

                import re


                candidate_years_match = re.search(

                    r"(\d+(?:\.\d+)?)",

                    candidate_experience

                )


                job_years_match = re.search(

                    r"(\d+(?:\.\d+)?)",

                    job_experience

                )


                if (

                    candidate_years_match

                    and

                    job_years_match

                ):

                    candidate_years = float(

                        candidate_years_match.group(1)

                    )


                    job_years = float(

                        job_years_match.group(1)

                    )


                    # Candidate has enough experience

                    if (

                        candidate_years
                        >= job_years

                    ):

                        score += 20


                    # Close experience match

                    elif (

                        abs(
                            candidate_years
                            - job_years
                        )

                        <= 1

                    ):

                        score += 10


        # ==================================
        # LOCATION MATCH — 15%
        # ==================================

        if preferred_location:

            job_location = (

                job.location
                or ""

            ).lower().strip()


            if (

                preferred_location
                in job_location

                or

                job_location
                in preferred_location

            ):

                score += 15


        # ==================================
        # SALARY MATCH — 15%
        # ==================================

        if (

            expected_salary

            and

            job.salary

        ):

            import re


            salary_numbers = re.findall(

                r"[\d,]+",

                str(job.salary)

            )


            salary_numbers = [

                int(
                    number.replace(
                        ",",
                        ""
                    )
                )

                for number
                in salary_numbers

                if number.replace(
                    ",",
                    ""
                ).isdigit()

            ]


            if salary_numbers:

                maximum_salary = max(
                    salary_numbers
                )


                # Full salary match

                if (

                    maximum_salary
                    >= expected_salary

                ):

                    score += 15


                # Partial salary match

                elif (

                    maximum_salary
                    >= expected_salary * 0.8

                ):

                    score += 8


        # ==================================
        # ADD MATCHED JOB
        # ==================================

        matched_jobs.append({

            "job_id":
                job.job_id,

            "title":
                job.title,

            "company":
                job.company,

            "description":
                job.description,

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

            "match_score":
                round(
                    score,
                    2
                ),

            "matched_skills":
                matched_skills,

            "created_at":
                job.created_at

        })


    # ======================================
    # SORT BY MATCH SCORE
    # ======================================

    matched_jobs.sort(

        key=lambda job:
            job["match_score"],

        reverse=True

    )


    # ======================================
    # RETURN TOP 50 JOBS
    # ======================================

    return matched_jobs[:50]


# ==========================================
# GET SINGLE JOB
# ==========================================

@router.get("/{job_id}")
def get_job(

    job_id: int,

    db: Session = Depends(
        get_db
    )

):

    job = db.query(Job).filter(

        Job.job_id == job_id,

        Job.status == "active"

    ).first()


    if not job:

        raise HTTPException(

            status_code=404,

            detail="Job not found"

        )


    return {

        "job_id":
            job.job_id,

        "title":
            job.title,

        "company":
            job.company,

        "description":
            job.description,

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

        "created_at":
            job.created_at

    }