from rest_framework import serializers

from .models import (
    Candidate,
    Resume,
    Job,
    JobSwipe,
    Application,
)


# =====================================
# CANDIDATE SERIALIZER
# =====================================

class CandidateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Candidate

        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "profile_picture",
            "skills",
            "experience",
            "education",
            "projects",
            "certifications",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "email",
            "created_at",
        ]

    # =====================================
    # SKILLS VALIDATION
    # =====================================

    def validate_skills(self, value):

        allowed = {
            "python",
            "java",
            "javascript",
            "react",
            "django",
            "flask",
            "html",
            "css",
            "sql",
            "mysql",
            "postgresql",
            "mongodb",
            "c",
            "c++",
            "c#",
            "nodejs",
            "node.js",
            "express",
            "git",
            "aws",
            "azure",
            "docker",
            "kubernetes",
            "angular",
        }

        skills = [
            skill.strip().lower()
            for skill in value.split(",")
            if skill.strip()
        ]

        for skill in skills:

            if skill not in allowed:
                raise serializers.ValidationError(
                    f'"{skill}" is not a recognized professional skill.'
                )

        return value

    # =====================================
    # EDUCATION VALIDATION
    # =====================================

    def validate_education(self, value):

        if value and len(value.split()) < 3:
            raise serializers.ValidationError(
                "Enter a valid education detail."
            )

        return value

    # =====================================
    # PROJECT VALIDATION
    # =====================================

    def validate_projects(self, value):

        if value and len(value.split()) < 10:
            raise serializers.ValidationError(
                "Project description is too short."
            )

        return value

    # =====================================
    # CERTIFICATION VALIDATION
    # =====================================

    def validate_certifications(self, value):

        if value and len(value.split()) < 2:
            raise serializers.ValidationError(
                "Enter a valid certification."
            )

        return value


# =====================================
# RESUME SERIALIZER
# =====================================

class ResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resume

        fields = "__all__"

        read_only_fields = [
            "id",
            "candidate",
            "ats_score",
            "uploaded_at",
        ]


# =====================================
# JOB SERIALIZER
# =====================================

class JobSerializer(serializers.ModelSerializer):

    ats_score = serializers.SerializerMethodField()
    matched_skills = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()

    skill_match_percentage = serializers.SerializerMethodField()
    match_percentage = serializers.SerializerMethodField()

    recommendation_score = serializers.SerializerMethodField()
    resume_match = serializers.SerializerMethodField()
    interest_match = serializers.SerializerMethodField()

    class Meta:
        model = Job

        fields = [
            "id",
            "title",
            "company",
            "location",
            "required_skills",
            "min_ats",

            "ats_score",
            "matched_skills",
            "missing_skills",
            "skill_match_percentage",
            "match_percentage",

            "recommendation_score",
            "resume_match",
            "interest_match",
        ]

    # =====================================
    # CURRENT CANDIDATE
    # =====================================

    def get_candidate(self):

        # ---------------------------------
        # USE CACHED CANDIDATE
        # ---------------------------------

        if hasattr(self, "_candidate"):
            return self._candidate

        request = self.context.get("request")

        if not request:
            self._candidate = None
            return None

        if not request.user.is_authenticated:
            self._candidate = None
            return None

        try:

            self._candidate = Candidate.objects.get(
                email__iexact=request.user.email
            )

        except Candidate.DoesNotExist:

            self._candidate = None

        return self._candidate

    # =====================================
    # CANDIDATE SKILLS
    # =====================================

    def get_candidate_skills(self):

        if hasattr(self, "_candidate_skills"):
            return self._candidate_skills

        candidate = self.get_candidate()

        if not candidate or not candidate.skills:

            self._candidate_skills = []
            return self._candidate_skills

        self._candidate_skills = [
            skill.strip().lower()
            for skill in candidate.skills.split(",")
            if skill.strip()
        ]

        return self._candidate_skills

    # =====================================
    # REQUIRED SKILLS
    # =====================================

    def get_required_skills(self, obj):

        if not obj.required_skills:
            return []

        return [
            skill.strip().lower()
            for skill in obj.required_skills.split(",")
            if skill.strip()
        ]

    # =====================================
    # ATS SCORE
    # =====================================

    def get_ats_score(self, obj):

        candidate = self.get_candidate()

        if not candidate:
            return 0

        try:

            resume = candidate.resume

            return resume.ats_score or 0

        except Resume.DoesNotExist:

            return 0

        except Exception:

            return 0

    # =====================================
    # MATCHED SKILLS
    # =====================================

    def get_matched_skills(self, obj):

        candidate_skills = self.get_candidate_skills()

        required_skills = self.get_required_skills(obj)

        return [
            skill
            for skill in required_skills
            if skill in candidate_skills
        ]

    # =====================================
    # MISSING SKILLS
    # =====================================

    def get_missing_skills(self, obj):

        candidate_skills = self.get_candidate_skills()

        required_skills = self.get_required_skills(obj)

        return [
            skill
            for skill in required_skills
            if skill not in candidate_skills
        ]

    # =====================================
    # SKILL MATCH %
    # =====================================

    def get_skill_match_percentage(self, obj):

        required_skills = self.get_required_skills(obj)

        if not required_skills:
            return 0

        matched_skills = self.get_matched_skills(obj)

        percentage = (
            len(matched_skills)
            / len(required_skills)
        ) * 100

        return round(percentage)

    # =====================================
    # OVERALL MATCH %
    # =====================================

    def get_match_percentage(self, obj):

        ats_score = self.get_ats_score(obj)

        skill_percentage = (
            self.get_skill_match_percentage(obj)
        )

        # ---------------------------------
        # ATS = 60%
        # SKILLS = 40%
        # ---------------------------------

        match = (
            (ats_score * 0.60)
            +
            (skill_percentage * 0.40)
        )

        return round(match)

    # =====================================
    # RECOMMENDATION SCORE
    # =====================================

    def get_recommendation_score(self, obj):

        return getattr(
            obj,
            "recommendation_score",
            0
        )

    # =====================================
    # RESUME MATCH
    # =====================================

    def get_resume_match(self, obj):

        return getattr(
            obj,
            "resume_match",
            0
        )

    # =====================================
    # INTEREST MATCH
    # =====================================

    def get_interest_match(self, obj):

        return getattr(
            obj,
            "interest_match",
            0
        )


# =====================================
# JOB SWIPE SERIALIZER
# =====================================

class JobMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "company",
            "location",
        ]


class JobSwipeSerializer(serializers.ModelSerializer):

    job = JobMiniSerializer(read_only=True)

    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source="job",
        write_only=True
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
            "job",
            "created_at",
        ]


# =====================================
# APPLICATION SERIALIZER
# =====================================

class ApplicationSerializer(serializers.ModelSerializer):

    job = JobMiniSerializer(read_only=True)

    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source="job",
        write_only=True
    )

    class Meta:
        model = Application
        fields = [
    "id",
    "candidate",
    "job",
    "job_id",
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
            "job",
            "applied_at",
        ]