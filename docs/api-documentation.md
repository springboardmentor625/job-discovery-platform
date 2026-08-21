Frontend API Documentation



The SwipeX frontend communicates with the backend using APIs. Axios is used on the frontend to send HTTP requests and receive responses.



React Frontend

&#x20;     │

&#x20;     │ HTTP Request

&#x20;     ▼

Backend API

&#x20;     │

&#x20;     │ HTTP Response

&#x20;     ▼

React Frontend



**Authentication APIs**

The frontend requires APIs for:

* User Registration

Purpose: Creates a new candidate account.

Frontend sends: Full name, Email, Password, Phone number



* User Login

Purpose: Authenticates an existing candidate.

Frontend sends: Email, Password



Frontend receives authentication information from the backend.



**Profile APIs**

The frontend requires APIs to:

* Create candidate profile
* Update candidate profile
* Retrieve candidate profile



Profile information includes: Headline, Summary, Location, Experience, Education, Projects, Certifications, Preferred job type, Preferred location, Preferred job role



**Resume APIs**

The frontend requires APIs for:

* Resume Upload: Allows the candidate to upload a resume.
* Resume Analysis: Requests resume processing and analysis.
* Resume Results: Retrieves the extracted resume information and analysis results.



**ATS Analysis API**

The frontend requires an API to retrieve ATS analysis results.

The response may contain: ATS score, Extracted skills, Matching skills, Missing skills, Resume analysis information



**Job Recommendation API**

The frontend requires an API to retrieve recommended jobs.

The response may contain: Job ID, Job title, Company, Location, Job type, Job description, Required skills



**Job Interaction APIs**

The frontend requires APIs for the following actions:

* Save Job: Saves a job for the candidate.
* Swipe Left: Records the candidate's left-swipe decision and allows the frontend to continue displaying recommendations.
* Swipe Right: Records the candidate's interest in a job and initiates the application workflow.



**Application API**

The frontend requires an API to submit a job application.

Swagger UI can be used to view and test the backend APIs during backend development.

