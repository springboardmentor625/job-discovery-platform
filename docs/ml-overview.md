Machine Learning is an important part of the SwipeX platform because it helps analyze candidate information, compare candidates with job requirements, and generate personalized job recommendations. SwipeX uses candidate profile information, resume data, job information, and candidate interaction data to support intelligent matching and recommendation.



The ML-related functionality primarily supports:

\- Resume information analysis

\- Skill matching

\- Resume-job compatibility

\- ATS scoring

\- Job recommendation

\- Recommendation ranking

\- Personalized matching

\- Swipe-feedback-based personalization



**Purpose of Machine Learning**: To improve the relevance of jobs shown to candidates. Traditional job platforms may display jobs using simple filters or keyword searches. SwipeX aims to provide a more personalized experience by considering multiple candidate and job attributes. The general idea is:

Candidate Information

&#x20;       +

Resume Information

&#x20;       +

Job Information

&#x20;       +

Candidate Preferences

&#x20;       +

Interaction / Swipe Data

&#x20;       |

&#x20;       v

ML / AI Processing

&#x20;       |

&#x20;       v

Job Matching and Recommendations



**ML Components:**

1\. Resume Information Processing

2\. Skill Extraction

3\. Skill Matching

4\. Resume-Job Matching

5\. ATS Compatibility Scoring

6\. Job Recommendation

7\. Recommendation Ranking

8\. Swipe Feedback Analysis



**Input Data**: The ML system can use information from:

* **Candidate Profile**

Skills

Experience

Education

Preferred job type

Preferred location

Candidate summary

Projects

Certifications

* **Resume**

Extracted skills

Experience

Education

Resume text

* **Job**

Job title

Job description

Required skills

Required experience

Location

Employment type

Salary information

* **Candidate Interaction**

Left swipe

Right swipe

Save action

Previous job interactions



**ML Processing Flow:**

Candidate Profile

&#x20;      |

Resume Data

&#x20;      |

Job Data

&#x20;      |

Swipe History

&#x20;      |

&#x20;      v

Feature Extraction

&#x20;      |

&#x20;      v

Matching / Similarity Analysis

&#x20;      |

&#x20;      v

Match Score

&#x20;      |

&#x20;      v

Recommendation Score

&#x20;      |

&#x20;      v

Rank Jobs

&#x20;      |

&#x20;      v

Personalized Recommendations



**Relationship with Other SwipeX Modules**: The ML component interacts with several other modules.

Resume Parsing

&#x20;     |

&#x20;     v

Resume Data

&#x20;     |

&#x20;     +------------------+

&#x20;                        |

Candidate Profile ------> ML Processing <------ Jobs

&#x20;                        |

Swipe History ---------->|

&#x20;                        |

&#x20;                        v

&#x20;                Recommendations



**ML and Resume Parsing**: Resume parsing converts unstructured resume content into useful information. The ML/AI processing can then use the extracted information for:

Skill matching



Experience matching



Job recommendations



ATS analysis



**The flow is:**

Resume

&#x20;  |

&#x20;  v

Text Extraction

&#x20;  |

&#x20;  v

Resume Parser

&#x20;  |

&#x20;  v

Skills / Experience / Education

&#x20;  |

&#x20;  v

ML Processing



**ML and ATS Analysis**: ATS component compares resume information with a selected job. The process includes:

Resume

&#x20;  +

Job Description

&#x20;  |

&#x20;  v

Extract Skills and Keywords

&#x20;  |

&#x20;  v

Compare Resume and Job

&#x20;  |

&#x20;  v

Compatibility Score

&#x20;  |

&#x20;  v

ATS Score

The ATS report can identify missing skills and keywords and generate improvement suggestions.



**ML and Job Recommendation**: The recommendation component uses candidate and job information to identify potentially suitable jobs. The general process is:

Candidate Profile

&#x20;      +

Resume Data

&#x20;      +

Available Jobs

&#x20;      |

&#x20;      v

Recommendation Processing

&#x20;      |

&#x20;      v

Match Scores

&#x20;      |

&#x20;      v

Rank Jobs

&#x20;      |

&#x20;      v

Recommended Jobs



**ML and Swipe Feedback**: Swipe actions provide information about candidate preferences. These interactions are stored in the SwipeHistory table. Swipe history can be used as feedback for future personalization.

Recommended Jobs

&#x20;      |

&#x20;      v

Candidate Swipe

&#x20;      |

&#x20;      v

Swipe History

&#x20;      |

&#x20;      v

Future Recommendation Processing

