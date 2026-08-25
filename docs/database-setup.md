**Creating the SwipeX Database:**

CREATE DATABASE swipex;

The actual database name should match the database name configured in the backend.



**Recommended Table Creation Order**

Tables should be created according to their dependencies.

A suitable order is:

1\. Users

2\. Companies

3\. CandidateProfile

4\. Jobs

5\. Resumes

6\. Applications

7\. SwipeHistory

8\. ATSReports

9\. Recommendations

10\. Notifications

This order allows referenced tables to exist before dependent foreign key relationships are created.



**Verifying Tables**

After connecting to the SwipeX database, the tables can be checked using PostgreSQL tools.



**Testing the Database**

Records can be checked using SQL queries.

Example: SELECT \* FROM Users;



**Database Verification Checklist**

The PostgreSQL setup can be verified by checking:

PostgreSQL server is running.

SwipeX database exists.

Required tables are created.

Primary keys are configured.

Foreign keys are configured.

Unique email constraint exists.

Required data types are configured.

JSON/TEXT fields are configured.

Timestamp fields are configured.

