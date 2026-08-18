# SwipeX Backend

## Project Overview

The SwipeX backend provides the server-side APIs required for the SwipeX job discovery platform. It handles candidate accounts, authentication, profiles, and database communication.

## Technology Stack

The backend is developed using the following technologies:

* **Python** – Backend programming language
* **Flask** – Web framework for building REST APIs
* **PostgreSQL** – Relational database
* **Flask-SQLAlchemy** – Database integration and ORM
* **Flask-CORS** – Cross-Origin Resource Sharing support
* **Flask-JWT-Extended** – JWT-based authentication

## Implemented Features

The current backend supports:

* New candidate registration
* Candidate login
* Secure password hashing
* JWT-based user authentication
* Authentication-protected candidate profile access
* PostgreSQL database connectivity

## API Routes

| HTTP Method | API Endpoint    | Description                                 |
| ----------- | --------------- | ------------------------------------------- |
| POST        | `/api/register` | Creates a new candidate account             |
| POST        | `/api/login`    | Authenticates a candidate and returns a JWT |
| POST        | `/api/profile`  | Creates a candidate profile                 |

## Database Structure

The current PostgreSQL database contains the following tables:

* `users` – Stores candidate account information
* `candidate_profiles` – Stores candidate profile details

## Running the Backend Locally

Follow these commands to start the backend:

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

After starting the application, the backend will be available at:

`http://127.0.0.1:5000`

## Environment Configuration

Before running the application, create a local `.env` file and provide the required configuration values, including:

* Database URL
* JWT secret key

Keep the `.env` file local and do not commit sensitive credentials to the repository.
