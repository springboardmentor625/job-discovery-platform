# API Documentation

Complete reference for the swipe x backend API.

## Overview

The backend API is built with **FastAPI** and provides RESTful endpoints for managing jobs, applications, and user data. All endpoints return JSON responses.

**Base URL**: `http://localhost:8000/api/v1`

**Interactive API Docs**: `http://localhost:8000/docs` (Swagger UI)

## Authentication

Currently, the API may support authentication via:
- Bearer tokens in the `Authorization` header
- Session cookies

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/v1/users/me
```

## Response Format

All responses follow a consistent format:

### Success Response (2xx)
```json
{
  "data": {
    "id": 1,
    "name": "Job Title"
  },
  "message": "Success"
}
```

### Error Response (4xx/5xx)
```json
{
  "detail": "Error message",
  "status_code": 400
}
```

## API Endpoints

### Jobs

#### List All Jobs
```
GET /api/v1/jobs
```

**Query Parameters:**
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Number of records to return (default: 10)
- `search` (string): Search term for job title or description
- `location` (string): Filter by job location
- `salary_min` (int): Minimum salary filter
- `salary_max` (int): Maximum salary filter

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Senior Developer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "description": "...",
      "salary": 150000,
      "posted_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 50
}
```

#### Get Job Details
```
GET /api/v1/jobs/{job_id}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "title": "Senior Developer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "description": "Detailed job description...",
    "requirements": ["Python", "FastAPI", "React"],
    "salary": 150000,
    "salary_currency": "USD",
    "job_type": "Full-time",
    "posted_at": "2024-01-15T10:00:00Z",
    "expires_at": "2024-02-15T10:00:00Z"
  }
}
```

#### Create Job (Admin Only)
```
POST /api/v1/jobs
```

**Request Body:**
```json
{
  "title": "Senior Developer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "description": "Job description...",
  "requirements": ["Python", "FastAPI"],
  "salary": 150000,
  "job_type": "Full-time"
}
```

**Response:** Returns the created job object with `id`

#### Update Job
```
PUT /api/v1/jobs/{job_id}
```

#### Delete Job
```
DELETE /api/v1/jobs/{job_id}
```

### Applications

#### Submit Job Application
```
POST /api/v1/applications
```

**Request Body:**
```json
{
  "job_id": 1,
  "cover_letter": "I am interested in this position...",
  "resume_url": "https://..."
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "job_id": 1,
    "user_id": 1,
    "status": "pending",
    "applied_at": "2024-01-20T15:30:00Z"
  }
}
```

#### Get My Applications
```
GET /api/v1/applications/me
```

**Query Parameters:**
- `status` (string): Filter by status (pending, accepted, rejected, etc.)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "job": {
        "id": 1,
        "title": "Senior Developer",
        "company": "Tech Corp"
      },
      "status": "pending",
      "applied_at": "2024-01-20T15:30:00Z"
    }
  ]
}
```

#### Get Application Details
```
GET /api/v1/applications/{application_id}
```

#### Update Application Status (Admin)
```
PUT /api/v1/applications/{application_id}
```

**Request Body:**
```json
{
  "status": "accepted"
}
```

### Users

#### Register New User
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Get Current User
```
GET /api/v1/users/me
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "profile": {
      "bio": "Software developer",
      "skills": ["Python", "React", "FastAPI"]
    }
  }
}
```

#### Update User Profile
```
PUT /api/v1/users/me
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "bio": "Senior Software Developer",
  "skills": ["Python", "React", "FastAPI", "PostgreSQL"]
}
```

### Saved Jobs

#### Save Job
```
POST /api/v1/saved-jobs
```

**Request Body:**
```json
{
  "job_id": 1
}
```

#### Get Saved Jobs
```
GET /api/v1/saved-jobs
```

#### Remove Saved Job
```
DELETE /api/v1/saved-jobs/{job_id}
```

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 500 | `INTERNAL_ERROR` | Server error |

## Rate Limiting

- **Anonymous requests**: 30 requests per minute
- **Authenticated requests**: 100 requests per minute
- **Admin requests**: Unlimited

Rate limit info is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642521600
```

## Pagination

List endpoints support cursor-based pagination:

```
GET /api/v1/jobs?skip=0&limit=10
```

Response includes pagination info:
```json
{
  "data": [...],
  "total": 150,
  "skip": 0,
  "limit": 10
}
```

## Filtering & Sorting

### Jobs Filtering
- `search`: Full-text search on title and description
- `location`: Exact location match
- `salary_min`, `salary_max`: Salary range
- `job_type`: Filter by employment type
- `posted_after`: Filter jobs posted after a date

### Sorting
```
GET /api/v1/jobs?sort=salary_desc
GET /api/v1/jobs?sort=posted_date_desc
```

## Examples

### Search for Python Developer Jobs
```bash
curl "http://localhost:8000/api/v1/jobs?search=python&location=San%20Francisco"
```

### Apply for a Job
```bash
curl -X POST http://localhost:8000/api/v1/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 1, "cover_letter": "I am interested..."}'
```

### Get User's Applications with Pending Status
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/applications/me?status=pending"
```

## Webhooks (Coming Soon)

Webhooks will allow your application to receive real-time notifications for:
- Job application status changes
- New job postings matching user preferences
- Saved job updates

## SDKs

Official SDKs available for:
- JavaScript/TypeScript (coming soon)
- Python (coming soon)

## Support

For API issues and questions:
- Check the [Swagger UI](http://localhost:8000/docs) for live testing
- Review the source code in `backend/app/routes/`
- Create an issue in the repository
