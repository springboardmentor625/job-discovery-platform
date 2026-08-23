SwipeX -- Job Discovery Platform

SwipeX is a candidate-focused job discovery platform designed to help
users find relevant jobs using their resume, candidate profile, ATS
analysis, job recommendations, and swipe-based interactions.

Project Workflow

Candidate Registration
        ↓
Candidate Login + JWT Authentication
        ↓
Candidate Profile
        ↓
Resume Upload
        ↓
PDF Resume Parsing
        ↓
Skill Extraction
        ↓
Active Job Listings
        ↓
ATS Analysis
        ↓
Job Recommendations
        ↓
Swipe LEFT / RIGHT / SAVE
        ↓
Swipe History

Current Features

1. Candidate Authentication

Candidate registration

Secure password hashing

Candidate login

JWT-based authentication

2. Candidate Profile

Candidates can maintain: - Headline - Summary - Location - Experience -
Education - Projects - Certifications - Preferred job type - Preferred
location

3. Resume Upload and Parsing

Resume upload is protected by JWT authentication.

The current implementation accepts PDF files only.

Maximum upload size is 5 MB.

PDF text is extracted using pypdf.

Skills are detected using the application's configured skill list.

Extracted skills are stored with the resume.

4. Job Discovery

The backend provides active job listings containing: - Company - Job
title - Description - Location - Employment type - Salary range -
Experience requirement - Required skills - Posted date

5. ATS Analysis

The current ATS implementation compares the candidate's extracted resume
skills with the selected job's required skills.

It provides: - ATS score - Match percentage - Matched skills - Missing
skills - Missing keywords - Suggestions

The current MVP uses the skill match percentage as the ATS score.

6. Job Recommendations

The current recommendation system uses a weighted rule-based matching
approach:

Factor                   Weight

Skill match                 70%
Preferred location          15%
Preferred job type          15%
Total              100%

Recommendations are ranked by the final recommendation score.

7. Swipe-Based Job Interaction

Candidates can interact with jobs using: - LEFT -- pass/reject the
job - RIGHT -- show interest/like the job - SAVE -- save the job

These interactions are stored in the swipe_history table.

Technology Stack

Backend

Python

Flask

Flask-SQLAlchemy

Flask-CORS

Flask-JWT-Extended

Werkzeug

pypdf

Database

PostgreSQL

Frontend

React

Vite

JavaScript

CSS

Development Tools

Git

GitHub

Visual Studio Code

Database

SwipeX currently uses 8 main tables:

users
candidate_profiles
resumes
companies
jobs
ats_reports
recommendations
swipe_history

The database schema and relationships are documented separately in
docs/Database_Schema.png.

Backend API

The main backend endpoints include:

POST /api/register
POST /api/login

POST /api/profile
GET  /api/profile

POST /api/resume

GET  /api/jobs

POST /api/ats/analyze/<job_id>

GET  /api/recommendations

POST /api/swipe
GET  /api/swipe-history

Additional utility endpoints:

GET /test-db
GET /

See docs/API_Documentation.md for request formats, authentication
requirements, and response details.

Project Structure

job-discovery-platform/
│
├── backend/
│   ├── app.py
│   ├── uploads/
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── Candidate_Workflow.pdf
│   ├── Database_Schema.png
│   ├── API_Documentation.md
│   └── README.md
│
├── .gitignore
├── LICENSE
└── README.md

Local Setup

1. Clone the repository

git clone <repository-url>
cd job-discovery-platform

2. Backend setup

Open a terminal in the backend directory:

cd backend
python -m venv venv

Activate the virtual environment on Windows PowerShell:

.env\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Configure the environment variables in .env:

DATABASE_URL=<your-postgresql-database-url>
JWT_SECRET_KEY=<your-jwt-secret>

Run the backend:

python app.py

The backend runs locally on:

http://localhost:5000

3. Frontend setup

Open another terminal:

cd frontend
npm install
npm run dev

The Vite development server runs on:

http://localhost:5173

Documentation

The docs/ directory contains the project documentation:

Candidate Workflow -- overall candidate workflow and system
flow.

Database Schema -- ER diagram showing the database tables,
columns, keys, and relationships.

API Documentation -- implemented backend REST APIs and their
usage.

Current Project Status

The current implementation provides the core candidate job-discovery
workflow:

Authentication
    ✓
Candidate Profile
    ✓
Resume Upload + Parsing
    ✓
Skill Extraction
    ✓
Job Discovery
    ✓
ATS Analysis
    ✓
Rule-Based Recommendations
    ✓
Swipe Actions
    ✓
Swipe History
    ✓

Future Enhancement

The current implementation provides a functional baseline for ATS
analysis and job recommendations.

A future enhancement can introduce an AI/ML personalization model
trained from candidate swipe history. This would allow the platform to
learn from actual candidate interactions and improve future job
recommendations.

The AI/ML personalization stage is considered a future enhancement and
is not represented as an already-trained model in the current
implementation.
