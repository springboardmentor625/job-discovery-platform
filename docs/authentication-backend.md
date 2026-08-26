Authentication is used to verify the identity of users accessing the SwipeX application.



**Authentication Flow:**

User

&#x20; ↓

Register

&#x20; ↓

User Account Created

&#x20; ↓

Login

&#x20; ↓

Credentials Verified

&#x20; ↓

JWT Access Token

&#x20; ↓

Access Protected APIs



**User Registration**: During registration, the user provides account information. The backend validates the submitted data before creating the user record.



**Password Security:** Passwords should not be stored as plain text. Instead, the password is converted into a secure password hash before being stored in PostgreSQL. The database stores password\_hash rather than the original password.



User Password

&#x20;     ↓

Password Hashing

&#x20;     ↓

password\_hash

&#x20;     ↓

PostgreSQL



**Login:** During login, the user provides:

* Email
* Password

The backend:

1\. Receives login request.

2\. Finds the user using the email.

3\. Verifies the password.

4\. Authenticates the user.

5\. Generates an access token.

6\. Returns the authentication response.

6\. JWT Authentication



SwipeX can use JSON Web Tokens (JWT) for authentication. After successful login, the backend generates a JWT access token.

The general flow is:

Login

&#x20; ↓

Credentials Verified

&#x20; ↓

JWT Generated

&#x20; ↓

Token Returned

&#x20; ↓

Frontend Stores Token

&#x20; ↓

Token Sent with Protected Requests



**Authorization Header**: For protected API requests, the token is typically sent using:

Authorization: Bearer <access\_token>

The backend verifies the token before allowing access to protected resources.



**Protected APIs:** Authenticated APIs can include operations such as:

* Candidate profile access.
* Resume management.
* Job applications.
* Swipe history.
* Saved jobs.
* Recommendations.
* Notifications.
* ATS reports.

The exact protected endpoints depend on the implemented backend.



**Authentication and PostgreSQL**: Authentication information is stored in the Users table.



**Security Practices:** The backend should follow these security practices:

* Never store plain-text passwords.
* Use password hashing.
* Use JWT for authenticated API access.
* Keep secret keys secure.
* Store database credentials in environment variables.
* Validate incoming requests.
* Protect private endpoints.
* Do not expose sensitive information in API responses.



**Authentication Summary:**

User registration.

Secure password storage.

User login.

Credential verification.

JWT-based authentication.

Protected API access.

Authentication error handling.

The authentication system forms the security layer between the frontend and protected backend resources.

