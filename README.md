# SwipeX - Intelligent Job Discovery Platform

SwipeX is an AI-powered job discovery and career assistance platform that helps candidates discover relevant job opportunities through an intuitive, swipe-based interface (similar to Tinder, but for jobs).

## Features

### Job Seekers
- **Swipe-based Discovery**: Swipe right to apply/save, swipe left to skip.
- **AI Resume Parsing**: Automatically extracts skills, experience, and education from uploaded resumes.
- **ATS Scoring Engine**: Get compatibility scores between your resume and job requirements.
- **Smart Recommendations**: Recommendations improve over time based on your swipe behavior.

### Recruiters
- **Company Management**: Create and manage your company profile.
- **Job Posting**: Post new roles with specific skill and experience requirements.
- **Applicant Tracking**: Review candidates, view their ATS scores, and update application statuses (Shortlisted, Interview, Rejected).

### Admins
- **Platform Management**: Monitor users, recruiters, companies, and jobs.
- **Analytics**: View overall platform growth and activity metrics.

## Architecture

SwipeX is built using a modern, scalable full-stack architecture:

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion (for smooth swipe gestures).
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Pydantic, JWT Auth.
- **Database**: PostgreSQL (containerized).
- **Deployment**: Docker & Docker Compose.

## Folder Structure

```
SwipeX/
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database Migrations
│   ├── app/                  
│   │   ├── api/v1/           # API Routers
│   │   ├── ai_services/      # Resume parsing & ATS logic
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Core business logic
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # UI Components (SwipeDeck, Auth)
│   │   ├── pages/            # View-level components
│   │   └── context/          # React Context (Auth)
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml        # Multi-container orchestration
└── .env.example              # Environment variables template
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose (recommended)
- Node.js 18+ (if running frontend locally)
- Python 3.11+ (if running backend locally)

### Environment Variables
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update the `SECRET_KEY` and any necessary DB credentials.

### Running with Docker (Recommended)

1. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```
2. The application will be available at:
   - **Frontend**: `http://localhost:5173`
   - **Backend API**: `http://localhost:8000/api/v1`
   - **API Docs (Swagger)**: `http://localhost:8000/docs`

### Running Locally (Without Docker)

**Backend Setup:**
1. Navigate to `backend/`.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

**Frontend Setup:**
1. Navigate to `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Database Setup (Migrations)
When the database is running (either locally or via Docker), run the migrations to create tables:
```bash
# Inside backend directory
alembic upgrade head
```

## Testing Instructions
*Tests are located in `backend/tests/`.*
Run backend tests using `pytest`:
```bash
pytest backend/tests/
```