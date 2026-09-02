Docker Architecture

The Docker architecture of SwipeX separates the major application components into independent services.

The main services are:

* Frontend
* Backend
* PostgreSQL



**High-Level Architecture**

&#x20;                        SWIPEX

&#x20;                          |

&#x20;           +--------------+--------------+

&#x20;           |              |              |

&#x20;           v              v              v

&#x20;     Frontend         Backend       PostgreSQL

&#x20;     Container        Container       Container

&#x20;           |              |              |

&#x20;           |              |              |

&#x20;           |              +--------------+

&#x20;           |                     |

&#x20;           |                     v

&#x20;           |                Database Data

&#x20;           |

&#x20;           v

&#x20;       Candidate UI



**Frontend Container**: Responsibilities include:

* Rendering the user interface.
* Handling candidate interactions.
* Displaying job cards.
* Sending API requests.
* Receiving backend responses.
* Displaying resume and job-related information.

The frontend communicates with the backend through HTTP requests.



**Backend Container**: Responsibilities include:

* Processing API requests.
* User authentication.
* Candidate profile operations.
* Resume operations.
* Job operations.
* Application operations.
* Swipe operations.
* Recommendation operations.
* ATS-related processing.
* Communication with PostgreSQL.

The backend acts as the central server-side component.



**Docker Network:** Docker Compose creates a private network for the services.

The communication can be represented as:

Frontend

&#x20;   |

&#x20;   | HTTP

&#x20;   v

Backend

&#x20;   |

&#x20;   | PostgreSQL connection

&#x20;   v

PostgreSQL

Services can communicate using their Compose service names.



**Port Mapping:** Ports allow services inside Docker containers to be accessed from the host computer.

A development configuration may use:

Frontend → 5173

Backend  → 8000

PostgreSQL → 5432



**Docker Compose Architecture**: Docker Compose manages the services together. The conceptual configuration is:

docker-compose.yml

&#x20;       |

&#x20;       +----------------------+

&#x20;       |          |           |

&#x20;       v          v           v

&#x20;  frontend     backend     postgres

&#x20;  container    container    container

&#x20;       |          |           |

&#x20;       +----------+-----------+

&#x20;                  |

&#x20;            Docker Network



**Application Request Flow:** 

Candidate

&#x20;   |

&#x20;   v

React Frontend

&#x20;   |

&#x20;   | HTTP Request

&#x20;   v

FastAPI Backend

&#x20;   |

&#x20;   +--------------------+

&#x20;   |                    |

&#x20;   v                    v

Business Logic      PostgreSQL

&#x20;   |                    |

&#x20;   +---------+----------+

&#x20;             |

&#x20;             v

&#x20;       Backend Response

&#x20;             |

&#x20;             v

&#x20;      React Frontend

&#x20;             |

&#x20;             v

&#x20;      Updated UI



**Resume Processing Flow**: The Dockerized architecture can support the resume processing workflow:

Candidate

&#x20;   |

&#x20;   v

Frontend Container

&#x20;   |

&#x20;   v

Backend Container

&#x20;   |

&#x20;   v

Resume Processing

&#x20;   |

&#x20;   v

AI Resume Parser

&#x20;   |

&#x20;   v

Extracted Resume Data

&#x20;   |

&#x20;   v

PostgreSQL Container



**ATS Analysis Flow**: The ATS workflow can operate through the backend service:

Candidate

&#x20;   |

&#x20;   v

Frontend

&#x20;   |

&#x20;   v

Backend

&#x20;   |

&#x20;   +----------------------+

&#x20;   |                      |

&#x20;   v                      v

Resume Data          Job Description

&#x20;   |                      |

&#x20;   +----------+-----------+

&#x20;              |

&#x20;              v

&#x20;         ATS Processing

&#x20;              |

&#x20;              v

&#x20;         ATS Report

&#x20;              |

&#x20;              v

&#x20;         PostgreSQL



**AI Recommendation Flow**: 

Candidate Profile

&#x20;       |

Resume Data

&#x20;       |

Available Jobs

&#x20;       |

&#x20;       v

Backend / Recommendation Logic

&#x20;       |

&#x20;       v

Calculate Match Score

&#x20;       |

&#x20;       v

Rank Jobs

&#x20;       |

&#x20;       v

Frontend

&#x20;       |

&#x20;       v

Display Job Cards

&#x20;       |

&#x20;       v

Capture Swipe Feedback

&#x20;       |

&#x20;       v

Backend

&#x20;       |

&#x20;       v

Swipe History

Swipe feedback can be used as an input for future recommendation processing.



**Data Persistence:** PostgreSQL data should be stored using a Docker volume when persistent database storage is required. The architecture becomes:

PostgreSQL Container

&#x20;       |

&#x20;       v

Docker Volume

&#x20;       |

&#x20;       v

Persistent Database Storage

This allows database data to survive container recreation.



**Container Lifecycle**: The general lifecycle of a SwipeX container is:

Dockerfile

&#x20;   |

&#x20;   v

Build Image

&#x20;   |

&#x20;   v

Create Container

&#x20;   |

&#x20;   v

Start Container

&#x20;   |

&#x20;   v

Running Service

&#x20;   |

&#x20;   v

Stop Container

&#x20;   |

&#x20;   v

Remove / Recreate Container

The Docker image can be rebuilt whenever application dependencies or Docker configuration change.



**Benefits of the Architecture:** The containerized architecture provides:

* Modularity: Each major application component runs independently.
* Isolation: Dependencies of one service do not directly interfere with another service.
* Portability: The application can be moved to another Docker-supported environment.
* Scalability: Individual services can be scaled independently when required.
* Maintainability: Each service has its own configuration and runtime environment.



**Complete SwipeX Docker Architecture**

&#x20;                        USER

&#x20;                          |

&#x20;                          v

&#x20;                +------------------+

&#x20;                | Frontend         |

&#x20;                | React + Vite     |

&#x20;                | Container        |

&#x20;                +--------+---------+

&#x20;                         |

&#x20;                         | HTTP API

&#x20;                         v

&#x20;                +------------------+

&#x20;                | Backend          |

&#x20;                | FastAPI + Python |

&#x20;                | Container        |

&#x20;                +--------+---------+

&#x20;                         |

&#x20;                         | Database

&#x20;                         v

&#x20;                +------------------+

&#x20;                | PostgreSQL       |

&#x20;                | Container        |

&#x20;                +--------+---------+

&#x20;                         |

&#x20;                         v

&#x20;                +------------------+

&#x20;                | Docker Volume    |

&#x20;                | Persistent Data  |

&#x20;                +------------------+

