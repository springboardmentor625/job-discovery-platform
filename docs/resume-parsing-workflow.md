The Resume Parsing feature in SwipeX processes a candidate's uploaded resume and extracts useful professional information from it. The extracted information is used by other parts of the SwipeX platform, particularly ATS analysis and job recommendation.

The resume parsing workflow extracts:

\- Skills

\- Experience

\- Education

The processed resume information is then stored for future use.



**Purpose of Resume Parsing: C**onvert the information contained in a resume into structured data.

Instead of requiring the candidate to manually enter all their professional information, the system processes the uploaded resume and extracts relevant details.

The extracted information can later be used for:

\- ATS analysis

\- Job recommendations

\- Candidate profile information

\- Skill matching

\- Resume-based job discovery



**Step 1 - Upload Resume**

The workflow starts when the candidate uploads a resume through the SwipeX application. The resume is submitted from the frontend to the backend. The backend receives the uploaded resume file and processes it.

The general flow is:

Candidate

&#x20;   |

&#x20;   v

Select Resume

&#x20;   |

&#x20;   v

Upload Resume

&#x20;   |

&#x20;   v

FastAPI Backend

The uploaded resume can be associated with the candidate's user account.



**Step 2 - Extract Text:** After the resume is uploaded, the system extracts the text contained in the resume. The purpose of this step is to convert the resume document into readable text that can be processed by the resume parser.

The process is:

Resume File

&#x20;   |

&#x20;   v

Text Extraction

&#x20;   |

&#x20;   v

Resume Text

The extracted text may contain information such as:

Candidate name

Skills

Work experience

Education

Projects

Certifications

Other professional information

The extracted text becomes the input for the AI resume parser.



**Step 3 - AI Resume Parser:** After extracting the text, the resume text is passed to the AI resume parser. The parser analyzes the content of the resume and identifies meaningful sections.

The process is:

Extracted Resume Text

&#x20;       |

&#x20;       v

&#x20;  AI Resume Parser

&#x20;       |

&#x20;       v

Structured Resume Information

The parser identifies information that can be used by the next stages of the workflow.



**Step 4 - Extract Skills:** The resume parser identifies technical and professional skills mentioned in the resume.

Examples of skills that may be extracted include:

Python

Java

JavaScript

React

FastAPI

PostgreSQL

SQL

Machine Learning

Git

The extracted skills are used later for:

* Job matching
* ATS analysis
* Job recommendations
* Candidate profile information

The extracted skills are stored in the resume data.



**Step 5 - Extract Experience**

The system identifies professional experience information from the resume.

Experience information may include:

* Job roles
* Companies
* Work experience
* Relevant experience details
* Experience duration

The extracted experience can be used to understand the candidate's professional background and compare it with job requirements. The candidate's experience is also relevant to job recommendation and ATS analysis.



**Step 6 - Extract Education:** The system identifies education-related information from the resume.

Education information may include:

* Degree
* Institution
* Field of study
* Graduation information

Other educational details mentioned in the resume

The extracted education information can be used to build the candidate's professional profile.



**Step 7 - Store Resume Data:** After extracting the required information, the system stores the processed resume information in the PostgreSQL database.

The main table used is: Resumes

The extracted skills are stored in: extracted\_skills

The field can store structured skill information using JSON.



**Resume Data Storage Flow**

Uploaded Resume

&#x20;     |

&#x20;     v

Extracted Text

&#x20;     |

&#x20;     v

Parsed Resume Information

&#x20;     |

&#x20;     +------------------+

&#x20;     |         |        |

&#x20;     v         v        v

&#x20;  Skills   Experience Education

&#x20;     |         |        |

&#x20;     +---------+--------+

&#x20;               |

&#x20;               v

&#x20;       Store Resume Data

&#x20;               |

&#x20;               v

&#x20;          PostgreSQL



**Resume Parsing and Candidate Profile:** The information extracted from a resume can support the candidate's profile. The candidate profile contains professional information such as:

* Headline
* Summary
* Location
* Experience
* Education
* Projects
* Certifications
* Job preferences

Resume parsing reduces the amount of information that the candidate needs to enter manually.



**Resume Parsing and ATS Analysis:** The extracted resume information is also used by the ATS analysis workflow. The relationship between the two workflows is:

Resume Upload

&#x20;     |

&#x20;     v

Resume Parsing

&#x20;     |

&#x20;     v

Extract Skills

&#x20;     |

&#x20;     v

ATS Analysis

&#x20;     |

&#x20;     v

Compare Skills and Keywords

&#x20;     |

&#x20;     v

ATS Score

The parsed resume provides information that can be compared with the requirements of a selected job.



**Resume Parsing and Job Recommendations:** The extracted skills and experience can also support personalized job recommendations. The general flow is:

Resume

&#x20; |

&#x20; v

Resume Parsing

&#x20; |

&#x20; v

Extracted Skills

&#x20; |

&#x20; v

Candidate Information

&#x20; |

&#x20; v

Job Matching

&#x20; |

&#x20; v

Job Recommendations

This allows the recommendation system to consider the candidate's resume information when identifying relevant job opportunities.



**Backend Interaction:** The resume parsing workflow involves the frontend, backend, parsing component, and database.

React Frontend

&#x20;     |

&#x20;     | Upload Resume

&#x20;     v

FastAPI Backend

&#x20;     |

&#x20;     v

Resume Processing

&#x20;     |

&#x20;     v

Text Extraction

&#x20;     |

&#x20;     v

AI Resume Parser

&#x20;     |

&#x20;     +-----------------------+

&#x20;     |           |           |

&#x20;     v           v           v

&#x20;  Skills    Experience   Education

&#x20;     |           |           |

&#x20;     +-----------+-----------+

&#x20;                 |

&#x20;                 v

&#x20;            PostgreSQL

&#x20;                 |

&#x20;                 v

&#x20;             Resumes



**Resume Database Information:** The Resumes table is associated with the candidate through user\_id. The relevant structure is: Resumes

The relationship is: Users (1) -------- (M) Resumes

This allows one candidate to maintain multiple resume records.



**Multiple Resume Support:** SwipeX supports maintaining multiple resume versions for a candidate. Each uploaded resume can have its own:

* Resume ID
* Resume name
* File path
* Extracted skills
* Upload timestamp
* Default status

The is\_default field can be used to identify the candidate's default resume.



**Example**: Suppose a candidate uploads a resume containing

Skills:

Python, FastAPI, React, PostgreSQL

Experience:

Software Development Intern

Education:

B.Tech in Computer Science

The resume parsing workflow processes the document as follows:

Resume File

&#x20;   |

&#x20;   v

Extract Text

&#x20;   |

&#x20;   v

AI Resume Parser

&#x20;   |

&#x20;   +--------------------+

&#x20;   |         |          |

&#x20;   v         v          v

&#x20;Skills   Experience  Education

&#x20;   |         |          |

&#x20;   v         v          v

Python     Software    B.Tech

FastAPI    Development Computer

React      Intern      Science

PostgreSQL

&#x20;   |

&#x20;   v

Store Resume Data

The extracted information can then be used by ATS analysis and job recommendation features.



**Error Handling:** The resume parsing workflow should handle cases such as:

* Unsupported resume format.
* Empty resume file.
* Resume text extraction failure.
* Missing readable text.
* Parsing failure.
* Invalid uploaded file.
* Database storage failure.

If processing fails, the system should return an appropriate error response rather than storing incomplete resume data.



The processed resume information provides structured data that can be reused by other SwipeX features, especially ATS analysis, skill matching, and personalized job recommendations.

