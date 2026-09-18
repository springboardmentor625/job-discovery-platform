# SwipeX - Intelligent Job Discovery Platform

SwipeX helps candidates discover relevant jobs through profile and resume matching, swipe-based personalization, ATS analysis, and saved-job management.

## Current features

### Authentication and candidate profile

- User registration and JWT login
- Protected candidate routes
- Candidate profile with headline, bio, location, education, skills, experience, preferred role/location, and expected salary
- Persistent candidate dashboard with Dashboard, Discover, Saved Jobs, Resume, AI Recommendations, and Settings sections

### Resume management

- Upload and manage a candidate resume
- Extract resume text, skills, experience, and profile information
- Optional Groq-powered resume skill extraction when `GROQ_API_KEY` is configured

### Discover and recommendations

- Ranked swipe deck of jobs matched to the candidate
- Right swipe to like, left swipe to reject, and deliberate downward gesture to save
- Bookmark save action independent of swipe history
- Mouse and touch pointer interactions
- Already-swiped jobs are excluded from future discovery
- Live search bar on the Discover page (filters by title, company, location, and skills in real time)
- AI Recommendations with match percentage, score breakdown, semantic similarity, swipe fit, missing skills, save/unsave, and inline job details
- Job details open in the current dashboard section for Discover, Recommendations, and Saved Jobs
- Swipe ML model activates after 10 swipes (logistic regression)

### ATS analysis

Per-job ATS scoring is available through `GET /api/ats/{job_id}`. The current weights are:

| Factor | Weight |
| --- | ---: |
| Required skills | 35% |
| Preferred skills | 15% |
| Experience fit | 20% |
| Semantic match | 20% |
| Education match | 10% |

The response includes the overall score, factor breakdown, missing skills, and an optional improvement suggestion.

## Matching and personalization

The displayed candidate/job Match % uses a fixed, explainable score:

```text
Skill match          70%
Experience match     20%
Role relevance        10%
Total                100%
```

Profile and primary-resume skills are normalized together. Experience is parsed from the candidate data and job requirement, while role relevance uses broad career categories with graduated related-role scores.

Swipe behavior is a separate personalization signal. Likes and rejected jobs provide behavioral data for rule-based or trained swipe classification. Personalization changes ranking, not the displayed 70/20/10 Match %.

The swipe ML model (logistic regression) activates once the user has at least **10** swipes in history.

## Performance design

- Candidate derived text and skills are cached during recommendation requests.
- Swiped jobs are excluded through a database query.
- Cheap deterministic scoring runs before semantic and ML enrichment.
- Semantic and ML work is limited to a bounded top candidate set (80/120/200 jobs depending on pool size).
- Job embeddings are cached by job ID.
- Only returned jobs receive full recommendation enrichment.
- Recommendation results use a short-lived per-candidate cache and are invalidated only when profile or resume data changes — not on every swipe.
- Job matching pool is capped at the 3,000 most recent active jobs to prevent unbounded scans.

## Technology stack

### Frontend

- React 19, Vite, Tailwind CSS
- React Router DOM, Axios, React Icons

### Backend

- Python, FastAPI, SQLAlchemy, PostgreSQL
- JWT authentication, scikit-learn, sentence-transformers, spaCy
- pandas, NumPy, pypdf, python-docx, Groq API, joblib

## Project structure

```text
job-discovery-platform/
├── backend/
│   ├── app/
│   │   ├── routes/       # Authentication, candidate, jobs, resume, ATS, recommendations, saved jobs
│   │   ├── services/     # Candidate data, matching helpers, embeddings, resume parsing, ATS
│   │   ├── ml_models/    # Trained swipe_classifier.joblib (see "Data and maintenance scripts" below)
│   │   ├── migrations.py
│   │   ├── models.py
│   │   ├── schemas.py    # Includes RegisterRequest (JSON request body for /api/auth/register)
│   │   └── main.py
│   ├── scripts/          # Import, repair, and model-training utilities
│   ├── tests/            # Backend smoke tests
│   ├── naukri_jobs.csv
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Auth guard for the candidate route tree
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useCurrentUser.js    # Shared /api/auth/me cache (Header + CandidateDashboard)
│   │   │   └── ...                  # Jobs, recommendations, and saved-job data hooks
│   │   └── pages/
│   │       ├── NotFound.jsx         # Catch-all 404 route
│   │       └── ...
│   ├── package.json
│   └── Dockerfile
├── docs/                 # Logic and project reference documents
├── docker-compose.yml
└── README.md
```

## API endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/register` | POST | Register a user (JSON body: `full_name`, `email`, `password`, `phone`) |
| `/api/auth/login` | POST | Authenticate a user |
| `/api/auth/me` | GET | Get the current user |
| `/api/candidate/profile` | GET / POST / PUT | Manage the candidate profile |
| `/api/candidate/resume` | GET / POST | Manage the candidate resume |
| `/api/jobs/{job_id}` | GET | Get one job |
| `/api/jobs/discovery-status` | GET | View discovery diagnostics |
| `/api/jobs/reset-swipes` | DELETE | Clear candidate swipe history |
| `/api/recommendations/{user_id}` | GET | Get ranked recommendations |
| `/api/recommendations/{user_id}/trend` | GET | Get recommendation trend data |
| `/api/swipes` | POST | Record a like or rejection |
| `/api/swipes/history` | GET | View swipe history |
| `/api/saved-jobs` | GET / POST / DELETE | Manage saved jobs |
| `/api/ats/{job_id}` | GET | Calculate a job ATS score |

## Setup and running

### Backend

Copy `backend/.env.example` to `backend/.env`, then configure the database, JWT, CORS, and optional Groq settings.

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000` and its documentation is at `http://127.0.0.1:8000/docs`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the frontend development URL in the terminal.

### Docker

The repository includes `docker-compose.yml` and Dockerfiles for the backend and frontend. Docker Compose can be used to run the application services together.

## Data and maintenance scripts

- `backend/scripts/import_jobs.py` imports jobs from `backend/naukri_jobs.csv`.
- `backend/scripts/fix_job_skills.py` normalizes and repairs imported job skills.
- `backend/scripts/train_swipe_model.py` trains the swipe-personalization model.
- `backend/app/migrations.py` applies the candidate-data migration when the API starts.
- `backend/tests/test_matching_smoke.py` contains the matching-engine smoke test.

## Validation

```powershell
cd frontend
npm run lint
npm run build

cd ..\backend
python -m pytest tests
```

## Recent fixes

This delivery includes a review pass that fixed the following, on top of the previous state of the project:

- `/api/auth/register` now takes a JSON request body instead of query parameters, so the password no longer appears in the request URL.
- `SECRET_KEY` is no longer a weak, hardcoded value — rotate it again yourself before any real deployment (see the comment above it in `.env` / `docker-compose.yml`).
- Removed the unused `components/recommendations/Recommended.jsx` (dead code, not imported anywhere) and the unused `framer-motion` dependency.
- Consolidated two independently-drifting semantic-similarity implementations (`embeddings.py`, `ats_service.py`) into one shared function.
- Fixed an asymmetric role-relevance category mapping in `job_routes.py`.
- Deduplicated the `GET /api/auth/me` request that both `Header.jsx` and `CandidateDashboard.jsx` used to fire independently on the same page load — see `hooks/useCurrentUser.js`.
- `frontend/Dockerfile` now builds and serves a production bundle instead of running the Vite dev server.
- `backend/Dockerfile` now downloads the spaCy model and sentence-transformers weights at build time, so the NLP-based matching paths work out of the box instead of silently falling back.
- Pinned `scikit-learn`/`joblib` to the versions the shipped `app/ml_models/swipe_classifier.joblib` was actually trained with, removed the unused `passlib` dependency, and fixed an invalid `pandas` version pin.
- Added a client-side `ProtectedRoute` auth guard and a catch-all 404 page (`pages/NotFound.jsx`) to `App.jsx`.
- Fixed a `Toast.jsx` timer bug and a `useSavedJobs.js` issue where a freshly saved job briefly had no title/company data.
- Added a live client-side search bar to the Discover page (filters by title, company, location, and skills).
- Lowered the swipe ML model activation threshold from 30 swipes to 10.
- Capped the job matching pool to the 3,000 most recent active jobs to prevent unbounded scans on large datasets.
- Removed `invalidate_recommendation_cache()` from the swipe endpoint — it was forcing a full recommendation pipeline recompute (up to 40 seconds) after every card swipe. Cache now persists for its full TTL and is only invalidated by profile or resume changes.
- Fixed swipe animation timing: `removeJob()` now fires at animation START so `jobs[0]` is already the next card when the 1-second exit animation completes — the next card appears with 0 delay. The exiting card's content is held stable by `exitingJobRef` so the card does not swap content mid-flight.
- Toast notifications now fire only after the card has fully left the screen, not during the exit animation.
- Code audit: removed `Depends()` from `get_matched_jobs` (not a route handler), removed duplicate profile/resume DB check from `get_recommendations` (2 fewer DB queries per request), removed dead constants `RECOMMENDATION_CANDIDATE_LIMIT_MEDIUM/LARGE`, removed an unused `base_match_score` alias field, added PEP 8 blank lines between model class definitions in `models.py`, and removed unused imports from `recommendation_routes.py`.

Do not commit `backend/.env`, uploaded resumes, generated model files, or other secrets to version control — only `.env.example` belongs there.