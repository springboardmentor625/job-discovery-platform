# SwipeX – Swipe-Based Intelligent Job Discovery Platform

SwipeX is an intelligent job discovery and career assistance platform that helps candidates discover jobs based on their skills, experience, preferences, and profile information.

The platform uses a swipe-based job discovery system where candidates can like, reject, save, and manage jobs. It also includes candidate profile management, resume management, job matching, ATS-related functionality, and saved job management.

---

# 🚀 Features Completed So Far

## 1. User Authentication

- User registration
- User login
- JWT-based authentication
- Secure password handling
- Role-based user access
- Authentication token storage
- Protected candidate routes
- Automatic redirect to login when authentication fails

---

# 👤 Candidate Profile Management

Candidates can create and update their professional profile.

Profile includes:

- Headline
- Bio
- Location
- Education
- Skills
- Experience level
- Preferred role
- Preferred location
- Expected salary

### Skills Management

The candidate can:

- Select skills from predefined skills
- Search for skills
- Select multiple skills
- Remove selected skills
- Add custom skills
- Add multiple custom skills using commas
- Automatically close the skill dropdown after selecting a skill
- Hide the custom skill input after adding a custom skill
- Prevent duplicate skills

---

# 📄 Resume Management

The platform supports resume management for candidates.

Current functionality includes:

- Upload resume
- Save resume information
- Resume file handling
- Resume-related API routes

Resume information can be used as part of the candidate profile and job matching process.

---

# 🔍 Intelligent Job Discovery

Candidates can discover jobs that match their profile.

The system considers:

- Candidate skills
- Experience
- Preferred role
- Preferred location
- Other profile information

Jobs are displayed with:

- Job title
- Company name
- Location
- Employment type
- Salary
- Experience required
- Required skills
- Matched skills
- Job description
- Match percentage

---

# 🎯 Job Matching

SwipeX provides matched jobs based on candidate information.

The job discovery page displays:

- Job match score
- Matched skills
- Required skills
- Candidate-relevant jobs

Jobs are ranked based on how well they match the candidate profile.

---

# ❤️ Swipe-Based Job Actions

Candidates can interact with jobs using swipe-style actions.

Available actions:

- ❤️ Like a job
- ✕ Reject a job
- 🔖 Save a job

After performing an action, the job is updated accordingly.

For example:

- Liked jobs are marked as interested
- Rejected jobs are removed from discovery
- Saved jobs are stored in the candidate's saved jobs list

---

# 🔖 Saved Jobs

Candidates can save jobs for later.

Features include:

- Save a job
- Remove a saved job
- View all saved jobs
- View saved job details
- See the saved date
- Prevent duplicate saved jobs

The saved jobs page displays:

- Job title
- Company
- Location
- Employment type
- Salary
- Skills
- Description
- Saved date

---

# 📊 ATS Functionality

The backend currently includes ATS-related routes and functionality.

The project is designed to support:

- Resume analysis
- Job description comparison
- Skill comparison
- ATS scoring
- Resume matching

Further improvements can be added to make ATS scoring more advanced.

---

# 🔔 User Notifications

The application includes user feedback for actions.

Notifications/messages can be used for actions such as:

- Job saved successfully
- Job removed from saved jobs
- Job liked
- Job rejected
- Profile saved successfully
- Resume saved successfully
- Error messages

Notifications are designed to provide immediate feedback to the candidate.

---

# 🧭 Candidate Dashboard

The candidate dashboard acts as the main workspace.

From the dashboard, candidates can access:

- Profile
- Edit Profile
- Discover Jobs
- Saved Jobs
- Resume Management
- Other candidate features

---

# 🏗️ Current Project Architecture

```text
SwipeX
│
├── Frontend
│   ├── React
│   ├── Vite
│   ├── React Router
│   ├── Axios
│   │
│   ├── Authentication Pages
│   ├── Candidate Dashboard
│   ├── Profile Management
│   ├── Edit Profile
│   ├── Job Discovery
│   ├── Saved Jobs
│   └── Resume Management
│
├── Backend
│   ├── FastAPI
│   ├── SQLAlchemy
│   ├── JWT Authentication
│   ├── PostgreSQL
│   │
│   ├── Authentication APIs
│   ├── Candidate APIs
│   ├── Job APIs
│   ├── Match APIs
│   ├── Swipe APIs
│   ├── Saved Job APIs
│   ├── Resume APIs
│   └── ATS APIs
│
└── Database
    ├── Users
    ├── Candidate Profiles
    ├── Jobs
    ├── Saved Jobs
    ├── Swipe Actions
    └── Resume Information