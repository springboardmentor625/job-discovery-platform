Users - CandidateProfile

Relationship: Users (1) -------- (1) CandidateProfile
A user has one candidate profile.

The relationship is established through:

CandidateProfile.user_id
        ↓
Users.user_id

3. Users - Resumes

Relationship: Users (1) -------- (M) Resumes
One user can have multiple resumes.

The relationship is established through:

Resumes.user_id
        ↓
Users.user_id

This allows candidates to maintain multiple resume versions.

4. Users - Applications

Relationship: Users (1) -------- (M) Applications
One user can submit multiple job applications.

The relationship is established through:

Applications.user_id
        ↓
Users.user_id

5. Users - SwipeHistory

Relationship: Users (1) -------- (M) SwipeHistory
One user can perform multiple swipe actions.

The relationship is established through:

SwipeHistory.user_id
        ↓
Users.user_id

6. Users - Recommendations

Relationship: Users (1) -------- (M) Recommendations
One user can receive multiple personalized job recommendations.

The relationship is established through:

Recommendations.user_id
        ↓
Users.user_id

7. Users - Notifications

Relationship: Users (1) -------- (M) Notifications
One user can receive multiple notifications.

The relationship is established through:

Notifications.user_id
        ↓
Users.user_id

8. Companies - Jobs

Relationship: Companies (1) -------- (M) Jobs
One company can post multiple jobs.

The relationship is established through:

Jobs.company_id
        ↓
Companies.company_id

9. Jobs - Applications

Relationship: Jobs (1) -------- (M) Applications
One job can receive multiple applications from candidates.

The relationship is established through:

Applications.job_id
        ↓
Jobs.job_id

10. Resumes - Applications

Relationship: Resumes (1) -------- (M) Applications
One resume can be associated with multiple applications.

The relationship is established through:

Applications.resume_id
        ↓
Resumes.resume_id

11. Resumes - ATSReports

Relationship: Resumes (1) -------- (M) ATSReports
One resume can have multiple ATS reports.

The relationship is established through:

ATSReports.resume_id
        ↓
Resumes.resume_id

Different ATS reports can be generated for the same resume against different jobs.

12. Jobs - ATSReports

Relationship: Jobs (1) -------- (M) ATSReports
One job can be associated with multiple ATS reports.

The relationship is established through:

ATSReports.job_id
        ↓
Jobs.job_id

This allows different candidate resumes to be evaluated against the same job.

13. Jobs - SwipeHistory

Relationship: Jobs (1) -------- (M) SwipeHistory
One job can have multiple swipe actions from different users.

The relationship is established through:

SwipeHistory.job_id
        ↓
Jobs.job_id

14. Jobs - Recommendations

Relationship: Jobs (1) -------- (M) Recommendations
One job can be recommended to multiple users.

The relationship is established through:

Recommendations.job_id
        ↓
Jobs.job_id

15. Complete Relationship Summary

Users (1) ──────── (1) CandidateProfile

Users (1) ──────── (M) Resumes

Users (1) ──────── (M) Applications

Users (1) ──────── (M) SwipeHistory

Users (1) ──────── (M) Recommendations

Users (1) ──────── (M) Notifications

Companies (1) ──── (M) Jobs

Jobs (1) ────────── (M) Applications

Resumes (1) ─────── (M) Applications

Resumes (1) ─────── (M) ATSReports

Jobs (1) ────────── (M) ATSReports

Jobs (1) ────────── (M) SwipeHistory

Jobs (1) ────────── (M) Recommendations