# swipe x

A modern web application for discovering and managing job opportunities. This platform provides a seamless experience for job seekers to find relevant positions and track their applications.

## � Documentation

All detailed documentation is available in the `/docs` folder:

- **[Setup Guide](docs/SETUP.md)** - Installation, configuration, and running the application
- **[API Documentation](docs/API.md)** - Complete API reference and endpoint documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System design, components, and technology stack
- **[Contributing](docs/CONTRIBUTING.md)** - Contribution guidelines and development workflow

## 🚀 Quick Start

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit: Frontend `http://localhost:3000` | Backend API `http://localhost:8000`

## 📝 Features

- Job listing and discovery
- Advanced search and filtering
- Job application tracking
- User profiles and preferences
- Saved jobs functionality

## 📄 License

MIT License - See [LICENSE](LICENSE) for details