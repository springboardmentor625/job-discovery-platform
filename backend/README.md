# SwipeX Backend

## Overview

Backend APIs for the SwipeX job discovery platform.

## Technologies

- Python
- Flask
- PostgreSQL
- Flask-SQLAlchemy
- Flask-CORS
- Flask-JWT-Extended

## Current Features

- Candidate registration
- Candidate login
- Password hashing
- JWT authentication
- JWT-protected candidate profile
- PostgreSQL integration

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/register` | Register candidate |
| POST | `/api/login` | Login and generate JWT |
| POST | `/api/profile` | Create candidate profile |

## Database

Current tables:

- `users`
- `candidate_profiles`

## Run Locally

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Backend runs at:

`http://127.0.0.1:5000`

## Environment

Create a local `.env` file with the database URL and JWT secret.
