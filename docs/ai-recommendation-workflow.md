The AI Recommendation feature in SwipeX provides personalized job recommendations to candidates based on their profile, resume information, available jobs, and previous interactions with job cards. The recommendation system analyzes candidate-related information and job requirements, calculates a match score, ranks suitable jobs, and displays the recommended jobs to the candidate. The system also captures the candidate's swipe feedback. This feedback can be used to improve future job recommendations.



**Purpose of AI Recommendation:** The purpose is to help candidates discover jobs that are relevant to their skills, experience, education, preferences, and resume information.

The recommendation process can consider:

\- Candidate profile

\- Resume data

\- Extracted skills

\- Experience

\- Education

\- Job requirements

\- Required skills

\- Job description

\- Candidate preferences

\- Previous swipe feedback



**Step 1 - Candidate Profile**

The recommendation workflow uses the candidate's profile information as one of its main inputs. The profile information helps the recommendation engine understand the candidate's career background and preferences. The relevant database table is: CandidateProfile



**Step 2 - Resume Data**

The recommendation system also uses information extracted from the candidate's resume. Resume parsing extracts useful information such as:

* Skills
* Experience
* Education
* Other relevant professional information

The main resume information used by the recommendation system includes the candidate's extracted skills and other parsed information. The relevant database table is: Resumes. The extracted resume data provides additional information for determining job compatibility.



**Step 3 - Available Jobs:** The recommendation engine receives information about available jobs. Job information is stored in Jobs table. The recommendation engine uses job requirements and relevant job information when calculating compatibility with the candidate.



**AI Recommendation Engine:** The candidate profile, resume data, and available jobs are provided to the AI Recommendation Engine. The engine analyzes the available information to identify jobs that are relevant to the candidate. The recommendation engine evaluates the relationship between the candidate's information and the requirements of available jobs.



**Step 5 - Calculate Match Score**

After receiving the required information, the recommendation system calculates a match score for the available jobs. A higher match score indicates a stronger potential match between the candidate and the job. Factors that may contribute to the match include:

* Matching skills
* Candidate experience
* Job experience requirements
* Candidate education
* Job requirements
* Candidate preferred job type
* Candidate preferred location
* Resume information
* Other relevant job information

The general process is:

Candidate Information

&#x20;       +

Job Information

&#x20;       |

&#x20;       v

&#x20;  Match Analysis

&#x20;       |

&#x20;       v

&#x20;  Match Score



**Step 6 - Rank Recommended Jobs**

After calculating match scores, the jobs are ranked according to their recommendation scores. Jobs with stronger matches can be placed higher in the recommendation list. The recommendation score is stored in recommendation\_score



**Step 7 - Generate Recommendation Reason**

The recommendation system can also generate a reason explaining why a job has been recommended. The reason can be based on factors such as:

* Matching skills
* Relevant experience
* Candidate preferences
* Resume-job compatibility
* Other matching information

The recommendation reason is stored in recommendation\_reason. This allows the system to associate an explanation with the generated recommendation.



**Step 8 - Store Recommendations**

The generated recommendations can be stored in the PostgreSQL database. The relevant table is: Recommendations. 



**Step 9 - Display Job Cards**

The ranked recommendations are sent to the frontend. The frontend displays the recommended jobs as job cards. The general flow is:

AI Recommendation Engine

&#x20;         |

&#x20;         v

Ranked Recommendations

&#x20;         |

&#x20;         v

FastAPI Backend

&#x20;         |

&#x20;         v

React Frontend

&#x20;         |

&#x20;         v

Job Cards



**Step 10 - Capture Swipe Feedback**

The candidate interacts with the displayed job cards using swipe actions. The candidate's swipe actions are recorded in the: SwipeHistory table. This information provides feedback about the candidate's interaction with recommended jobs.



**Recommendation Feedback Loop:** After the candidate interacts with job cards, the swipe feedback can be used as an input for future recommendation generation.

Candidate Profile

&#x20;      +

Resume Data

&#x20;      +

Available Jobs

&#x20;      +

Previous Swipe Feedback

&#x20;      |

&#x20;      v

AI Recommendation Engine

&#x20;      |

&#x20;      v

Calculate Match Score

&#x20;      |

&#x20;      v

Rank Jobs

&#x20;      |

&#x20;      v

Display Job Cards

&#x20;      |

&#x20;      v

Candidate Swipe

&#x20;      |

&#x20;      v

Capture Swipe Feedback

&#x20;      |

&#x20;      +--------------------> Future Recommendations



**The complete data flow is:**



&#x20;                  Candidate Profile

&#x20;                         |

&#x20;                         |

Resume Data --------------+ 

&#x20;                         |

&#x20;                         |

Available Jobs -----------+

&#x20;                         |

&#x20;                         v

&#x20;              AI Recommendation Engine

&#x20;                         |

&#x20;                         v

&#x20;               Calculate Match Score

&#x20;                         |

&#x20;                         v

&#x20;              Rank Recommended Jobs

&#x20;                         |

&#x20;                         v

&#x20;                 Display Job Cards

&#x20;                         |

&#x20;                         v

&#x20;               Capture Swipe Feedback

&#x20;                         |

&#x20;                         v

&#x20;                   Swipe History

&#x20;                         |

&#x20;                         |

&#x20;                         +----------------------+

&#x20;                                                |

&#x20;                                                v

&#x20;                                 AI Recommendation Engine



**The general architecture is:**



React Frontend

&#x20;     |

&#x20;     v

FastAPI Backend

&#x20;     |

&#x20;     +-------------------------+

&#x20;     |                         |

&#x20;     v                         v

Candidate Data              Job Data

&#x20;     |                         |

&#x20;     v                         v

Resume Data               Available Jobs

&#x20;     |                         |

&#x20;     +------------+------------+

&#x20;                  |

&#x20;                  v

&#x20;      AI Recommendation Engine

&#x20;                  |

&#x20;                  v

&#x20;         Calculate Match Score

&#x20;                  |

&#x20;                  v

&#x20;         Rank Recommendations

&#x20;                  |

&#x20;                  v

&#x20;            PostgreSQL

&#x20;                  |

&#x20;         +--------+--------+

&#x20;         |                 |

&#x20;         v                 v

&#x20;Recommendations      SwipeHistory

&#x20;         |                 |

&#x20;         +--------+--------+

&#x20;                  |

&#x20;                  v

&#x20;            React Frontend

&#x20;                  |

&#x20;                  v

&#x20;              Job Cards



**Relationship with Resume Parsing:** The AI Recommendation workflow uses information produced by the Resume Parsing workflow. The relationship between the two workflows is:

Upload Resume

&#x20;     |

&#x20;     v

Resume Parsing

&#x20;     |

&#x20;     v

Extract Skills

&#x20;     |

&#x20;     v

Resume Data

&#x20;     |

&#x20;     v

AI Recommendation Engine



**Relationship with ATS Analysis:** The recommendation workflow and ATS workflow both use resume and job information, but they serve different purposes.



**Resume Parsing:** Extracts structured information from the candidate's resume.



Resume

&#x20; ↓

Text Extraction

&#x20; ↓

Resume Parser

&#x20; ↓

Skills / Experience / Education



**ATS Analysis:** Compares a candidate's resume with a selected job and generates an ATS score and improvement information.



Resume + Job

&#x20;    ↓

ATS Analysis

&#x20;    ↓

ATS Score

&#x20;    ↓

Missing Skills / Keywords

&#x20;    ↓

Suggestions



**AI Recommendation:** Uses candidate and job information to identify and rank potentially relevant jobs.



Candidate + Resume + Jobs

&#x20;         ↓

Recommendation Engine

&#x20;         ↓

Match Scores

&#x20;         ↓

Ranked Jobs



**Recommendation Database Relationships**: The recommendation system uses information from several database tables. These relationships allow the recommendation system to access candidate information, resume information, jobs, recommendations, and swipe feedback.



**Example**: Consider a candidate with the following profile:

Skills:

Python

FastAPI

PostgreSQL

React

Preferred Job Type:

Full-time

Preferred Location:

Bengaluru

Suppose the available jobs are:

Job A:

Python

FastAPI

PostgreSQL

Bengaluru

Job B:

Java

Spring Boot

Mumbai

Job C:

React

JavaScript

Bengaluru

The recommendation engine analyzes the candidate and available jobs.

The system may determine that:

Job A → Strong Match

Job C → Moderate Match

Job B → Lower Match

The jobs are then ranked according to their calculated recommendation scores.

The frontend displays the ranked jobs as job cards.



**Example of Swipe Feedback**: Suppose the candidate interacts with the recommended jobs:

Job A → RIGHT

Job C → SAVE

Job B → LEFT

These actions are stored in SwipeHistory. The system can use this information as feedback for future recommendation generation.



**Recommendation Generation and Timestamp:** Each generated recommendation can be associated with the time at which it was generated. The field used is: generated\_at. This allows the system to maintain information about when a recommendation was created. Similarly, swipe interactions contain: swiped\_at which records when the candidate interacted with a job.



**The AI Recommendation workflow follows these major stages:**

1\. Retrieve Candidate Profile

2\. Retrieve Resume Data

3\. Retrieve Available Jobs

4\. Send Data to AI Recommendation Engine

5\. Calculate Match Score

6\. Rank Recommended Jobs

7\. Generate Recommendation Reason

8\. Store Recommendations

9\. Display Job Cards

10\. Capture Swipe Feedback

11\. Store Swipe History

12\. Use Feedback for Future Recommendations



The recommendation system helps candidates discover potentially relevant jobs while using their profile, resume information, job requirements, preferences, and previous interactions to improve the recommendation process.

