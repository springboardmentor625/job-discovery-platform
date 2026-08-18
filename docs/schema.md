# SwipeX — Database Schema

Primary database: **PostgreSQL**. Local dev fallback: **SQLite**.

## Users
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | string | |
| email | string, unique | used as login |
| password_hash | string | Django handles hashing |
| role | enum | `job_seeker`, `recruiter`, `admin` |
| created_at | datetime | |

## Profiles
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → Users | one-to-one |
| bio | text | |
| skills | text[] | tags |
| experience | text | |
| portfolio_url | string | |

## Resumes
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → Users | |
| file | file/URL | |
| version | integer | supports multiple resume versions |
| parsed_text | text | filled in by AI resume analyzer (Milestone 3) |
| uploaded_at | datetime | |

## Jobs
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| recruiter_id | FK → Users | who posted it |
| company | string | |
| title | string | |
| description | text | |
| job_type | enum | `full_time`, `internship`, `remote`, etc. |
| location | string | |
| salary_min / salary_max | integer | |
| skills_required | text[] | |
| posted_at | datetime | |

## Swipes
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → Users | |
| job_id | FK → Jobs | |
| direction | enum | `left`, `right` |
| created_at | datetime | feeds the recommendation engine (Milestone 3) |

## Applications
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → Users | |
| job_id | FK → Jobs | |
| status | enum | `saved`, `applied`, `interview`, `shortlisted`, `rejected` |
| applied_at | datetime | |

## Recommendations
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → Users | |
| job_id | FK → Jobs | |
| match_score | float | AI-generated match percentage |

## Notifications
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → Users | |
| message | text | |
| read | boolean | |
| created_at | datetime | |

See `schema.dbml` for a diagram-ready version — paste it into
https://dbdiagram.io to get a visual ER diagram.

## Milestone 1 scope note

For Milestone 1, only **Users** and **Profiles** are wired up with real API
endpoints (registration, login, roles). The other tables are modeled now
(see the Django models in `backend/*/models.py`) so migrations create the
full schema up front, but their API endpoints (jobs, swipes, applications,
recommendations, notifications) are built out in Milestones 2–4 per the
project plan.
