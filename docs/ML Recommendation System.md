ML Recommendation System

The SwipeX recommendation system is designed to identify jobs that are relevant to a candidate. The system considers candidate information, resume data, available jobs, and candidate interaction history. The recommendation workflow produces a recommendation score and ranks jobs according to their relevance.



**Recommendation Inputs**: The recommendation system uses three primary inputs:

* Candidate Profile
* Resume Data
* Available Jobs

Swipe feedback can additionally be used as a personalization signal.



* **Candidate Profile Processing**: Candidate profile information is retrieved from the database. This information helps determine whether a job is suitable for the candidate.
* **Resume Processing**: Resume data provides additional candidate information. The extracted skills are especially useful for matching the candidate with required job skills.
* **Job Processing**: Available jobs are retrieved from the Jobs table. Only suitable/available job postings should be considered for recommendation.



**Matching**: The recommendation system compares candidate information with job information. 



**Match Score**: Each candidate-job pair can receive a match score. The score represents the degree of compatibility between the candidate and the job. 



**Ranking**: After match scores are calculated, jobs are ranked.

Available Jobs

&#x20;     |

&#x20;     v

Calculate Match Scores

&#x20;     |

&#x20;     v

Sort by Recommendation Score

&#x20;     |

&#x20;     v

Ranked Jobs

Higher-scoring jobs can appear earlier in the recommendation list.



**Recommendation Storage**: Recommendations are stored in the PostgreSQL database. This allows the system to associate a recommendation with both the candidate and the job.



**Swipe Feedback**: Candidate interactions are stored in SwipeHistory. These interactions can provide feedback for future personalization.



**The feedback loop is:**

Recommendations

&#x20;     |

&#x20;     v

Job Cards

&#x20;     |

&#x20;     v

Candidate Swipe

&#x20;     |

&#x20;     v

Swipe History

&#x20;     |

&#x20;     v

Future Recommendation Processing



**Personalization**: Personalization means that recommendations can differ between candidates. For example:

Candidate A

→ Python + FastAPI jobs

Candidate B

→ React + JavaScript jobs

The difference is caused by differences in candidate skills, experience, preferences, resume information, and interaction history.



**Recommendation Workflow**

Candidate Profile

&#x20;       |

Resume Data

&#x20;       |

Available Jobs

&#x20;       |

&#x20;       v

AI / ML Recommendation Engine

&#x20;       |

&#x20;       v

Calculate Match Score

&#x20;       |

&#x20;       v

Rank Recommended Jobs

&#x20;       |

&#x20;       v

Store Recommendations

&#x20;       |

&#x20;       v

Display Job Cards

&#x20;       |

&#x20;       v

Capture Swipe Feedback

&#x20;       |

&#x20;       v

Swipe History

&#x20;       |

&#x20;       +----------------------+

&#x20;                              |

&#x20;                              v

&#x20;                 Future Recommendations

