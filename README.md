# job-discovery-platform
SwipeX is a Swipe-Based Intelligent Job Discovery and Career Assistance Platform designed to help candidates discover relevant job opportunities through personalized recommendations and an interactive swipe-based experience. The platform combines candidate profile management, resume parsing, ATS analysis, AI/ML-based job matching, personalized recommendations, saved jobs and application management in a single system.

Key Features
- Candidate registration and authentication
- Candidate profile management
- Resume upload and information extraction
- ATS-based resume analysis
- Missing skills and keyword identification
- Personalized job recommendations
- AI/ML-based candidate-job matching
- Swipe-based job discovery
- Save, skip and apply interactions
- Application tracking
- Candidate dashboard
- PostgreSQL database
- Docker support

Project Workflow
Register
   ↓
Login
   ↓
Complete Profile
   ↓
Upload Resume
   ↓
Resume Parsing
   ↓
ATS Analysis
   ↓
Job Recommendations
   ↓
Swipe Jobs
   ↓
Save / Skip / Apply
   ↓
Application Tracking

Technology Stack
Frontend
React.js
JavaScript / JSX
HTML5
CSS3
Vite
Backend
Python
FastAPI
Uvicorn
Database
PostgreSQL

Deployment
Docker
Docker Compose

Running the Project
Backend
cd backend
uvicorn app.main:app --reload
Backend: http://127.0.0.1:8000
Swagger API documentation: http://127.0.0.1:8000/docs

Frontend
cd frontend
npm install
npm run dev
Frontend: http://localhost:5173

Docker: The project also supports Docker-based execution using Docker Compose.
docker compose up --build

Project Objective: SwipeX aims to make job discovery more efficient and personalized by combining intelligent resume analysis, ATS insights, job matching and swipe-based interactions into one career assistance platform.
