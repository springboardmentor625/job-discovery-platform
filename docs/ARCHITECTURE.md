# Architecture Overview

Technical design and system architecture of swipe x.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Web Browser - React/Vite, Mobile Apps, Desktop Clients)  │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTPS / WebSocket
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     API Gateway / Proxy                      │
│           (Load Balancing, Rate Limiting, Auth)             │
└────────────────────────────┬────────────────────────────────┘
                             │
                         HTTP/REST
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  FastAPI Backend Service                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes (Endpoints)                                  │  │
│  │  ├── /jobs          (Job listings)                   │  │
│  │  ├── /applications  (User applications)              │  │
│  │  ├── /users         (User management)                │  │
│  │  ├── /auth          (Authentication)                 │  │
│  │  └── /saved-jobs    (Saved jobs)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services (Business Logic)                           │  │
│  │  ├── JobService       (Job operations)               │  │
│  │  ├── ApplicationService (Application handling)       │  │
│  │  ├── UserService      (User operations)              │  │
│  │  └── AuthService      (Authentication logic)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Models (Data Layer)                                 │  │
│  │  ├── Job             (Job listings)                  │  │
│  │  ├── Application     (Applications)                  │  │
│  │  ├── User            (Users)                         │  │
│  │  └── SavedJob        (Saved jobs)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┬──┘
                     │                                     │
                    SQL                              Logging
                     │                                     │
        ┌────────────▼────────────┐         ┌──────────────▼─────────┐
        │   Database              │         │   Logging Service      │
        │  (SQLite / PostgreSQL)  │         │   (Logs & Monitoring)  │
        └─────────────────────────┘         └────────────────────────┘
```

## Component Details

### Frontend (React/Vite)
- **Technology**: React 18+, Vite, TypeScript (optional)
- **Styling**: CSS/Tailwind/Styled Components
- **State Management**: Context API / Redux (if applicable)
- **API Client**: Axios / Fetch API
- **Components Structure**:
  ```
  src/
  ├── components/
  │   ├── JobCard.tsx
  │   ├── JobList.tsx
  │   ├── SearchBar.tsx
  │   └── ...
  ├── pages/
  │   ├── JobsPage.tsx
  │   ├── ApplicationsPage.tsx
  │   ├── ProfilePage.tsx
  │   └── ...
  ├── services/
  │   └── api.ts (API client)
  ├── hooks/
  │   └── useJobs.ts, useAuth.ts
  └── App.tsx
  ```

### Backend (FastAPI)

#### Routes Layer (`app/routes/`)
Handles HTTP requests and responses. Each route file handles a specific resource:
- `jobs.py` - Job listing endpoints
- `applications.py` - Application endpoints
- `users.py` - User management endpoints
- `auth.py` - Authentication endpoints
- `saved_jobs.py` - Saved jobs endpoints

**Example Route Structure**:
```python
from fastapi import APIRouter, Depends
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/")
async def list_jobs(skip: int = 0, limit: int = 10):
    # Calls service layer
    jobs = JobService.get_all(skip, limit)
    return {"data": jobs}

@router.get("/{job_id}")
async def get_job(job_id: int):
    job = JobService.get_by_id(job_id)
    return {"data": job}
```

#### Services Layer (`app/services/`)
Contains business logic and data manipulation:
- `job_service.py` - Job operations
- `application_service.py` - Application handling
- `user_service.py` - User operations
- `auth_service.py` - Authentication logic

**Example Service Structure**:
```python
class JobService:
    @staticmethod
    def get_all(skip: int, limit: int):
        # Business logic here
        return db.query(Job).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(job_id: int):
        return db.query(Job).filter(Job.id == job_id).first()
    
    @staticmethod
    def create(job_data):
        new_job = Job(**job_data.dict())
        db.add(new_job)
        db.commit()
        return new_job
```

#### Models Layer (`app/models/`)
SQLAlchemy ORM models representing database tables:
- `job.py` - Job model
- `user.py` - User model
- `application.py` - Application model
- `saved_job.py` - SavedJob model

**Example Model**:
```python
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String)
    description = Column(String)
    salary = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### Schemas Layer (`app/schemas/`)
Pydantic models for request/response validation:
- `job_schema.py` - Job schemas
- `user_schema.py` - User schemas
- `application_schema.py` - Application schemas

**Example Schema**:
```python
from pydantic import BaseModel
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    description: str
    salary: int

class JobResponse(JobCreate):
    id: int
    created_at: datetime
```

#### Utils Layer (`app/utils/`)
Helper functions and utilities:
- `decorators.py` - Custom decorators
- `validators.py` - Validation functions
- `helpers.py` - Helper functions
- `constants.py` - Constants and configurations

### Database

#### Schema Design
```sql
Jobs
├── id (Primary Key)
├── title
├── company
├── location
├── description
├── salary
└── created_at

Users
├── id (Primary Key)
├── email (Unique)
├── password_hash
├── full_name
├── created_at
└── updated_at

Applications
├── id (Primary Key)
├── job_id (Foreign Key → Jobs)
├── user_id (Foreign Key → Users)
├── status (pending, accepted, rejected)
├── cover_letter
└── applied_at

SavedJobs
├── id (Primary Key)
├── user_id (Foreign Key → Users)
├── job_id (Foreign Key → Jobs)
└── saved_at
```

#### Database Connection
- **ORM**: SQLAlchemy
- **Migrations**: Alembic (optional)
- **Connection Pool**: Managed by SQLAlchemy

### Authentication & Security

#### Authentication Flow
```
1. User submits email/password
2. Backend validates credentials
3. JWT token generated (if valid)
4. Frontend stores token in localStorage/cookie
5. Subsequent requests include token in Authorization header
6. Backend validates token before processing request
```

#### Security Measures
- Password hashing (bcrypt)
- JWT token expiration
- CORS configuration
- Input validation (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)
- Rate limiting
- HTTPS enforcement (production)

### Data Flow Examples

#### Creating a Job Application
```
1. Frontend → POST /api/v1/applications
   {
     "job_id": 1,
     "cover_letter": "...",
     "resume_url": "..."
   }

2. Backend Route Handler
   - Validates request (Pydantic schema)
   - Checks authentication

3. Service Layer
   - Verifies job exists
   - Creates application record
   - Returns application data

4. Frontend
   - Updates UI
   - Shows success message
```

#### Searching Jobs
```
1. Frontend → GET /api/v1/jobs?search=python&location=sf

2. Backend Route Handler
   - Extracts query parameters

3. Service Layer
   - Builds database query with filters
   - Executes query
   - Returns paginated results

4. Frontend
   - Displays results
   - Updates search filters UI
```

### Caching Strategy (Optional)

- **Frontend**: HTTP caching headers, localStorage for UI state
- **Backend**: Redis cache for frequently accessed jobs
- **Database**: Connection pooling

### Error Handling

**Centralized Error Handler**:
```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

### Logging Strategy

- Application logs to console and files
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Centralized logging in production (ELK stack, CloudWatch, etc.)

## Deployment Architecture

### Development Environment
- Backend: `localhost:8000`
- Frontend: `localhost:3000`
- Database: Local SQLite

### Production Environment
```
                    ┌─────────────────┐
                    │   DNS / CDN      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Load Balancer   │
                    └────────┬─────────┘
                             │
            ┌────────────┬───┴───┬────────────┐
            │            │       │            │
        ┌───▼──┐     ┌───▼──┐ ┌─▼────┐   ┌──▼──┐
        │API-1 │     │API-2 │ │API-3 │   │... │
        └───┬──┘     └───┬──┘ └──┬───┘   └──┬──┘
            │            │       │          │
            └────────────┼───────┼──────────┘
                         │
                    ┌────▼──────┐
                    │  Database  │
                    │ (Replicated)
                    └───────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18+, Vite, TypeScript (optional) |
| **Backend** | Python 3.9+, FastAPI, Uvicorn |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **ORM** | SQLAlchemy |
| **API Validation** | Pydantic |
| **Authentication** | JWT / Session |
| **Testing** | Pytest (Backend), Jest/Vitest (Frontend) |
| **Deployment** | Docker (optional), Cloud platforms |

## Performance Considerations

1. **Database Indexing**: Index frequently queried fields (job_id, user_id)
2. **Query Optimization**: Use joins efficiently, lazy loading
3. **Frontend Optimization**: Code splitting, lazy loading components
4. **API Optimization**: Pagination, filtering, compression
5. **Caching**: Cache job listings, user profiles

## Scalability

- **Horizontal Scaling**: Multiple API instances behind load balancer
- **Database Scaling**: Read replicas, connection pooling
- **Frontend Distribution**: CDN for static assets
- **Message Queue**: Celery/RabbitMQ for async tasks (future)

## Next Steps

- Review specific components in their respective directories
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- See [SETUP.md](SETUP.md) for local development setup
