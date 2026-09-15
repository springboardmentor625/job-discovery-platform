The SwipeX frontend is a React.js-based web application that provides the user interface for the candidate-side job discovery and career assistance platform.

Technology Stack
- React.js
- JavaScript / JSX
- HTML5
- CSS3
- Vite
- HTTP APIs

Main Features
- Candidate registration and login
- Candidate profile creation and management
- Resume upload
- Resume and ATS analysis display
- Personalized job recommendations
- Swipe-based job cards
- Save / Skip / Apply interactions
- Saved jobs
- Application information
- Candidate dashboard
- Form validation and user interaction

Frontend-Backend Communication: The frontend communicates with the FastAPI backend through REST APIs.
React.js -> HTTP -> FastAPI Backend -> PostgreSQL / AI / ML Services -> API Response -> React.js UI

Running the Frontend
Install dependencies: npm install
Start the development server: npm run dev
The frontend runs by default at: http://localhost:5173
The frontend is responsible for the user interface and communicates with the backend for authentication, profile, resume, job, recommendation, swipe and application operations.
