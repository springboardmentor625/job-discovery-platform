The project can be run in two ways:

1\. Local Development Setup

2\. Docker Setup



**Before running SwipeX, install the following software:**

* Python
* Node.js and npm
* PostgreSQL
* Git
* Visual Studio Code
* Docker Desktop (optional, for Docker execution)



**Verify the installations using:**

* python --version
* node --version
* npm --version
* psql --version
* git --version
* docker --version and docker compose version



**Database Setup**: Make sure the PostgreSQL server is running before starting the backend. The database configuration used by the backend should match the PostgreSQL database, username, password and port configured during project setup. The default PostgreSQL port is: 5432. The backend must be able to connect to PostgreSQL before API operations are performed.



**Local Development Setup**



**Step 1** - Open the SwipeX Project

**Step 2** - Start PostgreSQL

Start the PostgreSQL database service. Make sure PostgreSQL is running before starting the backend.

**Step 3** - Start the Backend

\-Activate the Virtual Environment

If the virtual environment already exists:venv\\Scripts\\activate

After activation, the terminal should show: (venv) at the beginning of the command prompt.

Install Backend Dependencies: If dependencies have not already been installed, run: pip install -r requirements.txt

Start FastAPI: uvicorn app.main:app --reload



**Step 4** - Verify the Backend

Open a browser and visit: http://127.0.0.1:8000

Next, open Swagger UI: http://127.0.0.1:8000/docs



**Step 5** - Start the Frontend

Open a second terminal. Navigate to the frontend folder

Install Frontend Dependencies: If dependencies have not already been installed, run: npm install

This installs the packages listed in: package.json

Start the React Development Server: npm run dev

The frontend is normally available at: http://localhost:5173



**Step 6** - Test the Application

**Test 1** - Backend

Open: http://127.0.0.1:8000

Confirm that the backend is running.



**Test 2** - Swagger

Open: http://127.0.0.1:8000/docs

Confirm that the API endpoints are visible.



**Test 3** - Frontend

Open: http://localhost:5173

Confirm that the SwipeX frontend loads correctly.



**Docker Setup:** SwipeX can also be run using Docker and Docker Compose.

Docker Compose

&#x20;     │

&#x20;     ├── Frontend Container

&#x20;     │

&#x20;     ├── Backend Container

&#x20;     │

&#x20;     └── PostgreSQL Container



Docker allows the application components and their dependencies to run in containers. 

Start SwipeX Using Docker Compose

Open a terminal in the root SwipeX directory:

Then run: docker compose up --build



**Docker Services:** The Docker Compose setup contains the application services required by SwipeX.

* frontend
* backend
* postgres

The backend container installs its Python dependencies from: backend/requirements.txt

The frontend container builds the React/Vite application and serves the generated frontend application.



**Running Docker in the Background**

To start the application in detached mode: docker compose up --build -d

The terminal can then be used for other commands.



**Check Running Containers**

Run: docker compose ps

This displays the status of the SwipeX containers.

You can also use: docker ps

to view running Docker containers.



**View Docker Logs**

* To view logs for all services: docker compose logs
* To follow the logs: docker compose logs -f
* To view backend logs: docker compose logs backend
* To view frontend logs: docker compose logs frontend



**Stop the Docker Application:** docker compose down

This stops and removes the containers created by Docker Compose.



**Rebuild the Docker Application**

If project files or Docker configuration have changed, rebuild the application:: docker compose down

Then: docker compose up --build

