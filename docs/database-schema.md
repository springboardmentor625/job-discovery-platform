1.Users

| Field | Description |

| user_id | Primary key that uniquely identifies a user |
| full_name | Full name of the user |
| email | Email address of the user |
| password_hash | Hashed password of the user |
| role | Role assigned to the user |
| phone | Phone number of the user |
| profile_picture | Profile picture path or reference |
| is_verified | Indicates whether the user account is verified |
| created_at | Date and time when the account was created |

2. CandidateProfile

| Field | Description |

| profile_id | Primary key that uniquely identifies a candidate profile |
| user_id | Foreign key referencing Users |
| headline | Candidate professional headline |
| summary | Candidate professional summary |
| location | Candidate location |
| experience_years | Number of years of experience |
| education | Education information stored as JSON/TEXT |
| projects | Project information stored as JSON/TEXT |
| certifications | Certification information stored as JSON/TEXT |
| preferred_job_type | Candidate's preferred job type |
| preferred_location | Candidate's preferred job location |

3. Companies

| Field | Description |

| company_id | Primary key that uniquely identifies a company |
| company_name | Name of the company |
| company_type | Type of company |
| industry | Industry in which the company operates |
| website | Company website |
| headquarters | Company headquarters |

4. Jobs

| Field | Description |

| job_id | Primary key that uniquely identifies a job |
| company_id | Foreign key referencing Companies |
| title | Job title |
| description | Description of the job |
| location | Job location |
| employment_type | Type of employment |
| salary_min | Minimum salary |
| salary_max | Maximum salary |
| experience_required | Required experience |
| required_skills | Required skills stored as JSON |
| posted_date | Date when the job was posted |
| status | Current status of the job |

5. Resumes

| Field | Description |

| resume_id | Primary key that uniquely identifies a resume |
| user_id | Foreign key referencing Users |
| resume_name | Name of the resume |
| file_path | Path of the uploaded resume |
| extracted_skills | Skills extracted from the resume and stored as JSON |
| uploaded_at | Date and time when the resume was uploaded |
| is_default | Indicates whether the resume is the user's default resume |

6. Applications

| Field | Description |

| application_id | Primary key that uniquely identifies an application |
| user_id | Foreign key referencing Users |
| job_id | Foreign key referencing Jobs |
| resume_id | Foreign key referencing Resumes |
| status | Current application status |
| applied_at | Date and time when the application was submitted |

7. SwipeHistory

| Field | Description |

| swipe_id | Primary key that uniquely identifies a swipe |
| user_id | Foreign key referencing Users |
| job_id | Foreign key referencing Jobs |
| swipe_action | Action performed by the user |
| swiped_at | Date and time of the swipe |

8. ATSReports

| Field | Description |

| ats_report_id | Primary key that uniquely identifies an ATS report |
| resume_id | Foreign key referencing Resumes |
| job_id | Foreign key referencing Jobs |
| ats_score | ATS score generated for the resume |
| match_percentage | Percentage match between resume and job |
| missing_skills | Skills missing from the resume, stored as JSON |
| missing_keywords | Missing keywords, stored as JSON |
| suggestions | Resume improvement suggestions |
| analyzed_at | Date and time when the analysis was performed |

9. Recommendations

| Field | Description |

| recommendation_id | Primary key that uniquely identifies a recommendation |
| user_id | Foreign key referencing Users |
| job_id | Foreign key referencing Jobs |
| recommendation_score | Score assigned to the recommendation |
| recommendation_reason | Reason for recommending the job |
| generated_at | Date and time when the recommendation was generated |

10. Notifications

| Field | Description |

| notification_id | Primary key that uniquely identifies a notification |
| user_id | Foreign key referencing Users |
| title | Notification title |
| message | Notification message |
| is_read | Indicates whether the notification has been read |
| created_at | Date and time when the notification was created |