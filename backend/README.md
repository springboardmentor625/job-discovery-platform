The SwipeX backend is a FastAPI-based REST API that handles authentication, candidate profiles, resumes, ATS analysis, jobs, recommendations, swipe actions, applications and dashboard operations.

** Technology Stack
- Python
- FastAPI
- Uvicorn
- PostgreSQL
- AI/ML components
- Docker

** Main Responsibilities
- User registration and authentication
- Candidate profile management
- Resume upload and processing
- Resume information extraction
- ATS analysis
- Job retrieval
- Personalized job recommendations
- Swipe history management
- Saved job management
- Job applications
- Application status management
- Candidate dashboard
- Database communication

** API Modules
-Authentication
-Candidate Profile
-Resumes
-ATS Analysis
-Jobs
-Recommendations
-Swipes
-Applications
-Dashboard

FastAPI automatically provides interactive API documentation through Swagger UI.

http://127.0.0.1:8000/docs

ReDoc is available at: http://127.0.0.1:8000/redoc

** Database
SwipeX uses PostgreSQL for persistent data storage.

The database stores information related to:
Users
Candidate profiles
Companies
Jobs
Resumes
Applications
Swipe history
ATS reports
Recommendations
Notifications

** Running the Backend

Install the required dependencies and configure the database environment variables.

Start the FastAPI development server: uvicorn app.main:app --reload

The backend runs at: http://127.0.0.1:8000

** Docker

The backend can also be run as part of the Docker Compose setup along with the PostgreSQL database.

docker compose up --build

The backend provides the API layer connecting the React frontend with the PostgreSQL database and AI/ML functionality.
