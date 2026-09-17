# SwipeX: Swipe-Based Intelligent Job Discovery and Career Assistance Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2.2-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3.3-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Project Overview

**SwipeX** is a modern, full-stack, intelligent job discovery and career assistance platform engineered to transform how job seekers find relevant employment opportunities and how recruiters discover matching talent.

Traditional job boards overwhelm candidates with endless static lists and opaque filtering criteria. **SwipeX** solves this by introducing a **gamified, interactive swipe-based job discovery feed** coupled with **natural language processing (NLP)**, **TF-IDF vector similarity matching**, a **5-dimensional standalone Resume ATS scoring engine**, and an **anti-overfitting multi-signal recommendation pipeline**.

For recruiters, SwipeX provides a dedicated management dashboard, multi-tenant role authorization, job posting with automated skill indexing, candidate application pipelines with real-time Resume Match Scores, and secure in-browser resume PDF streaming.

> **Project Type**: Individual Project  
> **Author**: L. Pradeep  
> **Initiative**: Infosys Springboard – 7th Edition  

---

## 🎯 Problem Statement & Objectives

### Problem Statement
1. **Candidate Job Search Fatigue**: Sifting through hundreds of irrelevant job postings without clear compatibility indicators causes candidate drop-off and inefficient job searches.
2. **Opaque ATS Rejections**: Job seekers frequently fail Applicant Tracking Systems (ATS) without understanding formatting errors, missing technical keywords, or lack of measurable impact.
3. **Recruiter Screening Burden**: Recruiters spend excessive hours manually cross-referencing candidate resumes against complex job requirements.
4. **Poor Discovery Personalization**: Most platforms rely on rigid Boolean keyword searches that ignore candidate preferences, skill breadth, and market competition levels.

### Platform Objectives
- **Interactive Job Discovery**: Deliver a swipe-based interface (Pass / Save / Apply) alongside an alternative grid view with instant filtering.
- **Standalone ATS Resume Evaluation**: Provide a 0–100 ATS resume audit across 5 dimensions (contact info, core sections, skills breadth, action verbs & impact, readability) with actionable remediation advice.
- **Job-Specific Resume Matching**: Calculate precise, mathematical similarity scores between candidate resumes and job descriptions using TF-IDF vectorization and cosine similarity.
- **Multi-Signal Recommendations**: Recommend high-fit jobs using a balanced, anti-overfitting scoring formula (resume match, profile preferences, interaction history, and competition level).
- **Recruiter Pipeline & Data Isolation**: Equip recruiters with dedicated tools to post jobs, manage applicant pipelines, review dynamically computed candidate match scores, and stream resumes securely with strict multi-tenant data isolation.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client["Frontend (React 19 + Vite + Tailwind CSS)"]
        UI["UI Layer (Pages & Components)"]
        CTX["Auth Context & Token State"]
        AXIOS["Axios Interceptor (Bearer JWT)"]
        ROUTER["React Router (Role-Based Protected Routes)"]
    end

    subgraph Server["Backend (FastAPI REST API)"]
        AUTH_SVC["Auth & JWT Service (Passlib / Bcrypt)"]
        RESET_SVC["Password Reset Service (SHA-256 Tokens)"]
        RESUME_SVC["Resume Parser & 5-D ATS Engine (pypdf)"]
        MATCH_SVC["NLP Matcher (TF-IDF & Cosine Similarity)"]
        REC_SVC["Multi-Signal Recommendation Engine"]
        JOB_SVC["Job Discovery & Competition Service"]
        APP_SVC["Applications & Recruiter Pipeline Service"]
        ANALYTICS_SVC["Dashboard Analytics Service"]
        NOTIF_SVC["Notification Engine"]
    end

    subgraph Storage["Database (PostgreSQL via SQLAlchemy ORM)"]
        DB[(PostgreSQL Database)]
        TABLES["11 Relational Tables"]
    end

    UI --> CTX
    CTX --> ROUTER
    ROUTER --> AXIOS
    AXIOS -- "REST API Requests (JSON / Multipart)" --> Server

    Server --> AUTH_SVC
    Server --> RESET_SVC
    Server --> RESUME_SVC
    Server --> MATCH_SVC
    Server --> REC_SVC
    Server --> JOB_SVC
    Server --> APP_SVC
    Server --> ANALYTICS_SVC
    Server --> NOTIF_SVC

    AUTH_SVC --> DB
    RESET_SVC --> DB
    RESUME_SVC --> DB
    MATCH_SVC --> DB
    REC_SVC --> DB
    JOB_SVC --> DB
    APP_SVC --> DB
    ANALYTICS_SVC --> DB
    NOTIF_SVC --> DB
```

---

## 🗄️ Database Design & Entity Relationships

The PostgreSQL database is managed via **SQLAlchemy 2.0** ORM and consists of 11 relational entities with foreign key constraints, cascading deletions, and strict multi-tenant ownership guards.

```mermaid
erDiagram
    users ||--o{ resumes : "uploads"
    users ||--o{ candidate_profile : "maintains"
    users ||--o{ applications : "submits"
    users ||--o{ swipe_history : "records"
    users ||--o{ notifications : "receives"
    users ||--o{ recommendations : "receives"
    users ||--o{ password_reset_tokens : "requests"
    users ||--o{ jobs : "posts (as recruiter)"

    companies ||--o{ jobs : "offers"

    jobs ||--o{ applications : "receives"
    jobs ||--o{ swipe_history : "targeted by"
    jobs ||--o{ recommendations : "recommended as"
    jobs ||--o{ ats_reports : "analyzed against"
    jobs ||--o{ notifications : "triggers"

    resumes ||--o{ applications : "attached to"
    resumes ||--o{ ats_reports : "evaluated in"

    applications ||--o{ notifications : "status updates"

    users {
        int user_id PK
        string full_name
        string email UK
        text password_hash
        string role "candidate | recruiter | admin"
        string phone
        text profile_picture
        boolean is_verified
        timestamp created_at
    }

    resumes {
        int resume_id PK
        int user_id FK
        string resume_name
        text file_path
        json extracted_skills
        int ats_score
        json ats_breakdown
        json ats_suggestions
        text raw_text
        boolean is_default
        timestamp uploaded_at
    }

    candidate_profile {
        int profile_id PK
        int user_id FK
        string headline
        text summary
        string location
        string preferred_job_type
        string preferred_location
        int experience_years
        json education
        json projects
        json certifications
    }

    companies {
        int company_id PK
        string company_name
        string company_type
        string industry
        string website
        string headquarters
    }

    jobs {
        int job_id PK
        int company_id FK
        int recruiter_id FK
        string title
        text description
        string location
        string employment_type
        int salary_min
        int salary_max
        string experience_required
        json required_skills
        string status
        timestamp posted_date
    }

    applications {
        int application_id PK
        int user_id FK
        int job_id FK
        int resume_id FK
        string status
        datetime applied_at
    }

    swipe_history {
        int swipe_id PK
        int user_id FK
        int job_id FK
        string swipe_action "Pass | Interested"
        datetime swiped_at
    }

    notifications {
        int notification_id PK
        int user_id FK
        int related_job_id FK
        int related_application_id FK
        string title
        text message
        string notification_type
        boolean is_read
        datetime created_at
    }

    recommendations {
        int recommendation_id PK
        int user_id FK
        int job_id FK
        string recommendation_score
        text recommendation_reason
        json matching_skills
        json missing_skills
        datetime generated_at
    }

    ats_reports {
        int ats_report_id PK
        int resume_id FK
        int job_id FK
        string ats_score
        string match_percentage
        json missing_skills
        json missing_keywords
        text suggestions
        datetime analyzed_at
    }

    password_reset_tokens {
        int token_id PK
        int user_id FK
        string token_hash UK
        datetime expires_at
        boolean is_used
        datetime created_at
    }
```

---

## ✨ Key Features & Implemented Functionality

### Feature Comparison Matrix

| Module | Feature Description | Status |
| :--- | :--- | :---: |
| **Authentication** | JWT-based Bearer Token Auth with role routing (`candidate`, `recruiter`, `admin`) | ✅ Implemented |
| **Password Security** | Bcrypt password hashing & timing-safe SHA-256 password reset tokens (15-min expiry) | ✅ Implemented |
| **User Enumeration Defense** | Masked email verification & generic forgot-password responses to prevent email harvesting | ✅ Implemented |
| **Candidate Profile** | Dynamic 11-point Profile Completion calculation (headline, skills, bio, education, projects) | ✅ Implemented |
| **Resume Parsing** | PDF text extraction (`pypdf`) with automated technical skill extraction (70+ vocab) | ✅ Implemented |
| **Standalone ATS Scoring** | 5-Dimensional ATS score (0–100) with category breakdowns and remediation tips | ✅ Implemented |
| **Resume Management** | Default resume switching, ATS recalculation, and safe cascade deletion (disk + DB) | ✅ Implemented |
| **Job Discovery (Swipe)** | Tinder-style swipe cards: ❌ Pass, ⭐ Interested (Save), ❤️ Apply with instant animation | ✅ Implemented |
| **Job Discovery (Grid)** | Searchable, multi-filtered grid view with keyword, location, type, and experience filters | ✅ Implemented |
| **Job Competition Signals** | Dynamic early applicant badges and competition tiers (`<5` = Low, `5–15` = Medium, `>15` = High) | ✅ Implemented |
| **Job Details & Sharing** | Full job specifications, company info, ATS suitability, and Web Share API / clipboard copy | ✅ Implemented |
| **NLP Resume–Job Match** | TF-IDF Vectorization & Cosine Similarity for precise Resume Match Scores | ✅ Implemented |
| **Job Recommendations** | Multi-signal recommendation engine with anti-overfitting adaptive swipe weighting | ✅ Implemented |
| **Swipe History** | Auto-pruned 50-record candidate interaction history with newest-first ordering | ✅ Implemented |
| **Candidate Applications** | Job application submission, duplicate prevention, and real-time status tracking | ✅ Implemented |
| **Notifications** | Automated alerts on application submission, recruiter status changes, and recommendation updates | ✅ Implemented |
| **Candidate Analytics** | Interactive Recharts dashboard: response rates, ATS averages, application trends, skill gaps | ✅ Implemented |
| **Recruiter Job Management** | Post jobs (auto company generation), edit job specs, and delete with dependency cascade | ✅ Implemented |
| **Recruiter Pipeline** | Candidate applicant table with dynamically computed match scores, matched/missing skills | ✅ Implemented |
| **Resume PDF Streaming** | Role-authorized inline PDF resume streaming with strict cross-recruiter ownership checks | ✅ Implemented |
| **Recruiter Analytics** | Recruiter dashboard: total postings, active jobs, candidate counts, hiring funnel breakdown | ✅ Implemented |
| **Data Isolation** | Strict recruiter isolation: recruiters can never access or modify jobs/applicants of peers | ✅ Implemented |

---

## 🔬 Core Algorithms & Technical Implementations

### 1. Standalone 5-Dimensional Resume ATS Scoring Engine
When a candidate uploads a PDF resume, `analyze_resume_ats` in `backend/app/resumes.py` evaluates the extracted text across **5 independent 20-point dimensions** (Total: 0–100):

```text
Total ATS Score (100 pts) = Structure (20) + Sections (20) + Skills (20) + Impact (20) + Readability (20)
```

1. **Structure & Contact Info (0–20 pts)**:
   - Professional Email Detection (`+6 pts`)
   - Direct Phone Number Detection (`+6 pts`)
   - Online Portfolio / LinkedIn / GitHub Links (`+4 pts`)
   - Location Specification (`+4 pts`)
2. **Core Sections Presence (0–20 pts)**:
   - Education / Academic background (`+4 pts`)
   - Experience / Work history / Internships (`+4 pts`)
   - Technical Skills section (`+4 pts`)
   - Projects / Portfolio work (`+4 pts`)
   - Certifications / Summary (`+4 pts`)
3. **Skills Breadth & Depth (0–20 pts)**:
   - Scanned against 70+ categorized tech skills (languages, frameworks, databases, cloud, DevOps, data).
   - `≥10 skills` = 20 pts, `7–9 skills` = 16 pts, `4–6 skills` = 12 pts, `2–3 skills` = 8 pts, `1 skill` = 4 pts.
4. **Action Verbs & Quantifiable Impact (0–20 pts)**:
   - Scanned for 30+ strong action verbs (*developed, engineered, architected, optimized, deployed*): up to 14 pts.
   - Scanned for quantifiable impact metrics (`%` improvements, `X` multipliers, scale numbers, latency reductions): up to 6 pts.
5. **Formatting, Word Count & Readability (0–20 pts)**:
   - Optimal length check: `350–850 words` = 14 pts (penalties for `<250` or `>1000` words).
   - Bullet point formatting detection (`•, -, *, ▪, –`): `+6 pts`.

---

### 2. Job-Specific NLP Resume Match Scoring
Implemented in `backend/app/matching.py` using **Scikit-learn**:

```text
Resume Text (Extracted PDF)          Job Description + Required Skills
          │                                          │
          ▼                                          ▼
   Text Cleaning & Stopwords Removal (lowercase, English stop words)
          │                                          │
          └───────────────────┬──────────────────────┘
                              ▼
                  TfidfVectorizer (sklearn)
                              ▼
            TF-IDF Sparse Matrices (1 x N features)
                              ▼
          Cosine Similarity = (v_resume · v_job) / (||v_resume|| * ||v_job||)
                              ▼
          Resume Match Score = round(Similarity * 100, 2)%
```

---

### 3. Multi-Signal Job Recommendation Engine (Anti-Overfitting)
Implemented in `backend/app/recommendations.py`. To prevent recommendation collapse when a user has few swipes, the platform uses an **adaptive weighting formula**:

$$\text{Score} = W_{\text{resume}} + W_{\text{profile}} + W_{\text{swipe}} + W_{\text{competition}} + W_{\text{freshness}}$$

- **1. Resume Skill & Content Match ($35\%$)**: TF-IDF similarity score + extracted skill intersection.
- **2. Candidate Profile & Experience ($25\%$)**: Location match, employment type preference, and experience alignment.
- **3. Adaptive Swipe History ($0\text{--}15\%$)**: Capped weight $W = \min(0.15, 0.04 + 0.02 \times N_{\text{swipes}})$. Users with 0 swipes experience zero bias. Left swipes (Pass) apply only a gentle job-specific reduction without penalizing entire skill categories.
- **4. Early Applicant / Competition Signal ($15\%$)**: Boost for low-competition listings (`<5 applicants` = $+15\text{ pts}$).
- **5. Freshness & Diversity ($10\%$)**: Prioritizes jobs posted within the last 7 days ($+10\text{ pts}$) or 21 days ($+5\text{ pts}$).

---

## 👥 Candidate & Recruiter Workflows

### Candidate Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    participant Frontend as React Frontend
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    Candidate->>Frontend: Register / Login (JWT)
    Frontend->>API: POST /login
    API-->>Frontend: access_token (Bearer)

    Candidate->>Frontend: Upload Resume PDF
    Frontend->>API: POST /resumes/upload
    API->>API: Extract text & compute 5-D ATS Score
    API->>DB: Store resume & ATS breakdown
    API-->>Frontend: Resume data + ATS score + suggestions

    Candidate->>Frontend: Open Discover Jobs (Swipe / Grid)
    Frontend->>API: GET /jobs/
    API->>API: Compute multi-signal priorities & competition levels
    API-->>Frontend: Ranked Jobs List

    Candidate->>Frontend: Swipe Interested / Apply
    Frontend->>API: POST /swipes/{job_id} or POST /applications/
    API->>DB: Record swipe / application & trigger notification
    API-->>Frontend: Success confirmation
```

---

### Recruiter Workflow & Multi-Tenant Data Isolation

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Frontend as React Frontend
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    Recruiter->>Frontend: Login (role = recruiter)
    Frontend->>API: POST /login
    API-->>Frontend: access_token (role: recruiter)

    Recruiter->>Frontend: Post Job (title, skills, salary, company)
    Frontend->>API: POST /jobs/
    API->>DB: Save job with recruiter_id = current_user.user_id
    API-->>Frontend: Job created successfully

    Recruiter->>Frontend: View Applicants Pipeline
    Frontend->>API: GET /applications/recruiter/all
    API->>DB: Query applications strictly where job.recruiter_id == current_user.user_id
    API->>API: Compute job-specific Resume Match Score for each applicant
    API-->>Frontend: Candidates list with match scores & missing skills

    Recruiter->>Frontend: Click View Resume PDF
    Frontend->>API: GET /applications/{app_id}/resume
    API->>API: Verify job.recruiter_id == current_user.user_id (403 if unauthorized)
    API-->>Frontend: Stream PDF FileResponse (inline)

    Recruiter->>Frontend: Update Status (e.g., Shortlisted / Interview)
    Frontend->>API: PUT /applications/{app_id}/status
    API->>DB: Update application status & dispatch Notification to candidate
    API-->>Frontend: Updated status
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 19 (`react` 19.2.8, `react-dom` 19.2.8)
- **Build Tool**: Vite 8.2.2 with `@vitejs/plugin-react`
- **Routing**: React Router DOM 7.18.2 (Browser Router with Role-Based Protected Routes)
- **Styling**: Tailwind CSS 4.3.3 (`@tailwindcss/vite`)
- **Animations**: Framer Motion 13.1.1
- **Icons**: Lucide React 1.37.0
- **Data Visualization**: Recharts 3.10.1 (Pie charts, Bar charts, Area charts)
- **HTTP Client**: Axios 1.20.0 (Global request/response token interceptors)

### Backend
- **Framework**: FastAPI 0.141.1 (Python ASGI framework)
- **ASGI Server**: Uvicorn 0.52.1
- **ORM / Database Layer**: SQLAlchemy 2.0.51 with `psycopg2-binary` 2.9.12
- **Data Validation & Settings**: Pydantic 2.13.4, `pydantic-core` 2.46.4, `email-validator` 2.3.0
- **Authentication & Security**: Python-Jose 3.5.0 (JWT), Passlib 1.7.4, Bcrypt 4.0.1, Python `secrets` & `hashlib`
- **Document Processing**: PyPDF 4.1.0 (PDF text and page extraction)
- **Machine Learning & NLP**: Scikit-learn 1.4.1 (TF-IDF Vectorization, Cosine Similarity), NumPy 1.26.4, SciPy 1.17.1
- **Environment Management**: Python-Dotenv 1.2.2

### Database & Infrastructure
- **Database Engine**: PostgreSQL 15+ (relational storage for users, jobs, resumes, applications, swipes)
- **Containerization**: Docker & Docker Compose (`Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`)

---

## 📁 Project Structure

```text
SwipeX/
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── analytics.py          # Candidate & Recruiter dashboard analytics endpoints
│       ├── applications.py       # Application submissions, recruiter pipeline & PDF streaming
│       ├── ats_reports.py        # Job-dependent ATS analysis & suggestion generator
│       ├── auth.py               # JWT token generation, password verification, role guards
│       ├── candidate_profile.py  # Profile CRUD & dynamic 11-point completion score
│       ├── config.py             # Backend configuration loader
│       ├── crud.py               # Database CRUD helpers
│       ├── database.py           # SQLAlchemy engine, SessionLocal & Base declaration
│       ├── jobs.py               # Job postings, recruiter my-jobs, discovery feed & match API
│       ├── main.py               # FastAPI application entrypoint, CORS & root routers
│       ├── matching.py           # TF-IDF Vectorization & Cosine Similarity match algorithm
│       ├── models.py             # 11 SQLAlchemy database models & relational schemas
│       ├── notifications.py      # Candidate notification feed & mark-as-read endpoints
│       ├── password_reset.py     # Forgot password, token verification & password reset
│       ├── recommendations.py    # Multi-signal recommendation engine (anti-overfitting)
│       ├── resumes.py            # Resume PDF upload, 5-D ATS scoring engine & cascade delete
│       ├── schemas.py            # Pydantic request/response validation schemas
│       └── swipes.py             # Swipe recording, auto-pruning (50 limit) & history APIs
│
├── frontend/
│   ├── public/                   # Static public assets
│   ├── src/
│   │   ├── assets/               # Local icons and graphics
│   │   ├── components/
│   │   │   ├── AppLayout.jsx     # Navigation shell, responsive sidebar & top header
│   │   │   ├── Header.jsx        # Notification dropdown, user profile badge & quick actions
│   │   │   └── Sidebar.jsx       # Dynamic candidate vs. recruiter sidebar navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state, login/logout & Axios header sync
│   │   ├── pages/
│   │   │   ├── recruiter/
│   │   │   │   ├── ManageJobs.jsx           # Recruiter job management (edit, delete, stats)
│   │   │   │   ├── PostJob.jsx              # Recruiter job posting with company auto-creation
│   │   │   │   ├── RecruiterApplications.jsx# Candidate review pipeline with match scores
│   │   │   │   └── RecruiterDashboard.jsx   # Recruiter hiring statistics & funnel charts
│   │   │   ├── Analytics.jsx     # Candidate application analytics & skill gap charts
│   │   │   ├── Applications.jsx  # Candidate submitted applications & status timeline
│   │   │   ├── ApplyJob.jsx      # Job application submission page with resume selector
│   │   │   ├── Companies.jsx     # Partner companies directory & search
│   │   │   ├── Dashboard.jsx     # Candidate overview (profile status, match feed, analytics)
│   │   │   ├── ForgotPassword.jsx# Password reset request form
│   │   │   ├── Home.jsx          # Public landing page with features showcase & hero
│   │   │   ├── InterestedJobs.jsx# Saved & starred jobs feed
│   │   │   ├── JobDetails.jsx    # Full job overview, ATS tips, company details & native share
│   │   │   ├── Jobs.jsx          # Interactive Swipe feed & Grid view job discovery
│   │   │   ├── Login.jsx         # User authentication page
│   │   │   ├── Notifications.jsx # User notification management
│   │   │   ├── Profile.jsx       # Candidate career profile builder & completion meter
│   │   │   ├── Recommendations.jsx# Personalized multi-signal job recommendations
│   │   │   ├── Register.jsx      # Account registration (Candidate / Recruiter roles)
│   │   │   ├── ResetPassword.jsx # Token-validated password reset form
│   │   │   ├── Resumes.jsx       # Resume upload, ATS audit scorecard & suggestions
│   │   │   └── SwipeHistory.jsx  # Candidate swipe history timeline (Pass / Interested)
│   │   ├── services/
│   │   │   └── api.js            # Axios client with automatic Bearer token injection
│   │   ├── App.css               # Global application styles
│   │   ├── App.jsx               # Route definitions, fallback redirects & role protection
│   │   ├── index.css             # Tailwind CSS directives
│   │   └── main.jsx              # React DOM root entrypoint
│   ├── eslint.config.js          # ESLint configuration
│   ├── index.html                # HTML entry template
│   ├── package.json              # Frontend npm dependencies & scripts
│   └── vite.config.js            # Vite build configuration with Tailwind plugin
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore file for repo cleanliness
├── Dockerfile.backend            # Docker containerization specification for FastAPI
├── Dockerfile.frontend           # Docker containerization specification for React/Vite
├── docker-compose.yml            # Multi-container orchestration (Backend + Frontend + DB)
├── init_db.py                    # Database schema creation script
├── LICENSE                       # MIT License
├── requirements.txt              # Python backend dependencies
├── test_e2e.py                   # 16-suite End-to-End API verification matrix
└── README.md                     # Project documentation
```

---

## 🖼️ Application Screens & User Interface

| Screen | Description | Placeholder |
| :--- | :--- | :---: |
| **Landing Page** | Public hero with animated value propositions and role entrypoints | `[Add screenshot: Landing Page]` |
| **Login & Password Reset** | Secure JWT authentication with token-validated password recovery | `[Add screenshot: Login & Reset Password]` |
| **Candidate Dashboard** | Unified dashboard with profile completion gauge, quick actions & stats | `[Add screenshot: Candidate Dashboard]` |
| **Swipe Job Discovery** | Card deck with Resume Match Score bar, tech tags, and swipe actions | `[Add screenshot: Swipe Discovery Feed]` |
| **Grid Job Discovery** | Multi-faceted filter system (keyword, location, employment type, exp) | `[Add screenshot: Grid View Discovery]` |
| **Job Details & Share** | Comprehensive job overview, ATS tips, company data & native share | `[Add screenshot: Job Details View]` |
| **Resume & ATS Scorecard** | PDF upload, 5-D ATS radar breakdown, and targeted improvement tips | `[Add screenshot: Resumes & ATS Scorecard]` |
| **Recommendations Feed** | Multi-signal ranked recommendations with matched/missing skill chips | `[Add screenshot: Recommendations]` |
| **Candidate Analytics** | Interactive Recharts showing status breakdown, skill gaps & trends | `[Add screenshot: Candidate Analytics]` |
| **Recruiter Dashboard** | Recruitment metrics, active listings count, and hiring status funnel | `[Add screenshot: Recruiter Dashboard]` |
| **Recruiter Applications** | Candidate review table with dynamically computed match scores & PDF stream | `[Add screenshot: Recruiter Pipeline]` |
| **Job Post & Management** | Job creation form with auto-company tagging, edit & cascade deletion | `[Add screenshot: Recruiter Job Management]` |

---

## ⚙️ Installation & Setup Guide

### Prerequisites
- **Python**: Version `3.12` or higher installed
- **Node.js**: Version `18.x` or higher and `npm` installed
- **PostgreSQL**: Version `15+` running locally or accessible via network
- **Git**: Installed for version control

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/SwipeX.git
cd SwipeX
```

---

### Step 2: Database Setup
1. Create a PostgreSQL database (e.g., `swipedb`):
```sql
CREATE DATABASE swipedb;
```

---

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Ensure your `.env` configuration contains valid parameters:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/swipedb

# JWT Authentication
SECRET_KEY=your-secure-random-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API & Server Configuration
ENVIRONMENT=development
API_HOST=127.0.0.1
API_PORT=8000

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

### Step 4: Backend Setup & Database Initialization

1. Create and activate a Python virtual environment:
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

2. Install backend dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize the database tables:
```bash
python init_db.py
```

4. Start the FastAPI backend server:
```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
*The backend API will now be running at `http://127.0.0.1:8000`.*

---

### Step 5: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install npm dependencies:
```bash
npm install
```

3. Start the Vite development server:
```bash
npm run dev
```
*The React frontend will now be accessible at `http://localhost:5173`.*

---

## 🧪 Verification & Automated Testing

SwipeX includes a comprehensive 16-suite End-to-End API verification script (`test_e2e.py`) validating all candidate, recruiter, ATS, NLP matching, password reset, and multi-tenant security layers.

To run the verification suite:
```bash
python test_e2e.py
```

### Verification Test Matrix
```text
===========================================================
      SWIPEX END-TO-END TPI & FEATURE VERIFICATION
===========================================================
[TEST 1]  Root Endpoint Health Check                   --> 200 OK
[TEST 2]  Jobs Discovery & Early Applicant Signals      --> 200 OK
[TEST 3]  Authenticated User Profile & Role Guard       --> 200 OK
[TEST 4]  Dynamic 11-Point Profile Completion Score      --> 200 OK
[TEST 5]  Dashboard Analytics & Skill Gaps Computation   --> 200 OK
[TEST 6]  Multi-Signal Recommendation Ranking Formula    --> 200 OK
[TEST 7]  Swipe Interested & History Pruning (50 Limit)  --> 200 OK
[TEST 8]  Candidate Application Submission Pipeline      --> 200 OK
[TEST 9]  Notifications Dispatch & Mark-as-Read Flow     --> 200 OK
[TEST 10] Standalone 5-D ATS Resume Score Breakdown      --> 200 OK
[TEST 11] Forgot/Reset Password SHA-256 Token Security   --> 200 OK
[TEST 12] Resume Deletion with Safe ATS Cascade Cleanup  --> 200 OK
[TEST 13] Recruiter Job Posting & Ownership Protection   --> 200 OK
[TEST 14] Recruiter Candidate Review & Status Workflow   --> 200 OK
[TEST 15] Job-Specific Resume Match Score & PDF Stream   --> 200 OK
[TEST 16] Multi-Recruiter Tenant Data Isolation Matrix   --> 200 OK
===========================================================
       ALL 16 VERIFICATION TESTS PASSED SUCCESSFULLY!     
===========================================================
```

---

## 🌐 Application URLs & API Documentation

| Service / Interface | URL | Access Level | Description |
| :--- | :--- | :---: | :--- |
| **Frontend Web App** | `http://localhost:5173` | Public / Auth | React single-page application |
| **Backend API Root** | `http://127.0.0.1:8000` | Public | FastAPI root endpoint |
| **Swagger Interactive Docs** | `http://127.0.0.1:8000/docs` | Public | Interactive OpenAPI UI for exploring all endpoints |
| **ReDoc API Documentation** | `http://127.0.0.1:8000/redoc` | Public | Structured OpenAPI technical specification |

---

## 🔮 Future Scope & Planned Enhancements

- [ ] **Real-Time WebSockets Chat**: Direct messaging between recruiters and candidates once an application is shortlisted.
- [ ] **AI Interview Question Generator**: Context-aware technical interview preparation generated from job descriptions and candidate resumes.
- [ ] **OAuth2 Social Logins**: One-click authentication with Google and GitHub.
- [ ] **Recruiter Video Pitch Integration**: Allowing candidates to attach a 60-second video elevator pitch to their applications.
- [ ] **Advanced Salary Benchmark Analytics**: Aggregated salary distribution charts based on location, experience, and tech stacks.

---

## 👨‍💻 Project Credits

- **Name**: L. Pradeep
- **Project**: SwipeX: Swipe-Based Intelligent Job Discovery and Career Assistance Platform
- **Program**: Infosys Springboard – 7th Edition
- **Project Type**: Individual Project

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- **Infosys Springboard (7th Edition)** for the mentorship, training, and opportunity to develop this comprehensive full-stack platform.
- **FastAPI & Python Community** for high-performance backend tools and documentation.
- **React & Tailwind CSS Ecosystem** for modern component architectures and rapid UI design.