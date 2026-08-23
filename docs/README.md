# SwipeX Database Schema

## Overview

The SwipeX database is designed to support an AI-powered job discovery platform that enables candidates to create professional profiles, upload resumes, receive AI-based resume analysis, calculate job matching probability, and apply for suitable job opportunities. The database follows a relational design with normalized tables to maintain data integrity, reduce redundancy, and efficiently manage relationships between users, jobs, resumes, and ATS reports.

---

# Database Schema Diagram

The Entity-Relationship (ER) Diagram below illustrates the database structure and relationships between all entities.

> **Figure:** SwipeX Database Schema / Entity-Relationship Diagram

![SwipeX Database Schema](SwipeX%20database.png)

---

# Database Tables

## 1. Users

Stores authentication and account information for all platform users.

**Primary Key**
- user_id

**Important Attributes**
- full_name
- email
- password_hash
- role
- phone
- profile_picture
- is_verified
- created_at

**Relationships**
- One User has one Candidate Profile.
- One User can upload multiple Resumes.
- One User can receive multiple Notifications.
- One User can apply for multiple Jobs.
- One User can have multiple Recommendations.
- One User can perform multiple Swipe actions.

---

## 2. Candidate Profile

Stores candidate-specific professional information.

**Primary Key**
- profile_id

**Foreign Key**
- user_id → Users

**Important Attributes**
- headline
- summary
- location
- experience_years
- education
- projects
- certifications
- preferred_job_type
- preferred_location

**Relationship**
- One-to-One with Users.

---

## 3. Companies

Stores employer information.

**Primary Key**
- company_id

**Important Attributes**
- company_name
- company_type
- industry
- website
- headquarters

**Relationship**
- One Company can post multiple Jobs.

---

## 4. Jobs

Stores job listings available on the platform.

**Primary Key**
- job_id

**Foreign Key**
- company_id → Companies

**Important Attributes**
- title
- description
- location
- employment_type
- salary_min
- salary_max
- experience_required
- required_skills
- posted_date
- status

**Relationship**
- One Company has many Jobs.
- One Job can receive multiple Applications.
- One Job can appear in multiple Recommendations.
- One Job can have multiple ATS Reports.
- One Job can have multiple Swipe records.

---

## 5. Resumes

Stores uploaded resumes and extracted information.

**Primary Key**
- resume_id

**Foreign Key**
- user_id → Users

**Important Attributes**
- resume_name
- file_path
- extracted_skills
- uploaded_at
- is_default

**Relationship**
- One User can upload multiple Resumes.
- One Resume can generate multiple ATS Reports.

---

## 6. Applications

Stores job applications submitted by candidates.

**Primary Key**
- application_id

**Foreign Keys**
- user_id → Users
- job_id → Jobs
- resume_id → Resumes

**Important Attributes**
- status
- applied_at

**Relationship**
- Many-to-One with Users.
- Many-to-One with Jobs.
- Many-to-One with Resumes.

---

## 7. ATS Reports

Stores AI-generated resume analysis results.

**Primary Key**
- ats_report_id

**Foreign Keys**
- resume_id → Resumes
- job_id → Jobs

**Important Attributes**
- ats_score
- match_percentage
- missing_skills
- missing_keywords
- suggestions
- analyzed_at

**Relationship**
- One Resume can generate multiple ATS Reports.
- One Job can have multiple ATS Reports.

---

## 8. Recommendations

Stores AI-generated job recommendations.

**Primary Key**
- recommendation_id

**Foreign Keys**
- user_id → Users
- job_id → Jobs

**Important Attributes**
- recommendation_score
- recommendation_reason
- generated_at

**Relationship**
- Many Recommendations belong to one User.
- Many Recommendations reference one Job.

---

## 9. Swipe History

Stores swipe interactions between candidates and jobs.

**Primary Key**
- swipe_id

**Foreign Keys**
- user_id → Users
- job_id → Jobs

**Important Attributes**
- swipe_action
- swiped_at

**Relationship**
- Many Swipe records belong to one User.
- Many Swipe records reference one Job.

---

## 10. Notifications

Stores notifications sent to users.

**Primary Key**
- notification_id

**Foreign Key**
- user_id → Users

**Important Attributes**
- title
- message
- is_read
- created_at

**Relationship**
- One User can receive multiple Notifications.

---

# Database Relationships Summary

| Parent Table | Child Table | Relationship |
|--------------|------------|--------------|
| Users | Candidate Profile | One-to-One |
| Users | Resumes | One-to-Many |
| Users | Applications | One-to-Many |
| Users | Recommendations | One-to-Many |
| Users | Notifications | One-to-Many 
| Users | Swipe History | One-to-Many |
| Companies | Jobs | One-to-Many |
| Jobs | Applications | One-to-Many |
| Jobs | ATS Reports | One-to-Many |
| Jobs | Recommendations | One-to-Many |
| Jobs | Swipe History | One-to-Many |
| Resumes | Applications | One-to-Many |
| Resumes | ATS Reports | One-to-Many |

---

# AI Resume Analysis Workflow

The ATS module follows the workflow below:

1. Candidate uploads a resume.
2. Resume text is extracted using AI-powered parsing.
3. Skills, education, experience, and projects are identified.
4. Resume content is compared with job requirements.
5. Matching skills and missing skills are identified.
6. ATS Score and Match Probability are calculated.
7. Improvement suggestions are generated.
8. Results are displayed to the candidate.

---

# Technology Stack

- PostgreSQL
- Django REST Framework
- React.js
- Docker
- AI Resume Parser
- PDF Processing
- Natural Language Processing (NLP)

---
# Conclusion

The SwipeX database is designed to support scalable recruitment workflows by integrating user management, resume analysis, ATS evaluation, AI-powered recommendations, job applications, and swipe-based job discovery. The relational schema ensures data consistency while enabling efficient retrieval of candidate, job, and resume information for intelligent job matching.
