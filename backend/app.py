from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import json
import re
import joblib


from tfidf_model import load_tfidf
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from skill_extractor import extract_skills_from_section

from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)

# ============================================================
# ML MODEL
# ============================================================

MODEL_PATH = "/app/model/trained_model.pkl"

ml_model = None

if os.path.exists(MODEL_PATH):
    ml_model = joblib.load(MODEL_PATH)
    print("ML: Trained model loaded")
else:
    print("ML: No trained model found")

# ============================================================
# TF-IDF MODEL
# ============================================================

tfidf_data = load_tfidf()

if tfidf_data:
    tfidf_vectorizer, tfidf_job_vectors, tfidf_job_ids = tfidf_data
    tfidf_job_index = {
        job_id: index
        for index, job_id in enumerate(tfidf_job_ids)
    }

    print(
        f"TF-IDF: Loaded {len(tfidf_job_ids)} job vectors"
    )

else:
    tfidf_vectorizer = None
    tfidf_job_vectors = None
    tfidf_job_ids = None
    tfidf_job_index = {}

    print("TF-IDF: No trained model found")


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)


# ============================================================
# JWT CONFIGURATION
# ============================================================

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

jwt = JWTManager(app)


# ============================================================
# CORS
# ============================================================

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "http://localhost:5173"
        }
    }
)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ============================================================
# RESUME UPLOAD CONFIGURATION
# ============================================================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Maximum resume size = 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(
            ".",
            1
        )[1].lower() in ALLOWED_EXTENSIONS
    )


# ============================================================
# BASIC SKILL LIST
# ============================================================

SKILLS = [

    "Python",
    "Java",
    "C++",
    "C",
    "JavaScript",
    "React",
    "Node.js",
    "Flask",
    "Django",
    "REST APIs",

    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",

    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "NLP",
    "Data Science",

    "Pandas",
    "NumPy",
    "PyTorch",
    "TensorFlow",

    "AWS",
    "Azure",
    "Docker",

    "Git",
    "GitHub",
    "Linux",

    "HTML",
    "CSS",

    "Power BI",
    "Tableau",

    "Spark",
    "PySpark"
]


# ============================================================
# PDF SKILL EXTRACTION
# ============================================================

def extract_skills_from_pdf(file_path):
    """
    Extract text from the uploaded PDF and then
    extract skills specifically from the Skills section.
    """

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return extract_skills_from_section(text)


# ============================================================
# USER MODEL
# ============================================================

class User(db.Model):

    __tablename__ = "users"

    user_id = db.Column(
        db.Integer,
        primary_key=True
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.Text,
        nullable=False
    )

    role = db.Column(
        db.String(20),
        default="CANDIDATE"
    )

    phone = db.Column(
        db.String(20)
    )

    profile_picture = db.Column(
        db.Text
    )

    is_verified = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ============================================================
# CANDIDATE PROFILE MODEL
# ============================================================

class CandidateProfile(db.Model):

    __tablename__ = "candidate_profiles"

    profile_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        unique=True,
        nullable=False
    )

    headline = db.Column(
        db.String(255)
    )

    summary = db.Column(
        db.Text
    )

    location = db.Column(
        db.String(255)
    )

    experience_years = db.Column(
        db.Integer
    )

    education = db.Column(
        db.Text
    )

    projects = db.Column(
        db.Text
    )

    certifications = db.Column(
        db.Text
    )

    preferred_job_type = db.Column(
        db.String(100)
    )

    preferred_location = db.Column(
        db.String(255)
    )


# ============================================================
# RESUME MODEL
# ============================================================

class Resume(db.Model):

    __tablename__ = "resumes"

    resume_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        nullable=False
    )

    resume_name = db.Column(
        db.String(255),
        nullable=False
    )

    file_path = db.Column(
        db.Text,
        nullable=False
    )

    extracted_skills = db.Column(
        db.Text
    )

    uploaded_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    is_default = db.Column(
        db.Boolean,
        default=False
    )


# ============================================================
# COMPANY MODEL
# ============================================================

class Company(db.Model):

    __tablename__ = "companies"

    company_id = db.Column(
        db.Integer,
        primary_key=True
    )

    company_name = db.Column(
        db.String(255),
        nullable=False
    )

    company_type = db.Column(
        db.String(100)
    )

    industry = db.Column(
        db.String(100)
    )

    website = db.Column(
        db.String(255)
    )

    headquarters = db.Column(
        db.String(255)
    )


# ============================================================
# JOB MODEL
# ============================================================

class Job(db.Model):

    __tablename__ = "jobs"

    job_id = db.Column(
        db.Integer,
        primary_key=True
    )

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.company_id"),
        nullable=False
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    location = db.Column(
        db.String(255)
    )

    employment_type = db.Column(
        db.String(100)
    )

    salary_min = db.Column(
        db.Integer
    )

    salary_max = db.Column(
        db.Integer
    )

    experience_required = db.Column(
        db.String(100)
    )

    required_skills = db.Column(
        db.Text
    )

    posted_date = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    status = db.Column(
        db.String(50),
        default="ACTIVE"
    )
# ============================================================
# ATS REPORT MODEL
# ============================================================

class ATSReport(db.Model):

    __tablename__ = "ats_reports"

    ats_report_id = db.Column(
        db.Integer,
        primary_key=True
    )

    resume_id = db.Column(
        db.Integer,
        db.ForeignKey("resumes.resume_id"),
        nullable=False
    )

    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.job_id"),
        nullable=False
    )

    ats_score = db.Column(
        db.Float
    )

    match_percentage = db.Column(
        db.Float
    )

    missing_skills = db.Column(
        db.Text
    )

    missing_keywords = db.Column(
        db.Text
    )

    suggestions = db.Column(
        db.Text
    )

    analyzed_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )
# ============================================================
# RECOMMENDATION MODEL
# ============================================================

class Recommendation(db.Model):

    __tablename__ = "recommendations"

    recommendation_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        nullable=False
    )

    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.job_id"),
        nullable=False
    )

    recommendation_score = db.Column(
        db.Float
    )

    recommendation_reason = db.Column(
        db.Text
    )

    generated_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )
# ============================================================
# SWIPE HISTORY MODEL
# ============================================================

class SwipeHistory(db.Model):

    __tablename__ = "swipe_history"

    swipe_id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        nullable=False
    )

    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.job_id"),
        nullable=False
    )

    swipe_action = db.Column(
        db.String(10),
        nullable=False
    )

    swiped_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return "SwipeX Backend is running!"


# ============================================================
# TEST DATABASE
# ============================================================

@app.route("/test-db")
def test_db():

    try:

        db.session.execute(
            db.text("SELECT 1")
        )

        return "PostgreSQL connection successful!"

    except Exception as e:

        return f"Database connection failed: {e}"


# ============================================================
# REGISTER
# ============================================================

@app.route(
    "/api/register",
    methods=["POST"]
)
def register():

    data = request.get_json()

    full_name = data.get(
        "full_name"
    )

    email = data.get(
        "email"
    )

    password = data.get(
        "password"
    )

    if not full_name or not email or not password:

        return jsonify({
            "message":
                "Full name, email and password are required"
        }), 400

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:

        return jsonify({
            "message":
                "Email already registered"
        }), 409

    password_hash = generate_password_hash(
        password
    )

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash
    )

    db.session.add(
        new_user
    )

    db.session.commit()

    return jsonify({
        "message":
            "Registration successful",
        "user_id":
            new_user.user_id
    }), 201


# ============================================================
# LOGIN
# ============================================================

@app.route(
    "/api/login",
    methods=["POST"]
)
def login():

    data = request.get_json()

    email = data.get(
        "email"
    )

    password = data.get(
        "password"
    )

    if not email or not password:

        return jsonify({
            "message":
                "Email and password are required"
        }), 400

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return jsonify({
            "message":
                "Invalid email or password"
        }), 401

    if not check_password_hash(
        user.password_hash,
        password
    ):

        return jsonify({
            "message":
                "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(
            user.user_id
        )
    )

    return jsonify({

        "message":
            "Login successful",

        "access_token":
            access_token,

        "user_id":
            user.user_id,

        "full_name":
            user.full_name,

        "email":
            user.email

    }), 200


# ============================================================
# CREATE CANDIDATE PROFILE
# ============================================================

@app.route(
    "/api/profile",
    methods=["POST"]
)
@jwt_required()
def create_profile():

    user_id = get_jwt_identity()

    data = request.get_json()

    headline = data.get(
        "headline"
    )

    summary = data.get(
        "summary"
    )

    location = data.get(
        "location"
    )

    experience_years = data.get(
        "experience_years"
    )

    education = data.get(
        "education"
    )

    projects = data.get(
        "projects"
    )

    certifications = data.get(
        "certifications"
    )

    preferred_job_type = data.get(
        "preferred_job_type"
    )

    preferred_location = data.get(
        "preferred_location"
    )

    existing_profile = CandidateProfile.query.filter_by(
        user_id=user_id
    ).first()

    if existing_profile:

        return jsonify({
            "message":
                "Candidate profile already exists"
        }), 409

    profile = CandidateProfile(

        user_id=user_id,

        headline=headline,

        summary=summary,

        location=location,

        experience_years=experience_years,

        education=education,

        projects=projects,

        certifications=certifications,

        preferred_job_type=preferred_job_type,

        preferred_location=preferred_location
    )

    db.session.add(
        profile
    )

    db.session.commit()

    return jsonify({

        "message":
            "Candidate profile created successfully",

        "profile_id":
            profile.profile_id,

        "user_id":
            user_id

    }), 201


# ============================================================
# GET EXISTING CANDIDATE PROFILE
# ============================================================

@app.route(
    "/api/profile",
    methods=["GET"]
)
@jwt_required()
def get_profile():

    user_id = get_jwt_identity()

    profile = CandidateProfile.query.filter_by(
        user_id=user_id
    ).first()

    if not profile:

        return jsonify({
            "profile_exists":
                False
        }), 200

    return jsonify({

        "profile_exists":
            True,

        "profile": {

            "profile_id":
                profile.profile_id,

            "user_id":
                profile.user_id,

            "headline":
                profile.headline,

            "summary":
                profile.summary,

            "location":
                profile.location,

            "experience_years":
                profile.experience_years,

            "education":
                profile.education,

            "projects":
                profile.projects,

            "certifications":
                profile.certifications,

            "preferred_job_type":
                profile.preferred_job_type,

            "preferred_location":
                profile.preferred_location
        }

    }), 200


# ============================================================
# UPLOAD + PARSE RESUME
# ============================================================

@app.route(
    "/api/resume",
    methods=["POST"]
)
@jwt_required()
def upload_resume():

    user_id = get_jwt_identity()

    if "resume" not in request.files:

        return jsonify({
            "message":
                "Resume file is required"
        }), 400

    file = request.files["resume"]

    if file.filename == "":

        return jsonify({
            "message":
                "No resume selected"
        }), 400

    if not allowed_file(
        file.filename
    ):

        return jsonify({
            "message":
                "Only PDF resumes are allowed"
        }), 400

    filename = secure_filename(
        file.filename
    )

    filename = (
        f"{user_id}_{filename}"
    )

    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )

    file.save(
        file_path
    )

    try:

        extracted_skills = (
            extract_skills_from_pdf(
                file_path
            )
        )
        print(
    "[DEBUG] API EXTRACTED SKILLS:",
    extracted_skills
)

    except Exception as e:

        if os.path.exists(
            file_path
        ):

            os.remove(
                file_path
            )

        return jsonify({
            "message":
                f"Could not parse resume: {str(e)}"
        }), 400

    existing_resume = Resume.query.filter_by(
        user_id=user_id
    ).first()

    is_default = (
        existing_resume is None
    )

    resume = Resume(

        user_id=user_id,

        resume_name=file.filename,

        file_path=file_path,

        extracted_skills=json.dumps(
            extracted_skills
        ),

        is_default=is_default
    )

    db.session.add(
        resume
    )

    db.session.commit()

    return jsonify({

        "message":
            "Resume uploaded and parsed successfully",

        "resume_id":
            resume.resume_id,

        "resume_name":
            resume.resume_name,

        "user_id":
            user_id,

        "extracted_skills":
            extracted_skills

    }), 201


# ============================================================
# SEED DEMO COMPANIES AND JOBS
# ============================================================

def seed_demo_jobs():

    # Don't create duplicates
    if Company.query.count() > 0:
        return

    companies = [

        Company(
            company_name="TechNova Solutions",
            company_type="Private",
            industry="Software",
            website="https://example.com",
            headquarters="Bangalore"
        ),

        Company(
            company_name="DataSphere Analytics",
            company_type="Private",
            industry="Data Analytics",
            website="https://example.com",
            headquarters="Hyderabad"
        ),

        Company(
            company_name="CloudCore Technologies",
            company_type="Private",
            industry="Cloud Computing",
            website="https://example.com",
            headquarters="Bangalore"
        ),

        Company(
            company_name="AIWorks Labs",
            company_type="Startup",
            industry="Artificial Intelligence",
            website="https://example.com",
            headquarters="Pune"
        )
    ]

    db.session.add_all(
        companies
    )

    db.session.commit()

    jobs = [

        Job(
            company_id=companies[0].company_id,

            title="Backend Developer",

            description=(
                "Develop and maintain backend applications "
                "and REST APIs using Python. Work with "
                "databases and cloud technologies."
            ),

            location="Bangalore",

            employment_type="Full-time",

            salary_min=500000,

            salary_max=900000,

            experience_required="0-2 years",

            required_skills=json.dumps([
                "Python",
                "Flask",
                "REST APIs",
                "PostgreSQL",
                "Docker",
                "AWS",
                "Git"
            ]),

            status="ACTIVE"
        ),

        Job(
            company_id=companies[1].company_id,

            title="Data Analyst",

            description=(
                "Analyze business data and create dashboards "
                "and reports using Python and SQL."
            ),

            location="Hyderabad",

            employment_type="Full-time",

            salary_min=400000,

            salary_max=700000,

            experience_required="0-2 years",

            required_skills=json.dumps([
                "Python",
                "SQL",
                "Pandas",
                "Power BI",
                "Data Science"
            ]),

            status="ACTIVE"
        ),

        Job(
            company_id=companies[2].company_id,

            title="Cloud Engineer",

            description=(
                "Build and deploy cloud-based applications "
                "using AWS, Docker and Linux."
            ),

            location="Bangalore",

            employment_type="Full-time",

            salary_min=600000,

            salary_max=1000000,

            experience_required="1-3 years",

            required_skills=json.dumps([
                "AWS",
                "Docker",
                "Linux",
                "Python",
                "Git"
            ]),

            status="ACTIVE"
        ),

        Job(
            company_id=companies[3].company_id,

            title="Machine Learning Engineer",

            description=(
                "Develop machine learning solutions using "
                "Python and modern AI frameworks."
            ),

            location="Pune",

            employment_type="Full-time",

            salary_min=600000,

            salary_max=1100000,

            experience_required="0-2 years",

            required_skills=json.dumps([
                "Python",
                "Machine Learning",
                "Pandas",
                "NumPy",
                "TensorFlow"
            ]),

            status="ACTIVE"
        )
    ]

    db.session.add_all(
        jobs
    )

    db.session.commit()

    print(
        "Demo companies and jobs created."
    )


# ============================================================
# GET JOBS FOR CANDIDATE
# ============================================================

@app.route(
    "/api/jobs",
    methods=["GET"]
)
@jwt_required()
def get_jobs():

    # Location filter
    location = request.args.get("location", "").strip()

    # Pagination
    try:
        page = max(int(request.args.get("page", 1)), 1)
        limit = min(
            max(int(request.args.get("limit", 20)), 1),
            50
        )
    except (TypeError, ValueError):
        page = 1
        limit = 20

    # Get only the requested page of active jobs
    query = Job.query.filter(
        db.func.lower(Job.status) == "active"
    )

    if location:

     query = query.filter(
        Job.location.ilike(f"%{location}%")
    )

    total_jobs = query.count()

    jobs = (
        query
        .order_by(Job.job_id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    result = []

    for job in jobs:

        company = Company.query.filter_by(
            company_id=job.company_id
        ).first()

        try:
            required_skills = (
                json.loads(job.required_skills)
                if job.required_skills
                else []
            )
        except Exception:
            required_skills = []

        result.append({

            "job_id":
                job.job_id,

            "company_id":
                job.company_id,

            "company_name":
                company.company_name
                if company else None,

            "title":
                job.title,

            "description":
                job.description,

            "location":
                job.location,

            "employment_type":
                job.employment_type,

            "salary_min":
                job.salary_min,

            "salary_max":
                job.salary_max,

            "experience_required":
                job.experience_required,

            "required_skills":
                required_skills,

            "posted_date":
                job.posted_date.isoformat()
                if job.posted_date
                else None
        })

    return jsonify({
        "jobs": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_jobs": total_jobs,
            "total_pages": (
                (total_jobs + limit - 1) // limit
            )
        }
    }), 200
# ============================================================
# ATS ANALYSIS
# ============================================================

@app.route(
    "/api/ats/analyze/<int:job_id>",
    methods=["POST"]
)
@jwt_required()
def analyze_ats(job_id):

    user_id = get_jwt_identity()

    # --------------------------------------------------------
    # Get selected job
    # --------------------------------------------------------

    job = Job.query.filter(
    Job.job_id == job_id,
    db.func.lower(Job.status) == "active"
).first()

    if not job:

        return jsonify({
            "message": "Job not found"
        }), 404

    # --------------------------------------------------------
    # Get candidate's default resume
    # --------------------------------------------------------

    resume = Resume.query.filter_by(
        user_id=user_id,
        is_default=True
    ).first()

    if not resume:

        resume = Resume.query.filter_by(
            user_id=user_id
        ).order_by(
            Resume.uploaded_at.desc()
        ).first()

    if not resume:

        return jsonify({
            "message":
                "Please upload a resume before ATS analysis"
        }), 400

    # --------------------------------------------------------
    # Get resume skills
    # --------------------------------------------------------

    try:

        resume_skills = json.loads(
            resume.extracted_skills
        ) if resume.extracted_skills else []

    except Exception:

        resume_skills = []

    # --------------------------------------------------------
    # Get job required skills
    # --------------------------------------------------------

    try:

        required_skills = json.loads(
            job.required_skills
        ) if job.required_skills else []

    except Exception:

        required_skills = []

    # --------------------------------------------------------
    # Normalize skills for comparison
    # --------------------------------------------------------

    resume_skill_map = {
        skill.strip().lower(): skill
        for skill in resume_skills
    }

    required_skill_map = {
        skill.strip().lower(): skill
        for skill in required_skills
    }

    # --------------------------------------------------------
    # Find matched and missing skills
    # --------------------------------------------------------

    matched_skills = []

    missing_skills = []

    for skill_key, original_skill in required_skill_map.items():

        if skill_key in resume_skill_map:

            matched_skills.append(
                original_skill
            )

        else:

            missing_skills.append(
                original_skill
            )

    # --------------------------------------------------------
    # Calculate match percentage
    # --------------------------------------------------------

    if len(required_skills) > 0:

        match_percentage = (
            len(matched_skills)
            / len(required_skills)
        ) * 100

    else:

        match_percentage = 0

    # Round to 2 decimal places

    match_percentage = round(
        match_percentage,
        2
    )

    # For our basic MVP, ATS score = match percentage

    ats_score = match_percentage

    # --------------------------------------------------------
    # Suggestions
    # --------------------------------------------------------

    if not missing_skills:

        suggestions = (
            "Your resume matches all required "
            "skills for this job."
        )

    else:

        suggestions = (
            "Consider adding or highlighting "
            "the missing skills in your resume: "
            + ", ".join(missing_skills)
        )

    # --------------------------------------------------------
    # Save ATS report
    # --------------------------------------------------------

    report = ATSReport(

        resume_id=resume.resume_id,

        job_id=job.job_id,

        ats_score=ats_score,

        match_percentage=match_percentage,

        missing_skills=json.dumps(
            missing_skills
        ),

        missing_keywords=json.dumps(
            missing_skills
        ),

        suggestions=suggestions
    )

    db.session.add(
        report
    )

    db.session.commit()

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return jsonify({

        "message":
            "ATS analysis completed",

        "ats_report_id":
            report.ats_report_id,

        "job_id":
            job.job_id,

        "resume_id":
            resume.resume_id,

        "ats_score":
            ats_score,

        "match_percentage":
            match_percentage,

        "matched_skills":
            matched_skills,

        "missing_skills":
            missing_skills,

        "suggestions":
            suggestions

    }), 201

# ============================================================
# JOB RECOMMENDATIONS
# ============================================================
@app.route(
    "/api/recommendations",
    methods=["GET"]
)
@jwt_required()
def get_recommendations():

    user_id = get_jwt_identity()

    # ----------------------------------------------------
    # GET CANDIDATE PROFILE
    # ----------------------------------------------------

    profile = CandidateProfile.query.filter_by(
        user_id=user_id
    ).first()

    if not profile:
        return jsonify({
            "message": "Please complete your profile first"
        }), 400

    # ----------------------------------------------------
    # GET CANDIDATE RESUME
    # ----------------------------------------------------

    resume = Resume.query.filter_by(
        user_id=user_id,
        is_default=True
    ).first()

    if not resume:
        resume = Resume.query.filter_by(
            user_id=user_id
        ).order_by(
            Resume.uploaded_at.desc()
        ).first()

    if not resume:
        return jsonify({
            "message": "Please upload a resume first"
        }), 400

    # ----------------------------------------------------
    # GET RESUME SKILLS
    # ----------------------------------------------------

    try:
        resume_skills = json.loads(
            resume.extracted_skills
        ) if resume.extracted_skills else []
    except Exception:
        resume_skills = []

    resume_skill_set = {
        skill.strip().lower()
        for skill in resume_skills
        if skill
    }
    # ----------------------------------------------------
    # TF-IDF CANDIDATE VECTOR
    # ----------------------------------------------------

    candidate_tfidf_vector = None

    if tfidf_vectorizer is not None:

     candidate_text = " ".join(
        str(skill)
        for skill in resume_skills
    )

    candidate_tfidf_vector = (
        tfidf_vectorizer.transform(
            [candidate_text]
        )
    )

    print(
        "[TF-IDF] Candidate vector created",
        flush=True
    )

    # ----------------------------------------------------
    # CANDIDATE PREFERENCES
    # ----------------------------------------------------

    preferred_location = (
        profile.preferred_location or ""
    ).strip().lower()

    preferred_job_type = (
        profile.preferred_job_type or ""
    ).strip().lower()

    # ----------------------------------------------------
    # GET JOBS
    # ----------------------------------------------------

    jobs = Job.query.all()

    # ----------------------------------------------------
    # CHECK SWIPE HISTORY
    # ----------------------------------------------------

    swipe_count = SwipeHistory.query.filter_by(
        user_id=user_id
    ).count()

    print(
        "SWIPE HISTORY:",
        swipe_count,
        flush=True
    )

    # ----------------------------------------------------
    # ML DECISION
    #
    # 0-4 swipes:
    #     Rule based
    #
    # 5+ swipes:
    #     ML model
    # ----------------------------------------------------

    use_ml = (
        swipe_count >= 11
        and ml_model is not None
    )

    if use_ml:
        print(
            "RECOMMENDATION MODE: ML",
            flush=True
        )
    else:
        print(
            "RECOMMENDATION MODE: RULE-BASED",
            flush=True
        )
        # ----------------------------------------------------
    # TF-IDF SCORES
    # ----------------------------------------------------

    tfidf_scores = {}

    if (
        use_ml
        and candidate_tfidf_vector is not None
        and tfidf_job_vectors is not None
    ):

        all_tfidf_scores = (
            candidate_tfidf_vector
            @ tfidf_job_vectors.T
        ).toarray()[0] * 100

        tfidf_scores = {
            job_id: float(score)
            for job_id, score
            in zip(
                tfidf_job_ids,
                all_tfidf_scores
            )
        }
                # Show only top 10 TF-IDF jobs for debugging
        top_tfidf = sorted(
            tfidf_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        print(
            "[TF-IDF TOP 10]",
            flush=True
        )

        for job_id, score in top_tfidf:

            print(
                job_id,
                "|",
                round(score, 2),
                flush=True
            )
        print(
            "[TF-IDF] Calculated scores for",
            len(tfidf_scores),
            "jobs",
            flush=True
        )

    scored_jobs = []
    ml_features = []
    ml_items = []
    # ----------------------------------------------------
    # REMOVE ALREADY SWIPED JOBS
    # ----------------------------------------------------

    swiped_job_ids = {
        swipe.job_id
        for swipe in SwipeHistory.query.filter_by(
            user_id=user_id
        ).all()
    }

    for job in jobs:

        if job.job_id in swiped_job_ids:
            continue

        # REQUIRED SKILLS
        # -----------------------------------------------

        try:
            required_skills = json.loads(
                job.required_skills
            ) if job.required_skills else []

        except Exception:
            required_skills = []

        required_skill_set = {
            skill.strip().lower()
            for skill in required_skills
            if skill
        }

        # -----------------------------------------------
        # SKILL MATCH
        # -----------------------------------------------

        matched_skills = (
            resume_skill_set
            & required_skill_set
        )

        if required_skill_set:

            skill_match = (
                len(matched_skills)
                / len(required_skill_set)
            ) * 100

        else:

            skill_match = 0
        

        # -----------------------------------------------
        # TF-IDF SCORE
        # -----------------------------------------------

        tfidf_score = tfidf_scores.get(
            job.job_id,
            0.0
        )

                

    

       # -----------------------------------------------
        # LOCATION MATCH
        # -----------------------------------------------

        location_match = 0

        job_location = (
            job.location or ""
        ).strip().lower()

        if preferred_location:

            if (
                preferred_location in job_location
                or job_location in preferred_location
            ):
                location_match = 100

        # -----------------------------------------------
        # JOB TYPE MATCH
        # -----------------------------------------------

        job_type_match = 0

        employment_type = (
            job.employment_type or ""
        ).strip().lower()

        if (
            preferred_job_type
            and preferred_job_type == employment_type
        ):
            job_type_match = 100

        # -----------------------------------------------
        # FINAL RECOMMENDATION SCORE
        # -----------------------------------------------

        if use_ml:

            ml_features.append([
                skill_match,
                location_match,
            ])

            ml_items.append({
                "job": job,
                "required_skills": required_skills,
                "matched_skills": matched_skills
            })

        else:

            # -------------------------------------------
            # RULE-BASED MODEL
            #
            # Skills      = 70%
            # Location    = 15%
            # Job Type    = 15%
            # -------------------------------------------

            skill_score = skill_match * 0.70

            location_score = location_match * 0.15

            job_type_score = job_type_match * 0.15

            recommendation_score = float(
                round(
                    skill_score
                    + location_score
                    + job_type_score,
                    2
                )
            )

            scored_jobs.append({

                "job": job,

                "required_skills":
                    required_skills,

                "matched_skills":
                    matched_skills,

                "recommendation_score":
                    recommendation_score
            })
    # ----------------------------------------------------
    # BATCH ML PREDICTION + HYBRID SCORE
    # ----------------------------------------------------

    if use_ml:
     print("[DEBUG] ML FEATURES SAMPLE:", ml_features[:10])

    ml_scores = (
        ml_model.predict_proba(
            ml_features
        )[:, 1] * 100
    )

    print(
        "[DEBUG] ML SCORES SAMPLE:",
        ml_scores[:20].round(2).tolist(),
        flush=True
    )

    for item, ml_score in zip(
        ml_items,
        ml_scores
    ):

        tfidf_score = tfidf_scores.get(
            item["job"].job_id,
            0.0
        )

        # ------------------------------------------------
        # HYBRID SCORE
        # 50% ML + 50% TF-IDF
        # ------------------------------------------------

        hybrid_score = (
            (ml_score * 0.50) +
            (tfidf_score * 0.50)
        )

        scored_jobs.append({

            "job":
                item["job"],

            "required_skills":
                item["required_skills"],

            "matched_skills":
                item["matched_skills"],

            "recommendation_score":
                float(
                    round(
                        hybrid_score,
                        2
                    )
                )
        })

    print(
        "JOBS SCORED:",
        len(scored_jobs),
        flush=True
    )

    # ----------------------------------------------------
    # SORT HIGHEST SCORE FIRST
    # ----------------------------------------------------

    scored_jobs.sort(
        key=lambda x: x["recommendation_score"],
        reverse=True
    )
    print(
    "[DEBUG] TOP 10 JOBS:",
    [
        {
            "title": item["job"].title,
            "score": item["recommendation_score"],
            "matched_skills": item["matched_skills"]
        }
        for item in scored_jobs[:10]
    ],
    flush=True
)

    # ----------------------------------------------------
    # TAKE ONLY TOP 50 JOBS
    # ----------------------------------------------------

    top_jobs = scored_jobs[:50]

    print(
        "TOP JOBS SELECTED:",
        len(top_jobs),
        flush=True
    )

    # ----------------------------------------------------
    # LOAD COMPANIES IN ONE QUERY
    # ----------------------------------------------------

    company_ids = {
        item["job"].company_id
        for item in top_jobs
        if item["job"].company_id
    }

    companies = Company.query.filter(
        Company.company_id.in_(company_ids)
    ).all()

    company_map = {
        company.company_id: company
        for company in companies
    }

    recommendations = []

    # ----------------------------------------------------
    # CREATE / UPDATE RECOMMENDATIONS
    # ----------------------------------------------------

    for item in top_jobs:

        job = item["job"]

        required_skills = item[
            "required_skills"
        ]

        matched_skills = item[
            "matched_skills"
        ]

        recommendation_score = item[
            "recommendation_score"
        ]

        # -----------------------------------------------
        # RECOMMENDATION REASON
        # -----------------------------------------------

        reasons = []

        if matched_skills:

            reasons.append(
                f"{len(matched_skills)} matching skills"
            )

        job_location = (
            job.location or ""
        ).strip().lower()

        if (
            preferred_location
            and (
                preferred_location in job_location
                or job_location in preferred_location
            )
        ):

            reasons.append(
                "preferred location matches"
            )

        employment_type = (
            job.employment_type or ""
        ).strip().lower()

        if (
            preferred_job_type
            and preferred_job_type == employment_type
        ):

            reasons.append(
                "preferred job type matches"
            )

        if reasons:

            recommendation_reason = (
                "Recommended because "
                + ", ".join(reasons)
                + "."
            )

        else:

            recommendation_reason = (
                "This job has some similarity "
                "with your profile."
            )

        # -----------------------------------------------
        # FIND EXISTING RECOMMENDATION
        # -----------------------------------------------

        recommendation = Recommendation.query.filter_by(
            user_id=user_id,
            job_id=job.job_id
        ).first()

        if recommendation:

            recommendation.recommendation_score = (
                recommendation_score
            )

            recommendation.recommendation_reason = (
                recommendation_reason
            )

        else:

            recommendation = Recommendation(

                user_id=user_id,

                job_id=job.job_id,

                recommendation_score=(
                    recommendation_score
                ),

                recommendation_reason=(
                    recommendation_reason
                )
            )

            db.session.add(
                recommendation
            )

        # Make sure ID is generated
        db.session.flush()

        # -----------------------------------------------
        # GET COMPANY
        # -----------------------------------------------

        company = company_map.get(
            job.company_id
        )

        recommendations.append({

            "recommendation_id":
                recommendation.recommendation_id,

            "job_id":
                job.job_id,

            "company_name":
                company.company_name
                if company
                else None,

            "title":
                job.title,

            "description":
                job.description,

            "location":
                job.location,

            "employment_type":
                job.employment_type,

            "salary_min":
                job.salary_min,

            "salary_max":
                job.salary_max,

            "experience_required":
                job.experience_required,

            "required_skills":
                required_skills,

            "recommendation_score":
                recommendation_score,

            "recommendation_reason":
                recommendation_reason
        })

    # ----------------------------------------------------
    # SAVE
    # ----------------------------------------------------

    db.session.commit()

    print(
        "TOTAL RECOMMENDATIONS RETURNED:",
        len(recommendations),
        flush=True
    )

    # ----------------------------------------------------
    # FINAL SORT
    # ----------------------------------------------------

    recommendations.sort(
        key=lambda x: x["recommendation_score"],
        reverse=True
    )

    return jsonify({
        "recommendations": recommendations
    }), 200
# ============================================================
# RECORD SWIPE
# ============================================================

@app.route(
    "/api/swipe",
    methods=["POST"]
)
@jwt_required()
def swipe_job():

    user_id = get_jwt_identity()

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    job_id = data.get("job_id")
    swipe_action = data.get("swipe_action")

    if not job_id:
        return jsonify({
            "message": "job_id is required"
        }), 400

    if swipe_action not in ["LEFT", "RIGHT", "SAVE"]:
        return jsonify({
            "message":
                "swipe_action must be LEFT, RIGHT, or SAVE"
        }), 400

    job = Job.query.filter(
    Job.job_id == job_id,
    db.func.lower(Job.status) == "active"
).first()

    if not job:
        return jsonify({
            "message": "Job not found"
        }), 404

    swipe = SwipeHistory(
        user_id=user_id,
        job_id=job_id,
        swipe_action=swipe_action
    )

    db.session.add(swipe)
    db.session.commit()

    return jsonify({
        "message": "Swipe recorded successfully",
        "swipe_id": swipe.swipe_id,
        "job_id": job_id,
        "swipe_action": swipe_action
    }), 201


# ============================================================
# GET SWIPE HISTORY
# ============================================================

@app.route(
    "/api/swipe-history",
    methods=["GET"]
)
@jwt_required()
def get_swipe_history():

    user_id = get_jwt_identity()

    swipe_records = SwipeHistory.query.filter_by(
        user_id=user_id
    ).order_by(
        SwipeHistory.swiped_at.desc()
    ).all()

    history = []

    for swipe in swipe_records:

        job = Job.query.filter_by(
            job_id=swipe.job_id
        ).first()

        company = None

        if job:
            company = Company.query.filter_by(
                company_id=job.company_id
            ).first()

        history.append({
            "swipe_id": swipe.swipe_id,
            "job_id": swipe.job_id,
            "title": job.title if job else None,
            "company_name":
                company.company_name if company else None,
            "swipe_action": swipe.swipe_action,
            "swiped_at":
                swipe.swiped_at.isoformat()
                if swipe.swiped_at else None
        })

    return jsonify({
        "swipe_history": history
    }), 200


# ============================================================
# DELETE SWIPE HISTORY
# ============================================================

@app.route(
    "/api/swipe-history/<int:swipe_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_swipe_history(swipe_id):

    user_id = get_jwt_identity()

    swipe = SwipeHistory.query.filter_by(
        swipe_id=swipe_id,
        user_id=user_id
    ).first()

    if not swipe:
        return jsonify({
            "message": "Swipe history record not found"
        }), 404

    db.session.delete(swipe)
    db.session.commit()

    return jsonify({
        "message": "Swipe history deleted successfully",
        "swipe_id": swipe_id
    }), 200

# ============================================================
# CREATE DATABASE TABLES + SEED JOBS
# ============================================================

with app.app_context():

    db.create_all()

    seed_demo_jobs()


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )