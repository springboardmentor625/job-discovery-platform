Database constraints are used to maintain the accuracy, consistency, and integrity of data stored in the SwipeX PostgreSQL database.

The main constraints used in the schema are:

\- Primary Key

\- Foreign Key

\- Unique

\- NOT NULL

\- Value restrictions where applicable



**Primary Key Constraints**



| Table | Primary Key |



| Users | user\_id |

| CandidateProfile | profile\_id |

| Companies | company\_id |

| Jobs | job\_id |

| Resumes | resume\_id |

| Applications | application\_id |

| SwipeHistory | swipe\_id |

| ATSReports | ats\_report\_id |

| Recommendations | recommendation\_id |

| Notifications | notification\_id |



**Foreign Key Constraints**



**CandidateProfile**



CandidateProfile.user\_id

&#x20;       ↓

Users.user\_id



**Jobs**



Jobs.company\_id

&#x20;       ↓

Companies.company\_id



**Resumes**



Resumes.user\_id

&#x20;       ↓

Users.user\_id



**Applications**



Applications.user\_id

&#x20;       ↓

Users.user\_id



Applications.job\_id

&#x20;       ↓

Jobs.job\_id



Applications.resume\_id

&#x20;       ↓

Resumes.resume\_id



**SwipeHistory**



SwipeHistory.user\_id

&#x20;       ↓

Users.user\_id



SwipeHistory.job\_id

&#x20;       ↓

Jobs.job\_id



**ATSReports**



ATSReports.resume\_id

&#x20;       ↓

Resumes.resume\_id



ATSReports.job\_id

&#x20;       ↓

Jobs.job\_id



**Recommendations**



Recommendations.user\_id

&#x20;       ↓

Users.user\_id



Recommendations.job\_id

&#x20;       ↓

Jobs.job\_id



**Notifications**



Notifications.user\_id

&#x20;       ↓

Users.user\_id



**Unique Constraint**



The email field in the Users table is unique. This prevents more than one user account from being created with the same email address.



**NOT NULL Constraints**

Fields that are required for creating valid records should be defined as NOT NULL in PostgreSQL.

Examples of fields that are expected to be required include:

Users

user\_id

full\_name

email

password\_hash

CandidateProfile

profile\_id

user\_id

Companies

company\_id

company\_name

Jobs

job\_id

company\_id

title

Resumes

resume\_id

user\_id

resume\_name

file\_path

Applications

application\_id

user\_id

job\_id

resume\_id

SwipeHistory

swipe\_id

user\_id

job\_id

swipe\_action

ATSReports

ats\_report\_id

resume\_id

job\_id

Recommendations

recommendation\_id

user\_id

job\_id

Notifications

notification\_id

user\_id

title

message



**Swipe Action Constraint**

The SwipeHistory table supports three swipe actions:

* LEFT
* RIGHT
* SAVE

The swipe\_action field should accept only valid actions defined by the application.



**Data Type Constraints**

The database uses appropriate data types for different types of information.

Examples include:

* Integer types for IDs and numerical values.
* Text/VARCHAR for names and descriptions.
* Boolean values for fields such as is\_verified, is\_default, and is\_read.
* Timestamp values for date/time fields.
* JSON/JSONB or TEXT for structured information where specified by the schema.



**JSON/TEXT Fields**

The simplified schema intentionally uses JSON/TEXT for certain fields.

Examples:

CandidateProfile

education

projects

certifications

Jobs

required\_skills

Resumes

extracted\_skills

ATSReports

missing\_skills

missing\_keywords

This approach avoids creating unnecessary additional tables and relationships.



**Referential Integrity**

Foreign key constraints help ensure that related records refer to existing records.

For example, a job application references: Users, Jobs, Resumes

Therefore, the corresponding user, job, and resume records should exist.



**Timestamp Fields**

The database contains timestamp fields to record important events.

Examples:

Users.created\_at

Resumes.uploaded\_at

Applications.applied\_at

SwipeHistory.swiped\_at

ATSReports.analyzed\_at

Recommendations.generated\_at

Notifications.created\_at

These fields allow the system to track when important actions occurred.



**The constraints help maintain:**

Data integrity

Data consistency

Unique user accounts

Valid relationships

Reliable records

Accurate job and application information

Valid swipe actions

