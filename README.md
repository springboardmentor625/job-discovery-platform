# SwipeX 🚀

SwipeX is a modern, Tinder-style job application platform designed to make job hunting seamless and engaging. By leveraging an advanced NLP resume parser and a skill-based matching engine, SwipeX presents candidates with highly relevant job opportunities that they can apply to, save, or pass on with simple swipe gestures.

## 🌟 Key Features

* **Advanced NLP Resume Parsing:** Automatically extracts skills, projects, certifications, branch/stream, and experience from PDF resumes.
* **Smart Job Matching:** Ranks and recommends jobs based on a strict overlap between the candidate's extracted skills and the job's required skills.
* **Tinder-Style Swiping UI:** 
  * 👉 **Swipe Right (Apply):** Records the application and instantly redirects the user to the company's official career page.
  * 👆 **Swipe Up (Save):** Bookmarks the job in the "Saved Jobs" tab for later review.
  * 👈 **Swipe Left (Pass):** Dismisses the job and presents the next best match.
* **Automated Profile Sync:** The candidate's profile is automatically populated and updated whenever a new resume is uploaded.
* **Strict Onboarding Gate:** Ensures users complete their profile and upload a resume before they can access the Swipe Jobs feature, guaranteeing high-quality matches.

---

## 🗄️ Database Schema & Models

SwipeX uses a robust PostgreSQL relational database managed via SQLAlchemy. Below are the core tables that power the platform:

### 1. User & Candidate Profile
* **Users (`users`):** Stores authentication details (`email`, `hashed_password`), `full_name`, `role`, and `profile_picture`.
* **CandidateProfile (`candidateprofile`):** Stores granular candidate details. It maintains a strict 1-to-1 relationship with the User table.
  * **Fields:** `headline`, `summary`, `experience_years`, `city`, `state`, `branch`, `stream`, `projects`, `certifications`, `skills`, `preferred_job_type`, `preferred_city`, `preferred_state`.

### 2. Companies & Jobs
* **Company (`companies`):** Stores employer data like `company_name`, `industry`, `headquarters`, and their official `career_page`.
* **Job (`jobs`):** Represents an open requisition. Linked to a company.
  * **Fields:** `title`, `description`, `location`, `employment_type`, `salary_min`, `salary_max`, `experience_required`, `required_skills` (JSON), `apply_url`.

### 3. Resumes & ATS
* **Resume (`resumes`):** Tracks the uploaded PDF documents. Includes the `file_path` and a JSON blob of `extracted_skills`.
* **ATSReport (`atsreports`):** Stores the generated ATS scores and `missing_skills` recommendations for a candidate based on their resume.

### 4. Interactions (The Core Engine)
* **SwipeHistory (`swipehistory`):** The most critical table for the UI. Records every user interaction (`action`: `RIGHT`, `LEFT`, or `SAVE`) on a specific `job_id`.
* **Application (`applications`):** Triggered when a user swipes RIGHT. Tracks the application status.
* **Recommendation (`recommendations`):** Stores the calculated `match_score` for a user-job pair to power the recommendation feed.

---

## 🔄 End-to-End User Flow

The entire application is built around a seamless, gamified flow. Here is the step-by-step journey of a user:

### Step 1: Authentication & Onboarding
1. The user creates an account and logs into the platform.
2. The frontend evaluates the `CandidateProfile` record in the database.
3. If the profile lacks mandatory fields (like `city`, `state`, `branch`, `stream`, or `experience_years`), the user is blocked by a "Strict Onboarding Gate" and forced to complete their profile.

### Step 2: Resume Parsing & ATS Generation
1. The user navigates to the ATS tab and uploads a PDF resume.
2. The file is saved, and PyMuPDF extracts the raw text.
3. The custom **NLP Parser** (`nlp_parser.py`) scans the document using regex and keyword dictionaries to identify technical skills, projects, and educational streams.
4. The backend automatically patches the `CandidateProfile` table with this extracted data, saving the user from manual data entry.
5. An **ATS Report** is generated, analyzing the resume for keyword richness and providing a score out of 100 with actionable feedback.

### Step 3: Skill-Based Job Matching
1. The user unlocks the "Discover Jobs" swipe deck.
2. The `job_matcher.py` service dynamically fetches all active jobs.
3. It queries the `SwipeHistory` table to instantly filter out any jobs the user has already seen or swiped on.
4. It compares the user's extracted skills against the job's `required_skills` JSON payload.
5. A `match_score` is calculated, and the jobs are served to the frontend deck sorted by highest relevance.

### Step 4: The Swipe Interaction
1. The user views the top recommended job on a highly interactive, animated glassmorphism card.
2. They drag the card using touch or mouse events:
   * **Drag Left (Pass):** The backend logs `LEFT` in `SwipeHistory`. The card flies off-screen, and the next job in the queue is revealed.
   * **Drag Up (Save):** Logs `SAVE` in `SwipeHistory`. The job is bookmarked and now appears in the user's "Saved Jobs" grid tab for later viewing.
   * **Drag Right (Apply):** Logs `RIGHT` in `SwipeHistory`, creates a record in `Applications`, and the frontend opens a new tab redirecting the user to the job's external `apply_url`.

---

## 🏗 Architecture & Tech Stack

### Frontend
* **Framework:** React + Vite
* **Routing:** React Router DOM
* **Styling:** Vanilla CSS with custom micro-animations (No Tailwind)
* **State Management:** React Context API (`AuthContext`)
* **HTTP Client:** Axios

### Backend
* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL (with SQLAlchemy ORM)
* **Authentication:** JWT (JSON Web Tokens) + Passlib for password hashing
* **PDF Processing:** PyMuPDF (`fitz`) for text extraction
* **Data Validation:** Pydantic

---

## 🧠 Core Files & Engine

Behind the scenes, SwipeX is powered by several critical services and routers that manage the intelligence of the platform:

### 1. `nlp_parser.py` (The Resume Brain)
* **Location:** `backend/app/services/nlp_parser.py`
* **Role:** Parses uploaded PDF resumes using PyMuPDF. It uses a robust, strictly bounded Regex/NLP extraction algorithm to reliably isolate the user's Skills, Experience, Education, and Certifications. It sorts known skills by length to ensure 100% accuracy and prevent false positive substring matches.

### 2. `job_matcher.py` (The Recommendation Engine)
* **Location:** `backend/app/services/job_matcher.py`
* **Role:** The heart of the recommendation feed. It fetches active jobs and the user's extracted profile. It calculates a deterministic **Match Score (0-100%)** by weighting skill overlap (50%), experience match (20%), location (10%), employment type (10%), and role fit (10%). It ensures users only see jobs they haven't swiped on yet.

### 3. `candidate.py` (The Central Router)
* **Location:** `backend/app/routers/candidate.py`
* **Role:** The main API router orchestrating all candidate actions. It handles resume uploads, dispatches parsing requests, manages the Tinder-style `swipe_job` interactions, and dynamically generates **Job-Specific ATS Reports** whenever a candidate applies for a job.

---

## ⚙️ Setup & Installation

### 1. Start the Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py               # Seed the PostgreSQL database with sample data
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to view the application!
