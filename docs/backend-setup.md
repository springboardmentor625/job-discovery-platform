**Prerequisites**

The following software is required:

\- Python

\- pip

\- PostgreSQL

\- Visual Studio Code or another code editor

\- Git

\- Internet connection for installing Python packages



**Navigate to the Backend Directory:** Open a terminal and navigate to the SwipeX backend directory.

Example: cd SwipeX/backend



**Create a Virtual Environment**: Python virtual environment is used to isolate project dependencies.

Create the virtual environment using: python -m venv venv



**Activate the Virtual Environment:**

On Windows: venv\\Scripts\\activate

After activation, the terminal should display: (venv)



**Install Required Packages:**

If requirements.txt is available:

pip install -r requirements.txt

Individual packages can also be installed when required.



**Configure PostgreSQL:**

Make sure PostgreSQL is installed and running.

The backend requires database configuration such as:

Database Host

Database Port

Database Name

Database Username

Database Password

The configuration should match the PostgreSQL database used by SwipeX.



**Configure Environment Variables**: Environment variables can be stored in a .env file.

Example:

DATABASE\_URL=your\_database\_connection\_string

SECRET\_KEY=your\_secret\_key



**Verify the Database**

Before starting the backend, verify that:

PostgreSQL is running.

The SwipeX database exists.

Required tables have been created.

Database credentials are correct.



**Start the FastAPI Server**

From the backend directory, run: uvicorn app.main:app --reload

If the application starts successfully, the terminal should display a message indicating that the server is running.

The default development address is: http://127.0.0.1:8000



**Open Swagger UI:**

FastAPI provides automatic interactive API documentation.

Open: http://127.0.0.1:8000/docs



**Swagger UI can be used to:**

View available endpoints.

View request parameters.

View request bodies.

Send API requests.

View API responses.

Test backend functionality.



**Running the Backend During Development:**

Stopping the Server: To stop the FastAPI development server: CTRL + C

The backend should be run in a virtual environment during development.

Sensitive configuration such as passwords, secret keys, and database credentials should not be committed to the project repository.



