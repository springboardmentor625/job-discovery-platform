# SWIPEX – Job Discovery Platform

## Project Overview

SWIPEX is a full-stack job discovery platform that helps candidates create their career profile, upload resumes, and discover suitable job opportunities.

The project uses React for the frontend and Django REST Framework for the backend.

---

## Technology Stack

- Frontend: React, Vite, JavaScript, HTML, CSS, Axios
- Backend: Python, Django, Django REST Framework
- Database: SQLite (development)
- Tools: VS Code, Git, GitHub, Postman, Python Virtual Environment

---

## Project Structure

```text
job-discovery-platform/
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── Login.jsx
│       ├── Dashboard.jsx
│       ├── Dashboard.css
│       └── VerifyEmail.jsx
│
├── backend/
│   ├── config/
│   ├── users/
│   └── manage.py
│
└── docs/

Work Completed
1. Candidate Authentication

Implemented the complete candidate authentication workflow.

Register
   ↓
Email Verification
   ↓
Login
   ↓
Dashboard
Registration

Candidates can register using:

Full Name
Mobile Number
Email
Password

The React frontend sends registration data to Django through:

POST /api/register/

The backend uses a custom Django User model to store candidate information.

Email Verification

After registration, an OTP is sent to the candidate's email.

The candidate verifies the email using the OTP before continuing to the login process.

The email sending is handled using the project's configured email service.

Login

Candidates log in using their email and password through:

POST /api/login/

After successful authentication, the candidate is taken to the Dashboard.

2. Candidate Dashboard

Created the main SWIPEX candidate dashboard using React.

The dashboard currently provides navigation for:

Dashboard
Find Jobs
My Resume
ATS Analysis
AI Recommendations
My Applications
Saved Jobs
Profile

The dashboard also displays candidate information and provides logout functionality.

Candidate Profile Workflow
3. Resume Upload and Parsing

Implemented resume upload as part of the candidate workflow.

Candidates can upload PDF or DOCX resumes.

The Django backend:

Receives the uploaded resume.
Extracts the text from the resume.
Processes the extracted content.
Identifies important candidate information.
Stores the extracted information in the database.

Currently extracted information includes:

Skills
Experience
Education
Complete extracted resume text

The extracted information is displayed in the My Resume section of the dashboard.

4. Resume Database

Created a dedicated Resume model connected to each candidate.

The model stores:

Resume file
Extracted text
Skills
Experience
Education
Upload/update timestamps

This allows SWIPEX to reuse the candidate's resume information later for features such as ATS analysis and job recommendations.

5. Professional Candidate Profile

Created a separate CandidateProfile model for information that is not necessarily extracted from the resume.

The profile contains:

Profile photo
Professional headline
Location
Bio
Career goal
Preferred job role
LinkedIn
GitHub
Portfolio

Candidates can view and edit this information directly from the Dashboard.

Profile photos are uploaded through the Django backend and stored as media files.

Frontend–Backend Integration

React communicates with Django REST APIs using Axios.

Current development servers:

Frontend: http://localhost:5173/
Backend:  http://127.0.0.1:8000/

The frontend sends authenticated requests to the backend and displays the returned candidate data dynamically.

Database & Version Control

Django migrations are used to maintain the database structure.

Current important models include:

User
Resume
CandidateProfile

The project is maintained using Git and GitHub.

Current development branch:

bhanu-teja-rajana

The completed candidate authentication, resume and profile workflow has been committed and pushed to the branch.

## 6. Job Discovery

Implemented the Find Jobs feature for discovering available job opportunities.

Candidates can browse jobs from the SWIPEX dashboard and view important job information such as:

- Job title
- Company
- Location
- Employment type
- Experience level
- Required skills
- Job description
- Sector
- Work type

The frontend displays jobs dynamically and allows the candidate to select a specific job.

### Job Data

Job data is imported into the Django backend from a LinkedIn jobs dataset.

The backend includes management commands for importing job data into the database.

Job records are stored using a dedicated Django Job model.

The job database allows SWIPEX to provide job-specific functionality such as:

- Job details
- Required skill extraction
- ATS analysis
- Future AI job recommendations


## 7. Job Details Workflow

Implemented a dedicated Job Details page.

When a candidate clicks **View Job** from the Find Jobs section, the selected job is stored in the frontend state and the candidate is taken to the Job Details page.

The Job Details page displays:

- Job title
- Company
- Location
- Employment type
- Experience level
- Required skills
- Complete job description

The page also provides an option to analyze the candidate's resume against the selected job.

### Job Selection

The selected job is maintained using React state.

This allows the selected job to be reused across different parts of the workflow, particularly the ATS Analysis feature.


## 8. Job Requirement Extraction

Implemented automatic extraction of required skills from job descriptions.

The backend contains a requirement extraction module that processes job descriptions and identifies relevant skills and technologies.

Extracted requirements are stored with the corresponding job.

This allows the ATS system to compare candidate resume skills with the actual requirements of each job.

The project includes Django management commands for processing and extracting job requirements.


## 9. ATS Resume Analysis

Implemented the ATS (Applicant Tracking System) analysis feature.

The ATS system compares the candidate's uploaded resume against the requirements of the selected job.

The workflow is:

```text
Find Jobs
   ↓
View Job
   ↓
Job Details
   ↓
Analyze My Resume
   ↓
ATS Analysis
   ↓
Resume Match Report

The ATS analysis is performed by the Django backend.

The frontend sends an authenticated request for the selected job using:

GET /api/ats/jobs/<job_id>/

The backend uses the candidate's stored resume and the selected job's requirements to calculate the match.

10. ATS Match Results

The ATS Analysis page displays a resume match report for the selected job.

The report currently includes:

Skill Match Percentage

Displays the percentage of required skills found in the candidate's resume.

Example:

Skill Match: 50%
Matched Skills

Displays the skills that are present in both:

Candidate resume
Job requirements
Missing Skills

Displays required job skills that were not found in the candidate's resume.

Analysis Summary

The ATS report also displays:

Job title
Number of matched skills
Number of missing skills
Overall skill match percentage
11. ATS Frontend Workflow

The ATS workflow was designed so that the candidate does not have to select the same job repeatedly.

When the candidate clicks:

Analyze My Resume

from the Job Details page:

The selected job is retained.
The ATS request is sent to the Django backend.
The candidate is taken directly to the ATS Analysis page.
The analysis result is displayed when the backend responds.

The candidate therefore receives the ATS report for the exact job that was selected.

The ATS page also supports:

Back to Job Details
Find Another Job

The previous selected job and ATS result are cleared when starting a new job-search workflow, preventing an old ATS report from appearing for a newly selected or unselected job.

12. Authentication and ATS Security

ATS requests use the authentication token generated during login.

The frontend retrieves the stored authentication token and sends it with the ATS request:

Authorization: Token <token>

The Django backend verifies the authenticated candidate before processing the ATS request.

This ensures that ATS analysis is performed for the authenticated candidate using their stored resume.

13. Backend ATS Components

The backend contains dedicated ATS functionality:

backend/
└── users/
    ├── ats/
    │   ├── __init__.py
    │   ├── matcher.py
    │   └── requirement_extractor.py
    │
    └── management/
        └── commands/
            ├── import_jobs.py
            └── extract_job_requirements.py
matcher.py

Responsible for comparing candidate resume skills with job requirements and calculating the skill match.

requirement_extractor.py

Responsible for identifying required skills from job descriptions.

import_jobs.py

Used to import job data into the Django database.

extract_job_requirements.py

Used to process jobs and extract their required skills.

14. Current Project Status
Completed
Candidate Management
Candidate registration
Email OTP verification
Candidate login
Authentication
Logout
Candidate dashboard
Resume Management
Resume upload
PDF/DOCX resume support
Resume text extraction
Skills extraction
Experience extraction
Education extraction
Resume database storage
Candidate Profile
Professional candidate profile
Profile photo upload
Profile editing
Location
Bio
Career goal
Preferred job role
LinkedIn
GitHub
Portfolio
Job Discovery
Find Jobs page
Job database
Job dataset import
Job listing
Job selection
Job Details page
Job description display
Required skills display
Job requirement extraction
ATS Analysis
ATS Analysis page
Resume vs job comparison
Skill matching
Matched skills
Missing skills
Skill match percentage
ATS analysis summary
Direct Job → ATS workflow
Selected job persistence
ATS result clearing/reset handling
Authentication for ATS API requests
Version Control
Git repository
Feature development branch
Candidate workflow committed
Job discovery and ATS functionality committed
Changes pushed to GitHub
