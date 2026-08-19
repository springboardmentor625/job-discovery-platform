import re

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
    JobSwipe,
    Resume
)
from ..auth import get_current_user


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)


# ==========================================
# HELPER: CONVERT SKILLS TO SET
# ==========================================

def skills_to_set(skills):

    if not skills:
        return set()

    return {
        skill.strip().lower()
        for skill in str(skills).split(",")
        if skill.strip()
    }


# ==========================================
# HELPER: GET JOB SKILLS
# ==========================================

def get_job_skills(job):

    return skills_to_set(
        job.skills
    )


# ==========================================
# HELPER: EXTRACT SALARY NUMBERS
# ==========================================

def extract_salary_numbers(salary):

    if not salary:
        return []

    numbers = re.findall(
        r"[\d,]+",
        str(salary)
    )

    return [

        int(
            number.replace(",", "")
        )

        for number in numbers

        if number.replace(
            ",",
            ""
        ).isdigit()

    ]


# ==========================================
# HELPER: EXPERIENCE YEARS
# ==========================================

def extract_experience_years(text):

    if not text:
        return []

    text = str(text).lower()

    matches = re.findall(

        r"(\d+(?:\.\d+)?)\s*"
        r"(?:\+?\s*)?"
        r"(?:years?|yrs?)",

        text

    )

    years = [

        float(match)

        for match in matches

    ]

    # Fallback if text doesn't contain
    # "years" or "yrs"

    if not years:

        number = re.search(
            r"(\d+(?:\.\d+)?)",
            text
        )

        if number:

            years.append(
                float(
                    number.group(1)
                )
            )

    return years


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

        CandidateProfile.user_id == user_id

    ).first()


    if not profile:

        raise HTTPException(

            status_code=404,

            detail="Candidate profile not found"

        )


    # ======================================
    # GET PRIMARY RESUME
    # ======================================

    resume = db.query(
        Resume
    ).filter(

        Resume.user_id == user_id,

        Resume.is_primary == True

    ).order_by(

        Resume.uploaded_at.desc()

    ).first()


    # ======================================
    # PROFILE SKILLS
    # ======================================

    profile_skills = skills_to_set(
        profile.skills
    )


    # ======================================
    # RESUME SKILLS
    # ======================================

    resume_skills = set()


    if resume:

        resume_skills = skills_to_set(

            resume.extracted_skills

        )


    # ======================================
    # COMBINE PROFILE + RESUME SKILLS
    # ======================================

    candidate_skills = (

        profile_skills
        |
        resume_skills

    )


    # ======================================
    # EXPERIENCE
    # ======================================

    profile_experience = (

        profile.experience
        or ""

    ).lower().strip()


    resume_experience = ""


    if resume:

        resume_experience = (

            resume.extracted_experience
            or ""

        ).lower().strip()


    candidate_experience = (

        f"{profile_experience} "
        f"{resume_experience}"

    ).strip()


    # ======================================
    # LOCATION
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
    # GET SWIPE HISTORY
    # ======================================

    swipe_history = db.query(
        JobSwipe
    ).filter(

        JobSwipe.user_id == user_id

    ).all()


    # ======================================
    # GET LIKED / REJECTED JOB IDS
    # ======================================

    liked_job_ids = {

        swipe.job_id

        for swipe in swipe_history

        if swipe.action == "like"

    }


    rejected_job_ids = {

        swipe.job_id

        for swipe in swipe_history

        if swipe.action == "reject"

    }


    # ======================================
    # BUILD PREFERRED SKILLS
    # FROM LIKED JOBS
    # ======================================

    liked_job_skills = set()


    if liked_job_ids:

        liked_jobs = db.query(
            Job
        ).filter(

            Job.job_id.in_(
                liked_job_ids
            )

        ).all()


        for liked_job in liked_jobs:

            liked_job_skills.update(

                get_job_skills(
                    liked_job
                )

            )


    # ======================================
    # BUILD AVOIDED SKILLS
    # FROM REJECTED JOBS
    # ======================================

    rejected_job_skills = set()


    if rejected_job_ids:

        rejected_jobs = db.query(
            Job
        ).filter(

            Job.job_id.in_(
                rejected_job_ids
            )

        ).all()


        for rejected_job in rejected_jobs:

            rejected_job_skills.update(

                get_job_skills(
                    rejected_job
                )

            )


    # ======================================
    # GET ALREADY SWIPED JOBS
    # ======================================

    swiped_job_ids = {

        swipe.job_id

        for swipe in swipe_history

    }


    # ======================================
    # GET ACTIVE UNSWIPED JOBS
    # ======================================

    jobs_query = db.query(
        Job
    ).filter(

        Job.status == "active"

    )


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

        base_score = 0

        matched_skills = []


        # ==================================
        # JOB SKILLS
        # ==================================

        job_skills = get_job_skills(
            job
        )


        # ==================================
        # SKILL MATCH — 50%
        # ==================================

        if (

            candidate_skills

            and

            job_skills

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


            base_score += min(
                skill_score,
                50
            )


        # ==================================
        # EXPERIENCE MATCH — 20%
        # ==================================

        if (

            candidate_experience

            and

            job.experience_required

        ):

            job_experience = (

                str(
                    job.experience_required
                )

                .lower()
                .strip()

            )


            if (

                candidate_experience
                in job_experience

                or

                job_experience
                in candidate_experience

            ):

                base_score += 20

            else:

                candidate_years = (
                    extract_experience_years(
                        candidate_experience
                    )
                )

                job_years = (
                    extract_experience_years(
                        job_experience
                    )
                )


                if (

                    candidate_years

                    and

                    job_years

                ):

                    candidate_max_years = max(
                        candidate_years
                    )

                    required_years = max(
                        job_years
                    )


                    if (

                        candidate_max_years
                        >= required_years

                    ):

                        base_score += 20

                    elif (

                        abs(

                            candidate_max_years
                            -
                            required_years

                        ) <= 1

                    ):

                        base_score += 10


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

                base_score += 15


        # ==================================
        # SALARY MATCH — 15%
        # ==================================

        if (

            expected_salary

            and

            job.salary

        ):

            salary_numbers = (
                extract_salary_numbers(
                    job.salary
                )
            )


            if salary_numbers:

                maximum_salary = max(
                    salary_numbers
                )


                if (

                    maximum_salary
                    >= expected_salary

                ):

                    base_score += 15

                elif (

                    maximum_salary
                    >= expected_salary * 0.8

                ):

                    base_score += 8


        # ==================================
        # SWIPE PERSONALIZATION
        # ==================================

        personalization_score = 0


        # ----------------------------------
        # POSITIVE PREFERENCE
        # ----------------------------------

        liked_skill_matches = (

            job_skills.intersection(
                liked_job_skills
            )

        )


        if liked_skill_matches:

            # Maximum +10

            positive_ratio = (

                len(
                    liked_skill_matches
                )

                /

                max(
                    len(job_skills),
                    1
                )

            )


            personalization_score += min(

                positive_ratio * 10,

                10

            )


        # ----------------------------------
        # NEGATIVE PREFERENCE
        # ----------------------------------

        rejected_skill_matches = (

            job_skills.intersection(
                rejected_job_skills
            )

        )


        if rejected_skill_matches:

            # Maximum -5

            negative_ratio = (

                len(
                    rejected_skill_matches
                )

                /

                max(
                    len(job_skills),
                    1
                )

            )


            personalization_score -= min(

                negative_ratio * 5,

                5

            )


        # ==================================
        # FINAL SWIPEX SCORE
        # ==================================

        final_score = (

            base_score
            +
            personalization_score

        )


        # Keep score within a sensible range

        final_score = max(
            0,
            min(
                final_score,
                110
            )
        )


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
                    final_score,
                    2
                ),

            "base_match_score":
                round(
                    base_score,
                    2
                ),

            "personalization_score":
                round(
                    personalization_score,
                    2
                ),

            "matched_skills":
                matched_skills,

            "liked_preference_skills":
                sorted(
                    liked_skill_matches
                ),

            "rejected_preference_skills":
                sorted(
                    rejected_skill_matches
                ),

            "created_at":
                job.created_at

        })


    # ======================================
    # SORT BY FINAL SWIPEX SCORE
    # ======================================

    matched_jobs.sort(

        key=lambda job:
            job["match_score"],

        reverse=True

    )


    # ======================================
    # RETURN TOP 50
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