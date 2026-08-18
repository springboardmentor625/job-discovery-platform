# Contributing Guidelines

Thank you for considering contributing to swipe x! This document provides guidelines for contributing to the project.

## Code of Conduct

Please be respectful, inclusive, and professional in all interactions with other contributors and community members.

## How to Contribute

### Reporting Bugs

Before creating bug reports, check the issue list to see if the problem has already been reported. If not:

1. **Use a clear descriptive title**
2. **Describe the exact steps to reproduce**
3. **Provide specific examples**
4. **Describe the behavior you observed**
5. **Explain which behavior you expected**
6. **Include screenshots or error messages**
7. **Include your environment** (OS, Python version, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

1. **Use a clear descriptive title**
2. **Describe the current behavior**
3. **Describe the suggested enhancement**
4. **Explain why this enhancement would be useful**
5. **List any related applications**

### Pull Requests

1. **Fork the repository** and create a branch from `main`
2. **Follow the development setup** in [SETUP.md](SETUP.md)
3. **Make your changes** with clear commit messages
4. **Write or update tests** as needed
5. **Ensure code quality** and style compliance
6. **Submit your pull request** with a clear description

## Development Setup

See [SETUP.md](SETUP.md) for complete setup instructions.

### Quick Start
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## Coding Standards

### Backend (Python)

#### PEP 8 Compliance
- Use 4 spaces for indentation
- Max line length: 100 characters
- Use meaningful variable names
- Follow naming conventions: `snake_case` for functions/variables, `PascalCase` for classes

#### Code Style Tools
```bash
# Install tools
pip install flake8 black isort

# Format code
black app/
isort app/

# Check style
flake8 app/
```

#### Example Backend Code Structure
```python
"""Module docstring describing the module."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import Job
from app.schemas import JobResponse, JobCreate

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
) -> List[JobResponse]:
    """Get list of jobs with pagination.
    
    Args:
        skip: Number of records to skip
        limit: Number of records to return
        db: Database session
        
    Returns:
        List of job responses
    """
    jobs = db.query(Job).offset(skip).limit(limit).all()
    return jobs
```

### Frontend (JavaScript/TypeScript)

#### Code Style
- Use 2 spaces for indentation
- Use meaningful variable names
- Follow camelCase for variables/functions
- Use PascalCase for components
- Use arrow functions

#### Linting & Formatting
```bash
# Install ESLint and Prettier
npm install --save-dev eslint prettier eslint-config-prettier

# Format code
npx prettier --write src/

# Check style
npx eslint src/
```

#### Example Frontend Component
```jsx
/**
 * JobCard Component
 * Displays a single job listing
 */
import React from 'react';
import PropTypes from 'prop-types';

const JobCard = ({ job, onApply }) => {
  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p className="company">{job.company}</p>
      <p className="location">{job.location}</p>
      <p className="description">{job.description}</p>
      <div className="meta">
        <span className="salary">${job.salary.toLocaleString()}</span>
        <button onClick={() => onApply(job.id)}>Apply Now</button>
      </div>
    </div>
  );
};

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.number.required,
    title: PropTypes.string.required,
    company: PropTypes.string.required,
    location: PropTypes.string,
    description: PropTypes.string,
    salary: PropTypes.number
  }).isRequired,
  onApply: PropTypes.func.isRequired
};

export default JobCard;
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_jobs.py

# Run with coverage
pytest --cov=app tests/

# Run with verbose output
pytest -v
```

#### Test File Structure
```python
"""Tests for job routes."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import Job

client = TestClient(app)

class TestJobEndpoints:
    """Test suite for job endpoints."""
    
    def test_list_jobs(self):
        """Test listing jobs."""
        response = client.get("/api/v1/jobs")
        assert response.status_code == 200
        assert "data" in response.json()
    
    def test_get_job_detail(self):
        """Test getting a specific job."""
        response = client.get("/api/v1/jobs/1")
        assert response.status_code == 200
        
    def test_get_nonexistent_job(self):
        """Test getting a non-existent job."""
        response = client.get("/api/v1/jobs/9999")
        assert response.status_code == 404
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run specific test file
npm test JobCard.test.js

# Run with coverage
npm test -- --coverage
```

#### Test File Structure
```jsx
/**
 * Tests for JobCard component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import JobCard from './JobCard';

describe('JobCard Component', () => {
  const mockJob = {
    id: 1,
    title: 'Senior Developer',
    company: 'Tech Corp',
    location: 'San Francisco',
    description: 'Great job opportunity',
    salary: 150000
  };
  
  const mockOnApply = jest.fn();
  
  test('renders job information', () => {
    render(<JobCard job={mockJob} onApply={mockOnApply} />);
    
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });
  
  test('calls onApply when button is clicked', () => {
    render(<JobCard job={mockJob} onApply={mockOnApply} />);
    
    fireEvent.click(screen.getByText('Apply Now'));
    expect(mockOnApply).toHaveBeenCalledWith(1);
  });
});
```

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
Use clear, descriptive commit messages:

```
feat: add job search functionality
fix: resolve pagination bug in job listings
refactor: simplify job filtering logic
docs: update API documentation
test: add tests for user authentication
```

### Commit Template
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, refactor, docs, test, style, chore
**Scope**: Component or module affected
**Subject**: Brief description (imperative mood, 50 chars)
**Body**: Detailed explanation (optional)
**Footer**: Issue references, breaking changes (optional)

### Pull Request Process

1. **Update your branch** with the latest changes from main
   ```bash
   git pull origin main
   ```

2. **Test your changes**
   ```bash
   # Backend
   cd backend && pytest
   
   # Frontend
   cd frontend && npm test
   ```

3. **Create a descriptive PR title and description**
   ```
   Title: Add job search with filters
   
   Description:
   - Implements full-text search on job titles and descriptions
   - Adds location and salary range filters
   - Includes comprehensive tests
   
   Fixes #123
   ```

4. **Ensure CI/CD checks pass**

5. **Request review** from maintainers

6. **Address review feedback** with new commits

## Documentation

- Update [README.md](../README.md) for significant changes
- Update relevant doc files in [docs/](../) folder
- Add docstrings to all functions and classes
- Include code examples for complex features

### Documentation Template

```python
def search_jobs(query: str, location: str = None) -> List[Job]:
    """Search for jobs by query and optional location.
    
    This function performs a full-text search on job titles and descriptions,
    and optionally filters by location.
    
    Args:
        query (str): Search term for job title/description
        location (str, optional): Filter by location. Defaults to None.
        
    Returns:
        List[Job]: List of matching jobs
        
    Raises:
        ValueError: If query is empty or invalid
        
    Examples:
        >>> jobs = search_jobs("Python developer", "San Francisco")
        >>> print(len(jobs))
        5
    """
```

## Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Need assistance
- `question` - Further information needed
- `wontfix` - Not planned to be fixed

## Review Process

### For Maintainers
- Review code quality and style
- Verify tests are included and passing
- Check documentation is updated
- Request changes if necessary
- Approve and merge when ready

### For Contributors
- Respond to feedback promptly
- Make requested changes
- Test thoroughly before pushing
- Push changes to the same branch

## Performance Considerations

### Backend
- Avoid N+1 queries (use joins, eager loading)
- Use database indexes for common queries
- Implement pagination for list endpoints
- Cache expensive operations

### Frontend
- Use React.memo for component optimization
- Implement lazy loading for routes
- Optimize image sizes
- Use production builds for performance testing

## Security Considerations

- Never commit secrets or credentials
- Use environment variables for configuration
- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Sanitize output for XSS prevention
- Keep dependencies up to date

## Development Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Vite Documentation](https://vitejs.dev/)

## Getting Help

- Check existing issues and discussions
- Read through documentation files
- Ask questions in issue discussions
- Contact maintainers for guidance

## Recognition

Contributors will be recognized in:
- Project README
- GitHub contributors page
- Release notes (for significant contributions)

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to make the Job Discovery Platform better! 🚀
