# job-discovery-platform

# SwipeX 🚀

### Swipe-Based Intelligent Job Discovery and Career Assistance Platform

SwipeX is a job discovery platform that helps candidates discover suitable job opportunities through profile-based matching and a swipe-based job interaction system.

## 🎯 Features

- 🔐 Candidate Registration & Login
- 👤 Candidate Profile Management
- 📄 Resume Upload & Replacement
- 💼 Job Discovery
- 🎯 Candidate-Job Matching
- 👆 Like / Reject Jobs
- ❤️ Matched Jobs
- 📝 Job Applications
- 📊 Application Tracking

## 🧠 Job Matching

Jobs are currently matched using:

| Criteria     | Weight |
|----------    |--------|
| Skills       | 50%    |
| Experience   | 20%    |
| Location     | 15%    |
| Salary       | 15%    |

A temporary Kaggle job dataset is used to test and validate the matching functionality.

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript
- React Router
- Axios
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

### Database
- PostgreSQL

## 🏗️ Architecture

```text
React Frontend
      ↓
FastAPI Backend
      ↓
SQLAlchemy
      ↓
PostgreSQL
      ↓
Job Matching Engine