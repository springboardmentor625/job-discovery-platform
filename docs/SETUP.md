# Setup Guide

Complete instructions for setting up swipe x for development and deployment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9 or higher** - [Download](https://www.python.org/)
- **Node.js 16+ and npm** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **A code editor** - VS Code recommended - [Download](https://code.visualstudio.com/)

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Python Virtual Environment
```bash
# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the backend directory:
```
DATABASE_URL=sqlite:///./job_platform.db
DEBUG=True
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["http://localhost:3000"]
```

### 5. Initialize Database
```bash
# Run migrations (if applicable)
alembic upgrade head

# Or for simple setup
python -c "from app.models import Base; from app.database import engine; Base.metadata.create_all(bind=engine)"
```

### 6. Run Backend Server
```bash
# Development mode with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
# or if using yarn
yarn install
```

### 3. Environment Configuration
Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=swipe x
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
# or
yarn build
```

The build output will be in the `dist/` directory.

## Running Both Services

### Option 1: Separate Terminals
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Option 2: Using Concurrently (Optional)
Install concurrently in the root directory:
```bash
npm install -D concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload\" \"cd frontend && npm run dev\""
  }
}
```

## Database Setup

### SQLite (Default)
No additional setup required. The database will be created automatically in the backend directory.

### PostgreSQL (Optional)
1. Install PostgreSQL
2. Create a database:
   ```bash
   createdb job_platform
   ```
3. Update `.env` in backend:
   ```
   DATABASE_URL=postgresql://user:password@localhost/job_platform
   ```

## Testing

### Backend Tests
```bash
cd backend
pytest
# With coverage
pytest --cov=app tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use**
```bash
# Use a different port
python -m uvicorn app.main:app --reload --port 8001
```

**ModuleNotFoundError**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Database errors**
```bash
# Delete the database and restart (development only)
rm job_platform.db
python -m uvicorn app.main:app --reload
```

### Frontend Issues

**Port 3000 already in use**
```bash
# Use a different port
npm run dev -- --port 3001
```

**Node modules issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## IDE Setup

### VS Code
1. Install extensions:
   - Python
   - Pylance
   - FastAPI
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense (if using Tailwind)

2. Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "ms-python.python"
}
```

## Next Steps

- Read the [API Documentation](API.md) to understand the backend endpoints
- Check out the [Architecture Guide](ARCHITECTURE.md) to understand the system design
- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
