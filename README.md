SwipeX -- Job Discovery Platform

SwipeX is a candidate-focused job discovery platform that helps
candidates discover relevant job opportunities using their profile,
resume, ATS analysis, job recommendations, and swipe-based interactions.

The project is organized into a React/Vite frontend and a
Flask/PostgreSQL backend.

1. Project Overview

The current candidate workflow is:

Register
   ↓
Login + JWT Authentication
   ↓
Candidate Profile
   ↓
Upload Resume (PDF)
   ↓
Resume Parsing + Skill Extraction
   ↓
View Active Jobs
   ↓
ATS Analysis
   ↓
Job Recommendations
   ↓
Swipe LEFT / RIGHT / SAVE
   ↓
Swipe History

2. Main Features

Candidate Authentication

Candidate registration

Password hashing

Candidate login

JWT authentication

Candidate Profile

Candidates can provide: - Headline - Summary - Location - Experience -
Education - Projects - Certifications - Preferred job type - Preferred
location

Resume Upload and Parsing

PDF resume upload

Maximum file size: 5 MB

PDF text extraction using pypdf

Skill extraction using the configured skill list

Extracted skills stored in PostgreSQL

Job Discovery

Candidates can view active jobs with: - Company - Job title -
Description - Location - Employment type - Salary range - Experience
requirement - Required skills - Posted date

ATS Analysis

The current ATS compares extracted resume skills with the selected job's
required skills.

It provides: - ATS score - Match percentage - Matched skills - Missing
skills - Suggestions

Current MVP logic:

ATS Score = Required Skill Match Percentage

Job Recommendations

The current recommendation engine uses:

Factor                   Weight

Skill match                 70%
Preferred location          15%
Preferred job type          15%
Total              100%

Jobs are ranked by the resulting recommendation score.

Swipe-Based Job Discovery

Candidates can interact with jobs using:

LEFT  → Pass / Reject
RIGHT → Like / Interested
SAVE  → Save for later

These actions are stored in swipe_history.

3. Technology Stack

Frontend

React

Vite

JavaScript

CSS

Fetch/API integration

Backend

Python

Flask

Flask-SQLAlchemy

Flask-CORS

Flask-JWT-Extended

Werkzeug

pypdf

python-dotenv

Database

PostgreSQL

Development

Git

GitHub

Visual Studio Code

4. Project Structure

job-discovery-platform/
│
├── backend/
│   ├── app.py
│   ├── uploads/
│   ├── README.md
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── docs/
│   ├── Candidate_Workflow.pdf
│   ├── Database_Schema.png
│   └── API_Documentation.md
│
├── .gitignore
├── LICENSE
└── README.md

Local virtual environments, uploaded files, environment secrets, and
generated build files should not be committed to GitHub.

5. Database

SwipeX currently uses these 8 tables:

users
candidate_profiles
resumes
companies
jobs
ats_reports
recommendations
swipe_history

Main relationships

users
 ├── candidate_profiles
 ├── resumes
 ├── recommendations
 └── swipe_history

companies
 └── jobs

resumes
 └── ats_reports

jobs
 ├── ats_reports
 ├── recommendations
 └── swipe_history

The complete ER diagram is available in:

docs/Database_Schema.png

6. Backend API

The backend runs locally on:

http://127.0.0.1:5000

Authentication

POST /api/register
POST /api/login

Candidate Profile

POST /api/profile
GET  /api/profile

Resume

POST /api/resume

Jobs

GET /api/jobs

ATS

POST /api/ats/analyze/<job_id>

Recommendations

GET /api/recommendations

Swipe

POST /api/swipe
GET  /api/swipe-history

Utility

GET /
GET /test-db

For complete request/response details, see:

docs/API_Documentation.md

7. Frontend

The frontend is built using React and Vite.

The frontend provides the candidate-facing interface for the backend
workflow.

Main screens/components include:

Registration
Login
Candidate Profile
Resume Upload
Detected Skills
Jobs
ATS Analysis
Recommended Jobs
Swipe Actions

The frontend communicates with the Flask backend through REST APIs.

Authentication uses the JWT returned by:

POST /api/login

Protected requests include the JWT in the authorization header.

8. Frontend Setup

Open a terminal in the frontend directory:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The Vite development server normally runs at:

http://localhost:5173

9. Backend Setup

Open another terminal:

cd backend

Create a Python virtual environment:

python -m venv venv

Activate it on Windows PowerShell:

.env\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Create/configure the backend .env file:

DATABASE_URL=<your-postgresql-database-url>
JWT_SECRET_KEY=<your-secret-key>

Start Flask:

python app.py

Backend:

http://127.0.0.1:5000

Frontend:

http://localhost:5173

10. Running the Full Application

Start PostgreSQL first.

Then start the backend:

cd backend
python app.py

In another terminal, start the frontend:

cd frontend
npm run dev

Open the frontend in the browser:

http://localhost:5173

The application can then be tested through:

Registration
    ↓
Login
    ↓
Profile
    ↓
Resume
    ↓
Jobs
    ↓
ATS
    ↓
Recommendations
    ↓
Swipe

11. Security

The backend currently includes:

Password hashing using Werkzeug

JWT authentication

Protected API endpoints

Secure filename handling

PDF file validation

5 MB upload limit

CORS configuration for the local frontend

Environment variables for database credentials and JWT secret

Never commit secrets from .env to GitHub.

12. Current ATS Implementation

The current ATS is a rule-based baseline.

Candidate Resume
       ↓
PDF Text Extraction
       ↓
Skill Extraction
       ↓
Selected Job
       ↓
Required Skill Extraction
       ↓
Skill Comparison
       ↓
Matched Skills
Missing Skills
       ↓
Match Percentage
       ↓
ATS Score

The current implementation does not yet use a trained AI model for ATS
scoring.

13. Current Recommendation Implementation

The current recommendation system is rule-based.

For each active job:

Resume Skills
      ↓
Skill Match
      +
Preferred Location
      +
Preferred Job Type
      ↓
Recommendation Score

The jobs are then sorted from highest to lowest recommendation score.

14. Swipe History and Future Personalization

SwipeX stores candidate interactions in:

swipe_history

with actions:

LEFT
RIGHT
SAVE

These interactions are intended to provide behavioral data for a future
personalization model.

The planned architecture is:

Initial Resume/Job Matching
          ↓
Initial Recommendations
          ↓
Candidate Swipes
          ↓
Swipe History
          ↓
Sufficient Interaction Data
          ↓
Personalization Model
          ↓
Improved Job Recommendations

The swipe-history-based AI/ML personalization stage is a future
enhancement and is not represented as an already-trained model in the
current implementation.

15. Documentation

Project documentation is available under:

docs/

Candidate Workflow

docs/Candidate_Workflow.pdf

Explains the candidate workflow and system process.

Database Schema

docs/Database_Schema.png

Shows the eight database tables, keys, columns, and relationships.

API Documentation

docs/API_Documentation.md

Contains the implemented backend endpoints and their usage.

16. Current Implementation Status

Candidate Registration       ✓
Candidate Login              ✓
JWT Authentication            ✓
Candidate Profile             ✓
PDF Resume Upload             ✓
Resume Skill Extraction       ✓
Job Discovery                 ✓
ATS Analysis                  ✓
Job Recommendations           ✓
Swipe LEFT / RIGHT / SAVE     ✓
Swipe History                 ✓

Future AI/ML personalization is planned as a later stage.

17. Development Branch

The project is maintained using Git and GitHub.

The individual development branch for this contribution is:

parthiv-bhat

Changes should be committed and pushed to the development branch rather
than directly to the main branch.

Example:

git add .
git commit -m "Update project documentation"
git push origin parthiv-bhat

18. Project Goal

The goal of SwipeX is to provide a personalized, swipe-based job
discovery experience where candidates can:

Create a profile.

Upload and analyze their resume.

Discover relevant job opportunities.

Understand their resume-job compatibility.

Receive job recommendations.

Interact with jobs using swipe actions.

Build behavioral history that can later support personalized
recommendations.