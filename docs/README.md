1. Project Overview

SWIPEX — Swipe-Based Intelligent Job Discovery and Career Assistance Platform

A short explanation of what the platform does.

2. Technology Stack

Part	                  Technology
Frontend             	React + Vite
Backend	               Django + Django REST Framework
Database	               PostgreSQL
Authentication	         Token-based authentication
AI/LLM	               LLM-based resume/job requirement extraction
Recommendation	         Profile + Resume + Job matching
API Testing	            Postman
Version Control	      Git + GitHub

3. Completed Workflows

This is the most important section for your mentor's evaluation.

A. Authentication Workflow

Register
   ↓
Email Verification
   ↓
Login
   ↓
Dashboard
   ↓
Logout
   ↓
Login again

Authentication was one of the early completed workflows. The original project milestone also identifies authentication as a core completed milestone.

B. Candidate Profile Workflow
User
 ↓
Profile
 ↓
Personal Information
 ↓
Preferred Job Roles
 ↓
Preferred Locations
 ↓
Preferred Job Type


C. Resume Workflow
Upload Resume
      ↓
Resume Processing
      ↓
Resume Data Extraction
      ↓
Skills / Experience / Education
      ↓
Store Resume Information

Your current backend also contains the LLM resume extraction work.

D. Job Discovery Workflow
Find Jobs
   ↓
Job Listings
   ↓
Select Job
   ↓
Job Details Popup
   ↓
View Job Information

The job-discovery milestone includes job listing APIs, job cards, search/filter functionality and swipe-based discovery.

📊 E. ATS Analysis Workflow
Resume
   +
Job Requirements
       ↓
   ATS Matching
       ↓
Skills Match
Experience Match
Education Match
       ↓
Matched Skills
Missing Skills
       ↓
ATS Match Score

The actual matcher uses Skills 60% + Experience 30% + Education 10% in the current ATS implementation.

F. AI Recommendation Workflow

This deserves its own section because this is what you've just completed.

User Profile
     +
Resume Skills
     +
Job Data
     ↓
Recommendation Engine
     ↓
Calculate Matching Scores
     ↓
Final Recommendation Score
     ↓
Top 10 Jobs
     ↓
AI Recommendations Page

Current scoring:

Resume Skills Match       50%
Preferred Job Role Match  20%
Preferred Location Match  15%
Job Type Match            15%

Then:

10 Recommended Jobs
        ↓
┌───────────────┐
│ ❌ Not Interested │
│ 💾 Save          │
│ ❤️ Interested    │
└───────────────┘
        ↓
      JobSwipe

And importantly, the current implementation records the swipe in the backend, but the next enhancement is to make swipe history influence future recommendations.

G. Swipe Workflow
Recommended Job
      ↓
   User Action
      ↓
 ┌────┼────┐
 ↓    ↓    ↓
Left Down Right
 ↓    ↓    ↓
❌    💾    ❤️
Not   Save  Interested

H. Saved Jobs Workflow

Job
 ↓
💾 Save
 ↓
Backend
 ↓
Saved Jobs

4. Current Project Status

This should be very clear:

Module	                         Status
Authentication	               ✅ Completed
Email Verification	         ✅ Completed
Candidate Profile	            ✅ Completed
Resume Upload/Processing	   ✅ Completed
Job Discovery	               ✅ Completed
Job Details	                  ✅ Completed
ATS Analysis	               ✅ Completed
AI Recommendations	         ✅ Completed
Swipe Recording	            ✅ Completed
Saved Jobs	                  ✅ Completed
Swipe-history-based learning	⏳ Next
Remove previously swiped jobs	⏳ Next
Actual drag/swipe gesture	   ⏳ Later
Full Application Tracking	   ⏳ Future
Notifications	               ⏳ Future
Analytics	                  ⏳ Future