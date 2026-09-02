from django.db import transaction

from ..utils.resume_parser import parse_resume
from ..utils.ats import (
    calculate_ats,
    calculate_probability_report,
)
from ..utils.predict import predict_resume_score
from ..utils.groq_service import generate_resume_feedback


class ResumeService:
    """
    Handles resume parsing, ATS calculation,
    ML prediction and candidate updates.
    """

    @staticmethod
    @transaction.atomic
    def process_resume(resume, candidate):
        """
        Parse uploaded resume and update
        Resume + Candidate.
        """

        try:

            print("=================================")
            print("STARTING RESUME PARSING")
            print("FILE:", resume.resume_file.path)
            print("=================================")

            # -------------------------------
            # Parse Resume
            # -------------------------------

            result = parse_resume(
                resume.resume_file.path
            )

            print("PARSER RESULT:")
            print(result)

            # -------------------------------
            # ATS
            # -------------------------------

            ats = calculate_ats(result)

            # -------------------------------
            # ML Score
            # -------------------------------

            ml_score = predict_resume_score(
                result.get(
                    "text",
                    ""
                )
            )

            # -------------------------------
            # Resume Fields
            # -------------------------------

            resume.extracted_text = result.get(
                "text",
                ""
            )

            resume.extracted_experience = result.get(
                "experience",
                ""
            )

            resume.extracted_education = result.get(
                "education",
                ""
            )

            resume.extracted_skills = ", ".join(
                result.get(
                    "skills",
                    []
                )
            )

            resume.probability_score = ml_score

            resume.ats_score = ats.get(
                "score",
                0
            )

            # -------------------------------
            # Required Skills
            # -------------------------------

            required_skills = [
                "Python",
                "Django",
                "REST API",
                "PostgreSQL",
                "Docker",
                "Git",
            ]

            probability = (
                calculate_probability_report(
                    result,
                    required_skills,
                )
            )

            resume.missing_skills = ", ".join(
                probability.get(
                    "missing_skills",
                    []
                )
            )

            # -------------------------------
            # AI Feedback
            # -------------------------------

            ai_feedback = generate_resume_feedback(
                result,
                ats.get(
                    "score",
                    0
                ),
                probability.get(
                    "missing_skills",
                    []
                ),
            )

            resume.ats_suggestions = "\n".join(
                ai_feedback.get(
                    "improvements",
                    []
                )
            )

            resume.save()

            # -------------------------------
            # Candidate Skills
            # -------------------------------

            if result.get("skills"):

                candidate.skills = ", ".join(
                    result["skills"]
                )

            # -------------------------------
            # Candidate Phone
            # -------------------------------

            if result.get("phone"):

                candidate.phone = result["phone"]

            # -------------------------------
            # Candidate Experience
            # -------------------------------

            if result.get("experience"):

                candidate.experience = result[
                    "experience"
                ]
                            # -------------------------------
            # Save Candidate
            # -------------------------------

            candidate.save()

            print("=================================")
            print("RESUME PROCESSED SUCCESSFULLY")
            print("ATS SCORE:", resume.ats_score)
            print("ML SCORE:", resume.probability_score)
            print(
                "MATCH PROBABILITY:",
                probability.get("probability")
            )
            print(
                "MATCHED SKILLS:",
                probability.get("matched_skills")
            )
            print(
                "MISSING SKILLS:",
                probability.get("missing_skills")
            )
            print("=================================")

            return resume

        except Exception as e:

            print("=================================")
            print("RESUME PROCESSING FAILED")
            print(repr(e))
            print("=================================")

            raise

    @staticmethod
    def reset_resume(resume):
        """
        Reset ATS-related fields before
        processing a new resume.
        """

        resume.ats_score = 0
        resume.probability_score = 0

        resume.extracted_text = ""
        resume.extracted_experience = ""
        resume.extracted_education = ""
        resume.extracted_skills = ""

        resume.missing_skills = ""
        resume.ats_suggestions = ""

        resume.save()

        return resume