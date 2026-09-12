SWIPEX – AI-Powered Job Discovery and Recommendation Platform

1. Project Overview

SWIPEX is an AI-powered job discovery and recommendation platform designed to help candidates discover relevant job opportunities based on their profile, resume, skills, experience, preferences, and interaction history.

The platform provides a complete candidate workflow starting from registration and email verification, followed by login, profile creation, resume upload and parsing, job discovery, ATS resume analysis, personalized job recommendations, job saving, and swipe-based interaction.

A key feature of SWIPEX is its swipe-based job discovery mechanism. Candidates can interact with jobs using swipe actions to indicate their interest or rejection. These interactions are recorded as swipe history and are later used as a personalization signal for improving future job recommendations.

The recommendation system initially uses candidate profile and resume information to identify suitable jobs. After sufficient swipe interactions are collected, a Logistic Regression model is used to learn from the candidate's accumulated swipe behavior. The learned preferences are then used to improve recommendations for unseen jobs.

The system also prevents jobs that the candidate has already interacted with from being repeatedly recommended, while allowing similar and previously unseen jobs to be recommended based on the candidate's learned preferences.

2. Main Objectives

The main objectives of SWIPEX are:

To provide candidates with a simple job discovery platform.
To allow candidates to create and maintain their professional profile.
To extract useful information from uploaded resumes.
To analyze the compatibility between a resume and a job using ATS scoring.
To provide personalized job recommendations.
To allow candidates to express job preferences through swipe actions.
To maintain swipe and saved-job history.
To learn candidate preferences from accumulated swipe interactions.
To use Logistic Regression for behavior-based personalization after sufficient interaction data is available.
To avoid recommending jobs that the candidate has already interacted with.
To provide a complete and user-friendly candidate job-discovery workflow.

3. Technology Architecture

SWIPEX follows a full-stack architecture consisting of a React frontend, Django REST backend, and PostgreSQL database.

Frontend: React.js with Vite

Backend: Python with Django and Django REST Framework

Database: PostgreSQL

API Communication: REST APIs

Machine Learning: Logistic Regression for swipe-based personalization

Resume Processing: Resume extraction and structured information storage

The frontend provides the user interface and communicates with the Django REST APIs. The backend handles authentication, candidate profiles, resume processing, job data, ATS analysis, recommendations, swipe history, saved jobs, and machine-learning-based personalization. PostgreSQL is used to persist candidate and application-related data.

4. Candidate Registration and Authentication

SWIPEX provides a candidate authentication workflow to ensure that only registered and verified candidates can access the job discovery features of the platform.

4.1 Candidate Registration

The registration workflow allows a new candidate to create an account by providing the required personal and authentication information.

The candidate provides:

Full name
Phone number
Email address
Password

The registration form is implemented in the React frontend. When the candidate submits the form, the frontend sends the registration details to the Django REST backend through the registration API.

The backend validates the submitted information before creating the candidate account. The email address is validated for a proper email format, while the backend also handles validation errors such as an already registered email address.

After successful registration, the candidate is required to verify the email address before proceeding to login.

4.2 Email Verification

Email verification is used to confirm that the candidate has access to the registered email address.

After registration, SWIPEX sends a verification email to the candidate. The candidate follows the verification process, and the account is marked as verified after successful verification.

This prevents an unverified account from directly proceeding through the normal authenticated workflow.

4.3 Candidate Login

After completing email verification, the candidate can log in using the registered email address and password.

The React frontend sends the login credentials to the Django REST backend. The backend verifies the credentials and confirms that the candidate account is valid and verified.

After successful authentication, the candidate is taken to the SWIPEX dashboard, where the candidate can access the available job discovery and personalization features.

4.4 Logout

SWIPEX also provides a logout mechanism. When the candidate logs out, the authenticated user information is cleared from the frontend application and the candidate is returned to the authentication flow.

4.5 Authentication Workflow

The complete authentication workflow is:

Candidate → Registration → Backend Validation → Account Creation → Email Verification → Login → Authentication Validation → Dashboard

This workflow forms the entry point for the remaining candidate features of SWIPEX.

5. Candidate Profile

After successful authentication, candidates can create and maintain their professional profile in SWIPEX. The profile provides additional information about the candidate that can be used along with resume data for job discovery and recommendation.

5.1 Profile Information

The candidate profile contains information such as:

Personal information
Preferred job roles
Preferred locations
Preferred job type

These preferences help SWIPEX understand the type of opportunities the candidate is interested in.

5.2 Profile Creation and Update

The candidate enters or updates profile information through the React frontend. The frontend communicates with the Django REST backend to store and retrieve the candidate's profile information.

The backend associates the profile information with the authenticated candidate so that each candidate's preferences remain separate.

When the candidate updates their preferences, the latest information is stored and can be used by the recommendation system when generating suitable job opportunities.

5.3 Role of Profile Data in SWIPEX

Candidate profile data is one of the inputs used by the SWIPEX recommendation workflow. Preferred roles, locations, and job type provide additional context for identifying relevant jobs.

Profile information is also used together with resume information and, later, the candidate's swipe behavior to improve personalization.

Therefore, the profile workflow acts as an important foundation for the subsequent Resume Processing, ATS Analysis, Initial Recommendation, and Swipe-Based Personalization workflows.

6. Resume Upload and Parsing

SWIPEX provides a resume-processing workflow that allows candidates to upload their resumes and convert the unstructured resume content into structured candidate information.

6.1 Resume Upload

The candidate uploads a resume through the SWIPEX frontend. The React frontend sends the uploaded resume to the Django REST backend for processing.

The backend receives the resume and performs the required processing to extract useful information from the document.

6.2 Resume Information Extraction

Resume parsing is used to identify important candidate information from the uploaded resume. The extracted information includes relevant details such as:

Skills
Work experience
Education
Other relevant resume information

The extracted information is converted into structured data and associated with the candidate's profile.

6.3 Structured Resume Data

Instead of relying only on the original uploaded document, SWIPEX stores the extracted resume information in a structured form. This allows the extracted information to be reused by other workflows in the platform.

The structured resume information acts as an important input for:

ATS Resume Analysis
Initial Job Recommendations
Candidate-job matching
Swipe-based personalization
6.4 Resume Processing Workflow

The resume workflow can be represented as:

Candidate → Upload Resume → Django REST API → Resume Processing/Parsing → Information Extraction → Structured Resume Data → Recommendation and ATS Workflows

This workflow connects the candidate's unstructured resume with the intelligent features of SWIPEX.

7. Job Discovery and Job Details

SWIPEX provides a job discovery workflow through which candidates can browse available job opportunities and view detailed information about individual jobs.

7.1 Job Listing

The Find Jobs section displays the available job opportunities to the candidate. Job information is retrieved from the Django REST backend through the jobs API and displayed in the React frontend.

The job listing provides information such as:

Job title
Company
Location
Required skills
Other available job information
7.2 Job Search

SWIPEX provides a search function that allows candidates to search for relevant jobs using keywords related to:

Job titles
Skills
Companies
Locations

The entered search term is used on the frontend to filter the available job data and display matching results.

7.3 Job Details

When a candidate selects a job, SWIPEX displays the detailed information for that job. The job details view allows the candidate to understand the opportunity before deciding whether to save, swipe, or analyze the job.

The job details workflow also provides the connection to other SWIPEX features such as ATS analysis and swipe-based job discovery.

7.4 Job Discovery Workflow

The basic workflow is:

Candidate → Find Jobs → Search/Filter Jobs → Select Job → View Job Details → Save / ATS Analysis / Swipe / Recommendation

This workflow provides the candidate with the main interface for exploring job opportunities before interacting with them.

8. ATS Resume Analysis

SWIPEX includes an Applicant Tracking System (ATS) analysis feature that helps candidates understand how well their resume matches the requirements of a selected job.

8.1 Purpose of ATS Analysis

The ATS workflow compares the information extracted from the candidate's resume with the requirements of the selected job. The objective is to identify how closely the candidate's skills and qualifications match the job requirements.

The analysis provides:

ATS compatibility score
Matched skills
Missing skills
Resume-job matching information
8.2 ATS Analysis Workflow

The candidate selects a job and starts ATS analysis. The frontend sends the required candidate resume information and selected job information to the Django REST backend.

The backend processes the resume and job requirements and performs the matching analysis.

The extracted resume information is compared with the skills and requirements associated with the selected job.

Skills that are present in both the candidate's resume and the job requirements are identified as matched skills.

Skills required by the job but not found in the candidate's resume are identified as missing skills.

Based on the matching results, an overall ATS compatibility score is generated.

8.3 ATS Score

The ATS score represents the degree of compatibility between the candidate's resume and the selected job requirements.

A higher score indicates that a greater portion of the relevant job requirements is represented in the candidate's resume, while a lower score indicates that more required information or skills are missing.

The score and the detailed matching information are returned by the backend API and displayed in the React frontend.

8.4 ATS Result

The candidate can view the generated score together with the matched and missing skills. This allows the candidate to understand their suitability for the selected position and identify areas where their resume may not satisfy the job requirements.

8.5 ATS Workflow

Candidate → Select Job → Start ATS Analysis → Resume Data + Job Requirements → Skill/Requirement Matching → Matched Skills + Missing Skills → ATS Score → Display Results

The ATS analysis is therefore an independent candidate-facing workflow while also providing useful information for the intelligent job-matching and recommendation features of SWIPEX.

8.6 ATS Matching Components and Weighting

The main ATS matching function evaluates three major components of the candidate's resume against the selected job:

Skills Matching — 60%
Experience Matching — 30%
Education Matching — 10%

The final ATS score is designed as a weighted combination of these three components:

Final ATS Score = (Skills Score × 0.60) + (Experience Score × 0.30) + (Education Score × 0.10)

However, the final weighted score is intentionally calculated only after all three components—skills, experience, and education—have been verified by the ATS matching process.

This weighting gives the highest importance to skills, since relevant technical and professional skills are a major factor in determining whether a candidate matches a job requirement. Experience contributes the second-highest weight, while education contributes the remaining weight.

ATS Weight Distribution
Component	Weight
Skills	60%
Experience	30%
Education	10%
Total	100%

Therefore, the ATS analysis does not rely only on keyword/skill matching. It considers skills, experience, and education together to produce the final compatibility score.

9. AI-Based Job Recommendations

SWIPEX provides an AI-based recommendation workflow to identify jobs that are relevant to a candidate. The initial recommendation process uses the candidate's available profile and resume information together with job information.

9.1 Purpose

The recommendation system reduces the need for candidates to manually search through all available jobs by ranking suitable opportunities and presenting the most relevant jobs first.

The initial recommendations are generated before sufficient swipe-history data is available for behavioral machine learning.

9.2 Recommendation Inputs

The recommendation process uses information from:

Candidate profile
Preferred job roles
Preferred locations
Preferred job type
Resume information
Extracted skills
Candidate experience
Job title
Job location
Job type
Job-required skills

These inputs are compared to determine the relevance of each available job to the candidate.

9.3 Recommendation Scoring

Each available job is evaluated against the candidate's information and assigned a relevance score.

The recommendation process considers the compatibility between the candidate and the job using the available profile and resume information. Jobs with higher relevance scores are ranked higher and are presented as the candidate's recommendations.

The recommendation system initially returns the top 10 relevant jobs.

9.4 Initial Recommendation Workflow

The initial recommendation workflow can be represented as:

Candidate Profile + Resume → Extract Candidate Information → Compare with Job Data → Calculate Relevance → Rank Jobs → Select Top 10 → Display Recommendations

9.5 Role of Initial Recommendations

Initial recommendations provide a starting point for a new candidate who does not yet have sufficient interaction history.

As the candidate starts interacting with recommended jobs through swipe actions, the system collects behavioral information. This swipe history later becomes an additional personalization signal for improving future recommendations.

Therefore, SWIPEX follows a progressive recommendation approach:

Profile/Resume-Based Recommendations → Candidate Swipe Interactions → Swipe History → Behavioral Learning → Personalized Recommendations

9.6 Recommendation Score Calculation

SWIPEX calculates a final relevance score for each job using four candidate-job matching factors:

Skills Score — 50%
Role Score — 20%
Location Score — 15%
Job Type Score — 15%

The final recommendation score is calculated using the following weighted formula:

Final Recommendation Score = (Skills Score × 0.50) + (Role Score × 0.20) + (Location Score × 0.15) + (Job Type Score × 0.15)

The Skills Score receives the highest weight because matching the candidate's skills with the skills required by the job is the primary relevance factor.

The Role Score measures how closely the job role matches the candidate's preferred roles.

The Location Score considers the compatibility between the candidate's preferred locations and the job location.

The Job Type Score considers the compatibility between the candidate's preferred job type and the type of the available job.

The resulting final score is used to rank available jobs. Jobs with higher scores are considered more relevant and are placed higher in the recommendation results.

Recommendation Weight Distribution
Matching Factor	Weight
Skills	50%
Role	20%
Location	15%
Job Type	15%
Total	100%

This scoring mechanism forms the initial recommendation stage of SWIPEX. Later, candidate swipe behavior is incorporated into the recommendation process to provide behavior-based personalization

10. Saved Jobs

SWIPEX provides a Saved Jobs feature that allows candidates to keep track of job opportunities they are interested in and may want to review later.

10.1 Saving a Job

A candidate can save a job through the SWIPEX job interaction workflow. When the candidate performs the save action, the frontend sends the selected job information to the Django REST backend.

The backend records the relationship between the candidate and the saved job so that it can be retrieved later.

10.2 Viewing Saved Jobs

Candidates can access their saved jobs from the Saved Jobs section of the dashboard.

The frontend requests the candidate's saved jobs from the backend and displays the stored jobs.

This allows candidates to return to jobs they previously considered relevant without having to search for them again.

10.3 Saved Jobs and Swipe Personalization

Saving a job is also treated as a positive candidate interaction in the SWIPEX personalization workflow. Saved jobs therefore contribute information about the candidate's interests.

However, a job that has already been saved or otherwise interacted with is not treated as a new job for future recommendation display. Instead, the interaction can contribute to learning the candidate's preferences while the exact job is excluded from being repeatedly recommended.

10.4 Saved Jobs Workflow

Candidate → Select Job → Save Job → Backend API → Store Candidate-Job Interaction → Saved Jobs → View Saved Job Later

Saved Jobs therefore serves two purposes in SWIPEX:

It allows candidates to maintain a list of jobs they are interested in.
The saved interaction provides a positive behavioral signal for the recommendation and personalization workflow.

10. Saved Jobs

SWIPEX provides a Saved Jobs feature that allows candidates to keep track of job opportunities they are interested in and may want to review later.

10.1 Saving a Job

A candidate can save a job through the SWIPEX job interaction workflow. When the candidate performs the save action, the frontend sends the selected job information to the Django REST backend.

The backend records the relationship between the candidate and the saved job so that it can be retrieved later.

10.2 Viewing Saved Jobs

Candidates can access their saved jobs from the Saved Jobs section of the dashboard.

The frontend requests the candidate's saved jobs from the backend and displays the stored jobs.

This allows candidates to return to jobs they previously considered relevant without having to search for them again.

10.3 Saved Jobs and Swipe Personalization

Saving a job is also treated as a positive candidate interaction in the SWIPEX personalization workflow. Saved jobs therefore contribute information about the candidate's interests.

However, a job that has already been saved or otherwise interacted with is not treated as a new job for future recommendation display. Instead, the interaction can contribute to learning the candidate's preferences while the exact job is excluded from being repeatedly recommended.

10.4 Saved Jobs Workflow

Candidate → Select Job → Save Job → Backend API → Store Candidate-Job Interaction → Saved Jobs → View Saved Job Later

Saved Jobs therefore serves two purposes in SWIPEX:

It allows candidates to maintain a list of jobs they are interested in.
The saved interaction provides a positive behavioral signal for the recommendation and personalization workflow.

12. Machine Learning-Based Recommendation Personalization

SWIPEX uses machine learning to personalize job recommendations based on the candidate's historical swipe behavior. The machine-learning stage is based on Logistic Regression.

12.1 Purpose of Machine Learning

The initial recommendation system uses the candidate's profile and resume information to identify relevant jobs. However, profile and resume information alone cannot fully represent how a candidate behaves while exploring jobs.

Swipe interactions provide direct behavioral feedback. By learning from these interactions, SWIPEX can identify patterns in the types of jobs a candidate is interested in or tends to reject.

Logistic Regression is used to learn this relationship between job characteristics and the candidate's previous swipe decisions.

12.2 Swipe Labels

The swipe actions are converted into labels for machine-learning training:

Swipe Action	Meaning	ML Label
Right	Interested	1
Down / Save	Positive interest	1
Left	Not Interested	0

Therefore, the model learns a binary classification problem where 1 represents positive interest and 0 represents negative interest.

12.3 ML Activation Threshold

Logistic Regression is not activated immediately for a new candidate because a new candidate initially has insufficient behavioral data.

SWIPEX activates the machine-learning personalization stage after the candidate has completed 10 swipe interactions.

The value 10 is an activation threshold, not a maximum number of swipes. The candidate can continue swiping after the threshold has been reached.

Once the threshold is reached, the model can be trained using the candidate's accumulated swipe history.

12.4 Training with Accumulated Swipe History

After machine-learning personalization is activated, SWIPEX uses the candidate's accumulated swipe history as training data.

The model is not limited to only the latest 10 interactions. The initial 10 interactions are used to provide enough data to activate the model, while subsequent interactions can provide additional training information.

As the candidate continues interacting with jobs, the newly collected swipe data can be incorporated into the personalization process so that recommendations can adapt to the candidate's evolving preferences.

12.5 Personalized Recommendation Process

After the Logistic Regression model is available, unseen jobs can be evaluated using the learned behavioral patterns.

The model estimates the candidate's likelihood of having a positive interaction with a job based on the job features learned from previous swipe behavior.

Jobs with stronger predicted positive preference can receive higher priority in the personalized recommendation process.

Importantly, the exact jobs that the candidate has already interacted with are excluded from being presented again as new recommendations. Their interaction history is retained as learning information, while previously unseen related jobs can still be recommended.

12.6 Recommendation Learning Cycle

The complete learning cycle is:

Initial Profile/Resume Recommendations → Candidate Swipes → Store Swipe History → Reach 10-Swipe Threshold → Train Logistic Regression → Learn Candidate Preferences → Score Unseen Jobs → Generate Personalized Recommendations → New Swipes → Update Learning Data → Improve Future Recommendations

This allows SWIPEX to move from primarily profile/resume-based recommendations toward behavior-based personalized job discovery.

12.7 Machine Learning Features

For each job in the candidate's swipe history, SWIPEX combines important job information into a single text representation.

The job text contains:

Job title
Required skills
Job city
Contract type
Job description

The text is normalized before being combined. This creates a textual representation of each job that can be used as input to the machine-learning model.

12.8 TF-IDF Feature Extraction

The combined job text is converted into numerical features using TF-IDF (Term Frequency-Inverse Document Frequency) vectorization.

SWIPEX uses the following TF-IDF configuration:

English stop words are removed.
A maximum of 1,000 features is considered.

TF-IDF converts the textual job information into numerical feature vectors that can be processed by the Logistic Regression model.

Therefore, the machine-learning input is derived from the textual characteristics of the jobs that the candidate has previously interacted with.

12.9 Logistic Regression Training

After the job text has been converted into TF-IDF vectors, SWIPEX trains a Logistic Regression classifier using the candidate's swipe labels.

The model is configured with:

max_iter = 1000

The model is trained using both positive and negative swipe examples.

Positive examples consist of:

Right-swiped jobs
Down/saved jobs

These interactions receive the label 1.

Left-swiped jobs receive the label 0.

The model therefore learns the relationship between the textual characteristics of previously interacted jobs and the candidate's positive or negative preference.

12.10 Requirement for Model Training

Logistic Regression requires both positive and negative training examples. Therefore, if the swipe history contains only one type of label, the model is not trained and no model is returned.

This prevents the system from attempting to train a binary classifier when the candidate's history does not contain sufficient variation in interaction outcomes.

12.11 ML Training Workflow

Swipe History → Retrieve Job Information → Combine Job Text → Normalize Text → TF-IDF Vectorization → Numerical Feature Matrix → Apply Swipe Labels → Logistic Regression Training → Trained Model + Vectorizer

The trained model and TF-IDF vectorizer are then available to the recommendation workflow for evaluating previously unseen jobs based on the candidate's learned behavioral preferences.

SECTION 13 — Swipe-Based Job Exclusion and Recommendation Refresh

This should explain what happens after a candidate swipes a job.

13.1 Excluding Previously Swiped Jobs

Document that:

RIGHT-swiped jobs are not shown again.
LEFT-swiped jobs are not shown again.
DOWN/saved jobs are not shown again as new recommendations.
The exclusion applies to the exact job already interacted with.
Related/unseen jobs can still be recommended based on learned preferences.
13.2 Swipe History as a Learning Signal

Explain:

Candidate Swipes Job
        ↓
Interaction Stored
        ↓
Swipe History Updated
        ↓
Used as ML Training Data
        ↓
Future Recommendations Become Personalized
13.3 Recommendation Refresh

Explain what happens when new swipe interactions are accumulated and recommendations are refreshed.

We should use the actual implementation/code here rather than guessing the refresh count or mechanism.

13.4 Overall Personalized Recommendation Cycle
Initial Recommendations
        ↓
Candidate Swipes Jobs
        ↓
Store Swipe History
        ↓
Exclude Already Swiped Jobs
        ↓
Collect Behavioral Data
        ↓
Train/Update ML Model
        ↓
Score Unseen Jobs
        ↓
Generate Personalized Recommendations
        ↓
Candidate Swipes Again
        ↓
Repeat