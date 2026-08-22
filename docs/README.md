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

Current Status
Completed
Candidate registration
Email OTP verification
Candidate login
Dashboard
Logout
Resume upload
Resume text extraction
Skills extraction
Experience extraction
Education extraction
Resume database storage
Candidate professional profile
Profile photo upload
Profile editing
GitHub version control