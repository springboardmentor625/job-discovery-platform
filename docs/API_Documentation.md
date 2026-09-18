# SwipeX – API Documentation

## 1. Overview

SwipeX provides a REST API built using **Django REST Framework (DRF)**.

The API supports the candidate-side job discovery workflow, including:

- Candidate registration and authentication
- Candidate profile management
- Resume upload and processing
- Resume viewing, downloading, and deletion
- Job retrieval
- Job search and filtering
- Job-specific ATS and matching information
- Personalized job recommendations
- Swipe actions
- Swipe history

The backend uses **JWT authentication** for protected APIs.

---

# 2. API Base URLs

## Local Development

```text
http://127.0.0.1:8001
````

## Production Backend

```text
https://swipex-backend-n4y5.onrender.com
```

The production frontend is deployed at:

```text
https://swipex-frontend-zeta.vercel.app/
```

---

# 3. Authentication

SwipeX uses **JSON Web Tokens (JWT)** for authentication.

The authentication flow is:

```text
Register
   ↓
Login
   ↓
JWT Access Token
   ↓
Frontend Stores Token
   ↓
Bearer Token
   ↓
Protected API Requests
```

Protected requests use:

```http
Authorization: Bearer ACCESS_TOKEN
```

---

## Register

Creates a new candidate account.

```http
POST /api/register/
```

### Request

```json
{
  "first_name": "Example",
  "last_name": "User",
  "email": "example@email.com",
  "password": "ExamplePassword123"
}
```

### Response

Returns information related to the newly created user.

---

## Login

Authenticates a candidate and returns JWT tokens.

```http
POST /api/login/
```

### Request

```json
{
  "email": "example@email.com",
  "password": "ExamplePassword123"
}
```

### Response

```json
{
  "access": "ACCESS_TOKEN",
  "refresh": "REFRESH_TOKEN"
}
```

The access token is used for protected API requests:

```http
Authorization: Bearer ACCESS_TOKEN
```

---

# 4. Candidate Profile API

## Get Current Candidate

Returns the authenticated candidate's profile information.

```http
GET /api/candidates/me/
```

### Response

Example:

```json
{
  "id": 1,
  "full_name": "Example User",
  "email": "example@email.com",
  "phone": "9876543210",
  "current_location": "Hyderabad, India",
  "education": "B.Tech in Computer Science",
  "experience": "0-1 years",
  "preferred_job_roles": "Software Engineer, Backend Developer",
  "preferred_locations": "Hyderabad, Bengaluru",
  "preferred_work_mode": "Remote",
  "career_interests": "Artificial Intelligence, Cloud Computing",
  "skills": "Python, Java, SQL",
  "bio": "Computer science student interested in software development."
}
```

---

## Update Candidate Profile

Updates the authenticated candidate's profile.

```http
PATCH /api/candidates/me/
```

### Request

```json
{
  "full_name": "Example User",
  "phone": "9876543210",
  "current_location": "Hyderabad, India",
  "education": "B.Tech in Computer Science",
  "experience": "0-1 years",
  "preferred_job_roles": "Software Engineer, Backend Developer",
  "preferred_locations": "Hyderabad, Bengaluru",
  "preferred_work_mode": "Remote",
  "career_interests": "Artificial Intelligence, Cloud Computing",
  "skills": "Python, Java, SQL",
  "bio": "Computer science student interested in software development."
}
```

The backend validates candidate profile information before saving it.

---

# 5. Resume API

## Get Candidate Resume

Returns resume information associated with the authenticated candidate.

```http
GET /api/resumes/
```

### Response

Example:

```json
[
  {
    "id": 10,
    "original_filename": "resume.pdf",
    "display_filename": "resume.pdf",
    "extracted_skills": "Python, Django, SQL",
    "detected_skills": [
      "Python",
      "Django",
      "SQL"
    ],
    "ats_score": 78,
    "probability_score": 81
  }
]
```

The exact response fields depend on the current resume serializer.

---

# 6. Upload Resume

Uploads and processes a candidate resume.

```http
POST /api/resumes/
```

### Request

The request uses:

```text
multipart/form-data
```

Example:

```text
resume_file = <resume.pdf>
```

---

## Resume Validation

The backend validates the uploaded resume.

Validation includes checks such as:

* File is provided
* File is not empty
* Supported file format
* File size
* File structure
* Readable text
* Resume-related information
* Candidate identity information

Supported resume formats include:

```text
PDF
DOC
DOCX
```

The maximum supported resume size is:

```text
5 MB
```

---

## Resume Identity Validation

SwipeX validates important information extracted from the resume against the candidate profile.

For example:

```text
Resume Name
     ↓
Candidate Profile Name

Resume Phone
     ↓
Candidate Profile Phone
```

If required identity information does not match, the resume can be rejected.

---

## Resume Processing Flow

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
ATS Processing
      ↓
ML Prediction
      ↓
Recommendation Preparation
```

---

# 7. Resume File API

## View Resume

Returns the uploaded resume file.

```http
GET /api/resumes/{resume_id}/file/
```

For PDF files, the browser can display the document directly.

For DOC/DOCX files, SwipeX can generate a PDF preview when required.

---

## Download Resume

Downloads the resume file.

```http
GET /api/resumes/{resume_id}/file/?download=true
```

---

## Delete Resume

Deletes the authenticated candidate's resume.

```http
DELETE /api/resumes/{resume_id}/
```

Candidates can only operate on their own resume data.

---

# 8. Resume Machine Learning

SwipeX uses machine learning during resume processing.

## Multinomial Naive Bayes

The resume-related prediction component uses:

```text
TF-IDF
   ↓
Multinomial Naive Bayes
   ↓
Prediction Probability
```

The predicted probability is stored with the candidate's resume information.

This model is used for **resume-related prediction**, not for the complete recommendation system.

---

# 9. Job API

## Get Jobs

Returns jobs available to the authenticated candidate.

```http
GET /api/jobs/
```

Jobs are retrieved using server-side pagination.

The current page size is:

```text
6 jobs per page
```

---

# 10. Search Jobs

Jobs can be searched using the `search` query parameter.

```http
GET /api/jobs/?search=python
```

Search can consider job-related fields such as:

* Job title
* Company
* Location
* Required skills
* Preferred skills
* Job description

---

# 11. Job Filters

## Filter by Skills

```http
GET /api/jobs/?skills=Python,SQL
```

Multiple skills can be provided as comma-separated values.

---

## Filter by Location

```http
GET /api/jobs/?location=Hyderabad
```

---

## Filter by Work Mode

```http
GET /api/jobs/?work_mode=Remote
```

Supported work modes include:

```text
All
Remote
Hybrid
On-site
```

---

## Filter by Experience

```http
GET /api/jobs/?experience=entry
```

Supported categories include:

```text
entry
mid
senior
```

---

# 12. Job-Specific Matching

SwipeX provides candidate-specific matching information for jobs.

Example:

```json
{
  "id": 25,
  "title": "Software Engineer",
  "company": "Example Company",
  "location": "Hyderabad",
  "ats_score": 82,
  "skill_match_percentage": 75,
  "matched_skills": [
    "Python",
    "Django",
    "SQL"
  ],
  "missing_skills": [
    "Docker"
  ]
}
```

The matching information is calculated using the authenticated candidate's profile and resume information.

---

# 13. Job-Specific ATS

SwipeX calculates ATS compatibility against a specific job.

The current job-specific ATS calculation uses:

| Component           |   Weight |
| ------------------- | -------: |
| Skill Match         |      45% |
| Semantic Similarity |      30% |
| Experience Fit      |      20% |
| Lexical Relevance   |       5% |
| **Total**           | **100%** |

The ATS score combines candidate and job information.

---

## Skill Match

Skill Match represents the percentage of required job skills matched by the candidate.

Example:

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

---

# 14. Semantic Matching

SwipeX uses lightweight text vectorization for semantic features.

The current implementation uses:

```text
HashingVectorizer
```

Configuration includes:

```text
n_features = 1024
norm = l2
ngram_range = (1, 2)
```

The vectorized resume and job text are used to calculate similarity-related features.

SwipeX's current implementation does **not** rely on:

```text
Sentence Transformers
all-MiniLM-L6-v2
```

for the semantic matching pipeline.

---

# 15. Recommendations API

## Get Recommendations

Returns personalized job recommendations for the authenticated candidate.

```http
GET /api/recommendations/
```

The recommendation system can consider:

* Candidate profile
* Resume information
* Extracted skills
* Preferred job roles
* Preferred locations
* Work mode
* ATS compatibility
* Skill matching
* Semantic similarity
* Experience fit
* Swipe behaviour

---

## Refresh Recommendations

Requests a fresh recommendation set.

```http
GET /api/recommendations/?refresh=true
```

Previously processed jobs are excluded from recommendation results.

---

# 16. Recommendation System

SwipeX uses different recommendation strategies depending on the available candidate feedback.

The general process is:

```text
Candidate Profile
       +
Resume
       +
Job Requirements
       +
ATS Score
       +
Skill Match
       +
Semantic Similarity
       +
Swipe History
       ↓
Recommendation Scoring
       ↓
Recommended Jobs
```

---

## Cold-Start Recommendation

When sufficient swipe history is not available, SwipeX uses candidate and job information to generate recommendations.

The cold-start scoring uses:

| Component      |   Weight |
| -------------- | -------: |
| ATS Score      |      35% |
| Skill Match    |      30% |
| Semantic Fit   |      20% |
| Experience Fit |      15% |
| **Total**      | **100%** |

This allows recommendations to be generated for new candidates.

---

# 17. Swipe Preference Learning

Swipe behaviour is used as recommendation feedback.

The available candidate actions are:

```text
Interested
Saved
Skipped
```

These actions are treated as behavioural signals.

```text
Interested
    ↓
Positive Signal

Saved
    ↓
Positive Signal

Skipped
    ↓
Negative Signal
```

---

## Logistic Regression

SwipeX uses **Logistic Regression** for preference learning when sufficient positive and negative swipe feedback is available.

The preference model requires at least:

```text
3 Positive Interactions
3 Negative Interactions
```

The model uses similarity-based features to learn the candidate's preferences.

The process is:

```text
Swipe History
      ↓
Positive / Negative Interactions
      ↓
Similarity Features
      ↓
Logistic Regression
      ↓
Learned Preference
      ↓
Recommendation Ranking
```

Before sufficient feedback is available, the cold-start recommendation strategy is used.

---

# 18. Swipe API

## Create Swipe

Stores a candidate's decision for a job.

```http
POST /api/swipes/
```

### Request

```json
{
  "job_id": 25,
  "decision": "interested"
}
```

Supported decisions include:

```text
interested
saved
skipped
```

Legacy values such as:

```text
right
left
```

can be normalized by the backend.

---

# 19. Swipe History API

## Get Swipe History

Returns the authenticated candidate's previous swipe interactions.

```http
GET /api/swipes/
```

---

## Filter by Decision

### Interested

```http
GET /api/swipes/?decision=interested
```

### Saved

```http
GET /api/swipes/?decision=saved
```

### Skipped

```http
GET /api/swipes/?decision=skipped
```

---

# 20. Recommendation and Swipe Workflow

The recommendation feedback cycle is:

```text
Get Recommendations
        ↓
Display Job
        ↓
Candidate Swipes
        ↓
POST /api/swipes/
        ↓
Swipe Stored
        ↓
Behavioural Feedback
        ↓
Preference Learning
        ↓
Updated Recommendation Ranking
```

This allows the recommendation system to become more personalized as candidate interactions increase.

---

# 21. Error Responses

The API uses standard Django REST Framework validation responses.

Example:

```json
{
  "phone": [
    "Enter a valid 10-digit Indian mobile number."
  ]
}
```

---

## Resume Format Error

```json
{
  "resume_file": [
    "Only PDF and DOCX resume files are allowed."
  ]
}
```

---

## Resume Identity Validation Error

Example:

```json
{
  "resume_file": [
    "Resume rejected: the phone number on the resume does not match your profile phone number."
  ]
}
```

---

# 22. Authentication and Authorization

Protected endpoints require a valid JWT access token.

Example:

```http
Authorization: Bearer ACCESS_TOKEN
```

The authenticated user determines which candidate-specific data can be accessed.

Protected candidate information includes:

* Candidate profile
* Resume
* Swipe history
* Recommendations

Candidates cannot access another candidate's private resume or swipe history.

---

# 23. API Workflow

The main candidate API workflow is:

```text
Register
   ↓
Login
   ↓
Get / Update Profile
   ↓
Upload Resume
   ↓
Resume Processing
   ↓
Get Jobs / Recommendations
   ↓
Swipe / Save / Interested
   ↓
Swipe Stored
   ↓
Updated Recommendations
   ↓
View Swipe History
   ↓
Explore Jobs
   ↓
View Job Details
```

---

# 24. API Technology

The API layer is implemented using:

```text
Django
Django REST Framework
Simple JWT
PostgreSQL
scikit-learn
NumPy
pandas
```

The API communicates with the React frontend using:

```text
JSON
```

and:

```text
multipart/form-data
```

for resume file uploads.

---

# 25. API Deployment

The SwipeX backend is deployed on Render.

Production backend:

```text
https://swipex-backend-n4y5.onrender.com
```

The frontend is deployed on Vercel:

```text
https://swipex-frontend-zeta.vercel.app/
```

The production architecture is:

```text
React Frontend
      ↓
Vercel
      ↓
Django REST API
      ↓
Render
      ↓
PostgreSQL
```

---

# 26. API Summary

| API Area        | Purpose                                    |
| --------------- | ------------------------------------------ |
| Authentication  | Registration and login                     |
| Candidate       | Profile management                         |
| Resume          | Upload, process, view, download and delete |
| Jobs            | Search, filtering and pagination           |
| Matching        | Job-specific ATS and matching information  |
| Recommendations | Personalized job ranking                   |
| Swipes          | Candidate job decisions                    |
| Swipe History   | Previous candidate interactions            |

---

# 27. Overall Architecture

```text
                    SwipeX
                      │
          ┌───────────┴───────────┐
          │                       │
      React Frontend         Django Backend
          │                       │
          │                 Django REST API
          │                       │
          │              ┌────────┴────────┐
          │              │                 │
          │           PostgreSQL        AI / ML
          │                                │
          │                 ┌──────────────┼──────────────┐
          │                 │              │              │
          │              Naive Bayes  Logistic Regression HashingVectorizer
          │
          └────────────── API Communication
```

---

# 28. Summary

SwipeX provides a REST API for the complete candidate-side job discovery workflow.

The API supports:

```text
Authentication
     ↓
Candidate Profile
     ↓
Resume Processing
     ↓
ATS & Matching
     ↓
Job Discovery
     ↓
Recommendations
     ↓
Swipe Feedback
     ↓
Preference Learning
     ↓
Personalized Ranking
```

SwipeX combines traditional backend APIs with machine-learning-based prediction, text similarity, ATS matching, and behavioural personalization to create an intelligent job discovery platform.
