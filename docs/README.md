# SwipeX – Swipe-Based Intelligent Job Discovery and Career Assistance Platform

SwipeX is a full-stack intelligent job discovery platform that helps candidates discover relevant job opportunities through a swipe-based interface.

The platform combines **resume parsing, NLP-based skill extraction, semantic matching, job-specific ATS scoring, machine learning, and swipe-based personalization** to provide candidates with more relevant job recommendations.

---

## Project Objective

The main objective of SwipeX is to simplify traditional job searching by allowing candidates to:

* Create and manage their profile
* Upload and analyze their resume
* Receive job-specific ATS and skill-match scores
* Get personalized job recommendations
* Discover jobs using a swipe-based interface
* Save, skip, or show interest in jobs
* Review swipe history
* Explore jobs using search and filters
* Track applications

The project focuses on the **candidate workflow**.

---

## Key Features

### 1. Candidate Registration & Authentication

Candidates can register and log in securely.

* JWT-based authentication
* Protected routes
* Candidate-specific data
* Secure logout

### 2. Candidate Profile

Candidates can maintain information such as:

* Name
* Contact information
* Location
* Skills
* Education
* Experience
* Projects
* Certifications
* Career preferences

Profile information contributes to personalized recommendations.

### 3. Resume Upload & Analysis

Candidates can upload resumes in supported formats such as:

* PDF
* DOCX

The resume processing pipeline performs:

```text
Resume Upload
      ↓
File Validation
      ↓
Text Extraction
      ↓
Resume Parsing
      ↓
Skill Extraction
      ↓
Experience / Education Extraction
      ↓
ATS & Matching Preparation
```

Detected skills are displayed to the candidate and are used during job matching.

---

## AI / ML Pipeline

AI and machine-learning techniques are a core part of SwipeX.

### spaCy

spaCy is used for NLP processing and text analysis, including skill extraction and normalization.

### Sentence Transformers

SwipeX uses Sentence Transformers for semantic text matching.

The project uses:

```text
all-MiniLM-L6-v2
```

Resume and job-related text are converted into embeddings so that semantically similar content can be matched even when the exact wording differs.

### scikit-learn

scikit-learn is used for machine-learning components related to recommendation preference learning and classification.

---

# Job-Specific ATS Matching

SwipeX calculates ATS compatibility against a **specific job**, rather than providing only a generic resume-quality score.

The matching process considers:

* Required skills
* Semantic similarity
* Experience fit
* Relevant job-description content
* Candidate resume/profile information

The current ATS calculation uses:

| Component           |   Weight |
| ------------------- | -------: |
| Skill Match         |      45% |
| Semantic Similarity |      30% |
| Experience Fit      |      20% |
| Lexical Similarity  |       5% |
| **Total**           | **100%** |

### Skill Match

Skill Match represents the percentage of recognized required job skills that the candidate has.

For example:

```text
Required:
Python
SQL
Django
React
Git

Candidate:
Python
SQL
Django

Skill Match = 3 / 5 × 100 = 60%
```

When there are no matched required skills, the Skill Match is **0%**.

---

# Personalized Recommendation System

The recommendation system combines candidate information, job information, and behavioural feedback.

```text
Candidate Profile
       +
Resume
       +
Extracted Skills
       +
Job Requirements
       +
Semantic Matching
       +
ATS Score
       +
Swipe History
       +
Application Signals
       ↓
Recommendation Ranking
       ↓
Recommended Jobs
```

---

## Cold Start Recommendation

For a new candidate without swipe history, SwipeX uses available candidate information such as:

* Resume
* Extracted skills
* Profile information
* Preferred roles
* Preferred locations
* Work mode
* Experience
* Job requirements
* ATS compatibility
* Semantic similarity

This allows recommendations to be generated before the candidate has provided behavioural feedback.

---

## Continuous Learning from Swipes

Candidate interactions are stored as behavioural signals.

The available actions are:

* **Skip**
* **Save**
* **Interested**

Application activity can also contribute as a positive signal.

The recommendation system uses these interactions to improve future ranking.

```text
Candidate Action
      ↓
Stored in Database
      ↓
Recommendation Feedback
      ↓
Updated Candidate Preference
      ↓
New Recommendation Ranking
```

Personalization starts from the candidate's interactions rather than waiting for a fixed number of swipes.

The recommendation system also uses a bounded recommendation batch so that a large number of jobs does not need to be processed on every request.

---

# Swipe-Based Job Discovery

SwipeX's main discovery experience is the **Swipe Deck**.

Each job is presented as a recommendation card.

Candidates can:

* Drag left to skip
* Drag right to show interest
* Save a job
* Open complete job details

Framer Motion is used to provide the swipe interaction.

Previously processed jobs are excluded from future recommendation results so the same job does not repeatedly appear.

---

# Recommendation Retrieval

SwipeX works with a large job dataset, so the system uses staged retrieval instead of performing expensive semantic matching against every job for every recommendation request.

```text
Large Job Dataset
       ↓
Candidate-specific retrieval
       ↓
Relevant Job Pool
       ↓
Batch Embeddings
       ↓
ATS + Skill + Semantic + Experience Matching
       ↓
Recommendation Ranking
       ↓
Top Jobs
```

This approach reduces unnecessary computation and makes recommendation generation more practical for a large dataset.

---

# Candidate-Facing Recommendation Information

Each recommendation provides useful job-specific information such as:

* ATS Score
* Skill Match
* Skills You Have
* Skills to Improve
* Job title
* Company
* Location
* Experience requirements
* Job description

The internal recommendation ranking combines multiple signals, while the UI focuses on understandable metrics for the candidate.

---

# Job Details

Candidates can open a detailed view of any recommendation.

The Job Details section can contain:

* Job title
* Company
* Location
* Employment type
* Work mode
* Required skills
* Preferred skills
* Experience requirements
* Salary information when available
* Job description

This information is also used by the matching system.

---

# Applications

When a candidate applies to a job, SwipeX records the application against the candidate and job.

This provides:

* Application history
* Duplicate prevention
* Application status tracking

When an external application URL is available, SwipeX can redirect the candidate to the company's application page.

The application flow is therefore:

```text
Candidate clicks Apply
        ↓
External application page
        +
SwipeX records application
        ↓
Application history
```

---

# Swipe History

Swipe History allows candidates to review their previous job interactions.

Available categories include:

* All
* Interested
* Saved
* Skipped

Swipe history is useful both for the candidate and for recommendation personalization.

---

# Explore Jobs

SwipeX also provides an **Explore Jobs** page for candidates who prefer traditional job browsing.

Features include:

* Search
* Backend-side filtering
* Server-side pagination
* Job details
* Application actions

Instead of loading the entire dataset into the browser, jobs are retrieved page by page from the backend.

---

# Swipe Deck vs Explore Jobs

Swipe Deck and Explore Jobs provide two different discovery experiences.

### Swipe Deck

Designed for:

* Fast decisions
* Personalized discovery
* Swipe interaction
* Behavioural feedback

### Explore Jobs

Designed for:

* Traditional browsing
* Searching
* Filtering
* Comparing multiple jobs

Swipe Deck is the primary experience because swipe-based job discovery is the core concept of SwipeX.

---

# Database

SwipeX uses **PostgreSQL** as the relational database.

The database documentation contains the ER diagram.

### Database Summary

**10 Tables | 10 Primary Keys | 13 Foreign Keys**

Core entities include:

```text
users
companies
candidate_profile
jobs
resumes
applications
swipe_history
ats_reports
recommendations
notifications
```

Main relationships include:

```text
users
 ├── candidate_profile
 ├── resumes
 ├── applications
 ├── swipe_history
 ├── recommendations
 └── notifications

companies
 └── jobs

jobs
 ├── applications
 ├── swipe_history
 ├── ats_reports
 └── recommendations

resumes
 ├── applications
 └── ats_reports
```

Database diagram:

```text
docs/database.png
```

---

# Backend

The backend is built using:

* Django
* Django REST Framework
* Simple JWT
* PostgreSQL

The backend handles:

* Authentication
* Candidate profiles
* Resume processing
* Job retrieval
* ATS calculation
* Skill matching
* Recommendations
* Swipe history
* Applications
* Notifications

General backend flow:

```text
API Request
    ↓
Django View
    ↓
Serializer
    ↓
Service / Utility
    ↓
Database / AI-ML Processing
    ↓
API Response
```

---

# Frontend

The frontend is built using:

* React
* Vite
* Tailwind CSS
* Framer Motion

Main candidate pages include:

* Profile
* Resume
* Recommendations
* Swipe History
* Explore Jobs

The application uses a shared authenticated layout and sidebar navigation.

---

# Authentication Flow

SwipeX uses JWT authentication.

```text
Login
  ↓
Credentials Validation
  ↓
JWT Token
  ↓
Frontend Stores Token
  ↓
Bearer Token Added to API Requests
  ↓
Protected Backend Endpoints
```

Only authenticated users can access protected candidate functionality.

---

# Resume Processing Technologies

Resume processing uses dedicated libraries for document handling and text extraction, including support for PDF and DOCX files.

The extracted information is then used by the matching and recommendation pipeline.

---

# Job Import

SwipeX supports importing job postings from the available dataset.

The import process stores job information in PostgreSQL so that the jobs can be used by:

* Recommendations
* Explore Jobs
* ATS matching
* Swipe Deck
* Applications

Management commands are included for importing and seeding job data.

---

# Docker

SwipeX is containerized using Docker and Docker Compose.

The application is separated into:

```text
Frontend
    ↓
Backend
    ↓
PostgreSQL
```

Docker provides a consistent environment for running the project.

Start the application with:

```bash
docker compose up --build -d
```

Check containers:

```bash
docker ps
```

View logs:

```bash
docker compose logs -f
```

Stop containers:

```bash
docker compose down
```

---

# Environment Configuration

Sensitive information is stored through environment variables.

Example configuration files:

```text
.env.example
backend/.env.example
```

Actual `.env` files should not be committed to GitHub.

Sensitive values such as:

* Database passwords
* Django secret keys
* API keys

must be provided through environment variables.

---

# Project Structure

```text
SwipeX final/
│
├── backend/
│   ├── candidates/
│   │   ├── management/
│   │   ├── migrations/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── config/
│   │   └── settings.py
│   │
│   ├── recommendation/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── Dockerfile
│   └── vite.config.js
│
├── docs/
│   └── database.png
│
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

---

# End-to-End Workflow

The complete candidate workflow is:

```text
Register
   ↓
Login
   ↓
Create / Update Profile
   ↓
Upload Resume
   ↓
Parse Resume
   ↓
Extract Skills and Information
   ↓
Match Resume with Jobs
   ↓
Calculate ATS + Skill Match
   ↓
Generate Recommendations
   ↓
Skip / Save / Interested
   ↓
Learn from Candidate Behaviour
   ↓
Update Recommendation Ranking
   ↓
View Job Details
   ↓
Apply
   ↓
Track Application
   ↓
Review Swipe History / Explore Jobs
```

---

# Technology Stack

| Category          | Technology                                   |
| ----------------- | -------------------------------------------- |
| Frontend          | React                                        |
| Build Tool        | Vite                                         |
| Styling           | Tailwind CSS                                 |
| Animation         | Framer Motion                                |
| Backend           | Django                                       |
| API               | Django REST Framework                        |
| Authentication    | Simple JWT                                   |
| Database          | PostgreSQL                                   |
| NLP               | spaCy                                        |
| Semantic Matching | Sentence Transformers                        |
| Machine Learning  | scikit-learn                                 |
| Data Processing   | NumPy, pandas                                |
| Resume Processing | pdfplumber, pdfminer, pypdfium2, python-docx |
| AI Services       | OpenAI / Groq                                |
| Containerization  | Docker / Docker Compose                      |
| Version Control   | Git / GitHub                                 |

---

# Testing and Verification

The project contains backend testing and verification utilities for validating important application flows.

These cover areas such as:

* Authentication
* Resume processing
* Job matching
* Recommendation generation
* Database operations
* Application workflow

Database migrations and management commands are also included as part of the backend setup.

---

# Security Practices

The project follows basic application security practices:

* JWT authentication
* Protected API endpoints
* Environment-based configuration
* `.env` exclusion through `.gitignore`
* Resume file validation
* Database credentials stored through environment configuration

---

# Future Enhancements

Potential future improvements include:

* More advanced recommendation models
* Real-time job ingestion
* Better duplicate-job detection
* More advanced skill ontology
* Explainable recommendation models
* Additional external job sources
* Recruiter-side functionality
* Cloud deployment
* Real-time notifications

---

# Conclusion

SwipeX combines full-stack development, NLP, semantic matching, machine learning, and behavioural personalization to create a smarter job discovery experience.

The core concept is:

```text
Understand the Candidate
        +
Understand the Job
        +
Learn from Candidate Behaviour
        ↓
Recommend Better Opportunities
```

SwipeX transforms traditional job searching into an interactive, personalized, and data-driven job discovery experience.

---

## Internship Project

**SwipeX – Swipe-Based Intelligent Job Discovery and Career Assistance Platform**

Developed as part of the **Infosys Springboard Virtual Internship**.

```

This version is ready to paste directly into `README.md`.
```
