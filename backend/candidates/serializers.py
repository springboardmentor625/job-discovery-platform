import os
import re
import zipfile

from rest_framework import serializers

from .models import (
    Candidate,
    Resume,
    Job,
    JobSwipe,
    Application,
)

from .utils.ats import calculate_job_ats
from .utils.matcher import normalize_skills
from .utils.resume_parser import extract_skills


# =====================================
# CANDIDATE SERIALIZER
# =====================================

class CandidateSerializer(serializers.ModelSerializer):
    has_resume = serializers.SerializerMethodField()
    resume_filename = serializers.SerializerMethodField()
    resume_id = serializers.SerializerMethodField()
    detected_skills = serializers.SerializerMethodField()
    resume_uploaded_at = serializers.SerializerMethodField()

    class Meta:
        model = Candidate

        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "current_location",
            "education",
            "experience",
            "preferred_job_roles",
            "preferred_locations",
            "preferred_work_mode",
            "career_interests",
            "skills",
            "bio",
            "profile_picture",
            "projects",
            "certifications",
            "created_at",
            "has_resume",
            "resume_filename",
            "resume_id",
            "detected_skills",
            "resume_uploaded_at",
        ]

        read_only_fields = [
            "id",
            "email",
            "created_at",
            "has_resume",
            "resume_filename",
            "resume_id",
            "detected_skills",
            "resume_uploaded_at",
        ]

    # =====================================
    # COMMON VALIDATION HELPERS
    # =====================================

    @staticmethod
    def _meaningful_text(value):
        """
        Basic validation for normal text fields.

        This checks formatting and obvious garbage without
        trying to determine whether the actual statement is
        factually true.
        """

        if not value:
            return False

        letters = re.sub(
            r"[^A-Za-z]",
            "",
            str(value),
        ).lower()

        if len(letters) < 2:
            return False

        return True

    # =====================================
    # FULL NAME
    # =====================================

    def validate_full_name(self, value):
        value = (value or "").strip()

        if not value:
            raise serializers.ValidationError(
                "Full name is required."
            )

        if len(value) < 2:
            raise serializers.ValidationError(
                "Full name is too short."
            )

        if len(value) > 100:
            raise serializers.ValidationError(
                "Full name must not exceed 100 characters."
            )

        if not re.fullmatch(
            r"[A-Za-zÀ-ÖØ-öø-ÿ.'-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ.'-]+)*",
            value,
        ):
            raise serializers.ValidationError(
                "Enter a valid full name using letters, spaces, dots, apostrophes or hyphens."
            )

        parts = value.replace("-", " ").split()

        if len(parts) < 2:
            raise serializers.ValidationError(
                "Please enter your full name, for example: Praveena Durga."
            )

        if len(parts) > 5:
            raise serializers.ValidationError(
                "Full name contains too many words."
            )

        for part in parts:
            letters = re.sub(
                r"[^A-Za-z]",
                "",
                part,
            )

            if not letters:
                raise serializers.ValidationError(
                    "Enter a valid full name."
                )

        return value

    # =====================================
    # PHONE
    # =====================================

    def validate_phone(self, value):
        value = (value or "").strip()

        if not value:
            raise serializers.ValidationError(
                "Phone number is required."
            )

        digits = re.sub(
            r"\D",
            "",
            value,
        )

        if digits.startswith("91") and len(digits) == 12:
            mobile = digits[2:]

        elif digits.startswith("0") and len(digits) == 11:
            mobile = digits[1:]

        elif len(digits) == 10:
            mobile = digits

        else:
            raise serializers.ValidationError(
                "Enter a valid 10-digit Indian mobile number."
            )

        if not re.fullmatch(
            r"[6-9]\d{9}",
            mobile,
        ):
            raise serializers.ValidationError(
                "Enter a valid 10-digit Indian mobile number."
            )

        return value

    # =====================================
    # CURRENT LOCATION
    # =====================================

    def validate_current_location(self, value):
        value = (value or "").strip()

        if not value:
            return ""

        if len(value) > 150:
            raise serializers.ValidationError(
                "Location must not exceed 150 characters."
            )

        if not re.fullmatch(
            r"[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'&()/-]+",
            value,
        ):
            raise serializers.ValidationError(
                "Location contains invalid characters."
            )

        if not self._meaningful_text(value):
            raise serializers.ValidationError(
                "Please enter a valid current location."
            )

        return value

    # =====================================
    # PREFERRED JOB ROLES
    # =====================================

    def validate_preferred_job_roles(self, value):
        value = (value or "").strip()

        if not value:
            return ""

        if len(value) > 300:
            raise serializers.ValidationError(
                "Preferred job roles must not exceed 300 characters."
            )

        roles = [
            role.strip()
            for role in value.split(",")
            if role.strip()
        ]

        if len(roles) > 10:
            raise serializers.ValidationError(
                "You can add up to 10 preferred job roles."
            )

        for role in roles:
            if len(role) < 2:
                raise serializers.ValidationError(
                    "Each job role must contain at least 2 characters."
                )

            if len(role) > 80:
                raise serializers.ValidationError(
                    "A job role must not exceed 80 characters."
                )

            if not re.search(
                r"[A-Za-z]",
                role,
            ):
                raise serializers.ValidationError(
                    f"Invalid job role: {role}"
                )

            if not re.fullmatch(
                r"[A-Za-z0-9+#./&()' -]+",
                role,
            ):
                raise serializers.ValidationError(
                    f"Invalid characters in job role: {role}"
                )

        return ", ".join(roles)

    # =====================================
    # PREFERRED LOCATIONS
    # =====================================

    def validate_preferred_locations(self, value):
        value = (value or "").strip()

        if not value:
            return ""

        if len(value) > 300:
            raise serializers.ValidationError(
                "Preferred locations must not exceed 300 characters."
            )

        locations = [
            location.strip()
            for location in value.split(",")
            if location.strip()
        ]

        if len(locations) > 10:
            raise serializers.ValidationError(
                "You can add up to 10 preferred locations."
            )

        for location in locations:
            if len(location) < 2:
                raise serializers.ValidationError(
                    "Each location must contain at least 2 characters."
                )

            if len(location) > 80:
                raise serializers.ValidationError(
                    "A location must not exceed 80 characters."
                )

            if not re.search(
                r"[A-Za-z]",
                location,
            ):
                raise serializers.ValidationError(
                    f"Invalid location: {location}"
                )

            if not re.fullmatch(
                r"[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'&()/-]+",
                location,
            ):
                raise serializers.ValidationError(
                    f"Invalid characters in location: {location}"
                )

        return ", ".join(locations)

    # =====================================
    # TECHNICAL SKILLS
    # =====================================

    def validate_skills(self, value):
        if not value:
            return ""

        if isinstance(value, list):
            skills = value

        else:
            skills = [
                skill.strip()
                for skill in str(value).split(",")
                if skill.strip()
            ]

        if len(skills) > 40:
            raise serializers.ValidationError(
                "You can add up to 40 skills."
            )

        cleaned_skills = []
        seen = set()

        for skill in skills:

            skill = str(skill).strip()

            if not skill:
                continue

            if len(skill) > 60:
                raise serializers.ValidationError(
                    f"Skill is too long: {skill}"
                )

            # Allow normal technical skill characters.
            if not re.fullmatch(
                r"[A-Za-z0-9+#./&()' -]+",
                skill,
            ):
                raise serializers.ValidationError(
                    f"Invalid characters in skill: {skill}"
                )

            if not re.search(
                r"[A-Za-z]",
                skill,
            ):
                raise serializers.ValidationError(
                    f"Invalid skill: {skill}"
                )

            # Single-character technical languages.
            if (
                len(skill) == 1
                and skill.upper() not in {"C", "R"}
            ):
                raise serializers.ValidationError(
                    f"Invalid skill: {skill}"
                )

            # Use the SAME skill vocabulary already used
            # by the resume parser.
            recognized = extract_skills(skill)

            if not recognized:
                raise serializers.ValidationError(
                    f"'{skill}' is not recognized as a technical skill. "
                    "Please enter a valid technical skill."
                )

            normalized = normalize_skills(
                recognized
            )

            if normalized:
                final_skill = str(
                    normalized[0]
                )
            else:
                final_skill = str(
                    recognized[0]
                )

            key = final_skill.casefold()

            if key not in seen:
                cleaned_skills.append(
                    final_skill
                )
                seen.add(key)

        return ", ".join(
            cleaned_skills
        )

    # =====================================
    # EXPERIENCE
    # =====================================

    def validate_experience(self, value):
        value = (value or "").strip()

        allowed_values = {
            "",
            "Fresher",
            "0-1 years",
            "1-3 years",
            "3-5 years",
            "5-10 years",
            "10+ years",
        }

        if value not in allowed_values:
            raise serializers.ValidationError(
                "Please select a valid experience range."
            )

        return value

    # =====================================
    # EDUCATION
    # =====================================

    def validate_education(self, value):
        value = (value or "").strip()

        if not value:
            return ""

        if len(value) < 3:
            raise serializers.ValidationError(
                "Please enter valid education information."
            )

        if len(value) > 3000:
            raise serializers.ValidationError(
                "Education must not exceed 3000 characters."
            )

        if not re.search(
            r"[A-Za-z]",
            value,
        ):
            raise serializers.ValidationError(
                "Education must contain meaningful text."
            )

        return value

    # =====================================
    # CAREER INTERESTS
    # =====================================

    def validate_career_interests(self, value):
        value = (value or "").strip()

        if not value:
            return ""

        if len(value) < 2:
            raise serializers.ValidationError(
                "Please enter meaningful career interests."
            )

        if len(value) > 500:
            raise serializers.ValidationError(
                "Career interests must not exceed 500 characters."
            )

        if not re.search(
            r"[A-Za-z]",
            value,
        ):
            raise serializers.ValidationError(
                "Career interests must contain meaningful text."
            )

        return value

    # =====================================
    # PROFESSIONAL BIO
    # =====================================

    def validate_bio(self, value):
        value = (value or "").strip()

        if not value:
            return ""

        if len(value) < 20:
            raise serializers.ValidationError(
                "Professional bio must contain at least 20 characters."
            )

        if len(value) > 2000:
            raise serializers.ValidationError(
                "Professional bio must not exceed 2000 characters."
            )

        if not re.search(
            r"[A-Za-z]",
            value,
        ):
            raise serializers.ValidationError(
                "Professional bio must contain meaningful text."
            )

        return value

    # =====================================
    # WORK MODE
    # =====================================

    def validate_preferred_work_mode(self, value):
        allowed = {
            "Any",
            "Remote",
            "Hybrid",
            "On-site",
        }

        if value not in allowed:
            raise serializers.ValidationError(
                "Please select a valid work mode."
            )

        return value

    # =====================================
    # EXISTING METHODS
    # =====================================

    def get_has_resume(self, obj):
        return (
            hasattr(obj, "resume")
            and bool(obj.resume.resume_file)
        )

    def get_resume_filename(self, obj):
        if (
            hasattr(obj, "resume")
            and obj.resume.resume_file
        ):
            return (
                obj.resume.original_filename
                or obj.resume.resume_file.name.split("/")[-1]
            )

        return ""

    def get_resume_id(self, obj):
        if (
            hasattr(obj, "resume")
            and obj.resume.id
        ):
            return obj.resume.id

        return None

    def get_resume_uploaded_at(self, obj):
        if (
            hasattr(obj, "resume")
            and obj.resume.uploaded_at
        ):
            return obj.resume.uploaded_at.isoformat()

        return None

    def get_detected_skills(self, obj):
        if (
            hasattr(obj, "resume")
            and obj.resume.extracted_skills
        ):
            return [
                str(s).title()
                for s in normalize_skills(
                    obj.resume.extracted_skills
                )
            ]

        return [
            str(s).title()
            for s in normalize_skills(
                obj.skills
            )
        ]


# =====================================
# RESUME SERIALIZER
# =====================================

class ResumeSerializer(serializers.ModelSerializer):
    detected_skills = serializers.SerializerMethodField()
    display_filename = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume

        fields = [
            "id",
            "candidate",
            "resume_file",
            "preview_pdf",
            "original_filename",
            "display_filename",
            "extracted_skills",
            "detected_skills",
            "ats_score",
            "probability_score",
            "uploaded_at",
            "file_url",
            "download_url",
        ]

        read_only_fields = [
            "id",
            "candidate",
            "preview_pdf",
            "detected_skills",
            "display_filename",
            "ats_score",
            "probability_score",
            "uploaded_at",
            "file_url",
            "download_url",
        ]

    # =====================================
    # RESUME FILE VALIDATION
    # =====================================

    def validate_resume_file(self, value):

        if not value:
            raise serializers.ValidationError(
                "Please select a resume file."
            )

        # Maximum 5 MB
        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Resume file must be 5 MB or smaller."
            )

        if value.size == 0:
            raise serializers.ValidationError(
                "The uploaded file is empty."
            )

        filename = value.name or ""

        extension = os.path.splitext(
            filename
        )[1].lower()

        # Only PDF and DOCX
        if extension not in {
            ".pdf",
            ".docx",
        }:
            raise serializers.ValidationError(
                "Only PDF and DOCX resume files are allowed."
            )

        # =================================
        # ACTUAL PDF VALIDATION
        # =================================

        if extension == ".pdf":

            try:
                value.seek(0)

                header = value.read(5)

                value.seek(0)

            except Exception:
                raise serializers.ValidationError(
                    "Unable to read the uploaded PDF."
                )

            if header != b"%PDF-":
                raise serializers.ValidationError(
                    "The uploaded file is not a valid PDF."
                )

        # =================================
        # ACTUAL DOCX VALIDATION
        # =================================

        if extension == ".docx":

            try:
                value.seek(0)

                with zipfile.ZipFile(value) as archive:

                    files = set(
                        archive.namelist()
                    )

                    if (
                        "word/document.xml"
                        not in files
                    ):
                        raise serializers.ValidationError(
                            "The uploaded file is not a valid DOCX document."
                        )

                value.seek(0)

            except serializers.ValidationError:
                value.seek(0)
                raise

            except Exception:
                value.seek(0)

                raise serializers.ValidationError(
                    "The uploaded file is not a valid DOCX document."
                )

        return value

    # =====================================
    # DISPLAY FILENAME
    # =====================================

    def get_display_filename(self, obj):

        if isinstance(obj, dict):

            filename = obj.get(
                "original_filename"
            )

            if filename:
                return filename

            filename = obj.get(
                "resume_file"
            )

            if filename:
                return str(
                    filename
                ).split("/")[-1]

            return "Resume.pdf"

        if obj.original_filename:
            return obj.original_filename

        if obj.resume_file:
            return obj.resume_file.name.split("/")[-1]

        return "Resume.pdf"

    # =====================================
    # FILE URL
    # =====================================

    def get_file_url(self, obj):

        request = self.context.get(
            "request"
        )

        url = (
            f"/api/resumes/{obj.id}/file/"
        )

        return (
            request.build_absolute_uri(url)
            if request
            else url
        )

    # =====================================
    # DOWNLOAD URL
    # =====================================

    def get_download_url(self, obj):

        request = self.context.get(
            "request"
        )

        url = (
            f"/api/resumes/{obj.id}/file/?download=true"
        )

        return (
            request.build_absolute_uri(url)
            if request
            else url
        )

    # =====================================
    # DETECTED SKILLS
    # =====================================

    def get_detected_skills(self, obj):

        raw = obj.extracted_skills

        if not raw:
            return []

        return [
            str(s).title()
            for s in normalize_skills(raw)
        ]


# =====================================
# JOB SERIALIZER
# =====================================

class JobSerializer(serializers.ModelSerializer):
    ats_score = serializers.SerializerMethodField()
    skill_match_percentage = serializers.SerializerMethodField()
    matched_skills = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()
    why_matches = serializers.SerializerMethodField()
    tips = serializers.SerializerMethodField()
    is_applied = serializers.SerializerMethodField()
    application_status = serializers.SerializerMethodField()
    applied_at = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    swipe_decision = serializers.SerializerMethodField()

    class Meta:
        model = Job

        fields = [
            "id",
            "title",
            "company",
            "location",
            "work_mode",
            "salary",
            "experience",
            "description",
            "required_skills",
            "preferred_skills",
            "application_url",
            "min_ats",
            "created_at",
            "source",
            "posted_at",
            "ats_score",
            "skill_match_percentage",
            "matched_skills",
            "missing_skills",
            "why_matches",
            "tips",
            "is_applied",
            "application_status",
            "applied_at",
            "is_saved",
            "swipe_decision",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        sal = str(data.get("salary") or "").strip()
        if not sal or sal.lower() in ("competitive", "nan", "none", "null", "not specified"):
            data["salary"] = "Not specified"
        return data

    def _get_candidate(self):

        if hasattr(
            self,
            "_cached_candidate",
        ):
            return self._cached_candidate

        request = self.context.get(
            "request"
        )

        if (
            not request
            or not request.user.is_authenticated
        ):
            self._cached_candidate = None
            return None

        self._cached_candidate = (
            Candidate.objects
            .filter(
                email__iexact=request.user.email
            )
            .select_related("resume")
            .first()
        )

        return self._cached_candidate

    def _get_ats_info(self, obj):

        if not hasattr(
            self,
            "_ats_cache",
        ):
            self._ats_cache = {}

        if obj.id not in self._ats_cache:

            candidate = self._get_candidate()

            self._ats_cache[obj.id] = (
                calculate_job_ats(
                    candidate,
                    obj,
                )
            )

        return self._ats_cache[obj.id]

    def _get_applied_map(self):

        if not hasattr(
            self,
            "_cached_applied_map",
        ):

            candidate = self._get_candidate()

            if not candidate:

                self._cached_applied_map = {}

            else:

                apps = (
                    Application.objects
                    .filter(
                        candidate=candidate
                    )
                    .values(
                        "job_id",
                        "applied_at",
                        "status",
                    )
                )

                self._cached_applied_map = {
                    a["job_id"]: {
                        "applied_at": a["applied_at"],
                        "status": a.get("status") or "link_opened",
                    }
                    for a in apps
                }

        return self._cached_applied_map

    def _get_swipe_map(self):

        if not hasattr(
            self,
            "_cached_swipe_map",
        ):

            candidate = self._get_candidate()

            if not candidate:

                self._cached_swipe_map = {}

            else:

                swipes = (
                    JobSwipe.objects
                    .filter(
                        candidate=candidate
                    )
                    .values(
                        "job_id",
                        "decision",
                    )
                )

                self._cached_swipe_map = {
                    s["job_id"]: s["decision"]
                    for s in swipes
                }

        return self._cached_swipe_map

    def get_ats_score(self, obj):
        return self._get_ats_info(
            obj
        )["ats_score"]

    def get_skill_match_percentage(
        self,
        obj,
    ):
        return self._get_ats_info(
            obj
        )["skill_match_percentage"]

    def get_matched_skills(self, obj):
        return [
            str(s).title()
            for s in self._get_ats_info(
                obj
            )["matched_skills"]
        ]

    def get_missing_skills(self, obj):
        return [
            str(s).title()
            for s in self._get_ats_info(
                obj
            )["missing_skills"]
        ]

    def get_why_matches(self, obj):
        return self._get_ats_info(
            obj
        )["why_matches"]

    def get_tips(self, obj):
        return self._get_ats_info(
            obj
        )["tips"]

    def get_is_applied(self, obj):
        info = self._get_applied_map().get(obj.id)
        if not info:
            return False
        return info.get("status") == "applied"

    def get_application_status(self, obj):
        info = self._get_applied_map().get(obj.id)
        if not info:
            return "not_applied"
        return info.get("status", "link_opened")

    def get_applied_at(self, obj):
        info = self._get_applied_map().get(obj.id)
        if not info or not info.get("applied_at"):
            return None
        dt = info["applied_at"]
        return dt.isoformat() if hasattr(dt, "isoformat") else str(dt)

    def get_is_saved(self, obj):
        return (
            self._get_swipe_map().get(
                obj.id
            )
            == "saved"
        )

    def get_swipe_decision(self, obj):
        return self._get_swipe_map().get(
            obj.id
        )


# =====================================
# JOB MINI SERIALIZER
# =====================================

class JobMiniSerializer(serializers.ModelSerializer):

    class Meta:
        model = Job

        fields = [
            "id",
            "title",
            "company",
            "location",
            "work_mode",
            "salary",
            "experience",
            "description",
            "required_skills",
            "preferred_skills",
            "application_url",
            "min_ats",
            "source",
            "posted_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        sal = str(data.get("salary") or "").strip()
        if not sal or sal.lower() in ("competitive", "nan", "none", "null", "not specified"):
            data["salary"] = "Not specified"
        return data


# =====================================
# JOB SWIPE SERIALIZER
# =====================================

class JobSwipeSerializer(serializers.ModelSerializer):

    job = JobSerializer(
        read_only=True
    )

    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source="job",
        write_only=True,
    )

    class Meta:
        model = JobSwipe

        fields = [
            "id",
            "candidate",
            "job",
            "job_id",
            "decision",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "candidate",
            "created_at",
        ]


# =====================================
# APPLICATION SERIALIZER
# =====================================

class ApplicationSerializer(serializers.ModelSerializer):

    job = JobSerializer(
        read_only=True
    )

    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source="job",
        write_only=True,
    )

    class Meta:
        model = Application

        fields = [
            "id",
            "candidate",
            "job",
            "job_id",
            "status",
            "cover_letter",
            "portfolio_url",
            "linkedin_url",
            "github_url",
            "expected_salary",
            "available_from",
            "applied_resume",
            "applied_at",
        ]

        read_only_fields = [
            "id",
            "candidate",
            "applied_resume",
            "applied_at",
        ]


# =====================================
# RECOMMENDATION SERIALIZER
# =====================================

class RecommendationSerializer(serializers.Serializer):

    job = JobMiniSerializer(
        read_only=True
    )

    match_score = serializers.IntegerField(
        read_only=True
    )

    ats_score = serializers.IntegerField(
        read_only=True
    )

    skill_match_percentage = serializers.IntegerField(
        read_only=True
    )

    matched_skills = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )

    missing_skills = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )

    why_matches = serializers.CharField(
        read_only=True
    )

    tips = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )

    is_applied = serializers.BooleanField(
        read_only=True
    )

    is_saved = serializers.BooleanField(
        read_only=True
    )