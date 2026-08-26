**ATS Analysis Workflow Explaination**

The ATS (Applicant Tracking System) Analysis feature in SwipeX evaluates how well a candidate's resume matches the requirements of a selected job. The ATS workflow compares the candidate's resume with the job description and generates an ATS score along with information about missing skills, missing keywords, and suggestions for improving the resume.

The generated ATS analysis is stored in the `ATSReports` table in the PostgreSQL database.



Purpose of ATS Analysis: Help candidates understand how well their resume matches a particular job before or during the application process.



The system analyzes:

\- Resume skills

\- Resume keywords

\- Job description

\- Job requirements

\- Skill matching

\- Keyword matching

\- Missing skills

\- Missing keywords



Based on the analysis, the system calculates an ATS score and generates improvement suggestions.



**ATS Workflow:** 



**Step 1 - Apply for Job**

The ATS workflow starts when a candidate applies for a job. The candidate selects a job from the available job opportunities and initiates the application process. The system identifies:

Candidate/User

Selected Job

Resume to be used for the application

The application is associated with the selected job and resume.



**Step 2 - Retrieve Resume**

After the application process begins, the system retrieves the candidate's resume.

The resume can be obtained using the candidate's user information and the resume associated with the application.

The resume contains information such as:

* Resume file
* Resume name
* Extracted skills
* Other resume information

The resume information is stored in the Resumes table.



**Step 3 - Retrieve Job Description**

At the same time, the system retrieves the job description for the selected job.

The job information is stored in the Jobs table.



The main information required for ATS analysis is:

Job Description

Required Skills

Experience Requirement



**Step 4 - Extract Skills and Keywords**

After retrieving both the resume and job description, the system extracts important skills and keywords from both sources.

The extraction process identifies relevant information from:

Resume

&#x20;  +

Job Description

&#x20;  ↓

Skills and Keywords



**Resume Extraction**: The system identifies skills and keywords present in the candidate's resume.



**Job Description Extraction:** The system identifies skills and keywords required or mentioned in the job description. The extracted information is used for the comparison stage.



**Step 5 - Compare Resume with Job Description**

The extracted resume skills and keywords are compared with the skills and keywords obtained from the job description. The comparison determines how closely the candidate's resume matches the selected job.

The basic process is:

Resume Skills

&#x20;      +

Job Required Skills

&#x20;      ↓

Skill Comparison

&#x20;      ↓

Matching Skills

&#x20;      +

Missing Skills

The system can also compare important keywords from the resume and job description.



**Step 6 - Calculate ATS Score**

After comparing the resume with the job description, the system calculates an ATS score.

The score represents the overall compatibility between the candidate's resume and the selected job.

The ATS analysis may consider factors such as:

* Matching skills
* Relevant keywords
* Job requirements
* Resume-job compatibility



**Step 7 - Identify Missing Skills**

After comparing the resume and job requirements, the system identifies skills required by the job that are not sufficiently represented in the candidate's resume.

The process is:

Required Job Skills

&#x20;       -

Resume Skills

&#x20;       ↓

Missing Skills

The missing skills are stored as structured data in the ATS report.



**Step 8 - Identify Missing Keywords:** The system can also identify important keywords present in the job description but missing from the candidate's resume.

The process is:

Job Keywords

&#x20;     -

Resume Keywords

&#x20;     ↓

Missing Keywords

These keywords can help the candidate understand which relevant terms are absent from the resume.



**Step 9 - Generate Improvement Suggestions**

Based on the ATS analysis, the system generates suggestions to help improve the candidate's resume for the selected job.

Suggestions can be based on:

* Missing skills
* Missing keywords
* Low matching percentage
* Job requirements
* Resume-job mismatch



Examples of suggestions include:

* Add relevant skills that are required by the job.
* Include important keywords from the job description where they accurately reflect the candidate's experience.
* Improve the description of relevant projects and experience.
* Highlight skills that directly match the job requirements.



**Step 10 - Store ATS Report**

After completing the analysis, the system stores the generated ATS report in the PostgreSQL database. The report is stored in the: ATSReports table.



**Backend and Database Interaction:**

The ATS workflow involves communication between the frontend, backend, AI processing components, and PostgreSQL.

The overall architecture is:



React Frontend

&#x20;     |

&#x20;     v

FastAPI Backend

&#x20;     |

&#x20;     +----------------------+

&#x20;     |                      |

&#x20;     v                      v

Resume Data            Job Data

&#x20;     |                      |

&#x20;     +----------+-----------+

&#x20;                |

&#x20;                v

&#x20;         ATS Processing

&#x20;                |

&#x20;                v

&#x20;      ATS Analysis Result

&#x20;                |

&#x20;                v

&#x20;         PostgreSQL

&#x20;                |

&#x20;                v

&#x20;          ATSReports



**ATS Database Relationships:** The ATSReports table is connected to both the Resumes and Jobs tables.

Resumes (1) -------- (M) ATSReports

&#x20;                        |

&#x20;                        |

Jobs (1) ---------------+



The relationships are:

ATSReports.resume\_id → Resumes.resume\_id

ATSReports.job\_id → Jobs.job\_id



This allows each ATS report to identify:

Which resume was analyzed.

Which job the resume was compared against.



ATS Analysis Example

Consider a job requiring:

Python

FastAPI

PostgreSQL

Docker

AWS

The candidate's resume contains:

Python

FastAPI

PostgreSQL



The system performs the following:



Resume Skills

&#x20;     ↓

Python

FastAPI

PostgreSQL



Job Skills

&#x20;     ↓

Python

FastAPI

PostgreSQL

Docker

AWS



Comparison

&#x20;     ↓

Matching Skills:

Python

FastAPI

PostgreSQL



Missing Skills:

Docker

AWS



The system then calculates the ATS score and generates appropriate improvement suggestions.

Finally, the result is stored in the ATSReports table.

