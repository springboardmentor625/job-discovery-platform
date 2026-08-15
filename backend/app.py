from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)

load_dotenv()

app = Flask(__name__)

# JWT configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

jwt = JWTManager(app)


CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "http://localhost:5173"
        }
    }
)


app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)




class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), default="CANDIDATE")
    phone = db.Column(db.String(20))
    profile_picture = db.Column(db.Text)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())




class CandidateProfile(db.Model):
    __tablename__ = "candidate_profiles"

    profile_id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        unique=True,
        nullable=False
    )

    headline = db.Column(db.String(255))
    summary = db.Column(db.Text)
    location = db.Column(db.String(255))
    experience_years = db.Column(db.Integer)
    education = db.Column(db.Text)
    projects = db.Column(db.Text)
    certifications = db.Column(db.Text)
    preferred_job_type = db.Column(db.String(100))
    preferred_location = db.Column(db.String(255))




@app.route("/")
def home():
    return "SwipeX Backend is running!"




@app.route("/test-db")
def test_db():
    try:
        db.session.execute(db.text("SELECT 1"))
        return "PostgreSQL connection successful!"
    except Exception as e:
        return f"Database connection failed: {e}"




@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    if not full_name or not email or not password:
        return jsonify({
            "message": "Full name, email and password are required"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "message": "Email already registered"
        }), 409

    password_hash = generate_password_hash(password)

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "Registration successful",
        "user_id": new_user.user_id
    }), 201




@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # Create JWT
    access_token = create_access_token(
        identity=str(user.user_id)
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email
    }), 200




@app.route("/api/profile", methods=["POST"])
@jwt_required()
def create_profile():
    # Get user ID from JWT
    user_id = get_jwt_identity()

    data = request.get_json()

    headline = data.get("headline")
    summary = data.get("summary")
    location = data.get("location")
    experience_years = data.get("experience_years")
    education = data.get("education")
    projects = data.get("projects")
    certifications = data.get("certifications")
    preferred_job_type = data.get("preferred_job_type")
    preferred_location = data.get("preferred_location")

    # Check if profile already exists
    existing_profile = CandidateProfile.query.filter_by(
        user_id=user_id
    ).first()

    if existing_profile:
        return jsonify({
            "message": "Candidate profile already exists"
        }), 409

    # Create profile
    profile = CandidateProfile(
        user_id=user_id,
        headline=headline,
        summary=summary,
        location=location,
        experience_years=experience_years,
        education=education,
        projects=projects,
        certifications=certifications,
        preferred_job_type=preferred_job_type,
        preferred_location=preferred_location
    )

    db.session.add(profile)
    db.session.commit()

    return jsonify({
        "message": "Candidate profile created successfully",
        "profile_id": profile.profile_id,
        "user_id": user_id
    }), 201




with app.app_context():
    db.create_all()




if __name__ == "__main__":
    app.run(debug=True)