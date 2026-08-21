# Database Schema & Entity Relationship Model

This document outlines the database schema for the **Job Discovery Platform (SwipeX)**, including relational models, field data types, foreign keys, and the **Candidate Skill DNA & Verification Matrix**.

---

## 📊 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ JOBS : "posts (recruiter)"
    USERS ||--o{ APPLICATIONS : "applies (seeker)"
    USERS ||--o{ SWIPES : "swipes (seeker)"
    USERS ||--o{ SAVED_JOBS : "bookmarks"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o| PROFILES : "has"
    USERS ||--o{ CANDIDATE_SKILL_DNA : "possesses"
    USERS ||--o{ SKILL_ENDORSEMENTS : "endorses"
    
    JOBS ||--o{ APPLICATIONS : "receives"
    JOBS ||--o{ SWIPES : "targeted_by"
    JOBS ||--o{ SAVED_JOBS : "saved_in"
    JOBS ||--o{ ATS_REPORTS : "evaluates"
    
    APPLICATIONS ||--o| ATS_REPORTS : "generates"
    
    CANDIDATE_SKILL_DNA ||--o{ SKILL_ENDORSEMENTS : "receives"

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        boolean is_active
        datetime created_at
    }

    JOBS {
        int id PK
        int recruiter_id FK
        string title
        string company
        string company_type
        string location
        string job_type
        int salary_min
        int salary_max
        text skills_json
        text description
        datetime posted_at
        boolean is_active
    }

    APPLICATIONS {
        int id PK
        int job_id FK
        int seeker_id FK
        string status
        float match_score
        text reviewer_notes
        float reviewer_score
        datetime interview_at
        datetime created_at
        datetime updated_at
    }

    CANDIDATE_SKILL_DNA {
        int id PK
        int user_id FK
        string category
        string skill_name
        int proficiency_level
        float years_experience
        boolean verified
        float ai_confidence_score
        int endorsements_count
        datetime created_at
    }

    SKILL_ENDORSEMENTS {
        int id PK
        int skill_dna_id FK
        int endorser_id FK
        string comment
        int rating
        datetime created_at
    }

    ATS_REPORTS {
        int id PK
        int application_id FK
        int job_id FK
        int seeker_id FK
        float ats_score
        text matched_skills_json
        text missing_skills_json
        text extracted_keywords_json
        text suggestions_json
        text workflow_steps_json
        datetime created_at
    }

    PROFILES {
        int id PK
        int user_id FK
        text data_json
        text resume_json
    }

    SWIPES {
        int id PK
        int user_id FK
        int job_id FK
        string decision
        datetime created_at
    }

    SAVED_JOBS {
        int id PK
        int user_id FK
        int job_id FK
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        text detail
        boolean is_read
        datetime created_at
    }

    ACTIVITIES {
        int id PK
        int actor_id FK
        string action
        string entity_type
        int entity_id
        text metadata_json
        datetime created_at
    }
```

---

## 🧬 Unique Feature: Candidate Skill DNA Matrix

The **Candidate Skill DNA** subsystem represents a multidimensional skill proficiency and endorsement graph:

### 1. `candidate_skill_dna` Table
| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER` (PK) | Primary identifier |
| `user_id` | `INTEGER` (FK) | Reference to `users.id` |
| `category` | `VARCHAR(50)` | Category: `Technical`, `Domain`, `Soft`, `Tooling` |
| `skill_name` | `VARCHAR(100)` | Normalized skill name (e.g. `React`, `FastAPI`, `System Design`) |
| `proficiency_level` | `INTEGER` (1-5) | 1 = Beginner, 3 = Intermediate, 5 = Expert |
| `years_experience` | `FLOAT` | Hands-on years with this capability |
| `verified` | `BOOLEAN` | Verified through assessments, endorsements, or work experience |
| `ai_confidence_score` | `FLOAT` | Dynamic AI parsing confidence (0.00 to 1.00) |
| `endorsements_count` | `INTEGER` | Number of verified peer/recruiter endorsements |
| `created_at` | `DATETIME` | Timestamp of skill entry |

### 2. `skill_endorsements` Table
| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER` (PK) | Primary identifier |
| `skill_dna_id` | `INTEGER` (FK) | Reference to `candidate_skill_dna.id` |
| `endorser_id` | `INTEGER` (FK) | Recruiter/peer user ID giving endorsement |
| `comment` | `TEXT` | Specific testimonial or recommendation |
| `rating` | `INTEGER` (1-5) | Endorsement rating score |
| `created_at` | `DATETIME` | Timestamp of endorsement |

---

## 🚀 Key APIs for Skill DNA

- `GET /api/skill-dna`: Retrieve logged-in candidate's Skill DNA and radar metrics.
- `GET /api/candidates/{candidate_id}/skill-dna`: Recruiter view of candidate's verified skill footprint.
- `POST /api/skill-dna`: Add or update a candidate skill attribute.
- `POST /api/skill-dna/{skill_id}/endorse`: Endorse a candidate skill.
