The backend of SwipeX provides the server-side functionality required for the application. It acts as an intermediary between the React frontend and the PostgreSQL database. The backend handles API requests, authentication, user-related operations, resume processing, job-related operations, applications, swipe actions, and communication with the database.



**Backend Technology Stack:**

| Technology | Purpose |



| Python | Backend programming language |

| FastAPI | Web framework for building APIs |

| PostgreSQL | Relational database |

| Uvicorn | ASGI server used to run FastAPI |

| Pydantic | Request and response data validation |

| JWT | Authentication and authorization |

| Python Libraries | Supporting backend and AI functionality |



**Backend Architecture:**

React Frontend

&#x20;     ↓

FastAPI Backend

&#x20;     ↓

API Routes

&#x20;     ↓

Business Logic

&#x20;     ↓

Database / Services

&#x20;     ↓

PostgreSQL

The backend receives requests from the frontend, processes the requests, communicates with PostgreSQL or other services when required, and returns responses to the frontend.



**Role of the Backend:**

* Handling API requests.
* Processing user registration.
* Processing user login.
* Managing authentication.
* Validating incoming data.
* Connecting to PostgreSQL.
* Managing candidate profile information.
* Handling resume uploads.
* Storing resume information.
* Processing job-related requests.
* Managing job applications.
* Recording swipe actions.
* Managing saved jobs.
* Supporting ATS analysis.
* Supporting job recommendations.
* Managing notifications.
* Returning appropriate responses to the frontend.



**Frontend-Backend Communication**: The frontend communicates with the backend using HTTP requests.

Flow:

User Action

&#x20;   ↓

React Frontend

&#x20;   ↓

HTTP Request

&#x20;   ↓

FastAPI API

&#x20;   ↓

Backend Processing

&#x20;   ↓

PostgreSQL / AI Services

&#x20;   ↓

HTTP Response

&#x20;   ↓

React Frontend



**API Communication**: The backend exposes REST-style API endpoints.

Common HTTP methods include:

* GET
* POST
* PUT
* PATCH
* DELETE

These methods are used according to the operation being performed.



**Data Validation**: FastAPI and Pydantic are used to validate incoming request data.



**Database Communication:** The backend communicates with PostgreSQL to store and retrieve application data.

Flow:

FastAPI

&#x20;  ↓

Database Layer

&#x20;  ↓

PostgreSQL

The database stores persistent information such as:

Users

Candidate profiles

Companies

Jobs

Resumes

Applications

Swipe history

ATS reports

Recommendations

Notifications



**Backend Security**

Security-related functionality includes:

* Password hashing.
* Authentication.
* JWT-based authorization.
* Input validation.
* Protected API endpoints.
* Secure database credentials.

Sensitive configuration values should be stored using environment variables rather than being directly committed to source control.



**Backend Development Server**

The backend can be started using Uvicorn: uvicorn app.main:app --reload

The --reload option automatically reloads the development server when backend source files are modified.

