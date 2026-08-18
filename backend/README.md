# Backend - swipe x

FastAPI backend service for swipe x.

## Overview

The backend is a Python REST API built with FastAPI that handles:
- Job listings and management
- User authentication and profiles
- Job applications tracking
- Saved jobs management

## Quick Start

See the main [SETUP.md](../docs/SETUP.md) for detailed setup instructions.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── database.py          # Database configuration
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── job.py
│   │   ├── user.py
│   │   ├── application.py
│   │   └── saved_job.py
│   ├── routes/              # API endpoints
│   │   ├── __init__.py
│   │   ├── jobs.py
│   │   ├── users.py
│   │   ├── applications.py
│   │   ├── auth.py
│   │   └── saved_jobs.py
│   ├── schemas/             # Pydantic request/response models
│   │   ├── __init__.py
│   │   ├── job_schema.py
│   │   ├── user_schema.py
│   │   └── application_schema.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── job_service.py
│   │   ├── user_service.py
│   │   ├── application_service.py
│   │   └── auth_service.py
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── validators.py
│       ├── decorators.py
│       └── constants.py
├── tests/                   # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_jobs.py
│   ├── test_users.py
│   ├── test_applications.py
│   └── test_auth.py
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (not committed)
└── README.md               # This file
```

## Key Features

### 1. Job Management
- List all jobs with pagination
- Search and filter jobs
- Get detailed job information
- Create, update, and delete jobs (admin)

### 2. User Management
- User registration and authentication
- User profile management
- User preferences storage

### 3. Applications
- Submit job applications
- Track application status
- View application history
- Update application status (admin)

### 4. Saved Jobs
- Save favorite jobs
- View saved jobs list
- Remove saved jobs

## Dependencies

### Core
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI web server
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation using Python type annotations

### Authentication & Security
- **python-jose** - JWT token handling
- **passlib** - Password hashing
- **bcrypt** - Cryptographic hashing

### Database
- **python-dotenv** - Environment variable management
- **alembic** - Database migrations (optional)

### Development
- **pytest** - Testing framework
- **pytest-cov** - Code coverage
- **black** - Code formatter
- **flake8** - Code linter
- **isort** - Import sorter

## Environment Variables

Create a `.env` file in the backend directory:

```
# Database
DATABASE_URL=sqlite:///./swipe_x.db

# Application
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# JWT
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# API
API_PREFIX=/api/v1
```

## Running the Application

### Development Mode
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Gunicorn (Production)
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

## Testing

### Run All Tests
```bash
pytest
```

### Run Specific Test File
```bash
pytest tests/test_jobs.py -v
```

### Run with Coverage Report
```bash
pytest --cov=app --cov-report=html tests/
```

### Run Tests in Watch Mode
```bash
pytest-watch
```

## Code Quality

### Format Code
```bash
black app/ tests/
isort app/ tests/
```

### Check Code Style
```bash
flake8 app/ tests/
```

### Full Quality Check
```bash
black app/ tests/ --check
isort app/ tests/ --check
flake8 app/ tests/
pytest --cov=app tests/
```

## Database

### Initialize Database
```bash
# For simple setup (creates tables)
python -c "from app.models import Base; from app.database import engine; Base.metadata.create_all(bind=engine)"
```

### Database Migrations (with Alembic)
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Database Queries
```bash
# Interactive Python shell with models imported
python

>>> from app.database import SessionLocal
>>> from app.models import Job, User
>>> db = SessionLocal()
>>> jobs = db.query(Job).all()
>>> print(len(jobs))
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

For detailed API documentation, see [API.md](../docs/API.md)

## Authentication

### JWT Authentication
1. User registers/logs in with email and password
2. Backend returns JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Backend validates token for protected endpoints

### Example
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response: {"access_token": "eyJhbGc...", "token_type": "bearer"}

# Use token
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:8000/api/v1/users/me
```

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
python -m uvicorn app.main:app --reload --port 8001
```

### ModuleNotFoundError
```bash
# Ensure virtual environment is activated and dependencies installed
pip install -r requirements.txt
```

### Database Errors
```bash
# Reset database (development only)
rm job_platform.db
python -m uvicorn app.main:app --reload
```

### CORS Errors
Update `CORS_ORIGINS` in `.env` with your frontend URL.

## Performance Tips

1. **Use Database Indexes**: Index frequently queried fields
2. **Implement Caching**: Cache expensive queries
3. **Pagination**: Always paginate list endpoints
4. **Connection Pooling**: Use SQLAlchemy connection pooling
5. **Query Optimization**: Use `.select()` with joins efficiently

## Deployment

See the main project [SETUP.md](../docs/SETUP.md) for deployment information.

### Docker (Optional)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

## Contributing

See [CONTRIBUTING.md](../docs/CONTRIBUTING.md) for contribution guidelines.

## Architecture

For detailed system architecture, see [ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## License

MIT License - See [LICENSE](../LICENSE)
