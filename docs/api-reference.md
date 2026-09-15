The APIs currently implemented in the FastAPI backend handle:

\- User authentication

\- Resume management

\- ATS analysis

\- Job retrieval

\- Job recommendations

\- Swipe actions

\- Job applications

\- Candidate dashboard

\- Candidate profile management



**Authentication APIs:** Authentication APIs are used for user registration, login, and retrieving the currently authenticated user.
Register User: POST /api/auth/register

Request: The request contains the user registration information required by the backend.



Login User: POST /api/auth/login

Request: The request contains the user's login credentials.



Get Current User: GET /api/auth/me

Authentication: This endpoint requires authentication.



**Resume APIs**: Resume APIs are used to upload, retrieve, and delete candidate resumes.

Upload Resume: POST /api/resumes/upload

The endpoint handles resume upload and stores the resume information for further processing.

Authentication: This endpoint requires authentication.



Get My Resumes: GET /api/resumes/me

Authentication: This endpoint requires authentication.



Delete Resume: DELETE /api/resumes/{resume\\\\\\\_id}

Authentication: This endpoint requires authentication.



**ATS Analysis APIs:** ATS APIs analyze a candidate's resume and generate an ATS report.

Analyze Resume: POST /api/ats/analyze

Authentication: This endpoint requires authentication.



Get My ATS Reports: GET /api/ats/

Purpose: Retrieves the ATS reports belonging to the currently authenticated candidate.

Authentication: This endpoint requires authentication.



Get ATS Report: GET /api/ats/{ats\\\\\\\_report\\\\\\\_id}

Purpose: Retrieves a specific ATS report using its ATS report ID.

Authentication: This endpoint requires authentication.



**Job APIs:** Job APIs provide job information to the frontend.



Get Jobs: GET /api/jobs/

Purpose: Retrieves the available jobs from the backend.



Get Job: GET /api/jobs/{job\\\\\\\_id}

Purpose: Retrieves information about a specific job.



**Recommendation APIs:** Recommendation APIs provide personalized job recommendations to candidates.

Get Recommended Jobs: GET /api/recommendations/

Purpose: Retrieves job recommendations for the currently authenticated candidate.

Authentication: This endpoint requires authentication.



**Swipe APIs:** Swipe APIs record the candidate's interaction with recommended jobs.



Create Swipe: POST /api/swipes/

Purpose: Records a candidate's swipe action for a job.

Authentication: This endpoint requires authentication.



Get Saved Jobs: GET /api/swipes/saved

Purpose: Retrieves the jobs saved by the currently authenticated candidate.

Authentication: This endpoint requires authentication.



**Application APIs:** Application APIs manage job applications submitted by candidates.

Apply For Job: POST /api/applications/

Purpose: Creates an application for a job.

Authentication: This endpoint requires authentication.



Get My Applications: GET /api/applications/

Purpose: Retrieves the applications submitted by the currently authenticated candidate.

Authentication: This endpoint requires authentication.



Get Application: GET /api/applications/{application\\\\\\\_id}

Purpose: Retrieves details of a specific job application.

Authentication: This endpoint requires authentication.



Update Application Status: PUT /api/applications/{application\\\\\\\_id}/status

Purpose: Updates the status of a specific job application.

Authentication: This endpoint requires authentication.



**Dashboard API:** The dashboard API provides candidate-specific dashboard information.



Get Candidate Dashboard: GET /api/dashboard/candidate

Purpose: Retrieves dashboard information for the currently authenticated candidate.

Authentication: This endpoint requires authentication.



**Candidate Profile APIs:** Candidate profile APIs are used to create, retrieve, and update the candidate's professional profile.



Get Profile: GET /api/profile/

Purpose: Retrieves the profile of the currently authenticated candidate.

Authentication: This endpoint requires authentication.



Update Profile: PUT /api/profile/

Purpose: Updates the candidate's profile information.

Authentication: This endpoint requires authentication.



Create Profile: POST /api/profile/

Purpose: Creates a candidate profile for the authenticated user.

Authentication: This endpoint requires authentication.



**HTTP Methods**

Method	Purpose

GET	Retrieve information

POST	Create or submit information

PUT	Update an existing resource

DELETE	Delete a resource

