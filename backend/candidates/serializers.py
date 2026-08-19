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
        ]

    # =====================================
    # CURRENT CANDIDATE
    # =====================================

    def get_candidate(self):

        request = self.context.get("request")

        if not request:
            return None

        if not request.user.is_authenticated:
            return None

        try:

            return Candidate.objects.get(
                email__iexact=request.user.email
            )

        except Candidate.DoesNotExist:

            return None

    # =====================================
    # CANDIDATE SKILLS
    # =====================================

    def get_candidate_skills(self):

        candidate = self.get_candidate()

        if not candidate:
            return []

        if not candidate.skills:
            return []

        return [
            skill.strip().lower()
            for skill in candidate.skills.split(",")
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

            return candidate.resume.ats_score

        except Exception:

            return 0

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

        # ATS = 60%
        # Skills = 40%

        match = (
            (ats_score * 0.60)
            +
            (skill_percentage * 0.40)
        )

        return round(match)


# =====================================
# JOB SWIPE SERIALIZER
# =====================================

class JobSwipeSerializer(serializers.ModelSerializer):

    class Meta:
        model = JobSwipe

        fields = [
            "id",
            "candidate",
            "job",
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

    class Meta:
        model = Application

        fields = "__all__"

        read_only_fields = [
            "candidate",
            "applied_at",
        ]
