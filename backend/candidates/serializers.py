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

    extracted_skills = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()
    ats_suggestions = serializers.SerializerMethodField()

    class Meta:
        model = Resume

        fields = [
            "id",
            "candidate",
            "resume_file",
            "preview_pdf",
            "original_filename",

            "extracted_text",
            "extracted_skills",
            "extracted_experience",
            "extracted_education",

            "ats_score",
            "probability_score",
            "missing_skills",
            "ats_suggestions",

            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "candidate",
            "original_filename",
            "preview_pdf",

            "extracted_text",
            "extracted_skills",
            "extracted_experience",
            "extracted_education",

            "ats_score",
            "probability_score",
            "missing_skills",
            "ats_suggestions",

            "uploaded_at",
        ]

    # =====================================
    # EXTRACTED SKILLS
    # =====================================

    def get_extracted_skills(self, obj):

        if not obj.extracted_skills:
            return []

        return [
            skill.strip()
            for skill in obj.extracted_skills.split(",")
            if skill.strip()
        ]

    # =====================================
    # MISSING SKILLS
    # =====================================

    def get_missing_skills(self, obj):

        if not obj.missing_skills:
            return []

        return [
            skill.strip()
            for skill in obj.missing_skills.split(",")
            if skill.strip()
        ]

    # =====================================
    # ATS SUGGESTIONS
    # =====================================

    def get_ats_suggestions(self, obj):

        if not obj.ats_suggestions:
            return []

        return [
            suggestion.strip()
            for suggestion in obj.ats_suggestions.split("\n")
            if suggestion.strip()
        ]


# =====================================
# JOB SERIALIZER
# =====================================

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
            "description",
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

        if hasattr(self, "_candidate"):
            return self._candidate

        request = self.context.get("request")

        if not request:
            self._candidate = None
            return None

        if not request.user.is_authenticated:
            self._candidate = None
            return None

        self._candidate = Candidate.objects.filter(
            email__iexact=request.user.email
        ).first()

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
    # NORMALIZE SKILL
    # =====================================

    def normalize_skill(self, skill):

        return (
            str(skill)
            .strip()
            .lower()
        )

    # =====================================
    # REQUIRED SKILLS
    # =====================================

    def get_required_skills(self, obj):

        if not obj.required_skills:
            return []

        value = str(
            obj.required_skills
        )

        value = value.replace(
            "\n",
            ","
        )

        value = value.replace(
            ";",
            ","
        )

        skills = []

        for skill in value.split(","):

            skill = self.normalize_skill(skill)

            if skill and skill not in skills:
                skills.append(skill)

        return skills

    # =====================================
    # SKILL MATCHING
    # =====================================

    def skill_matches(
        self,
        required_skill,
        candidate_skill
    ):

        required_skill = self.normalize_skill(
            required_skill
        )

        candidate_skill = self.normalize_skill(
            candidate_skill
        )

        if not required_skill or not candidate_skill:
            return False

        if required_skill == candidate_skill:
            return True

        if (
            required_skill in candidate_skill
            or candidate_skill in required_skill
        ):
            return True

        return False

    # =====================================
    # ATS SCORE
    # =====================================

    def get_ats_score(self, obj):

        candidate = self.get_candidate()

        if not candidate:
            return 0

        resume = getattr(
            candidate,
            "resume",
            None
        )

        if not resume:
            return 0

        return resume.ats_score or 0

    # =====================================
    # MATCHED SKILLS
    # =====================================

    def get_matched_skills(self, obj):

        candidate_skills = (
            self.get_candidate_skills()
        )

        required_skills = (
            self.get_required_skills(obj)
        )

        matched = []

        for required in required_skills:

            for candidate_skill in candidate_skills:

                if self.skill_matches(
                    required,
                    candidate_skill
                ):

                    matched.append(required)

                    break

        return matched

    # =====================================
    # MISSING SKILLS
    # =====================================

    def get_missing_skills(self, obj):

        required_skills = (
            self.get_required_skills(obj)
        )

        matched_skills = (
            self.get_matched_skills(obj)
        )

        return [
            skill
            for skill in required_skills
            if skill not in matched_skills
        ]

    # =====================================
    # SKILL MATCH %
    # =====================================

    def get_skill_match_percentage(self, obj):

        required_skills = (
            self.get_required_skills(obj)
        )

        if not required_skills:
            return 0

        matched_skills = (
            self.get_matched_skills(obj)
        )

        return round(
            (
                len(matched_skills)
                /
                len(required_skills)
            ) * 100
        )

    # =====================================
    # OVERALL MATCH %
    # =====================================

    def get_match_percentage(self, obj):

        ats_score = self.get_ats_score(obj)

        skill_percentage = (
            self.get_skill_match_percentage(obj)
        )

        return round(
            (ats_score * 0.60)
            +
            (skill_percentage * 0.40)
        )

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
            "description",
            "required_skills",
            "min_ats",
        ]


# =====================================
# JOB SWIPE SERIALIZER
# =====================================

class JobSwipeSerializer(serializers.ModelSerializer):

    job = JobMiniSerializer(
        read_only=True
    )

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

    job = JobMiniSerializer(
        read_only=True
    )

    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source="job",
        write_only=True
    )

    matched_skills = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()

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

            "matched_skills",
            "missing_skills",
            "match_score",
        ]

        read_only_fields = [
            "id",
            "candidate",
            "job",
            "applied_resume",
            "applied_at",
            "matched_skills",
            "missing_skills",
            "match_score",
        ]

    # ============================================
    # NORMALIZE SKILLS
    # ============================================

    def normalize_skills(self, value):

        if not value:
            return []

        value = str(value)

        value = value.replace("\n", ",")
        value = value.replace(";", ",")

        skills = value.split(",")

        cleaned = []

        for skill in skills:

            skill = skill.strip()

            if not skill:
                continue

            skill = skill.lower()

            if skill not in cleaned:
                cleaned.append(skill)

        return cleaned

    # ============================================
    # RESUME SKILLS
    # ============================================

    def get_resume_skills(self, obj):

        resume = obj.applied_resume

        if not resume:
            return []

        return self.normalize_skills(
            resume.extracted_skills
        )

    # ============================================
    # JOB SKILLS
    # ============================================

    def get_job_skills(self, obj):

        if not obj.job:
            return []

        return self.normalize_skills(
            obj.job.required_skills
        )

    # ============================================
    # MATCHED SKILLS
    # ============================================

    def get_matched_skills(self, obj):

        resume_skills = self.get_resume_skills(obj)
        job_skills = self.get_job_skills(obj)

        matched = []

        for job_skill in job_skills:

            for resume_skill in resume_skills:

                if (
                    job_skill == resume_skill
                    or job_skill in resume_skill
                    or resume_skill in job_skill
                ):

                    if job_skill not in matched:
                        matched.append(job_skill)

                    break

        return matched

    # ============================================
    # MISSING SKILLS
    # ============================================

    def get_missing_skills(self, obj):

        job_skills = self.get_job_skills(obj)
        matched = self.get_matched_skills(obj)

        return [
            skill
            for skill in job_skills
            if skill not in matched
        ]

    # ============================================
    # MATCH SCORE
    # ============================================

    def get_match_score(self, obj):

        job_skills = self.get_job_skills(obj)

        if not job_skills:
            return 0

        matched = self.get_matched_skills(obj)

        score = (
            len(matched)
            / len(job_skills)
        ) * 100

        return round(score)

# =====================================
# AI RECOMMENDATION SERIALIZER
# =====================================

class RecommendationSerializer(
    serializers.Serializer
):

    job = JobMiniSerializer(
        read_only=True
    )

    match_score = serializers.IntegerField(
        read_only=True
    )

    skill_match_percentage = serializers.IntegerField(
        read_only=True
    )

    recommendation_score = serializers.IntegerField(
        read_only=True
    )

    matched_skills = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )

    missing_skills = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )

    resume_skills = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )

    reasons = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
