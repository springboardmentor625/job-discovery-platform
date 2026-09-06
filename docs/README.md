# SwipeX Database Schema

## Overview

The **SwipeX** database is designed to support an AI-powered job discovery platform that enables candidates to create professional profiles, upload resumes, receive AI-powered resume analysis, calculate ATS scores and job match probability, receive intelligent job recommendations, and apply for suitable job opportunities.

The database follows a **normalized relational design** to ensure data integrity, minimize redundancy, and efficiently manage relationships between users, resumes, companies, jobs, applications, and AI-generated analytics.

---

# Database Schema Diagram

The Entity-Relationship (ER) diagram below illustrates the complete database structure and relationships among all core entities.

> **Figure:** SwipeX Database Schema / Entity-Relationship Diagram

![SwipeX Database Schema](SwipeX_database.png)

---

# Database Tables

## 1. Users

Stores authentication and account information for all platform users.

### Primary Key

- user_id

### Important Attributes

- full_name
- email
- password_hash
- role
- phone
- profile_picture
- is_verified
- created_at

### Relationships

- One User has one Candidate Profile.
- One User can upload multiple Resumes.
- One User can submit multiple Applications.
- One User can receive multiple Recommendations.
- One User can receive multiple Notifications.
- One User can perform multiple Swipe actions.

---

## 2. Candidate Profile

Stores candidate-specific professional information.

### Primary Key

- profile_id

### Foreign Key

- user_id → Users

### Important Attributes

- headline
- summary
- location
- experience_years
- education
- projects
- certifications
- preferred_job_type
- preferred_location

### Relationship

- One-to-One with Users.

---

## 3. Companies

Stores employer information.

### Primary Key

- company_id

### Important Attributes

- company_name
- company_type
- industry
- website
- headquarters

### Relationship

- One Company can post multiple Jobs.

---

## 4. Jobs

Stores job listings published by companies.

### Primary Key

- job_id

### Foreign Key

- company_id → Companies

### Important Attributes

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

### Relationships

- One Company has many Jobs.
- One Job can receive multiple Applications.
- One Job can appear in multiple Recommendations.
- One Job can have multiple ATS Reports.
- One Job can have multiple Swipe records.

---

## 5. Resumes

Stores uploaded resumes and extracted information.

### Primary Key

- resume_id

### Foreign Key

- user_id → Users

### Important Attributes

- resume_name
- file_path
- extracted_skills
- uploaded_at
- is_default

### Relationships

- One User can upload multiple Resumes.
- One Resume can be used for multiple Applications.
- One Resume can generate multiple ATS Reports.

---

## 6. Applications

Stores job applications submitted by candidates.

### Primary Key

- application_id

### Foreign Keys

- user_id → Users
- job_id → Jobs
- resume_id → Resumes

### Important Attributes

- status
- applied_at

### Relationships

- Many Applications belong to one User.
- Many Applications belong to one Job.
- Many Applications use one Resume.

---

## 7. ATS Reports

Stores AI-generated resume evaluation results for a specific resume against a particular job.

### Primary Key

- ats_report_id

### Foreign Keys

- resume_id → Resumes
- job_id → Jobs

### Important Attributes

- ats_score
- match_percentage
- missing_skills
- missing_keywords
- suggestions
- analyzed_at

### Relationships

- One Resume can generate multiple ATS Reports.
- One Job can have multiple ATS Reports.

---

## 8. Recommendations

Stores AI-generated personalized job recommendations.

### Primary Key

- recommendation_id

### Foreign Keys

- user_id → Users
- job_id → Jobs

### Important Attributes

- recommendation_score
- recommendation_reason
- generated_at

### Relationships

- Many Recommendations belong to one User.
- Many Recommendations reference one Job.

---

## 9. Swipe History

Stores swipe interactions between candidates and job postings.

### Primary Key

- swipe_id

### Foreign Keys

- user_id → Users
- job_id → Jobs

### Important Attributes

- swipe_action
  - LEFT
  - RIGHT
  - SAVE
- swiped_at

### Relationships

- Many Swipe records belong to one User.
- Many Swipe records reference one Job.

---

## 10. Notifications

Stores notifications delivered to platform users.

### Primary Key

- notification_id

### Foreign Key

- user_id → Users

### Important Attributes

- title
- message
- is_read
- created_at

### Relationship

- One User can receive multiple Notifications.

---

# Database Relationships Summary

| Parent Table | Child Table | Relationship |
|--------------|------------|--------------|
| Users | Candidate Profile | One-to-One |
| Users | Resumes | One-to-Many |
| Users | Applications | One-to-Many |
| Users | Recommendations | One-to-Many |
| Users | Notifications | One-to-Many |
| Users | Swipe History | One-to-Many |
| Companies | Jobs | One-to-Many |
| Jobs | Applications | One-to-Many |
| Jobs | Recommendations | One-to-Many |
| Jobs | Swipe History | One-to-Many |
| Jobs | ATS Reports | One-to-Many |
| Resumes | Applications | One-to-Many |
| Resumes | ATS Reports | One-to-Many |

---

# AI Resume Analysis Workflow

The ATS evaluation pipeline follows these steps:

1. Candidate uploads a resume.
2. Resume content is extracted using an AI-powered parser.
3. Skills, education, experience, certifications, and projects are identified.
4. Resume content is compared against job requirements.
5. Matching and missing skills are identified.
6. ATS Score and Match Percentage are calculated.
7. Personalized improvement suggestions are generated.
8. Results are stored in the ATS Reports table and displayed to the candidate.

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

The SwipeX database is designed to support scalable, AI-driven recruitment workflows by integrating user management, resume parsing, ATS evaluation, intelligent job recommendations, swipe-based job discovery, and application tracking.

The relational schema maintains data consistency through well-defined primary and foreign key relationships while enabling efficient retrieval of candidate, resume, company, and job information for intelligent job matching and recommendation.

The modular design also allows future enhancements such as interview scheduling, recruiter dashboards, analytics, and machine learning models without significant changes to the core database architecture.