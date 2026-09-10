# SwipeX – AI-Powered Swipe-Based Intelligent Job Discovery Platform

> **Infosys Springboard Virtual Internship 7.0 – Final Individual Project**  
> An intelligent, candidate-centric job discovery platform combining automated resume parsing, multi-dimensional ATS scoring, machine learning-driven recommendations, and an intuitive swipe-based discovery interface.

---

## 📖 Project Overview

**SwipeX** modernizes the traditional job search process by transforming static job boards into an engaging, intelligent experience. Rather than sifting through hundreds of irrelevant postings, candidates receive personalized job cards evaluated against their extracted resume profile, ATS readiness index, and career interests.

By incorporating an active learning feedback loop, the platform records candidate swipe interactions (Left = Skip, Right = Save/Interested) to calibrate a Machine Learning recommendation model that progressively tailors opportunities to user preferences.

---

## 🎯 Key Objectives

- **Frictionless Candidate Experience:** Fast registration, JWT authentication, and automated profile building.
- **Deep Resume Analysis:** Automated extraction of skills, experience, education, projects, and certifications from PDF/DOCX resumes.
- **Multi-Dimensional ATS Evaluation:** Objective 0–100 scoring based on section completeness, skill breadth, and action-verb keyword density.
- **GenAI Career Suggestions:** Contextual resume enhancement feedback powered by Groq LLaMA 3.3 with offline fallback.
- **Hybrid Recommendation Engine:** Multi-factor scoring incorporating resume skills, location preferences, role alignment, ATS index, and trained ML swipe behavior.
- **Interactive Swipe Navigation:** Framer Motion drag-and-swipe cards with progress milestones and saved job tracking.
- **End-to-End Application Tracking:** Comprehensive dashboard displaying applied jobs, real-time match scores, matched skills, and identified skill gaps.

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion (gesture drag & swipe physics)
- **Icons & Notifications:** React Icons, React Hot Toast, SweetAlert2
- **HTTP Client:** Axios (configured with JWT interceptors)

### Backend
- **Framework:** Python 3.12+ / Django 6.1
- **API Framework:** Django REST Framework (DRF) 3.18
- **Authentication:** JSON Web Tokens (djangorestframework-simplejwt)
- **Cross-Origin Handling:** django-cors-headers

### Machine Learning & Data Processing
- **Libraries:** Scikit-learn, Pandas, NumPy, Joblib
- **Feature Extraction:** CountVectorizer (lowercase, n-gram tokenization)
- **Algorithms:** Logistic Regression (swipe preference classifier), Multinomial Naive Bayes
- **Dataset:** Curated LinkedIn job postings dataset with mapped skill taxonomies

### Resume Processing & Generative AI
- **Document Parsing:** PyMuPDF (`fitz`), `python-docx`, `pypdf`
- **Generative AI:** Groq SDK (`llama-3.3-70b-versatile`) with structured JSON schema outputs

### Database & DevOps
- **Database:** PostgreSQL 16
- **Containerization:** Docker & Docker Compose
- **Version Control:** Git & GitHub

---

## 🔄 Candidate Workflow

```text
Register (Email & Password)
    ↓
Login (JWT Access & Refresh Tokens)
    ↓
Candidate Profile Creation
    ↓
Resume Upload (PDF / DOCX)
    ↓
Automated Resume Parsing (Skills, Experience, Education)
    ↓
Multi-Dimensional ATS & Keyword Analysis
    ↓
AI Resume Suggestions (Groq LLaMA 3.3)
    ↓
Hybrid AI Job Recommendations
    ↓
Swipe Discovery (Left = Skip, Right = Save, Apply)
    ↓
Swipe History Learning Loop (50 Swipes Milestone)
    ↓
Application Tracking Dashboard (Status & Skill Breakdown)
```

---

## 📂 Project Structure

```text
SwipeX final/
├── backend/
│   ├── candidates/                 # Core DRF Application
│   │   ├── management/commands/    # CLI tools: import_jobs, train_recommendation_model
│   │   ├── migrations/             # Database migrations
│   │   ├── services/               # Service layer: resume, recommendation, application, file
│   │   ├── utils/                  # Core engines: ats.py, matcher.py, groq_service.py
│   │   ├── models.py               # Candidate, Resume, Job, JobSwipe, Application
│   │   ├── serializers.py          # DRF Serializers with field validations
│   │   ├── urls.py                 # Application API endpoints
│   │   └── views.py                # ViewSets and APIViews
│   ├── config/                     # Django Project Settings & Routing
│   ├── dataset/                    # Preloaded job dataset (postings.csv)
│   ├── ml/                         # Naive Bayes model and artifacts
│   ├── recommendation/             # Trained ML models (recommendation_model.pkl)
│   ├── Dockerfile                  # Backend container specification
│   ├── requirements.txt            # Python dependencies
│   └── manage.py                   # Django management entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI: Sidebar, Layout
│   │   ├── pages/                  # Views: Jobs, Applications, Recommendations, MyResume, Dashboard
│   │   ├── services/               # Axios API client & token handling (api.js)
│   │   ├── App.jsx                 # Route definitions & guards
│   │   └── main.jsx                # React root entrypoint
│   ├── Dockerfile                  # Frontend container specification
│   └── package.json                # Node.js dependencies
│
├── docs/                           # Architecture, schema diagrams, and documentation
├── docker-compose.yml              # Multi-container orchestration (db, backend, frontend)
├── .env.example                    # Environment variable template
└── README.md                       # Main project documentation
```

---

## 📡 API Endpoints Reference

All endpoints are mounted under `/api/` and require JWT `Bearer <token>` authentication (except public auth routes):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/register/` | Register candidate account |
| `POST` | `/api/login/` | Authenticate with email/password; returns JWT tokens |
| `POST` | `/api/token/refresh/` | Refresh expired access token |
| `GET/POST` | `/api/candidates/` | Retrieve or create candidate profile |
| `GET/POST` | `/api/resumes/` | Upload, parse, and analyze candidate resume |
| `GET` | `/api/resumes/{id}/file/` | Serve parsed resume or preview PDF |
| `GET` | `/api/jobs/` | Paginated list of unswiped job postings |
| `POST` | `/api/swipes/` | Record swipe action (`left` = skip, `right` = save) |
| `GET/POST` | `/api/applications/` | List submitted applications with match analysis or apply |
| `GET` | `/api/recommendations/` | AI hybrid recommended jobs with explainability reasons |

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- PostgreSQL 16 (or Docker Desktop)

### Option 1: Running with Docker (Recommended)

1. Clone repository:
   ```bash
   git clone https://github.com/springboardmentor625/job-discovery-platform.git
   cd job-discovery-platform
   ```
2. Launch containers:
   ```bash
   docker-compose up --build
   ```
3. Access services:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000/api/`
   - Admin: `http://localhost:8000/admin/`

---

### Option 2: Local Development Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run database migrations
python manage.py migrate

# (Optional) Preload curated LinkedIn jobs
python manage.py import_jobs

# Start Django development server
python manage.py runserver
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧠 Machine Learning & Recommendation Logic

SwipeX combines supervised Machine Learning with heuristic domain modeling:

$$\text{Final Recommendation Score} = 0.35 \times \text{Skill Match} + 0.25 \times \text{ATS Score} + 0.20 \times \text{Swipe ML Factor} + 0.10 \times \text{Location} + 0.10 \times \text{Role Alignment}$$

1. **Skill Match (35%):** Dynamic intersection of candidate skills (extracted + profile) against job requirements.
2. **Resume ATS Readiness (25%):** Section completeness, technical depth, and action-verb keyword density.
3. **Swipe History & ML Factor (20%):** Trained `LogisticRegression` probability score calibrated from candidate's right and left swipes.
4. **Location Preference (10%):** Proximity alignment with previous right-swipe locations and remote flexibility.
5. **Role Alignment (10%):** Semantic matching with job titles previously liked by the candidate.

---

## 👩‍💻 Author & Project Context

- **Developer:** Praveena Durga
- **Project:** Infosys Springboard Virtual Internship 7.0
- **Domain:** Artificial Intelligence & Full-Stack Web Development

