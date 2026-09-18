# SwipeX - Intelligent Job Discovery Platform

SwipeX is a full-stack job discovery platform built to help candidates discover relevant opportunities using profile matching, resume parsing, ATS scoring, recommendation ranking, and swipe-based personalization.

## Overview

The platform combines:

- Candidate authentication and profile management
- Resume upload and profile extraction
- Job discovery through swipe interactions
- AI-powered recommendation ranking
- Saved jobs and candidate dashboard workflows
- ATS scoring to evaluate how well a candidate matches a job requirement

## Features

### Candidate experience

- User registration and login with JWT-based authentication
- Protected routes for authenticated candidate flows
- Candidate profile with headline, bio, location, skills, education, work experience, preferred role, and salary expectations
- Dashboard pages for Discover, Saved Jobs, Resume, AI Recommendations, and Settings

### Resume and profile intelligence

- Resume upload and parsing
- Extraction of skills, experience, and candidate summary data
- Normalized profile-skills matching with job requirements
- Optional Groq-based enrichment for resume skill extraction when configured

### Job discovery and recommendations

- Ranked job card deck for matching opportunities
- Like, reject, and save interactions
- Swipe history tracking and exclusion of already reviewed jobs
- Real-time search on the Discover page
- Recommendation views with score breakdowns, match percentages, missing skills, and detailed job context
- Saved jobs management separate from swipe activity

### ATS and matching

- Per-job ATS score evaluation based on required skills, preferred skills, experience fit, semantic match, and education fit
- Explainable candidate-to-job match score combining key skill, experience, and role relevance signals
- Personalization signal from swipe behavior, without replacing the core match score logic

## Tech stack

### Frontend

- React
- Vite
- React Router
- Axios
- React Icons

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT authentication
- scikit-learn
- sentence-transformers
- spaCy
- pandas, NumPy, pypdf, python-docx
- Groq API integration

## Project structure

```text
job-discovery-platform/
├── backend/
│   ├── app/
│   │   ├── ml_models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── migrations.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── scripts/
│   ├── tests/
│   ├── naukri_jobs.csv
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── README.md
├── docs/
├── docker-compose.yml
├── LICENSE
├── README.md
└── .gitignore
```

## API highlights

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/register` | POST | Register a new candidate |
| `/api/auth/login` | POST | Log in and receive tokens |
| `/api/auth/me` | GET | Fetch current authenticated user |
| `/api/candidate/profile` | GET / POST / PUT | View or update candidate profile |
| `/api/candidate/resume` | GET / POST | Manage uploaded resume data |
| `/api/jobs/{job_id}` | GET | Fetch a single job |
| `/api/jobs/discovery-status` | GET | View discovery and filter diagnostics |
| `/api/jobs/reset-swipes` | DELETE | Clear swipe history |
| `/api/recommendations/{user_id}` | GET | Fetch ranked job recommendations |
| `/api/swipes` | POST | Record swipe decisions |
| `/api/swipes/history` | GET | Fetch swipe history |
| `/api/saved-jobs` | GET / POST / DELETE | Manage saved jobs |
| `/api/ats/{job_id}` | GET | Calculate ATS score for a job |

## Environment setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Configure database, JWT, CORS, and optional Groq settings.
3. Install dependencies.

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at:

- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server will show the local frontend URL in the terminal.

### Docker

The repository includes Docker configuration for both backend and frontend services.

```powershell
docker-compose up --build
```

## Data and utility scripts

- `backend/scripts/import_jobs.py` imports job records from the dataset
- `backend/scripts/fix_job_skills.py` fixes and normalizes imported skill data
- `backend/scripts/train_swipe_model.py` trains the swipe personalization model
- `backend/app/migrations.py` applies startup migration logic for candidate data
- `backend/tests/test_matching_smoke.py` validates the core matching pipeline

## Validation

```powershell
cd frontend
npm run lint
npm run build

cd ..\backend
python -m pytest tests
```

## Notes

- Do not commit secrets or generated local artifacts such as `backend/.env`, uploaded resumes, or model files.
- Keep environment configuration in `.env.example` and update it when new settings are introduced.
- The app is designed for a candidate-first job discovery workflow with explainable recommendation logic and a modular backend API structure.
