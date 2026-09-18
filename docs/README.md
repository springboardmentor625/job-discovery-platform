# SwipeX – Swipe-Based Intelligent Job Discovery and Career Assistance Platform

SwipeX is a full-stack intelligent job discovery platform that helps candidates discover relevant job opportunities through a swipe-based interface.

The platform combines **resume analysis, ATS scoring, skill matching, semantic text processing, machine learning, and swipe-based personalization** to provide candidates with relevant job recommendations.

The project focuses on the **candidate workflow**.

---

## 🚀 Live Deployment

### Frontend

https://swipex-frontend-zeta.vercel.app/

### Backend API

https://swipex-backend-n4y5.onrender.com

The frontend is deployed using **Vercel**, while the backend is deployed using **Render**.

---

## Project Objective

The main objective of SwipeX is to simplify traditional job searching by allowing candidates to:

- Create and manage their profile
- Upload and analyze their resume
- Receive ATS and skill-match information
- Get personalized job recommendations
- Discover jobs using a swipe-based interface
- Skip jobs
- Save jobs
- Show interest in jobs
- Review swipe history
- Explore jobs using search and filters
- View detailed job information

The project focuses on the **candidate-side job discovery workflow**.

---

# Key Features

## 1. Candidate Registration & Authentication

Candidates can register and log in securely.

Features include:

- JWT-based authentication
- Protected API endpoints
- Protected frontend routes
- Candidate-specific data
- Logout functionality

---

## 2. Candidate Profile

Candidates can create and manage their profile information.

Profile information includes:

- Full name
- Email
- Phone number
- Profile picture
- Skills
- Education
- Experience
- Projects
- Certifications
- Career preferences

Candidate profile information is used during job matching and recommendation generation.

---

## 3. Resume Upload & Analysis

Candidates can upload supported resume files.

Supported formats include:

- PDF
- DOC
- DOCX

The resume processing workflow is:

```text
Resume Upload
      ↓
File Validation
      ↓
Text Extraction
      ↓
Resume Processing
      ↓
Skill Extraction
      ↓
ATS & ML Processing
      ↓
Recommendation Preparation
