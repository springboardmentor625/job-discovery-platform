# SwipeX Implementation Walkthrough

The SwipeX complete project audit and feature implementation is now complete. I have worked sequentially through the approved implementation plan, addressing bug fixes, security loopholes, ATS improvements, the recommendation engine, and frontend refactoring.

Here is a summary of the improvements made to the project.

## 1. Security & Database Constraints

- **Password Reset Flow:** Added the `PasswordResetToken` model to safely store reset tokens. Implemented `/forgot-password` and `/reset-password` endpoints with secure hashing (bcrypt) and one-time use token invalidation.
- **Unified Password Validation:** Enforced consistent, strong password requirements across the application (at least 12 characters, uppercase, lowercase, numbers, and special characters).
- **Database Integrity:** 
  - Introduced unique constraints to prevent duplicate emails, applications (`user_id`, `job_id`), and recommendations.
  - Implemented database indexes on `job.status`, `SwipeHistory`, and `Application` tables to optimize read queries.
- **Alembic Migrations:** Initialized Alembic and created the initial migration (`alembic/versions/d1ccc37e3941_add_constraints_without_enums.py`). Replaced PostgreSQL-specific Enum types with standardized `String(20)` fields and validation logic to prevent migration deadlocks.

## 2. Resume & ATS Engine Improvements

- **Secure Resume Upload:** Added a strict 5MB file size limit and enforced PDF-only validation for resume uploads. Generated UUID-based filenames to prevent collisions and avoid exposing identifiable information via file paths.
- **Orphan File Cleanup:** The system now automatically deletes the old PDF file from the disk when a user uploads a new resume.
- **Deterministic ATS:** Removed the `random.uniform()` scores from the ATS engine. The ATS score is now highly deterministic, weighted across matched skills (40%), keywords (20%), experience (15%), education (10%), projects (10%), and structure (5%).
- **Non-Destructive Parsing:** Adjusted `sync_profile_from_resume` so that it intelligently merges extracted skills and projects instead of blindly overwriting the user's manual inputs.

## 3. Smarter Job Recommendations

- **Weighted Matching Engine:** Rewrote the recommendation logic in `job_matcher.py` to be completely deterministic. Scores are calculated using:
  - Skill Overlap (50%)
  - Experience Match (20%)
  - Location (10%)
  - Employment Type (10%)
  - Role Fit / Headline Match (10%)
- **Persistent Recommendations:** Calculated recommendations are now upserted into the `Recommendation` table with clear, explainable `recommendation_reason` text strings (e.g., "85% Match. Why this matches: ✓ Skills (React, Node), ✓ Location"). 
- **Pagination & Optimization:** The recommendation feed now uses an offset and limit to avoid querying and scoring the entire database for every API call.
- **Explainability UI:** Added the `match_score` and `match_reason` to the `JobOut` API schema so the frontend can display exactly *why* a job was recommended.

## 4. Swipe & Application Integrity

- **Duplicate Prevention:** The backend now strictly validates swipe requests. Duplicate swipes for the same job and action are rejected.
- **Enum Validation:** Implemented Pydantic `@field_validator` on `SwipeActionRequest` to strictly enforce `LEFT`, `RIGHT`, or `SAVE` actions.
- **Resume Linking:** When a user swipes RIGHT (applies) on a job, the backend now automatically links their currently active `resume_id` to the `Application` record.
- **Application Endpoint:** Added the `GET /applications` endpoint to fetch the user's application history.

## 5. Frontend Refactoring & UI Improvements

- **Centralized API Client:** Created a modern, centralized `apiClient.js` powered by Axios. It manages authorization headers via interceptors and provides standardized error handling.
- **API Migration:** Refactored `authApi.js` and `candidateApi.js` to use the new `apiClient`, replacing scattered and inconsistent `fetch` calls.
- **Component Refactoring:** The massive `Candidate.jsx` file has been cleanly refactored. Extracted the massive 600+ line profile tab into a distinct `CandidateProfileTab.jsx` component.
- **Applications UI:** Created the new `Applications.jsx` component and integrated it into the Candidate dashboard as the "Applications" tab, allowing users to track their applied jobs.
- **Environment Standards:** Created `.env.example` templates for both the frontend and backend, standardizing the use of `VITE_API_BASE_URL`.

---

The backend server is fully updated and the application state has been preserved. You can now test the platform by starting the backend (`uvicorn app.main:app --reload`) and frontend (`npm run dev`).
