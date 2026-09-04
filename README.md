# SwipeX – Intelligent Job Discovery & Resume Matching Platform

## 📌 Project Overview

**SwipeX** is an intelligent job discovery platform designed to help candidates find relevant job opportunities based on their resume, skills, experience, and job preferences.

The platform combines a modern web application with **NLP-based machine learning** to analyze the similarity between a candidate's resume and available job descriptions. It provides a **Resume Match Score** and supports an interactive job-swiping experience.

---

## 🎯 Project Objective

The main objectives of SwipeX are:

- Help candidates discover relevant job opportunities.
- Analyze resumes and extract useful information such as skills.
- Compare candidate resumes with job descriptions.
- Generate a Resume Match Score.
- Recommend jobs based on resume-job relevance.
- Provide an interactive swipe-based job discovery experience.
- Allow candidates to apply for jobs through the platform.
- Maintain swipe and application history.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      Candidate      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌──────────────┐  ┌─────────────┐
      │ PostgreSQL  │   │ NLP / ML     │  │ JWT Auth    │
      │  Database   │   │ Matching     │  │             │
      └─────────────┘   └──────────────┘  └─────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Resume Match Score  │
                    │ & Recommendations   │
                    └─────────────────────┘
🛠️ Technologies Used
Frontend
React.js
Vite
JavaScript
Axios
CSS
Backend
Python
FastAPI
Pydantic
SQLAlchemy
JWT Authentication
Uvicorn
Database
PostgreSQL
pgAdmin
Machine Learning / NLP
Python
Scikit-learn
TF-IDF Vectorization
Cosine Similarity
NLP-based text matching
Development Tools
Visual Studio Code
Git
GitHub
GitHub Copilot / Antigravity
👤 User Authentication

SwipeX implements user authentication using JWT (JSON Web Tokens).

The system supports different user roles, including:

Candidate
Recruiter
Admin

Authentication is used to protect user-specific resources such as resumes, applications, and swipe history.

📄 Resume Management

Candidates can upload and manage their resumes through the frontend.

The resume system stores information such as:

Resume name
Resume file path
Extracted skills
Upload date
Default resume status
Associated candidate

Example candidate skills:

Python
SQL
PostgreSQL
FastAPI
Pandas
PySpark
🤖 AI / Machine Learning Component

The main intelligent component of SwipeX is Resume–Job Matching.

The system compares the candidate's resume with a job description using NLP-based machine learning techniques.

Matching Process
Resume
   ↓
Resume Text
   ↓
Text Preprocessing
   ↓
TF-IDF Vectorization
   ↓
Cosine Similarity
   ↓
Resume Match Score
TF-IDF

TF-IDF (Term Frequency–Inverse Document Frequency) converts text into numerical vectors based on the importance of words within the documents.

The resume and job description are converted into TF-IDF vectors.

Cosine Similarity

Cosine similarity measures the similarity between the resume vector and job-description vector.

The resulting similarity value is converted into a percentage-based:

Resume Match Score

Example:

Resume Match Score: 27.28%

This provides an indication of how closely the candidate's resume matches the requirements and content of a particular job.

🎯 Job Recommendation

The matching system can be used to determine job relevance.

Candidate Resume
       ↓
Compare with Jobs
       ↓
Calculate Match Scores
       ↓
Rank Relevant Jobs
       ↓
Recommend Jobs

Jobs with stronger resume-job similarity can be prioritized for the candidate.

💼 Job Discovery

Candidates can browse available job opportunities through the Jobs section.

Job information includes:

Job title
Job ID
Location
Employment type
Experience requirement
Required technical skills
Role overview
Resume Match Score
👆 Swipe-Based Job Discovery

SwipeX provides an interactive job discovery mechanism.

Candidates can interact with jobs using actions such as:

❌ Pass

Reject or skip a job opportunity.

⭐ Interested

Mark a job as interesting for later consideration.

❤️ Apply

Proceed with the application process.

The system records these interactions as part of the candidate's swipe history.

📚 Swipe History

Candidates can view previously interacted jobs through the Swipe History section.

This helps users keep track of jobs they have:

Passed
Marked as interested
Applied to
🏢 Company Management

SwipeX also provides company information associated with job postings.

Candidates can view company details and access the company's website when available.

🗄️ Database Design

The PostgreSQL database contains several entities used by the platform.

Major tables include:

users
companies
jobs
resumes
applications
candidate_profile
swipe_history

The database manages relationships between:

User
 │
 ├── Candidate Profile
 │
 ├── Resumes
 │
 ├── Applications
 │
 └── Swipe History

Company
 │
 └── Jobs
🔌 Backend API

The backend is implemented using FastAPI.

The API handles:

User registration
User authentication
Resume management
Job management
Company information
Job discovery
Swipe actions
Applications
Resume-job matching
Recommendations
Swipe history

FastAPI provides RESTful API endpoints that are consumed by the React frontend.

🖥️ Frontend

The frontend is developed using React + Vite.

Major frontend sections include:

Home
Dashboard
Jobs
Swipe Jobs
Swipe History
Login
Registration

The frontend communicates with the FastAPI backend using HTTP requests through Axios.

🔐 Security

The application uses JWT-based authentication to protect authenticated resources.

Authentication tokens are used by the frontend when making protected API requests.
🚀 How to Run the Project
Backend

Navigate to the backend directory:

cd backend

Activate the virtual environment:

.venv\Scripts\activate

Start the FastAPI server:

uvicorn app.main:app --reload

Backend:

http://127.0.0.1:8000
Frontend

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Frontend:

http://localhost:5173
📊 Current Implementation Status
Module	Status
Project Setup	✅ Completed
PostgreSQL Database	✅ Implemented
Database Models	✅ Implemented
FastAPI Backend	✅ Implemented
React Frontend	✅ Implemented
User Registration	✅ Implemented
JWT Authentication	✅ Implemented
Resume Upload	✅ Implemented
Resume Skill Extraction	✅ Implemented
Job Management	✅ Implemented
Swipe Functionality	✅ Implemented
Swipe History	✅ Implemented
Company Listing	✅ Implemented
Resume–Job Matching	✅ Implemented
TF-IDF Matching	✅ Implemented
Cosine Similarity	✅ Implemented
Resume Match Score	✅ Implemented
Job Recommendation	✅ Implemented
Professional Dashboard UI	🔄 Ongoing
Testing & Refinement	🔄 Ongoing
🧠 Key Intelligent Feature

The primary intelligent feature of SwipeX is:

NLP-based Resume–Job Matching and Recommendation

Instead of displaying jobs without considering the candidate's profile, SwipeX analyzes the relationship between the candidate's resume and job descriptions.

This allows the system to provide a Resume Match Score and support more relevant job discovery.