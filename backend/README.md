# SwipeX Candidate Workflow API

## Backend
- Django REST Framework
- PostgreSQL
- JWT Authentication

## Base URL
http://127.0.0.1:8000/api/

### Register

POST /api/register/

```json
{
  "username": "sameer",
  "email": "sameer@example.com",
  "password": "Sameer@123"
}
```

### Login

POST /api/token/

```json
{
  "username": "sameer",
  "password": "Sameer@123"
}
```

Copy the **access token** from the response.

### Candidate APIs

- GET /api/candidates/
- POST /api/candidates/
- GET /api/candidates/{id}/
- PUT /api/candidates/{id}/
- DELETE /api/candidates/{id}/

Use the **Bearer Token** (access token) for all Candidate APIs.