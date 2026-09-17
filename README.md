# SwipeX – Swipe-Based Intelligent Job Discovery and Career Assistance Platform

SwipeX is a full-stack intelligent job discovery platform that helps candidates discover relevant job opportunities through a swipe-based interface.

The platform combines candidate profiles, resume analysis, ATS scoring, machine-learning-based prediction, semantic text matching, and swipe-based personalization to provide relevant job recommendations.

The project focuses on the **candidate workflow**.

---

## Project Objective

SwipeX aims to simplify traditional job searching by allowing candidates to:

* Register and log in securely
* Create and manage their profile
* Upload and analyze their resume
* View resume-related prediction results
* Discover personalized job recommendations
* Swipe left to skip jobs
* Swipe right to show interest
* Save jobs
* Review swipe history
* Explore jobs using search and filters
* View complete job details

---

## Key Features

### 1. Candidate Registration and Authentication

* Candidate registration and login
* JWT-based authentication
* Protected frontend routes
* Candidate-specific data
* Logout functionality

### 2. Candidate Profile

Candidates can manage information such as:

* Full name
* Email and phone number
* Profile picture
* Skills
* Education
* Experience
* Projects
* Certifications
* Career preferences

Profile information is used during job matching and recommendation generation.

### 3. Resume Upload and Analysis

Candidates can upload supported resume files, including:

* PDF
* DOC
* DOCX

The resume-processing workflow includes:

```text
Resume Upload
      ↓
File Validation
      ↓
Text Extraction
      ↓
Resume Information Processing
      ↓
Skill Extraction
      ↓
ATS and Recommendation Preparation
```

The extracted resume information is used for ATS calculation, job matching, and recommendation generation.

---

## AI and Machine Learning Pipeline

SwipeX uses different machine-learning techniques for different tasks.

### 1. Multinomial Naive Bayes

Multinomial Naive Bayes is used for resume-related prediction.

The model uses:

* TF-IDF text features
* Resume and job-related text
* A trained machine-learning model
* Probability prediction during resume processing

The predicted probability is stored with the candidate's resume information.

### 2. Logistic Regression

Logistic Regression is used for learning candidate preferences from swipe behaviour.

The recommendation system considers positive and negative interactions, such as:

* Interested
* Saved
* Skipped

The Logistic Regression preference model is trained when sufficient feedback is available, including at least:

* 3 positive interactions
* 3 negative interactions

Before enough swipe data is available, SwipeX uses a cold-start recommendation strategy based on candidate and job information.

### 3. HashingVectorizer

SwipeX uses `HashingVectorizer` from scikit-learn for lightweight semantic text features.

It converts resume and job-related text into numerical vectors that can be used for similarity calculations.

The current implementation uses a lightweight vectorization approach rather than Sentence Transformers or the `all-MiniLM-L6-v2` model.

---

## Job-Specific ATS Matching

SwipeX calculates ATS compatibility against a specific job.

The job-specific ATS score considers:

| Component           |   Weight |
| ------------------- | -------: |
| Skill Match         |      45% |
| Semantic Similarity |      30% |
| Experience Fit      |      20% |
| Lexical Relevance   |       5% |
| **Total**           | **100%** |

### Skill Match

Skill Match represents how many of the required job skills are present in the candidate's skills or resume information.

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

Skill Match = 3 / 5 × 100 = 60%
```

The score is based on the matching skills identified by the system.

---

## Personalized Recommendation System

The recommendation system combines candidate information, job information, ATS results, semantic similarity, and swipe behaviour.

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
Swipe History
       ↓
Recommendation Scoring
       ↓
Recommended Jobs
```

### Cold-Start Recommendations

For candidates with limited or no swipe history, SwipeX uses available information such as:

* Candidate skills
* Resume information
* Preferred roles
* Preferred locations
* Work mode
* Experience
* Job requirements
* ATS compatibility
* Semantic similarity

This allows recommendations to be generated before enough behavioural data is collected.

### Continuous Learning from Swipes

Candidate interactions are stored as behavioural signals.

The recommendation system uses these interactions to improve future job ranking.

```text
Candidate Swipe
      ↓
Swipe Stored in Database
      ↓
Positive or Negative Feedback
      ↓
Preference Learning
      ↓
Updated Recommendation Ranking
```

Previously processed jobs are excluded from future recommendation results.

---

## Swipe-Based Job Discovery

The main discovery experience is the **Swipe Deck**.

Each job is displayed as a recommendation card. Candidates can:

* Drag left to skip a job
* Drag right to show interest
* Save a job
* Open complete job details

Framer Motion is used to support the swipe interaction.

---

## Recommendation Scoring

SwipeX uses different scoring strategies depending on the amount of candidate feedback.

### Cold-Start Scoring

For candidates with limited swipe history, the recommendation score considers:

| Component      | Weight |
| -------------- | -----: |
| ATS Score      |    35% |
| Skill Match    |    30% |
| Semantic Fit   |    20% |
| Experience Fit |    15% |

### Preference-Based Scoring

When sufficient positive and negative swipe feedback is available, the recommendation system also uses learned preference information.

The preference-based ranking considers:

* Learned swipe preference
* ATS compatibility
* Skill match
* Semantic similarity
* Experience fit

This allows recommendations to become more personalized as the candidate interacts with jobs.

---

## Candidate-Facing Recommendation Information

The recommendation interface can display information such as:

* Job title
* Company
* Location
* ATS score
* Skill match
* Skills already matched
* Skills to improve
* Experience requirements
* Job description

The internal recommendation score combines multiple signals, while the user interface presents understandable job-related information.

---

## Job Details

Candidates can open a detailed view of a job.

Job details may include:

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

## Swipe History

Swipe History allows candidates to review their previous job interactions.

Available categories include:

* All
* Interested
* Saved
* Skipped

Swipe history also provides behavioural feedback for the recommendation system.

---

## Explore Jobs

SwipeX provides an Explore Jobs page for candidates who prefer traditional job browsing.

Features include:

* Job search
* Backend-side filtering
* Server-side pagination
* Job details
* Job recommendations through the backend API

Jobs are retrieved page by page instead of loading the complete dataset into the browser.

---

## Swipe Deck vs Explore Jobs

### Swipe Deck

Designed for:

* Fast job discovery
* Personalized recommendations
* Swipe-based interaction
* Behavioural feedback

### Explore Jobs

Designed for:

* Traditional job browsing
* Searching
* Filtering
* Viewing multiple job listings
* Opening job details

The Swipe Deck is the primary experience because swipe-based job discovery is the core concept of SwipeX.

---

## Database

SwipeX uses **PostgreSQL** as its relational database.

The main database entities include:

* Users
* Candidate profiles
* Resumes
* Jobs
* Companies
* Job swipes
* Applications

The database diagram is available at:

```text
docs/SwipeX_database.png
```

The exact database structure is defined by the Django models and migrations in the backend.

---

## Backend

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
* Database operations

General backend flow:

```text
API Request
    ↓
Django View
    ↓
Serializer
    ↓
Service or Utility
    ↓
Database or ML Processing
    ↓
API Response
```

---

## Frontend

The frontend is built using:

* React
* Vite
* Tailwind CSS
* Framer Motion

The frontend includes candidate-facing pages such as:

* Dashboard
* Jobs
* Resume
* Profile
* Edit Profile
* Swipe History
* Settings

The application uses a shared authenticated layout and sidebar navigation.

---

## Authentication Flow

SwipeX uses JWT authentication.

```text
Login
  ↓
Credential Validation
  ↓
JWT Access Token
  ↓
Frontend Stores Token
  ↓
Bearer Token Added to API Requests
  ↓
Protected Backend Endpoints
```

Only authenticated candidates can access protected functionality.

---

## Resume Processing Technologies

Resume processing uses libraries for document handling and text extraction, including support for PDF and DOC/DOCX files.

The extracted information is used by:

* Resume analysis
* Skill matching
* ATS calculation
* Recommendation generation

DOC/DOCX preview processing may use headless LibreOffice conversion when required.

---

## Job Import

SwipeX supports importing job postings from available datasets.

The import process stores job information in PostgreSQL so that jobs can be used for:

* Recommendations
* Explore Jobs
* ATS matching
* Swipe Deck
* Job details

Django management commands are included for importing job data.

---

## Docker

SwipeX is containerized using Docker and Docker Compose.

The application is separated into:

```text
Frontend
    ↓
Backend
    ↓
PostgreSQL
```

Start the application with:

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

Stop containers:

```bash
docker compose down
```

---

## Environment Configuration

Sensitive information should be stored through environment variables.

Example configuration files include:

```text
.env.example
backend/.env.example
```

Actual `.env` files should not be committed to GitHub.

Sensitive values include:

* Database passwords
* Django secret keys
* API keys

These values should be configured separately for local development and deployment.

---

## Project Structure

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
├── docs/
│   └── SwipeX_database.png
│
├── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

---

## End-to-End Candidate Workflow

```text
Register
   ↓
Login
   ↓
Create or Update Profile
   ↓
Upload Resume
   ↓
Process Resume
   ↓
Extract Resume Information
   ↓
Calculate ATS and Matching Scores
   ↓
Generate Job Recommendations
   ↓
Skip / Save / Show Interest
   ↓
Store Swipe History
   ↓
Learn Candidate Preferences
   ↓
Update Recommendation Ranking
   ↓
View Job Details
   ↓
Review Swipe History or Explore Jobs
```

---

## Technology Stack

| Category           | Technology                                   |
| ------------------ | -------------------------------------------- |
| Frontend           | React                                        |
| Build Tool         | Vite                                         |
| Styling            | Tailwind CSS                                 |
| Animation          | Framer Motion                                |
| Backend            | Django                                       |
| API                | Django REST Framework                        |
| Authentication     | Simple JWT                                   |
| Database           | PostgreSQL                                   |
| Machine Learning   | scikit-learn                                 |
| Data Processing    | NumPy, pandas                                |
| Text Vectorization | TF-IDF, HashingVectorizer                    |
| ML Models          | Multinomial Naive Bayes, Logistic Regression |
| Resume Processing  | PDF and DOC/DOCX processing libraries        |
| AI Services        | Groq, where configured                       |
| Containerization   | Docker, Docker Compose                       |
| Version Control    | Git, GitHub                                  |

---

## Testing and Verification

The project includes backend utilities and testing support for important application flows, including:

* Authentication
* Resume processing
* Job matching
* Recommendation generation
* Swipe history
* Database operations

Database migrations and management commands are included as part of the backend setup.

---

## Security Practices

The project includes basic security practices such as:

* JWT authentication
* Protected API endpoints
* Environment-based configuration
* `.env` exclusion through `.gitignore`
* Resume file validation
* Database credentials managed through configuration

Production deployments should use secure secret values and deployment-specific environment variables.

---

## Future Enhancements

Potential future improvements include:

* More advanced recommendation models
* Improved duplicate-job detection
* Better skill normalization
* Explainable recommendation results
* More external job sources
* Recruiter-side functionality
* Advanced candidate analytics
* Improved resume parsing
* Real-time notifications

---

## Conclusion

SwipeX combines full-stack development, resume analysis, ATS matching, machine learning, semantic text processing, and behavioural personalization to create an interactive job discovery experience.

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

SwipeX transforms traditional job searching into an interactive and personalized job discovery platform.

---

## Internship Project

**SwipeX – Swipe-Based Intelligent Job Discovery and Career Assistance Platform**

Developed as part of the **Infosys Springboard Virtual Internship 7.0**.
