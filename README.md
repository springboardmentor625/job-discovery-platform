# Job Discovery Platform (SwipeX) 🚀

SwipeX is a modern talent & job discovery platform featuring Tinder-style swiping, real-time matching, intelligent ATS scoring, interactive applicant tracking, and direct chat communication between job seekers and recruiters.

---

## 🌟 Key Features

- 🃏 **Swipe Discovery**: Tinder-like card swiping mechanism for intuitive job seeking and candidate exploration.
- 🎯 **ATS Fit Scoring & Keyword Analysis**: Resume parser and applicant tracking evaluation comparing candidates with job specifications.
- 📊 **Kanban Pipeline**: Streamlined applicant management with drag-and-drop statuses (Applied, Screening, Interview, Offer, Rejected).
- 💬 **Real-time Messaging**: Instant messaging between matched recruiters and candidates.
- 🌓 **Modern UI/UX**: Sleek dark & light theme built with React, Tailwind CSS, Lucide icons, and responsive layouts.
- ⚡ **High Performance Backend**: Built on FastAPI, SQLAlchemy, SQLite, and JWT-secured RESTful endpoints.

---

## 🏗️ Architecture

```
job-discovery-platform/
├── backend/              # FastAPI REST API, SQLAlchemy ORM & Auth
│   ├── app/
│   │   ├── api/          # Route handlers (auth, candidates, jobs, matches, messages, ats)
│   │   ├── core/         # Config, security & JWT utilities
│   │   ├── models/       # Database models
│   │   └── schemas/      # Pydantic schemas
│   └── tests/            # Automated test suite
├── frontend/             # Vite + React single-page application
│   ├── src/
│   │   ├── components/   # Modular UI components (SwipeDeck, ATSModal, Kanban, etc.)
│   │   ├── pages/        # Route pages (Discover, Matches, Messages, Profile, Jobs)
│   │   └── context/      # Auth & Theme context providers
│   └── public/
└── docs/                 # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

---

### Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API Docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```

4. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Access web app at: [http://localhost:5173](http://localhost:5173)

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).