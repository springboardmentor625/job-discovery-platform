# SwipeX -- API Documentation

## Overview

The SwipeX backend is built with Flask and provides REST APIs for
candidate authentication, profile management, resume upload and parsing,
job discovery, ATS analysis, job recommendations, and swipe history.

Base URL during local development:

`http://localhost:5000`

Protected endpoints require a JWT access token returned by the login
API.

------------------------------------------------------------------------

## Authentication

### POST `/api/register`

Registers a new candidate.

**Request body:**

``` json
{
  "full_name": "Candidate Name",
  "email": "candidate@example.com",
  "password": "password"
}
```

**Success response:** `201 Created`

``` json
{
  "message": "Registration successful",
  "user_id": 1
}
```

------------------------------------------------------------------------

### POST `/api/login`

Authenticates a candidate using email and password and returns a JWT
access token.

**Request body:**

``` json
{
  "email": "candidate@example.com",
  "password": "password"
}
```

**Success response:** `200 OK`

``` json
{
  "message": "Login successful",
  "access_token": "<JWT_TOKEN>",
  "user_id": 1,
  "full_name": "Candidate Name",
  "email": "candidate@example.com"
}
```

Use the returned token for protected APIs:

`Authorization: Bearer <JWT_TOKEN>`

------------------------------------------------------------------------

## Candidate Profile

### POST `/api/profile`

Creates the authenticated candidate's profile.

**Authentication:** JWT required.

**Request body:**

``` json
{
  "headline": "Backend Developer",
  "summary": "Python backend developer",
  "location": "Bangalore",
  "experience_years": 1,
  "education": "B.Tech",
  "projects": "Job Discovery Platform",
  "certifications": "AWS",
  "preferred_job_type": "Full-time",
  "preferred_location": "Bangalore"
}
```

**Success response:** `201 Created`

Returns the created `profile_id` and authenticated `user_id`.

------------------------------------------------------------------------

### GET `/api/profile`

Retrieves the authenticated candidate's profile.

**Authentication:** JWT required.

Returns `profile_exists` and, when available, the complete candidate
profile.

------------------------------------------------------------------------

## Resume

### POST `/api/resume`

Uploads and parses a candidate resume.

**Authentication:** JWT required.

**Content type:** `multipart/form-data`

**Form field:** `resume`

**Current supported format:** PDF only.

**Maximum file size:** 5 MB.

The backend extracts text from the PDF and detects skills from the
application's configured skill list.

**Success response:** `201 Created`

Returns:

-   `resume_id`
-   `resume_name`
-   `user_id`
-   `extracted_skills`

------------------------------------------------------------------------

## Jobs

### GET `/api/jobs`

Returns all active jobs.

**Authentication:** JWT required.

The response includes:

-   Job details
-   Company name
-   Location
-   Employment type
-   Salary range
-   Experience requirement
-   Required skills
-   Posted date

------------------------------------------------------------------------

## ATS Analysis

### POST `/api/ats/analyze/<job_id>`

Analyzes the authenticated candidate's resume against the selected job.

**Authentication:** JWT required.

The current implementation:

1.  Gets the selected active job.
2.  Gets the candidate's default/latest resume.
3.  Reads extracted resume skills.
4.  Reads the job's required skills.
5.  Finds matched and missing skills.
6.  Calculates match percentage.
7.  Uses the match percentage as the current ATS score.
8.  Stores the ATS report in `ats_reports`.

**Success response:** `201 Created`

Returns:

-   `ats_report_id`
-   `job_id`
-   `resume_id`
-   `ats_score`
-   `match_percentage`
-   `matched_skills`
-   `missing_skills`
-   `suggestions`

------------------------------------------------------------------------

## Job Recommendations

### GET `/api/recommendations`

Generates job recommendations for the authenticated candidate.

**Authentication:** JWT required.

The current recommendation logic uses:

-   **70%** skill match
-   **15%** preferred location match
-   **15%** preferred job type match

The final recommendation score is returned for each active job, and
recommendations are sorted from highest score to lowest score.

The API also stores or updates the recommendation in the
`recommendations` table.

------------------------------------------------------------------------

## Swipe

### POST `/api/swipe`

Records the candidate's action on a job.

**Authentication:** JWT required.

**Request body:**

``` json
{
  "job_id": 1,
  "swipe_action": "RIGHT"
}
```

Allowed actions:

-   `LEFT` -- reject/pass the job
-   `RIGHT` -- interested/like the job
-   `SAVE` -- save the job

**Success response:** `201 Created`

``` json
{
  "message": "Swipe recorded successfully",
  "swipe_id": 1,
  "job_id": 1,
  "swipe_action": "RIGHT"
}
```

------------------------------------------------------------------------

### GET `/api/swipe-history`

Returns the authenticated candidate's swipe history.

**Authentication:** JWT required.

The response includes:

-   Swipe ID
-   Job ID
-   Job title
-   Company name
-   Swipe action
-   Swipe timestamp

------------------------------------------------------------------------

## Utility Endpoints

### GET `/`

Basic backend health message.

Response:

``` text
SwipeX Backend is running!
```

### GET `/test-db`

Tests the PostgreSQL database connection.

Successful response:

``` text
PostgreSQL connection successful!
```

------------------------------------------------------------------------

## API Flow

``` text
Register
   ↓
Login
   ↓
JWT Token
   ↓
Create Candidate Profile
   ↓
Upload Resume
   ↓
Resume Parsing + Skill Extraction
   ↓
View Active Jobs
   ↓
ATS Analysis
   ↓
Job Recommendations
   ↓
Swipe LEFT / RIGHT / SAVE
   ↓
Swipe History
```

## Current Implementation Notes

-   Authentication uses JWT.
-   Passwords are stored as password hashes rather than plain text.
-   Resume parsing currently supports PDF files only.
-   Skill extraction currently uses a predefined skill list and text
    matching.
-   ATS scoring currently uses required-skill match percentage as the
    ATS score.
-   Job recommendations currently use rule-based weighted matching.
-   Swipe actions are stored in `swipe_history`.
-   The backend seeds demo companies and jobs when the database does not
    already contain companies.

This document describes the current implemented backend APIs. Future
AI/ML recommendation or swipe-history training can be added as a later
enhancement.
