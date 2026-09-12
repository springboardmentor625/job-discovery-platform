# SwipeX – API Documentation

## 1. Overview

SwipeX uses a REST API built with **Django REST Framework**.

The API handles:

- Candidate registration and authentication
- Candidate profile management
- Resume upload and processing
- Job retrieval and filtering
- Job-specific ATS and skill matching
- Personalized recommendations
- Swipe actions
- Swipe history
- Resume viewing and downloading

All protected APIs require an authenticated user.

---

# 2. Authentication

## Register

Creates a new user account.

```http
POST /api/register/
````

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

Returns the newly created user information.

---

## Login

Authenticates a candidate and returns JWT authentication tokens.

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

The access token is sent with protected requests:

```http
Authorization: Bearer ACCESS_TOKEN
```

---

# 3. Candidate Profile API

## Get Current Candidate

Returns the authenticated candidate's profile.

```http
GET /api/candidates/me/
```

### Response

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

Updates the authenticated candidate profile.

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

The backend validates profile information before saving it.

---

# 4. Resume API

## Get Candidate Resume

Returns the authenticated candidate's resume information.

```http
GET /api/resumes/
```

### Response

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

---

## Upload Resume

Uploads a new PDF or DOCX resume.

```http
POST /api/resumes/
```

### Request

`multipart/form-data`

```text
resume_file = <resume.pdf>
```

### Validation

The backend checks:

* File is provided
* File is not empty
* File is PDF or DOCX
* File size is at most 5 MB
* File structure is valid
* Resume contains readable text
* Resume contains sufficient resume-related information
* Name on the resume matches the candidate profile
* Phone number on the resume matches the candidate profile

### Success

```json
{
  "message": "Resume processed successfully"
}
```

The uploaded resume is then processed for:

* Text extraction
* Skill extraction
* Experience extraction
* Education extraction
* ATS analysis
* Resume feedback

---

# 5. Resume File API

## View Resume

Returns the uploaded resume file for viewing.

```http
GET /api/resumes/{resume_id}/file/
```

For PDF files, the browser can open the document directly.

For DOCX files, SwipeX can use the generated PDF preview.

---

## Download Resume

Downloads the original resume file.

```http
GET /api/resumes/{resume_id}/file/?download=true
```

---

## Delete Resume

Deletes the authenticated candidate's resume.

```http
DELETE /api/resumes/{resume_id}/
```

---

# 6. Jobs API

## Get Jobs

Returns jobs available to the authenticated candidate.

```http
GET /api/jobs/
```

Jobs are returned using server-side pagination.

The current page size is:

```text
6 jobs per page
```

---

## Search Jobs

Jobs can be searched using the `search` query parameter.

```http
GET /api/jobs/?search=python
```

Search can consider fields such as:

* Job title
* Company
* Location
* Required skills
* Preferred skills
* Description

---

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

# 7. Job-Specific Matching

Job information returned by the API can include candidate-specific matching information.

Examples include:

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

The matching information is calculated using the authenticated candidate's profile and resume.

---

# 8. Recommendations API

## Get Recommendations

Returns personalized job recommendations.

```http
GET /api/recommendations/
```

The recommendation system considers:

* Candidate profile
* Resume information
* Skills
* Preferred roles
* Preferred locations
* Work mode
* ATS compatibility
* Semantic similarity
* Experience fit
* Swipe behaviour

---

## Refresh Recommendations

Requests a fresh recommendation set.

```http
GET /api/recommendations/?refresh=true
```

The recommendation system excludes jobs that the candidate has already processed.

---

# 9. Swipe API

## Create Swipe

Stores the candidate's decision for a job.

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

Supported decisions are:

```text
interested
saved
skipped
```

Legacy values `right` and `left` are normalized by the backend.

---

## Swipe Behaviour

Swipe interactions act as recommendation feedback.

```text
Interested
    ↓
Positive signal

Saved
    ↓
Positive signal

Skipped
    ↓
Negative signal
```

The recommendation system can use these signals to improve future ranking.

---

# 10. Swipe History API

## Get Swipe History

Returns the authenticated candidate's previous swipe decisions.

```http
GET /api/swipes/
```

### Filter by Decision

Interested:

```http
GET /api/swipes/?decision=interested
```

Saved:

```http
GET /api/swipes/?decision=saved
```

Skipped:

```http
GET /api/swipes/?decision=skipped
```

---

# 11. Error Responses

The API returns validation errors using standard Django REST Framework responses.

Example:

```json
{
  "phone": [
    "Enter a valid 10-digit Indian mobile number."
  ]
}
```

Resume validation example:

```json
{
  "resume_file": [
    "Only PDF and DOCX resume files are allowed."
  ]
}
```

Resume identity validation example:

```json
{
  "resume_file": [
    "Resume rejected: the phone number on the resume does not match your profile phone number."
  ]
}
```

---

# 12. Authentication and Authorization

Protected endpoints require a valid JWT access token.

Example:

```http
Authorization: Bearer ACCESS_TOKEN
```

The backend uses the authenticated user to determine which:

* Profile
* Resume
* Swipe history
* Recommendations
* Jobs

are available to the candidate.

Candidates cannot access another candidate's private resume or swipe history.

---

# 13. API Workflow

The main API workflow is:

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
Get Recommendations
   ↓
Swipe / Save / Interested
   ↓
Get Updated Recommendations
   ↓
View Swipe History
   ↓
Explore Jobs
```

---

# 14. API Technology

The API layer is implemented using:

```text
Django
Django REST Framework
Simple JWT
PostgreSQL
```

The API communicates with the React frontend using JSON and multipart form data for file uploads.

---

# 15. Summary

SwipeX APIs provide the complete backend interface for the candidate job-discovery workflow.

The main API areas are:

| API Area        | Purpose                                    |
| --------------- | ------------------------------------------ |
| Authentication  | Registration and login                     |
| Candidate       | Profile management                         |
| Resume          | Upload, process, view, download and delete |
| Jobs            | Search, filtering and pagination           |
| Recommendations | Personalized job ranking                   |
| Swipes          | Candidate job decisions                    |
| Swipe History   | Previous candidate interactions            |

```
