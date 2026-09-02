ML Matching and Scoring

Matching and scoring are used to determine how closely a candidate matches a particular job. SwipeX can consider multiple matching factors instead of relying only on a single keyword. The main factors include:

\- Skills

\- Experience

\- Location

\- Job preferences

\- Resume information

\- Candidate interaction signals



**Candidate-Job Matching**: The matching process compares:

Candidate

&#x20;   |

&#x20;   +-- Skills

&#x20;   +-- Experience

&#x20;   +-- Education

&#x20;   +-- Preferences

&#x20;   +-- Resume

&#x20;         |

&#x20;         v

&#x20;       MATCH

&#x20;         ^

&#x20;         |

&#x20;   +-- Job Skills

&#x20;   +-- Experience Required

&#x20;   +-- Location

&#x20;   +-- Employment Type

&#x20;   +-- Job Description

&#x20;   |

&#x20;  Job



**Skill Matching**: Skill matching compares candidate skills with required job skills. Example:

Candidate:

Python

React

SQL

FastAPI



Job:

Python

React

Docker

FastAPI



Matching skills:

Python

React

FastAPI



Required skills:

Python

React

Docker

FastAPI



Skill Match = 3 / 4 = 75%



**Experience Matching**: Candidate experience can be compared with the experience required by a job. For example:

Candidate Experience = 2 years

Job Requirement = 1 year

The candidate satisfies the experience requirement.

Experience can therefore contribute positively to the overall compatibility score.



**Location Matching**: Candidate location preferences can be compared with the job location. For example:

Preferred Location = Bengaluru

Job Location = Bengaluru

This represents a location match.

Location compatibility can contribute to recommendation scoring.



**Job Type Matching**: Candidate job preferences can be compared with the employment type of a job. For example:

Preferred Job Type = Full-time

Job Employment Type = Full-time

This represents a job-type match.



**Combined Matching**: The overall matching process can combine several signals:

Skill Match

&#x20;    +

Experience Match

&#x20;    +

Location Match

&#x20;    +

Job Type Match

&#x20;    |

&#x20;    v

Overall Compatibility



**Missing Skills**: Skill matching can also identify skills required by a job that are not present in the candidate's extracted skills. Example:

Job Skills:

Python

React

Docker

FastAPI



Candidate Skills:

Python

React

FastAPI



Missing skill:

Docker

Missing skills are particularly useful for ATS analysis and can also provide information for recommendation explanations.



**Recommendation Explanation**: The matching information can be used to generate a recommendation reason. For example: Strong match because the candidate's skills and preferred location align with the job requirements. The explanation is stored in: recommendation\_reason



**Feedback-Based Improvement**: Candidate swipe behavior can provide additional information. Repeated interactions can provide preference signals for future recommendation processing.



**Matching Pipeline**

Candidate Data

&#x20;     +

Resume Data

&#x20;     +

Job Data

&#x20;     |

&#x20;     v

Feature Extraction

&#x20;     |

&#x20;     v

Skill Matching

&#x20;     |

&#x20;     v

Experience Matching

&#x20;     |

&#x20;     v

Preference Matching

&#x20;     |

&#x20;     v

Semantic Matching

&#x20;     |

&#x20;     v

Calculate Score

&#x20;     |

&#x20;     v

Rank Jobs

