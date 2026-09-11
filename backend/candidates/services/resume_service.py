import os
import re
import tempfile

from django.db import transaction

from ..utils.resume_parser import parse_resume
from ..utils.ats import calculate_ats
from ..utils.predict import predict_resume_score
from ..utils.groq_service import generate_resume_feedback


class ResumeValidationError(Exception):
    """
    Raised when an uploaded document is invalid
    or does not belong to the current candidate.
    """
    pass


class ResumeService:
    """
    Handles resume validation, parsing, ATS calculation,
    ML prediction and candidate updates.
    """

    # ==================================================
    # NORMALIZE PHONE
    # ==================================================

    @staticmethod
    def normalize_phone(phone):
        if not phone:
            return ""

        digits = re.sub(r"\D", "", str(phone))

        if digits.startswith("91") and len(digits) == 12:
            return digits[-10:]

        if digits.startswith("0") and len(digits) == 11:
            return digits[-10:]

        if len(digits) == 10:
            return digits

        return digits[-10:] if len(digits) >= 10 else digits

    # ==================================================
    # NORMALIZE NAME
    # ==================================================

    @staticmethod
    def normalize_name(name):
        if not name:
            return ""

        name = str(name).casefold()

        name = re.sub(
            r"[^a-z0-9]+",
            " ",
            name,
        )

        return " ".join(name.split())

    @staticmethod
    def names_match(name1, name2):
        """
        Compare names while ignoring:
        - case
        - punctuation
        - extra spaces
        - word order

        Example:
        Tejasri Lakkimsetti
        Lakkimsetti Tejasri

        -> Match
        """

        normalized1 = ResumeService.normalize_name(name1)
        normalized2 = ResumeService.normalize_name(name2)

        if not normalized1 or not normalized2:
            return False

        # Exact normalized match
        if normalized1 == normalized2:
            return True

        # Compare individual name words without considering order.
        words1 = sorted(normalized1.split())
        words2 = sorted(normalized2.split())

        return words1 == words2

    # ==================================================
    # RESUME CONTENT VALIDATION
    # ==================================================

    @staticmethod
    def validate_resume_content(result):
        text = (result.get("text") or "").strip()

        if not text:
            raise ResumeValidationError(
                "The uploaded file does not contain readable text. "
                "Please upload a text-based PDF or DOCX resume."
            )

        normalized_text = " ".join(
            text.lower().split()
        )

        word_count = len(
            normalized_text.split()
        )

        if word_count < 30:
            raise ResumeValidationError(
                "The uploaded document is too short to be a resume."
            )

        resume_sections = [
            "education",
            "experience",
            "skills",
            "projects",
            "certifications",
            "professional experience",
            "work experience",
            "technical skills",
            "qualification",
            "objective",
            "summary",
            "achievements",
        ]

        section_matches = sum(
            1
            for section in resume_sections
            if section in normalized_text
        )

        if section_matches < 2:
            raise ResumeValidationError(
                "The uploaded document does not appear to be a resume. "
                "Please upload a proper resume containing sections such as "
                "education, skills, experience or projects."
            )

        return True

    # ==================================================
    # NAME + PHONE MATCH
    # ==================================================

    @staticmethod
    def validate_candidate_identity(result, candidate):
        profile_name = ResumeService.normalize_name(
            candidate.full_name
        )

        profile_phone = ResumeService.normalize_phone(
            candidate.phone
        )

        resume_name = ResumeService.normalize_name(
            result.get("name")
        )

        resume_phone = ResumeService.normalize_phone(
            result.get("phone")
        )

        # ----------------------------------------------
        # Profile must already contain both fields
        # ----------------------------------------------

        if not profile_name:
            raise ResumeValidationError(
                "Please complete your full name in your profile before uploading a resume."
            )

        if not profile_phone:
            raise ResumeValidationError(
                "Please add a valid phone number to your profile before uploading a resume."
            )

        # ----------------------------------------------
        # Resume must contain both fields
        # ----------------------------------------------

        if not resume_name:
            raise ResumeValidationError(
                "We could not detect your name in the resume. "
                "Please upload a resume containing your name."
            )

        if not resume_phone:
            raise ResumeValidationError(
                "We could not detect a phone number in the resume. "
                "Please upload a resume containing your phone number."
            )

        # ----------------------------------------------
        # NAME MATCH
        # ----------------------------------------------

        if not ResumeService.names_match(
    profile_name,
    resume_name,
):
            raise ResumeValidationError(
        "Resume rejected: the name on the resume does not match your profile name."
    )

        # ----------------------------------------------
        # PHONE MATCH
        # ----------------------------------------------

        if resume_phone != profile_phone:
            raise ResumeValidationError(
                "Resume rejected: the phone number on the resume does not match your profile phone number."
            )

        return True

    # ==================================================
    # VALIDATE UPLOADED FILE BEFORE SAVING IT
    # ==================================================

    @staticmethod
    def validate_uploaded_file(uploaded_file, candidate):
        """
        Validate and parse an uploaded file BEFORE replacing
        the candidate's existing resume.

        This protects the old valid resume when a replacement
        is rejected.
        """

        extension = os.path.splitext(
            uploaded_file.name or ""
        )[1].lower()

        fd, temp_path = tempfile.mkstemp(
            suffix=extension
        )

        os.close(fd)

        try:
            uploaded_file.seek(0)

            with open(
                temp_path,
                "wb"
            ) as temp_file:

                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)

            uploaded_file.seek(0)

            result = parse_resume(
                temp_path
            )

            ResumeService.validate_resume_content(
                result
            )

            ResumeService.validate_candidate_identity(
                result,
                candidate,
            )

            return result

        finally:
            try:
                os.remove(temp_path)
            except FileNotFoundError:
                pass

            try:
                uploaded_file.seek(0)
            except Exception:
                pass

    # ==================================================
    # MAP RESUME EXPERIENCE TO PROFILE DROPDOWN
    # ==================================================

    @staticmethod
    def map_experience_to_profile(value):
        value = (value or "").strip().lower()

        if not value:
            return ""

        if (
            "fresher" in value
            or "fresh graduate" in value
            or "recent graduate" in value
        ):
            return "Fresher"

        if "intern" in value:
            return "0-1 years"

        match = re.search(
            r"(\d+(?:\.\d+)?)",
            value
        )

        if not match:
            return ""

        years = float(match.group(1))

        if years <= 1:
            return "0-1 years"

        if years <= 3:
            return "1-3 years"

        if years <= 5:
            return "3-5 years"

        if years <= 10:
            return "5-10 years"

        return "10+ years"

    # ==================================================
    # PROCESS RESUME
    # ==================================================

    @staticmethod
    @transaction.atomic
    def process_resume(
        resume,
        candidate,
        parsed_result=None,
    ):
        try:
            print("=================================")
            print("STARTING RESUME PARSING")
            print(
                "FILE:",
                resume.resume_file.path
            )
            print("=================================")

            # ------------------------------------------
            # Parse
            # ------------------------------------------

            result = (
                parsed_result
                if parsed_result is not None
                else parse_resume(
                    resume.resume_file.path
                )
            )

            print("PARSER RESULT:")
            print(result)

            # ------------------------------------------
            # Validate
            # ------------------------------------------

            ResumeService.validate_resume_content(
                result
            )

            ResumeService.validate_candidate_identity(
                result,
                candidate,
            )

            # ------------------------------------------
            # ATS
            # ------------------------------------------

            ats = calculate_ats(
                result
            )

            # ------------------------------------------
            # ML
            # ------------------------------------------

            ml_score = predict_resume_score(
                result.get(
                    "text",
                    ""
                )
            )

            # ------------------------------------------
            # Resume fields
            # ------------------------------------------

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

            keyword_score = ats.get(
                "keyword_match_score"
            )

            resume.probability_score = (
                keyword_score
                if keyword_score is not None
                else ml_score
            )

            resume.ats_score = ats.get(
                "score",
                0
            )

            # ------------------------------------------
            # Missing skills
            # ------------------------------------------

            missing_list = ats.get(
                "missing_skills",
                []
            )

            resume.missing_skills = ", ".join(
                missing_list[:6]
            )

            # ------------------------------------------
            # AI feedback
            # ------------------------------------------

            ai_feedback = generate_resume_feedback(
                result,
                ats.get("score", 0),
                missing_list,
            )

            improvements = ai_feedback.get(
                "improvements",
                []
            )

            if not improvements:
                improvements = ats.get(
                    "suggestions",
                    [
                        "Highlight quantifiable impact on your core projects.",
                        "Include industry keywords relevant to your preferred positions.",
                    ],
                )

            resume.ats_suggestions = "\n".join(
                improvements
            )

            resume.save()

            # ------------------------------------------
            # Update candidate skills
            # ------------------------------------------

            if result.get("skills"):
                candidate.skills = ", ".join(
                    result["skills"]
                )

            # ------------------------------------------
            # DO NOT overwrite candidate phone
            #
            # The phone has already been verified.
            # ------------------------------------------

            # ------------------------------------------
            # Update candidate experience using dropdown
            # ------------------------------------------

            extracted_experience = result.get(
                "experience",
                ""
            )

            mapped_experience = (
                ResumeService.map_experience_to_profile(
                    extracted_experience
                )
            )

            if mapped_experience:
                candidate.experience = mapped_experience

            candidate.save()

            print("=================================")
            print("RESUME PROCESSED SUCCESSFULLY")
            print(
                "ATS SCORE:",
                resume.ats_score
            )
            print(
                "ML SCORE:",
                resume.probability_score
            )
            print(
                "EXTRACTED SKILLS:",
                resume.extracted_skills
            )
            print("=================================")

            return resume

        except Exception as e:
            print("=================================")
            print("RESUME PROCESSING FAILED")
            print(repr(e))
            print("=================================")

            raise

    # ==================================================
    # RESET
    # ==================================================

    @staticmethod
    def reset_resume(resume):
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