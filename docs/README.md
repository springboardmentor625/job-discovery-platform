\# SWIPEX – Job Discovery Platform



\## Project Overview



SWIPEX is a full-stack job discovery platform designed to help users discover career opportunities through a simple and user-friendly web application.



The project is being developed using a React frontend and Django REST API backend.



\---



\## Technology Stack



\### Frontend

\- React

\- Vite

\- JavaScript

\- HTML5

\- CSS3

\- Axios



\### Backend

\- Python

\- Django

\- Django REST Framework



\### Database

\- SQLite (current development setup)



\### Tools

\- VS Code

\- Git \& GitHub

\- npm

\- Python Virtual Environment



\---



\## Project Structure



```text

job-discovery-platform/

│

├── frontend/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   ├── Login.jsx

│   │   ├── Dashboard.jsx

│   │   ├── Dashboard.css

│   │   └── VerifyEmail.jsx

│   └── package.json

│

├── backend/

│   ├── config/

│   ├── users/

│   └── manage.py

│

└── docs/

&#x20;   └── README.md





Work Completed So Far

1\. Frontend Setup

Created React + Vite frontend.

Designed the initial SWIPEX user interface.

Added responsive authentication pages.

Improved the overall UI with modern layouts, rounded cards, gradients, icons, buttons and form styling.

2\. User Registration



Implemented a complete registration form with:



Full Name

Mobile Number

Email

Password

Form validation

Loading state

Success and error messages



The frontend communicates with the backend through:



POST /api/register/

3\. User Login



Implemented the login functionality using:



POST /api/login/



The login page includes:



Email and password fields

Form validation

Loading state

Error handling

Successful login handling

Navigation to the Dashboard

4\. Email Verification



Implemented an email verification step after registration.



Current flow:



Register

&#x20;  ↓

Email Verification

&#x20;  ↓

Login

&#x20;  ↓

Dashboard



The backend includes OTP and email verification fields required for this workflow.



5\. Dashboard



Implemented a basic user Dashboard.



After successful login:



User information is passed to the Dashboard.

The Dashboard is displayed.

Logout functionality is available.

Logout returns the user to the authentication flow.

6\. Django Backend



Created the Django backend with:



Django project configuration

users application

Custom User model

Serializers

API views

API URL configuration

Django migrations

Authentication-related functionality

7\. Frontend–Backend Integration



Connected the React frontend with the Django backend using Axios.



Current development servers:



Frontend: http://localhost:5173/

Backend:  http://127.0.0.1:8000/



Authentication APIs:



POST /api/register/

POST /api/login/

8\. Database \& Migrations



Implemented the initial database structure using Django migrations.



Current migrations include changes related to:



User model

Email verification

OTP

Phone number



Migration files are maintained in the repository so the database structure can be recreated consistently.



9\. GitHub \& Version Control



The project is maintained using Git and GitHub.



Current development branch:



bhanu-teja-rajana



The completed frontend and backend work has been committed and pushed to the GitHub repository.



Current Status

Completed

&#x20;React + Vite frontend

&#x20;Django backend

&#x20;Custom user model

&#x20;Registration

&#x20;Login

&#x20;Email verification workflow

&#x20;Dashboard

&#x20;Logout

&#x20;Axios API integration

&#x20;Database migrations

&#x20;Authentication UI design

&#x20;Error and loading handling

&#x20;GitHub integration

