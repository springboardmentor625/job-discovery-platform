ML Data and Feature Documentation

Machine Learning systems require meaningful input data. SwipeX obtains its ML-related data from candidate profiles, resumes, jobs, applications, and swipe history. These inputs are converted into features that can be used for matching, scoring, and recommendation.



* Candidate Features: These features describe the candidate's professional background and preferences.
* Resume Features: The most important resume feature for basic job matching is the set of extracted skills.
* Job Features: The Jobs table stores the job information used by the recommendation and matching processes.
* Interaction Features: Swipe history provides information about candidate interaction with jobs. These interactions can be treated as preference signals. For example:
1. RIGHT → Positive Interest
2. SAVE  → Potential Interest
3. LEFT  → Negative / Low Interest

These signals can be used to improve future recommendations.



**Feature Extraction**: Feature extraction converts raw application data into information that can be compared. For example:

Candidate Skills: Python, React, SQL

Job Skills: Python, React, Docker

The common skills are: Python, React

The matching information can then be used to calculate a skill-based compatibility score.



**Skill Matching**: A simple skill-overlap approach can be used as a baseline. The formula is:

Skill Match Score =

Number of Matching Skills

\-------------------------

Total Required Job Skills



For example:

Candidate Skills:

Python

React

SQL



Job Required Skills:

Python

React

Docker



Matching Skills = 2

Required Skills = 3



Skill Match = 2 / 3

&#x20;           = 66.67%

This provides a simple and interpretable baseline for job matching.



* **Text Features**: Resume and job-description text can contain important information beyond individual skills.

