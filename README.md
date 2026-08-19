# SwipeX — Swipe-Based Intelligent Job Discovery & Career Assistance Platform

SwipeX is a full-stack job discovery and career assistance platform designed to help candidates discover relevant job opportunities through profile-based matching, resume analysis, and a swipe-based job discovery experience.

The platform ranks jobs according to the candidate's skills, experience, location, and salary preferences, allowing candidates to quickly explore, save, like, reject, and apply for relevant opportunities.

---

## 🚀 Current Development Status

### Candidate Module — Completed

The current version of SwipeX focuses on completing the Candidate Workflow.

Implemented:

- User Registration
- User Login & Authentication
- Candidate Profile Management
- Resume Upload
- PDF/DOCX Resume Parsing
- ATS Resume Analysis
- Resume Skill Detection
- Resume Section Analysis
- Job Dataset Integration
- Candidate-Based Job Matching
- Match Score Calculation
- Swipe-Based Job Discovery
- Like Job
- Reject Job
- Save Job
- Unsave Job
- Saved Jobs
- Job Details
- Apply for Job
- Duplicate Application Prevention
- My Applications
- Application Status Tracking
- Candidate Dashboard

Recruiter and Admin modules are planned for the next development phase.

---

# 🔄 Candidate Workflow

```text
Registration
     ↓
Login
     ↓
Candidate Dashboard
     ↓
Complete Candidate Profile
     ↓
Upload Resume
     ↓
Resume Parsing
     ↓
ATS Resume Analysis
     ↓
Job Matching
     ↓
Discover Jobs
     ↓
┌───────────────┬───────────────┬───────────────┐
│     Reject    │      Save     │      Like     │
└───────────────┴───────────────┴───────────────┘
                       ↓
                  Saved Jobs
                       ↓
                  View Job
                       ↓
                  Apply Job
                       ↓
               My Applications