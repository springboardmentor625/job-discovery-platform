SwipeX Backend

Backend service for the SwipeX -- Job Discovery Platform.

The backend is implemented using Flask and provides APIs for candidate
authentication, candidate profiles, resume upload and skill extraction,
job discovery, ATS analysis, job recommendations, and swipe history.

Technology Stack

Python

Flask

Flask-SQLAlchemy

PostgreSQL

Flask-JWT-Extended

Flask-CORS

Werkzeug

pypdf

python-dotenv

Backend Responsibilities

The backend handles the following workflow:

Candidate Registration
        ↓
Candidate Login
        ↓
JWT Authentication
        ↓
Candidate Profile
        ↓
Resume Upload
        ↓
PDF Parsing + Skill Extraction
        ↓
Job Discovery
        ↓
ATS Analysis
        ↓
Job Recommendations
        ↓
Swipe Actions
        ↓
Swipe History

Project Structure

backend/
│
├── app.py
├── uploads/
├── .env
├── venv/
└── README.md

venv/ is a local Python virtual environment and should not be
committed to Git.

Database

The backend connects to PostgreSQL using the DATABASE_URL environment
variable.

The application uses these 8 database tables:

users
candidate_profiles
resumes
companies
jobs
ats_reports
recommendations
swipe_history

The SQLAlchemy models in app.py map directly to these tables.

Environment Variables

Create a .env file inside the backend/ directory:

DATABASE_URL=your_postgresql_database_url
JWT_SECRET_KEY=your_secret_key

Do not commit the .env file to GitHub.

Setup

1. Open the backend directory

cd backend

2. Create a virtual environment

Windows:

python -m venv venv

3. Activate the virtual environment

Windows PowerShell:

.env\Scripts\Activate.ps1

4. Install dependencies

If requirements.txt is available:

pip install -r requirements.txt

The main packages used by the backend are:

Flask
Flask-SQLAlchemy
Flask-CORS
Flask-JWT-Extended
python-dotenv
Werkzeug
pypdf
psycopg2

5. Configure PostgreSQL

Make sure PostgreSQL is running and the DATABASE_URL in .env points
to the SwipeX database.

6. Start the backend

python app.py

The Flask development server runs locally using:

http://127.0.0.1:5000

Authentication

SwipeX uses JWT (JSON Web Token) authentication.

After successful login, the backend returns an access token.

Protected endpoints require:

Authorization: Bearer <JWT_TOKEN>

The authenticated user's ID is obtained from the JWT using
Flask-JWT-Extended.

API Endpoints

Health

GET /

Returns:

SwipeX Backend is running!

Database Test

GET /test-db

Checks whether the backend can successfully connect to PostgreSQL.

Registration

POST /api/register

Request:

{
  "full_name": "Candidate Name",
  "email": "candidate@example.com",
  "password": "password"
}

The password is hashed using Werkzeug before it is stored in the
database.

Login

POST /api/login

Request:

{
  "email": "candidate@example.com",
  "password": "password"
}

Returns a JWT access token after successful authentication.

Create Candidate Profile

POST /api/profile

JWT required.

Creates a profile for the authenticated candidate.

Get Candidate Profile

GET /api/profile

JWT required.

Returns the authenticated candidate's profile.

Upload Resume

POST /api/resume

JWT required.

The resume must be sent as multipart form data using the field:

resume

Current restrictions:

PDF only

Maximum file size: 5 MB

The backend:

Validates the file.

Saves the resume in backend/uploads/.

Extracts text using pypdf.

Detects skills from the configured skill list.

Stores the resume and extracted skills in PostgreSQL.

Get Jobs

GET /api/jobs

JWT required.

Returns active jobs with company information, salary, location,
experience requirement, and required skills.

ATS Analysis

POST /api/ats/analyze/<job_id>

JWT required.

The backend compares the candidate's extracted resume skills with the
selected job's required skills.

The current ATS process:

Resume Skills
      +
Job Required Skills
      ↓
Skill Comparison
      ↓
Matched Skills
Missing Skills
      ↓
Match Percentage
      ↓
ATS Score

The current implementation uses:

ATS Score = Match Percentage

The ATS report is stored in the ats_reports table.

Job Recommendations

GET /api/recommendations

JWT required.

The current recommendation system uses rule-based weighted matching.

Matching factor          Weight

Resume skill match          70%
Preferred location          15%
Preferred job type          15%
Total              100%

The resulting jobs are sorted by recommendation score in descending
order.

Recommendations are stored in the recommendations table.

Record Swipe

POST /api/swipe

JWT required.

Request:

{
  "job_id": 1,
  "swipe_action": "RIGHT"
}

Allowed actions:

LEFT
RIGHT
SAVE

The interaction is stored in swipe_history.

Get Swipe History

GET /api/swipe-history

JWT required.

Returns the authenticated candidate's previous job interactions.

Resume Skill Extraction

The backend currently maintains a predefined list of skills.

Examples include:

Python
Java
C++
JavaScript
React
Node.js
Flask
Django
REST APIs
SQL
MySQL
PostgreSQL
MongoDB
Machine Learning
Deep Learning
Artificial Intelligence
NLP
Pandas
NumPy
PyTorch
TensorFlow
AWS
Azure
Docker
Git
GitHub
Linux
Spark
PySpark

The PDF text is searched against this skill list and detected skills are
stored in the resume record.

Demo Job Seeding

When the backend starts, it calls the demo job seeding function.

If companies already exist, duplicate demo data is not created.

The current demo data contains example companies and jobs for:

Backend Developer

Data Analyst

Cloud Engineer

Machine Learning Engineer

This provides jobs for testing the candidate workflow.

Security

The backend includes:

Password hashing

JWT authentication

Protected candidate endpoints

File extension validation

Secure filename handling

5 MB maximum resume upload size

CORS restricted to the local frontend origin

Current Implementation Status

Flask Backend                 ✓
PostgreSQL Connection         ✓
Candidate Registration        ✓
Candidate Login               ✓
JWT Authentication            ✓
Candidate Profile             ✓
PDF Resume Upload             ✓
Resume Skill Extraction       ✓
Job Discovery                 ✓
ATS Analysis                  ✓
Job Recommendations           ✓
Swipe LEFT/RIGHT/SAVE         ✓
Swipe History                 ✓

Future Enhancement

The current backend provides a functional baseline for ATS analysis and
job recommendations.

A future enhancement can introduce an AI/ML personalization model
trained from candidate swipe history. The current recommendation
implementation is rule-based; the swipe-history-based personalization
model can be added as a later stage.