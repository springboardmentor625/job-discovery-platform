# SwipeX – Swipe-Based Intelligent Job Discovery and Career Assistance Platform

> An AI-powered job discovery platform that enables candidates to discover, analyze, and apply for jobs through intelligent resume analysis, ATS scoring, and personalized recommendations.

---

## 📖 Project Overview

SwipeX is a full-stack web application that modernizes the job search experience by combining Artificial Intelligence, Machine Learning, and an intuitive swipe-based discovery concept.

The platform assists candidates in finding relevant jobs using resume analysis, ATS compatibility scoring, intelligent job recommendations, and application tracking. Recruiters can efficiently manage job postings and applicants through a centralized dashboard.

The project demonstrates the integration of modern web technologies, REST APIs, PostgreSQL, and machine learning to create an intelligent career assistance platform.

---

# 🎯 Project Objective

The objective of SwipeX is to build an intelligent job discovery platform that:

- Simplifies job discovery using a swipe-based interface.
- Provides AI-powered resume analysis.
- Calculates ATS compatibility scores.
- Recommends personalized job opportunities.
- Tracks applications in real time.
- Helps candidates improve resumes using AI-generated suggestions.
- Assists recruiters in managing recruitment workflows efficiently.

---

# ✨ Features

## 🔐 Authentication

- Secure User Registration
- Login & Logout
- JWT Authentication
- Protected Routes
- Role-Based Access Control

---

## 👤 Candidate Module

- Candidate Profile Creation
- Profile Editing
- Resume Upload
- Resume Preview
- Resume Version Management
- Skill & Experience Management
- ATS Resume Analysis
- AI Resume Suggestions
- Personalized Job Recommendations
- Browse Jobs
- Apply for Jobs
- Saved Jobs
- Application Tracking Dashboard

---

## 🏢 Recruiter Module

- Recruiter Dashboard
- Create Job Posts
- Manage Job Listings
- View Applicants
- Candidate Recommendations

---

## 🤖 Artificial Intelligence Features

- Resume Parsing
- ATS Resume Scoring
- Resume-Job Compatibility Analysis
- Skill Extraction
- Missing Skill Detection
- Job Recommendation Engine
- TF-IDF Feature Extraction
- Naive Bayes Machine Learning Model

---

# 🛠 Technology Stack

## Frontend

- React.js
- React Router
- Axios
- CSS

## Backend

- Python
- Django
- Django REST Framework

## Database

- PostgreSQL

## Authentication

- JWT Authentication

## Machine Learning

- Scikit-learn
- Pandas
- NumPy
- TF-IDF
- Naive Bayes

## Resume Processing

- PyMuPDF

## DevOps

- Docker
- Docker Compose
- Git
- GitHub

---

# 📂 Project Structure

```
SwipeX
│
├── backend
│   ├── candidates
│   ├── recommendation
│   ├── services
│   ├── config
│   └── manage.py
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   └── assets
│   └── public
│
├── docs
│
├── docker-compose.yml
│
├── requirements.txt
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/<your-github-username>/job-discovery-platform.git

cd job-discovery-platform
```

---

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

Backend:

```
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# 🤖 Machine Learning Workflow

```
Resume Upload
      ↓
Resume Parsing
      ↓
Skill Extraction
      ↓
ATS Analysis
      ↓
Resume-Job Matching
      ↓
Recommendation Engine
      ↓
Personalized Job Recommendations
```

---

# 🗄 Database

Main entities include:

- User
- Candidate
- Recruiter
- Resume
- Job
- Application
- Skills
- Recommendations

---

# 📊 System Workflow

```
User Registration
        ↓
Login
        ↓
Create Profile
        ↓
Upload Resume
        ↓
Resume Analysis
        ↓
ATS Score
        ↓
AI Job Recommendation
        ↓
Browse Jobs
        ↓
Apply
        ↓
Track Applications
```

---

# 📸 Screenshots

Include screenshots of:

- Login Page
- Dashboard
- Candidate Profile
- Resume Upload
- Resume Analysis
- ATS Score
- Job Recommendations
- Job Listing
- Apply Job
- Application Dashboard

---

# 🚀 Future Enhancements

- Swipe Gesture Interface
- OAuth2 Authentication
- Email Notifications
- Interview Scheduling
- Company Dashboard
- AI Career Coach
- Resume Builder
- Salary Prediction
- Skill Gap Analysis
- GitHub Actions CI/CD
- AWS / Azure Deployment
- Mobile Application

---

# 📚 Learning Outcomes

This project demonstrates knowledge of:

- Full Stack Web Development
- React.js
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Machine Learning
- Resume Parsing
- ATS Optimization
- Recommendation Systems
- REST API Development
- Docker

---

# 👩‍💻 Developer

**Praveena Durga**

**Role:** Full Stack Developer

### Responsibilities

- Designed and developed the complete frontend using React.js.
- Developed REST APIs with Django REST Framework.
- Designed the PostgreSQL database schema.
- Implemented JWT authentication and authorization.
- Built resume upload, parsing, and ATS scoring modules.
- Developed AI-powered job recommendation features.
- Integrated candidate profile and application management.
- Containerized the application using Docker.

---

# 📄 License

This project was developed by **Praveena Durga** for academic, learning, and portfolio purposes.

---

# 🙏 Acknowledgements

- Django
- Django REST Framework
- React.js
- PostgreSQL
- Scikit-learn
- PyMuPDF
- Pandas
- NumPy
