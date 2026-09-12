SWIPEX API Endpoints
#	Feature	                Method	           Endpoint	                Purpose
1	Candidate Registration	POST	         /api/register/	        Register a new candidate
2	Candidate Login     	POST	           /api/login/ 	        Authenticate candidate
3	Email Verification	    GET/POST*	     /api/verify-email/ 	Verify candidate email
4	Resume Upload	        POST	         /api/resume/upload/	Upload and process resume
5	Resume Delete	        DELETE/POST*	 /api/resume/delete/	Delete candidate resume
6	Job Swipe	            POST	         /api/jobs/swipe/	Record right/left/down swipe
7	Saved Jobs	            GET/POST*	     /api/jobs/saved/	    Manage saved jobs
8	Swipe History	        GET	           /api/jobs/swipe-history/	Retrieve swipe history
9	Candidate Profile	GET/POST/PUT*	    /api/profile/	        Manage candidate profile
10	ATS Analysis	    GET/POST*	     /api/ats/jobs/<job_id>/ Analyze resume against a job
11	Job Listings	    GET	                /api/jobs/	            Retrieve available jobs
12	Recommendations	    GET	              /api/recommendations/	Retrieve AI recommendations