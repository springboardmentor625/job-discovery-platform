````markdown
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
````

The extracted resume information is used for:

* Skill matching
* ATS calculation
* Recommendation generation
* Resume-related machine-learning prediction

Resume identity validation also checks important profile information such as the candidate's registered name and phone number.

---

# AI / Machine Learning Pipeline

SwipeX uses multiple machine-learning and text-processing techniques for different parts of the system.

The project does **not** use one single ML model for everything.

Different models perform different tasks.

---

## 1. Multinomial Naive Bayes

SwipeX uses **Multinomial Naive Bayes** for resume-related prediction.

The model uses:

* TF-IDF text features
* Resume/job-related text
* A trained classification model
* Probability prediction

The model is trained using job-related data and is used during resume processing.

The predicted probability is stored with the candidate's resume information.

The general flow is:

```text
Resume Text
     ↓
TF-IDF Vectorization
     ↓
Multinomial Naive Bayes
     ↓
Prediction Probability
     ↓
Resume Probability Score
```

---

## 2. Logistic Regression

SwipeX uses **Logistic Regression** for learning candidate preferences from swipe behaviour.

The recommendation system considers behavioural feedback such as:

* Interested
* Saved
* Skipped

The preference-learning model uses similarity-based features to learn from positive and negative candidate interactions.

The Logistic Regression model is activated when sufficient behavioural feedback is available:

```text
Minimum Positive Interactions = 3
Minimum Negative Interactions = 3
```

Once enough feedback is available, the learned preference information contributes to recommendation ranking.

Before sufficient feedback is available, SwipeX uses a cold-start recommendation strategy.

The general flow is:

```text
Candidate Swipes
       ↓
Positive / Negative Feedback
       ↓
Similarity Features
       ↓
Logistic Regression
       ↓
Learned Preference
       ↓
Recommendation Ranking
```

---

## 3. HashingVectorizer

SwipeX uses **HashingVectorizer** from scikit-learn for lightweight text vectorization.

The current implementation uses:

```text
HashingVectorizer
n_features = 1024
norm = l2
ngram_range = (1, 2)
```

Resume and job-related text are converted into numerical vectors.

These vectors are used for similarity calculations in the matching and recommendation pipeline.

This lightweight approach helps reduce model size and startup overhead.

---

# Job-Specific ATS Matching

SwipeX calculates ATS compatibility against a **specific job**.

The current job-specific ATS calculation uses:

| Component           |   Weight |
| ------------------- | -------: |
| Skill Match         |      45% |
| Semantic Similarity |      30% |
| Experience Fit      |      20% |
| Lexical Relevance   |       5% |
| **Total**           | **100%** |

The ATS score combines multiple aspects of the candidate and job.

---

## Skill Match

Skill Match represents how many required job skills are matched by the candidate.

For example:

```text
Required Skills:
Python
SQL
Django
React
Git

Candidate Skills:
Python
SQL
Django
```

Therefore:

```text
Matched Skills = 3
Required Skills = 5

Skill Match = 3 / 5 × 100
            = 60%
```

The system uses the identified candidate skills and job requirements to calculate the match.

---

## Semantic Similarity

Semantic similarity measures how closely the candidate's resume/profile information relates to the job content.

SwipeX uses lightweight text vectorization and similarity calculations to generate semantic features.

This helps compare text beyond simple exact keyword matching.

---

## Experience Fit

Experience Fit considers the relationship between the candidate's experience and the experience requirements of the job.

---

## Lexical Relevance

Lexical relevance considers the relevance of text and matching terms between candidate information and job information.

---

# Personalized Recommendation System

The recommendation system combines candidate information, job information, ATS results, semantic features, and behavioural feedback.

```text
Candidate Profile
       +
Resume Information
       +
Extracted Skills
       +
Job Requirements
       +
ATS Score
       +
Semantic Similarity
       +
Experience Fit
       +
Swipe History
       ↓
Recommendation Scoring
       ↓
Recommended Jobs
```

The recommendation system is designed to become more personalized as the candidate interacts with jobs.

---

# Cold Start Recommendation

A new candidate may not have enough swipe history for the preference-learning model.

SwipeX therefore uses a cold-start recommendation strategy.

The cold-start recommendation score uses:

| Component      |   Weight |
| -------------- | -------: |
| ATS Score      |      35% |
| Skill Match    |      30% |
| Semantic Fit   |      20% |
| Experience Fit |      15% |
| **Total**      | **100%** |

This allows recommendations to be generated even before sufficient behavioural feedback is available.

The system can use information such as:

* Resume
* Extracted skills
* Candidate profile
* Preferred roles
* Preferred locations
* Work mode
* Experience
* Job requirements
* ATS compatibility
* Semantic similarity

---

# Continuous Learning from Swipes

Candidate interactions are stored as behavioural signals.

Available swipe actions include:

* **Skip**
* **Save**
* **Interested**

These interactions are used to understand candidate preferences.

The process is:

```text
Candidate Action
       ↓
Swipe Stored in Database
       ↓
Positive / Negative Feedback
       ↓
Preference Learning
       ↓
Updated Recommendation Score
       ↓
New Recommendation Ranking
```

When enough positive and negative interactions are available, Logistic Regression can be used to learn candidate preferences.

The recommendation system therefore becomes more personalized as the candidate interacts with more jobs.

---

# Swipe-Based Job Discovery

The main discovery experience of SwipeX is the **Swipe Deck**.

Each job is displayed as a recommendation card.

Candidates can:

* Drag left to skip
* Drag right to show interest
* Save a job
* Open complete job details

**Framer Motion** is used to provide the swipe interaction and animations.

Previously processed jobs are excluded from future recommendation results.

This prevents the same processed job from repeatedly appearing in the recommendation deck.

---

# Recommendation Retrieval

SwipeX works with a large job dataset.

Instead of performing expensive processing against every job for every recommendation request, the system uses a staged recommendation process.

```text
Large Job Dataset
       ↓
Candidate-Specific Retrieval
       ↓
Relevant Job Pool
       ↓
Text Vectorization
       ↓
ATS + Skill + Semantic + Experience Matching
       ↓
Recommendation Scoring
       ↓
Top Recommended Jobs
```

This reduces unnecessary processing and makes recommendation generation more practical for a large job dataset.

---

# Candidate-Facing Recommendation Information

The recommendation interface can provide job-specific information such as:

* Job title
* Company
* Location
* ATS score
* Skill match
* Skills you have
* Skills to improve
* Experience requirements
* Job description

The internal recommendation system combines multiple signals, while the user interface presents understandable information to candidates.

---

# Job Details

Candidates can open a detailed view of a job.

Job information can include:

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

---

# Applications

The backend contains application-related functionality for recording candidate applications against jobs.

Application records can contain information such as:

* Candidate
* Job
* Resume
* Application status
* Application date
* External application URL

The application functionality is handled through the backend API.

---

# Swipe History

Swipe History allows candidates to review previous job interactions.

Available categories include:

* All
* Interested
* Saved
* Skipped

Swipe history serves two purposes:

1. Allows candidates to review their previous interactions.
2. Provides behavioural feedback for recommendation personalization.

---

# Explore Jobs

SwipeX also provides an **Explore Jobs** page for traditional job browsing.

Features include:

* Search
* Backend-side filtering
* Server-side pagination
* Job details
* Job browsing

Instead of loading the entire job dataset into the browser, jobs are retrieved page by page from the backend.

---

# Swipe Deck vs Explore Jobs

Swipe Deck and Explore Jobs provide two different job discovery experiences.

## Swipe Deck

Designed for:

* Personalized discovery
* Fast job decisions
* Swipe-based interaction
* Behavioural feedback

## Explore Jobs

Designed for:

* Traditional browsing
* Searching
* Filtering
* Viewing multiple job listings
* Opening detailed job information

The Swipe Deck represents the core concept of SwipeX.

---

# Database

SwipeX uses **PostgreSQL** as its relational database.

The database structure is implemented using Django models and migrations.

Core database entities include:

```text
Users
Candidate Profiles
Resumes
Companies
Jobs
Applications
Swipe History
ATS Reports
Recommendations
```

The exact database structure is defined by the current Django models and migrations.

---

## Database Diagram

The Entity Relationship Diagram is available at:

```text
docs/SwipeX_database.png
```

The diagram represents the major entities and relationships used by the SwipeX backend.

---

# Backend

The backend is built using:

* Django
* Django REST Framework
* Simple JWT
* PostgreSQL
* scikit-learn
* NumPy
* pandas

The backend handles:

* Authentication
* Candidate profiles
* Resume uploads
* Resume processing
* Job retrieval
* ATS calculation
* Skill matching
* Recommendation generation
* Swipe history
* Application-related operations
* Database operations

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
Database / ML Processing
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

The candidate-facing application includes pages such as:

* Dashboard
* Jobs
* Resume
* Profile
* Edit Profile
* Swipe History
* Settings

The application uses a shared authenticated layout and sidebar navigation.

---

# Authentication Flow

SwipeX uses JWT-based authentication.

```text
Login
  ↓
Credentials Validation
  ↓
JWT Access Token
  ↓
Frontend Stores Token
  ↓
Bearer Token Added to API Requests
  ↓
Protected Backend Endpoints
```

Protected candidate functionality requires authentication.

---

# Resume Processing

Resume processing supports PDF and DOC/DOCX documents.

The processing pipeline includes:

```text
Resume File
    ↓
File Validation
    ↓
Text Extraction
    ↓
Resume Information Processing
    ↓
Skill Extraction
    ↓
ATS / ML Processing
```

DOC/DOCX preview processing can use headless LibreOffice conversion.

Resume files are validated before processing, including file-size and supported-format checks.

---

# Job Import

SwipeX supports importing job postings from available datasets.

Imported jobs are stored in PostgreSQL and can be used by:

* Recommendation generation
* Explore Jobs
* ATS matching
* Swipe Deck
* Job details

The backend includes Django management commands for job-data importing.

---

# Docker

SwipeX is containerized using **Docker and Docker Compose**.

The application consists of:

```text
Frontend
    ↓
Backend
    ↓
PostgreSQL
```

Start the application:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker ps
```

View logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

---

# Environment Configuration

Sensitive configuration values should be stored through environment variables.

Example configuration files:

```text
.env.example
backend/.env.example
```

Actual `.env` files should not be committed to GitHub.

Sensitive values include:

* Database passwords
* Django secret key
* API keys
* Other deployment secrets

These values should be configured separately for local development and production deployment.

---

# Project Structure

```text
SwipeX/
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
│   ├── ml/
│   │   ├── train.py
│   │   └── model artifacts
│   │
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
├── dataset/
│
├── docs/
│   └── SwipeX_database.png
│
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

---

# End-to-End Candidate Workflow

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
Process Resume
   ↓
Extract Resume Information
   ↓
Calculate ATS + Matching Scores
   ↓
Generate Job Recommendations
   ↓
Skip / Save / Interested
   ↓
Store Swipe History
   ↓
Learn Candidate Preferences
   ↓
Update Recommendation Ranking
   ↓
View Job Details
   ↓
Review Swipe History / Explore Jobs
```

---

# Technology Stack

| Category            | Technology                                   |
| ------------------- | -------------------------------------------- |
| Frontend            | React                                        |
| Build Tool          | Vite                                         |
| Styling             | Tailwind CSS                                 |
| Animation           | Framer Motion                                |
| Backend             | Django                                       |
| API                 | Django REST Framework                        |
| Authentication      | Simple JWT                                   |
| Database            | PostgreSQL                                   |
| Machine Learning    | scikit-learn                                 |
| ML Models           | Multinomial Naive Bayes, Logistic Regression |
| Text Vectorization  | TF-IDF, HashingVectorizer                    |
| Data Processing     | NumPy, pandas                                |
| Resume Processing   | PDF and DOC/DOCX processing libraries        |
| AI Services         | Groq, where configured                       |
| Containerization    | Docker, Docker Compose                       |
| Version Control     | Git, GitHub                                  |
| Frontend Deployment | Vercel                                       |
| Backend Deployment  | Render                                       |

---

# Testing and Verification

The project includes backend testing and verification utilities for important application flows.

These include areas such as:

* Authentication
* Resume processing
* Job matching
* ATS calculation
* Recommendation generation
* Swipe history
* Database operations

Database migrations and management commands are also included as part of the backend setup.

---

# Security Practices

SwipeX includes basic application security practices such as:

* JWT authentication
* Protected API endpoints
* Environment-based configuration
* `.env` exclusion through `.gitignore`
* Resume file validation
* Database credentials managed through configuration
* Candidate-specific protected data

Production deployments should use secure environment variables and deployment-specific secrets.

---

# Future Enhancements

Potential future improvements include:

* More advanced recommendation models
* Improved duplicate-job detection
* Better skill normalization
* Explainable recommendation results
* Additional external job sources
* Recruiter-side functionality
* Improved resume parsing
* Advanced candidate analytics
* Real-time notifications
* More advanced personalization techniques

---

# Conclusion

SwipeX combines full-stack development, resume analysis, ATS matching, machine learning, semantic text processing, and behavioural personalization to create an interactive job discovery platform.

The core concept is:

```text
Understand the Candidate
        +
Understand the Job
        +
Learn from Candidate Behaviour
        ↓
Generate Relevant Job Recommendations
```

SwipeX transforms traditional job searching into an interactive and personalized job discovery experience.

---

# Internship Project

**SwipeX – Swipe-Based Intelligent Job Discovery and Career Assistance Platform**

Developed as part of the **Infosys Springboard Virtual Internship 7.0**.

---
