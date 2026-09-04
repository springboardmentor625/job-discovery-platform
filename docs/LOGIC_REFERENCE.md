# SwipeX — Logic & Algorithm Reference

This document describes the logic currently implemented by SwipeX. It is a reference for the matching engine, personalization, recommendation enrichment, swipe behavior, per-job ATS scoring, and performance architecture.

## 1. Job Matching Score (`match_score`)

**File:** `backend/app/routes/job_routes.py`
**Function:** `get_matched_jobs()`

SwipeX uses a fixed weighted base score:

| Component | Weight | Current logic |
|---|---:|---|
| **Skills** | **70%** | Percentage of normalized job skills matched by the candidate's combined profile + primary-resume skill set. |
| **Experience** | **20%** | Compares candidate experience years with the minimum years parsed from the job's free-text requirement. Meeting the requirement gives 100; a shortfall reduces the score by 20 points per missing year, bounded at 0. |
| **Role relevance** | **10%** | Graduated career-category relevance rather than a binary match. Exact category = 100; defined adjacent categories receive partial scores; otherwise a small residual score is used. |

The displayed base `match_score` is:

```text
match_score =
    skill_overlap * 0.70
  + experience_match * 0.20
  + role_relevance * 0.10
```

The score is kept separate from swipe personalization. ML personalization affects ordering, not the displayed 70/20/10 Match %.

### 1.1 Candidate data

The matcher reads the candidate profile and primary resume. Profile and resume skills are normalized through the shared helper `backend/app/services/skill_utils.py`. Candidate text and normalized skill work are cached by their source values so repeated recommendation requests do not rebuild identical derived data unnecessarily.

### 1.2 Role relevance

Job and candidate roles are mapped to broad categories by `guess_job_category()` in `backend/app/services/ats_service.py`. Exact category matches receive 100. Related career families receive graduated values (for example software/data and marketing/sales are treated as related), while unrelated/unknown combinations receive a low residual score. This avoids the previous all-or-nothing 0/100 role component.

## 2. Swipe behavior and ML personalization

**File:** `backend/app/routes/job_routes.py`

Swipe history is read from `JobSwipe`. Previously liked and rejected job skills are used as behavioral signals. The rule-based fallback derives a behavior-fit score from overlap with liked and rejected job skills.

When the swipe classifier is available and the candidate has sufficient swipe history, the classifier is applied only to the top semantic candidates. Its probability becomes the personalization score used for reranking. Semantic similarity is also calculated for those bounded candidates.

The important separation is:

```text
70% skills + 20% experience + 10% role relevance
                 ↓
          displayed Match %
                 ↓
       ML / swipe behavior signal
                 ↓
             reranking
```

Swiped jobs are excluded from future recommendations through a SQL subquery against `job_swipes`.

## 3. Recommendation API

**File:** `backend/app/routes/recommendation_routes.py`
**Endpoint:** `GET /api/recommendations/{user_id}`

The endpoint reuses `get_matched_jobs()`, optionally applies server-side text search, then enriches only the requested result set. Enrichment includes required skills, posted date, tags, and score-breakdown fields. The API caps the requested `limit` at 300.

The recommendation endpoint does not run expensive semantic enrichment over the entire active-job table. The matcher first performs cheap deterministic scoring and only evaluates a bounded top candidate set for semantic/ML personalization.

## 4. Recommendation trend API

**File:** `backend/app/routes/recommendation_routes.py`
**Endpoint:** `GET /api/recommendations/{user_id}/trend`

This endpoint reports the week-over-week average stored match score for liked swipes when sufficient data exists. It is an API capability for recommendation trend data and is separate from per-job ATS scoring.

## 5. Swipe recording

Swipe records are stored in `job_swipes` and are used to prevent already-processed jobs from returning to the recommendation pool. The recommendation deck records horizontal like/reject actions; the frontend also supports a deliberate downward gesture as a save action.

## 6. Frontend job discovery architecture

The candidate-facing job views use the shared recommendation data and an inline `JobDetailsModal` rather than a separate job-detail page. The modal is opened in the current section, so:

- Discover → View Details stays in Discover.
- AI Recommendations → View Details stays in AI Recommendations.
- Saved Jobs → View Details stays in Saved Jobs.

The old `pages/JobDetail.jsx` page and its unreachable routes have been removed.

## 7. Performance design

The recommendation path is designed for large imported job datasets:

1. Candidate derived skill/text work is cached by its source values.
2. Swiped jobs are excluded in SQL instead of building a large Python `IN` list.
3. Cheap 70/20/10 scoring is performed before expensive semantic/ML work.
4. Semantic/ML work is bounded to a small top candidate set.
5. Job embeddings are cached by job ID in the embedding service.
6. Recommendation enrichment is performed only for jobs that can actually be returned.

These constraints are intended to keep Discover and AI Recommendations responsive even when the database contains many thousands of jobs.

## 8. Shared skill normalization

**File:** `backend/app/services/skill_utils.py`

`split_skills()` is the single shared implementation for converting comma-separated skill strings into normalized sets. Recommendation matching and per-job ATS scoring use this helper, avoiding duplicate normalization implementations.

## 9. ATS scoring

**File:** `backend/app/services/ats_service.py`

ATS scoring uses the current ATS weights implemented by `calculate_ats_score()`: required skills 35%, preferred skills 15%, experience 20%, semantic similarity 20%, and education 10%. Missing skills are returned separately for improvement guidance.

