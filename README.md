# SwipeX – Swipe-Based Intelligent Job Discovery Platform

SwipeX is an intelligent job discovery and career assistance platform for candidates. It combines profile and resume information with a weighted job-matching engine, swipe-based preference learning, ATS analysis, and saved-job management.

The candidate experience is organized around a persistent dashboard where Discover, AI Recommendations, Saved Jobs, Settings, and Resume are available through the sidebar.

---

# 🚀 Current Features

## 1. Authentication

- User registration and login
- JWT-based authentication
- Secure password handling
- Role-aware access
- Protected candidate routes
- Automatic authentication handling

The backend reads authentication settings from `backend/.env`.

Example:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/swipex
SECRET_KEY=swipex-secret-key
ALGORITHM=HS256
```

---

# 👤 Candidate Profile

Candidates can create and update a professional profile containing:

- Full name
- Headline
- Bio
- Location
- Education
- Skills
- Experience
- Preferred role
- Preferred location
- Expected salary


# 📄 Resume Management

Candidates can upload and manage a resume.

Resume information is used by the matching and ATS systems when available.

The platform can use:

- Resume text
- Extracted skills
- Extracted experience
- Resume profile information

Optional resume parsing functionality uses the available document-processing libraries in the backend.

---

# 🔎 Discover

Discover is the primary swipe-based job discovery workspace.

Each candidate receives a ranked swipe deck containing jobs that match their profile.

### Swipe Deck

- Displays a stack of matched jobs
- Drag right beyond the swipe threshold → Like
- Drag left beyond the swipe threshold → Pass
- Drag down beyond the save threshold → Save
- Heart button → Like
- X button → Pass
- Bookmark button → Save
- Pointer Events support mouse and touch interaction
- Small horizontal movements snap back without triggering Like/Pass
- Downward gestures save the current job when the vertical movement is deliberate
- The deck advances immediately after a successful swipe
- Already-swiped jobs are excluded from future discovery

Each job card can show:

- Match score
- Company
- Job title
- Location
- Employment type
- Salary
- Required experience
- Job description
- Required skills
- Matched skills
- Job tags

### Job Details

Selecting **View Job Details** opens the job details as an overlay inside the current candidate dashboard.

The application does not switch to Discover, Saved Jobs, or another dashboard when the details are opened. The current dashboard remains visible behind a lightly blurred details overlay.

The same job-details experience can be used from:

- Discover
- AI Recommendations
- Saved Jobs

Closing the details returns the candidate to the exact dashboard section they were using.

---

# 🤖 AI Recommendations

AI Recommendations provides the candidate's strongest currently available job matches.

The recommendation page includes:

- Ranked recommendations
- Overall match percentage
- Match-score ring
- Skill breakdown
- Semantic similarity information
- Swipe behavior fit
- Missing-skill suggestions
- Save/unsave functionality
- In-place job details

The recommendation data is loaded from:

```text
GET /api/recommendations/{user_id}
```


---

# 🧠 SwipeX Match Engine

The primary candidate/job Match % uses fixed weights:

```text
Skill Match          70%
Experience Match     20%
Role Relevance       10%
────────────────────────
Total               100%
```

## Skill Match – 70%

The engine compares normalized candidate skills from the profile and resume with the skills required by the job.

The score is based on the proportion of required job skills matched by the candidate.

## Experience Match – 20%

The engine extracts experience information from the candidate profile/resume and compares it with the experience requirement of the job.

Candidates meeting or exceeding the detected requirement receive full experience credit.

## Role Relevance – 10%

The engine compares the candidate's preferred role/headline with the job's category.

The resulting role relevance contributes 10% of the primary Match %.

### Swipe Behavior

Swipe behavior is kept as a separate personalization signal.

- Likes provide positive preference information.
- Rejected jobs provide negative preference information.
- After sufficient swipe history, the trained swipe classifier can estimate behavioral fit.
- Swipe behavior influences ranking/personalization but does not change the fixed 70/20/10 Match %.

This keeps the main Match % explainable while allowing SwipeX to learn from candidate interaction.

---

# ⚡ Recommendation Performance

The matching pipeline is optimized for a large imported job dataset.

The current design:

- Performs candidate text and experience preparation once per recommendation request.
- Uses PostgreSQL filtering to exclude jobs already swiped by the candidate.
- Performs the inexpensive 70/20/10 scoring pass first.
- Reuses cached normalized skills and job-category calculations across requests.
- Limits semantic/ML personalization work to the highest-ranked candidate set.
- Avoids recalculating the complete matching pipeline just to store a swipe score when the displayed card already provides that score.
- Caches repeated text embeddings inside the embedding service.
- Returns only the requested recommendation limit.
- Keeps expensive job enrichment bounded to the jobs that are actually displayed.
- Uses a short-lived per-candidate recommendation cache to avoid repeating the full matching pass during rapid dashboard navigation.
- Invalidates recommendation results when profile, resume, or swipe data changes.

Discover requests a smaller job pool than the full recommendation page because the Swipe Deck only needs a limited number of cards.

---

# ❤️ Swipe Behavior

SwipeX records candidate interaction through:

```text
POST /api/swipes
```

Supported actions:

```text
right → like
left  → reject
```

A swipe records:

- Candidate
- Job
- Action
- Match score at the time of the swipe

The stored swipe history supports:

- Removing previously swiped jobs from discovery
- Preference learning
- Recommendation personalization

---

# 🔖 Saved Jobs

Candidates can save jobs independently from swiping.

Available functionality:

- Save a job
- Remove a saved job
- View saved jobs
- Prevent duplicate saved jobs
- View saved date
- Open full job details without leaving Saved Jobs

Saving a job does not convert it into a swipe action and does not force the candidate into the Discover page.

Saved Jobs is a separate candidate workspace.

---

# 📋 Job Details

Job details provide a complete view of an individual job, including:

- Job title
- Company
- Location
- Employment type
- Salary
- Experience requirement
- Required skills
- Job description

The details view can also display the candidate's ATS match for that job.

Job details opened from a job card are displayed in the current dashboard context rather than navigating the candidate to a different dashboard.

---

# 🎯 ATS Score

SwipeX provides a per-job ATS score through:

```text
GET /api/ats/{job_id}
```

The ATS system evaluates:

| Factor | Weight |
|---|---:|
| Required Skills | 50% |
| Experience Fit | 20% |
| Semantic Match | 20% |
| Education Match | 10% |

The job details view can display:

- Overall ATS score
- Factor-by-factor breakdown
- Missing skills
- Optional improvement suggestion

The improvement suggestion can use the OpenAI API when an `OPENAI_API_KEY` is configured.

---

# 🔔 Notifications and Feedback

SwipeX provides immediate feedback for important candidate actions, including:

- Job saved
- Job removed
- Job liked
- Job rejected
- Profile updated
- Resume-related actions
- API errors

---

# 🧭 Candidate Dashboard

The candidate area uses a persistent layout containing:

- Sidebar navigation
- Candidate header
- Main content area

Available candidate sections:

```text
Dashboard
Discover
Saved Jobs
Resume
AI Recommendations
Settings
```

Settings is split into focused pages:

```text
/candidate/settings
├── /profile  - create or update the candidate profile
└── /history  - review swipes and change Like/Reject decisions
```

The profile page preserves its opener. Saving from Dashboard returns to Dashboard,
saving from AI Recommendations returns to AI Recommendations, and saving from
Settings returns to Settings.

Opening job details from Discover, Saved Jobs, or AI Recommendations keeps the candidate within the current dashboard context.

---

# 🏗️ Current Architecture

```text
SwipeX
│
├── Frontend
│   ├── React 19
│   ├── Vite
│   ├── Tailwind CSS
│   ├── React Router DOM
│   ├── Axios
│   ├── React Icons
│   │
│   ├── Authentication
│   ├── Persistent Candidate Layout
│   ├── Candidate Dashboard
│   ├── Discover
│   │   ├── useJobs()
│   │   └── SwipeDeck
│   ├── AI Recommendations
│   │   └── Recommended
│   ├── Saved Jobs
│   ├── Job Details Modal
││   ├── Resume Management
│   └── Profile Management
│
├── Backend
│   ├── FastAPI
│   ├── SQLAlchemy
│   ├── Alembic
│   ├── JWT Authentication
│   ├── PostgreSQL
│   ├── Resume Parsing
│   ├── Embeddings
│   ├── Recommendation Matching
│   ├── Swipe Personalization
│   ├── ATS Scoring
│   └── Saved Jobs
│
└── Database
    ├── Users
    ├── Candidate Profiles
    ├── Jobs
    ├── Saved Jobs
    ├── Job Swipes
    ├── Resumes
    └── ATS Reports
```

---

# 📡 Key API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/me` | GET | Current user |
| `/api/candidate/profile` | GET / POST / PUT | Candidate profile |
| `/api/candidate/resume` | GET / POST | Resume management |
| `/api/jobs/{job_id}` | GET | Single job |
| `/api/jobs/discovery-status` | GET | Discovery diagnostics |
| `/api/jobs/reset-swipes` | DELETE | Clear candidate swipe history |
| `/api/recommendations/{user_id}` | GET | Ranked recommendation jobs |
| `/api/swipes` | POST | Like/pass interaction |
| `/api/swipes/history` | GET | Candidate swipe history with job details |
| `/api/saved-jobs` | GET / POST / DELETE | Saved jobs |
| `/api/ats/{job_id}` | GET | Per-job ATS score |

---

# 🛠️ Technology Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Icons
- Framer Motion

## Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT
- scikit-learn
- sentence-transformers
- spaCy
- pandas
- NumPy
- pypdf / PyPDF2
- python-docx
- OpenAI API

## Machine Learning

SwipeX uses machine-learning functionality for swipe-behavior personalization.

The trained model is stored as:

```text
backend/ml_models/swipe_classifier.joblib
```

Semantic matching uses `sentence-transformers` when available and falls back to lexical similarity when the embedding dependency/model is unavailable.

---

# 🗄️ Database and Migrations

SwipeX uses PostgreSQL.

The backend uses SQLAlchemy for database access and Alembic for schema migrations.

Before starting the backend, configure:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/swipex
SECRET_KEY=swipex-secret-key
ALGORITHM=HS256
```

Make sure the PostgreSQL database named `swipex` exists and is accessible with the configured credentials.

---

# ▶️ Running the Project

## Backend

From the project root:

```powershell
cd backend
uvicorn app.main:app --reload
```

The API is available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite will provide the frontend development URL in the terminal.

---

# 📁 Important Project Structure

```text
job-discovery-platform/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth_routes.py
│   │   │   ├── candidate_routes.py
│   │   │   ├── job_routes.py
│   │   │   ├── recommendation_routes.py
│   │   │   ├── saved_job_routes.py
│   │   │   ├── resume_routes.py
│   │   │   └── ats_routes.py
│   │   │
│   │   ├── services/
│   │   │   ├── recommendation_service.py
│   │   │   ├── embeddings.py
│   │   │   ├── resume_parser.py
│   │   │   └── ats_service.py
│   │   │
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── ml_models/
│   ├── scripts/
│   ├── .env
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── settings/
│   │   │   │   ├── ProfileSettings.jsx
│   │   │   │   └── SwipeHistory.jsx
│   │   │   ├── discover/
│   │   │   └── recommendations/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── docker-compose.yml
└── README.md
```

---

# 🔐 Environment Configuration

The project keeps environment configuration in:

```text
backend/.env
```

The current configuration contains:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/swipex
SECRET_KEY=swipex-secret-key
ALGORITHM=HS256
```

Optional integrations can be configured separately when required, such as the OpenAI API key for ATS improvement suggestions.

---

# 🎯 SwipeX Goal

SwipeX combines:

```text
Candidate Profile
       +
Resume
       +
Job Requirements
       +
70/20/10 Match Engine
       +
Swipe Behavior
       +
ATS Analysis
       ↓
Personalized Job Discovery
```

The goal is to help candidates quickly discover relevant jobs while providing transparent matching information and career-oriented feedback.
