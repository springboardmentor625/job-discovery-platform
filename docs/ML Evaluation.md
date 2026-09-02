ML Evaluation

Evaluation is important for determining whether the matching and recommendation system produces useful results. The SwipeX ML component can be evaluated using both matching metrics and recommendation-related metrics.



**Purpose of Evaluation**

\- Determine whether jobs are relevant to candidates.

\- Measure matching quality.

\- Improve recommendation ranking.

\- Evaluate candidate interaction with recommendations.



**Recommendation Evaluation**: Recommendation quality can be evaluated using candidate interactions. A higher proportion of positive interactions can indicate that recommendations are becoming more relevant.



**Ranking Evaluation**: Since SwipeX ranks recommended jobs, ranking quality is important. The system should aim to place highly relevant jobs near the top of the recommendation list. Candidate interactions can provide feedback about whether highly ranked jobs were useful.



**Swipe Feedback Evaluation**: Swipe history provides a practical feedback signal. The system can analyze:

* Number of RIGHT swipes
* Number of SAVE actions
* Number of LEFT swipes

These signals can help assess recommendation relevance.



**ATS Evaluation**: ATS results can be evaluated by checking whether:

* Relevant skills are identified.
* Missing skills are correctly detected.
* Missing keywords are identified.
* Resume-job compatibility is reasonable.
* Suggestions are relevant.



**Future Improvement**: The recommendation system can be improved by:

* Incorporating more candidate preferences.
* Using swipe feedback.
* Evaluating different scoring strategies.
* Collecting more interaction data.



**Evaluation Workflow**

Candidate and Job Data

&#x20;       |

&#x20;       v

Generate Recommendations

&#x20;       |

&#x20;       v

Calculate Scores

&#x20;       |

&#x20;       v

Rank Jobs

&#x20;       |

&#x20;       v

Candidate Interaction

&#x20;       |

&#x20;       v

Collect Feedback

&#x20;       |

&#x20;       v

Evaluate Recommendation Quality

&#x20;       |

&#x20;       v

Improve Matching / Scoring

