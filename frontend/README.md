# Frontend - swipe x

React/Vite frontend application for swipe x.

## Overview

The frontend is a modern React application built with Vite that provides:
- Job search and discovery interface
- User authentication
- Job application management
- Saved jobs functionality
- User profile management

## Quick Start

See the main [SETUP.md](../docs/SETUP.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000` (or `http://localhost:5173` depending on Vite config)

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                 # Main App component
│   ├── App.css                 # Global styles
│   ├── main.jsx                # Entry point
│   ├── components/
│   │   ├── JobCard.jsx
│   │   ├── JobList.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Navbar.jsx
│   │   ├── UserProfile.jsx
│   │   └── ...
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── JobDetailsPage.jsx
│   │   ├── ApplicationsPage.jsx
│   │   ├── SavedJobsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── ...
│   ├── services/
│   │   ├── api.js              # API client configuration
│   │   ├── jobService.js       # Job API calls
│   │   ├── userService.js      # User API calls
│   │   ├── authService.js      # Auth API calls
│   │   └── applicationService.js
│   ├── hooks/
│   │   ├── useJobs.js
│   │   ├── useAuth.js
│   │   ├── useApplications.js
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.jsx     # Auth state management
│   │   └── JobContext.jsx      # Job state management
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── constants.js
│   └── styles/
│       ├── index.css
│       └── variables.css
├── public/
│   └── index.html
├── tests/
│   ├── __tests__/
│   │   ├── JobCard.test.jsx
│   │   ├── SearchBar.test.jsx
│   │   └── ...
│   └── setup.js
├── .env                        # Environment variables
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## Key Features

### 1. Job Discovery
- Browse all available jobs
- Search jobs by title and description
- Filter by location, salary, job type
- Sort by date posted or salary
- Pagination for large result sets

### 2. User Authentication
- User registration
- Login/logout
- Session management
- Protected routes

### 3. Job Applications
- Apply for jobs
- Upload resume and cover letter
- Track application status
- View application history

### 4. Saved Jobs
- Save favorite jobs for later
- Manage saved jobs list
- Quick apply from saved jobs

### 5. User Profile
- View/edit profile information
- Manage skills and experience
- Update preferences
- Change password

## Technology Stack

### Core
- **React 18+** - UI library
- **Vite** - Build tool and dev server
- **JavaScript/TypeScript** - Programming language

### Styling
- **CSS3** - Modern CSS features
- **Tailwind CSS** (optional) - Utility-first CSS
- **Styled Components** (optional) - CSS-in-JS

### HTTP & State
- **Axios** - HTTP client
- **React Query** (optional) - Server state management
- **Zustand** or **Redux** (optional) - Global state management

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** or **Yup** - Schema validation

### Testing
- **Vitest** or **Jest** - Test framework
- **React Testing Library** - Component testing
- **Cypress** (optional) - E2E testing

## Dependencies

Main dependencies (see package.json for full list):
- react
- react-dom
- vite
- axios
- (and others based on your setup)

## Environment Variables

Create a `.env` file in the frontend directory:

```
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_PREFIX=/api/v1

# App Configuration
VITE_APP_NAME=swipe x
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

## Available Scripts

### Development
```bash
# Start development server with hot reload
npm run dev

# Serve production build locally
npm run preview
```

### Building
```bash
# Build for production
npm run build

# Build with source maps for debugging
npm run build:debug
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test JobCard.test.jsx

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

## Component Hierarchy

```
App/
├── Navbar
├── Routes/
│   ├── HomePage/
│   │   ├── SearchBar
│   │   └── JobList/
│   │       └── JobCard (multiple)
│   ├── JobDetailsPage/
│   │   ├── JobDetail
│   │   └── ApplyForm
│   ├── LoginPage/
│   │   └── LoginForm
│   ├── RegisterPage/
│   │   └── RegisterForm
│   ├── ApplicationsPage/
│   │   └── ApplicationList
│   ├── SavedJobsPage/
│   │   └── SavedJobList
│   └── ProfilePage/
│       └── ProfileForm
└── Footer
```

## API Integration

### API Client Setup
```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Example Service
```javascript
// services/jobService.js
import apiClient from './api';

export const jobService = {
  // Get all jobs
  getAllJobs: async (params = {}) => {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },

  // Get job by ID
  getJobById: async (jobId) => {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Search jobs
  searchJobs: async (query, filters) => {
    const response = await apiClient.get('/jobs', {
      params: {
        search: query,
        ...filters,
      },
    });
    return response.data;
  },
};
```

## State Management

### Context API Example
```javascript
// context/AuthContext.jsx
import React, { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      // API call
      const response = await loginAPI(email, password);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Using the Context
```javascript
// components/UserProfile.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const UserProfile = () => {
  const { user } = useContext(AuthContext);

  return <div>{user?.name}</div>;
};
```

## Routing

### Example React Router Setup
```javascript
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import JobDetailsPage from './pages/JobDetailsPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Testing

### Component Test Example
```javascript
// components/__tests__/JobCard.test.jsx
import { render, screen } from '@testing-library/react';
import JobCard from '../JobCard';

describe('JobCard', () => {
  const mockJob = {
    id: 1,
    title: 'Developer',
    company: 'TechCorp',
    location: 'San Francisco',
  };

  test('renders job information', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });
});
```

## Performance Optimization

1. **Code Splitting**: Lazy load route components
   ```javascript
   const JobDetailsPage = lazy(() => import('./pages/JobDetailsPage'));
   ```

2. **Memoization**: Prevent unnecessary re-renders
   ```javascript
   const JobCard = memo(({ job }) => (...));
   ```

3. **Image Optimization**: Use optimized images and lazy loading

4. **Bundle Analysis**: Analyze bundle size
   ```bash
   npm run build:analyze
   ```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag dist/ folder to Netlify
```

See [SETUP.md](../docs/SETUP.md) for more deployment options.

## Troubleshooting

### Port Already in Use
```bash
npm run dev -- --port 3001
```

### CORS Errors
- Ensure backend is running
- Check API URL in `.env`
- Verify backend CORS configuration

### API Calls Failing
- Check browser DevTools Network tab
- Verify token is being sent
- Check backend logs for errors

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

See [CONTRIBUTING.md](../docs/CONTRIBUTING.md) for contribution guidelines.

## Architecture

For detailed system architecture, see [ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## License

MIT License - See [LICENSE](../LICENSE)
