Docker Setup Guide

This document describes the basic steps required to run the SwipeX application using Docker.



The following software should be installed:

* Docker Desktop
* Git
* Visual Studio Code
* SwipeX source code

Docker Desktop should be running before Docker commands are executed.



**Verify Docker Installation**: Open a terminal and run: docker --version

A successful installation should display the installed Docker version.

Docker Compose can be checked using docker compose version



**Frontend Dockerfile**: The frontend Dockerfile defines how the React/Vite frontend is packaged into a Docker image.

The Dockerfile generally contains:

* Base image
* Working directory
* Dependency installation
* Frontend source code
* Build command
* Application startup command

The exact Dockerfile depends on the frontend deployment configuration.



**Backend Dockerfile**: The backend Dockerfile defines how the Python/FastAPI backend is packaged into a Docker image.

The Dockerfile generally contains:

* Python base image
* Working directory
* Dependency installation
* Backend source code
* Application startup command

The FastAPI application is started using Uvicorn. Example startup command: uvicorn app.main:app --host 0.0.0.0 --port 8000



**PostgreSQL Docker Service**: PostgreSQL can be configured as a separate service in Docker Compose. The database service should define configuration such as:

* Database name
* Database user
* Database password
* Database port

Actual credentials should be stored securely using environment variables.



**Docker Compose**: Docker Compose is used to define the services required by SwipeX. A typical configuration contains:

services:

* &#x20;   frontend
* &#x20;   backend
* &#x20;   postgres



Each service can define:

* Container name
* Build configuration
* Ports
* Environment variables
* Dependencies
* Volumes
* Networks



**Building the Docker Images**: Open a terminal in the SwipeX project root: cd SwipeX

Build the Docker images using: docker compose build

This reads the Docker Compose configuration and builds the required images.



**Starting SwipeX**: Start the services using: docker compose up

To run the containers in the background: docker compose up -d

The -d option runs the containers in detached mode.



**Checking Running Containers**

Use: docker ps

This displays currently running Docker containers. The SwipeX services should appear as running containers.



**Viewing Container Logs:** To view logs from all Compose services: docker compose logs

To follow logs continuously: docker compose logs -f

Logs can help identify:

* Application startup errors
* Database connection errors
* Missing dependencies
* Port conflicts
* Configuration problems



**Stopping SwipeX:** To stop the running services: docker compose down

This stops and removes the containers created by Docker Compose.



**Rebuilding After Changes:** If Docker configuration or application dependencies change, rebuild the images using: docker compose build

Then start the services again: docker compose up

A combined command can also be used: docker compose up --build



**Backend API Access:** When the backend port is exposed to the host machine, FastAPI can be accessed through the configured host port.

A common development configuration is: http://127.0.0.1:8000

Swagger UI is normally available at: http://127.0.0.1:8000/docs

The exact address depends on the port mapping in docker-compose.yml.



**Frontend Access:** The frontend is accessed through the port mapped by Docker Compose.

For example, if the frontend is mapped to port 5173: http://localhost:5173

The exact frontend URL depends on the Docker configuration.



**PostgreSQL Access:** PostgreSQL runs inside its Docker container. The backend communicates with PostgreSQL using the Docker Compose service name and configured database port. Inside the Docker network, the backend should connect to the PostgreSQL service rather than using localhost to refer to the database container.



**Environment Variables:** Environment variables can be used for configuration. Examples include:

* DATABASE\_URL
* SECRET\_KEY
* API\_KEYS
* DATABASE\_USER
* DATABASE\_PASSWORD
* DATABASE\_NAME



**Volumes:** Docker volumes can be used to preserve PostgreSQL data even when the database container is stopped or recreated.

PostgreSQL Container

&#x20;       |

&#x20;       v

Docker Volume

&#x20;       |

&#x20;       v

Persistent Database Data

This prevents database data from being tied only to the lifetime of a particular container.



**Docker Network:** Docker Compose creates a network that allows the SwipeX services to communicate. The general structure is:

Docker Network

&#x20;     |

&#x20;     +------ Frontend

&#x20;     |

&#x20;     +------ Backend

&#x20;     |

&#x20;     +------ PostgreSQL

The backend can communicate with PostgreSQL through the PostgreSQL service name defined in Docker Compose.



**Common Docker Problems:** 

* Docker Command Not Recognized

If the terminal displays:'docker' is not recognized as an internal or external command: check that:

* Docker Desktop is installed.
* Docker Desktop is running.
* Docker was added to the system PATH.
* The terminal was restarted after installation.

If Docker works in Windows Command Prompt but not in VS Code's terminal, restart VS Code after Docker installation or after changing the PATH.



* Docker Desktop Not Running: Start Docker Desktop and wait until Docker has finished starting. Then run: docker --version



* Port Already in Use: Change the host-side port mapping in the Docker Compose configuration.



* Backend Cannot Connect to PostgreSQL: 

Check:

* PostgreSQL container is running.
* Database credentials are correct.
* The database service name is correct.
* The backend uses the PostgreSQL container's service name instead of localhost.
* The required database has been initialized.



**Docker Setup Summary**

Install Docker Desktop

&#x20;       ↓

Start Docker Desktop

&#x20;       ↓

Open SwipeX Project

&#x20;       ↓

Verify Docker

&#x20;       ↓

Configure Dockerfiles

&#x20;       ↓

Configure docker-compose.yml

&#x20;       ↓

Configure Environment Variables

&#x20;       ↓

Build Images

&#x20;       ↓

Start Containers

&#x20;       ↓

Verify Frontend

&#x20;       ↓

Verify Backend

&#x20;       ↓

Verify PostgreSQL

