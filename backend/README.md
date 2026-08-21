# SwipeX Backend

FastAPI backend for the SwipeX intelligent job discovery and hiring platform.

## Included

- JWT authentication with seeker, recruiter, interviewer, and admin roles
- SQLite local development with PostgreSQL-compatible `DATABASE_URL`
- Job search, filters, posting, deactivation, swipes, saves, and applications
- Recruiter/HR candidate pipeline and application review notes/scores
- Interviewer decisions and interview scheduling fields
- Candidate notifications and status changes
- Resume upload endpoint with structured AI parsing and deterministic keyword fallback
- Admin platform metrics, audit activity, user management, and suspension
- Dockerfile and Docker Compose configuration
- Pytest API coverage for health, seeker, recruiter, and admin flows

## Run locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: `http://127.0.0.1:8000/docs`

## Demo accounts

- Candidate: `candidate@swipex.dev` / `candidate123`
- Recruiter/HR: `hr@swipex.dev` / `recruiter123`
- Interviewer: `interviewer@swipex.dev` / `interviewer123`
- Admin: `admin@swipex.dev` / `admin12345`

Change these credentials and `JWT_SECRET` before deployment.

### AI resume parsing

Set `AI_API_KEY` to enable structured parsing through the OpenAI-compatible endpoint configured by `AI_API_URL`. `AI_MODEL` defaults to `gpt-4o-mini`. If the provider is unavailable or no key is configured, uploads automatically use the local parser.

## Test

```powershell
pytest
```

## Docker

```powershell
docker compose up --build
```
