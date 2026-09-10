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

    def get_has_resume(self, obj):
        return hasattr(obj, "resume") and bool(obj.resume.resume_file)

    def get_resume_filename(self, obj):
        if hasattr(obj, "resume") and obj.resume.resume_file:
            return obj.resume.original_filename or obj.resume.resume_file.name.split("/")[-1]
        return ""

    def get_resume_id(self, obj):
        if hasattr(obj, "resume") and obj.resume.id:
            return obj.resume.id
        return None

    def get_resume_uploaded_at(self, obj):
        if hasattr(obj, "resume") and obj.resume.uploaded_at:
            return obj.resume.uploaded_at.isoformat()
        return None

    def get_detected_skills(self, obj):
        if hasattr(obj, "resume") and obj.resume.extracted_skills:
            return [str(s).title() for s in normalize_skills(obj.resume.extracted_skills)]
        return [str(s).title() for s in normalize_skills(obj.skills)]


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

    def get_display_filename(self, obj):
        if isinstance(obj, dict):
            filename = obj.get("original_filename")
            if filename:
                return filename

            filename = obj.get("resume_file")
            if filename:
                return str(filename).split("/")[-1]

            return "Resume.pdf"

        if obj.original_filename:
            return obj.original_filename

        if obj.resume_file:
            return obj.resume_file.name.split("/")[-1]

        return "Resume.pdf"

    def get_file_url(self, obj):
        request = self.context.get("request")
        url = f"/api/resumes/{obj.id}/file/"
        return request.build_absolute_uri(url) if request else url

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = f"/api/resumes/{obj.id}/file/?download=true"
        return request.build_absolute_uri(url) if request else url

    def get_detected_skills(self, obj):
        raw = obj.extracted_skills
        if not raw:
            return []
        return [str(s).title() for s in normalize_skills(raw)]


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
            "ats_score",
            "skill_match_percentage",
            "matched_skills",
            "missing_skills",
            "why_matches",
            "tips",
            "is_applied",
            "applied_at",
            "is_saved",
            "swipe_decision",
        ]

    def _get_candidate(self):
        if hasattr(self, "_cached_candidate"):
            return self._cached_candidate
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            self._cached_candidate = None
            return None
        self._cached_candidate = Candidate.objects.filter(email__iexact=request.user.email).select_related("resume").first()
        return self._cached_candidate

    def _get_ats_info(self, obj):
        if not hasattr(self, "_ats_cache"):
            self._ats_cache = {}
        if obj.id not in self._ats_cache:
            candidate = self._get_candidate()
            self._ats_cache[obj.id] = calculate_job_ats(candidate, obj)
        return self._ats_cache[obj.id]

    def _get_applied_map(self):
        if not hasattr(self, "_cached_applied_map"):
            candidate = self._get_candidate()
            if not candidate:
                self._cached_applied_map = {}
            else:
                apps = Application.objects.filter(candidate=candidate).values("job_id", "applied_at")
                self._cached_applied_map = {a["job_id"]: a["applied_at"] for a in apps}
        return self._cached_applied_map

    def _get_swipe_map(self):
        if not hasattr(self, "_cached_swipe_map"):
            candidate = self._get_candidate()
            if not candidate:
                self._cached_swipe_map = {}
            else:
                swipes = JobSwipe.objects.filter(candidate=candidate).values("job_id", "decision")
                self._cached_swipe_map = {s["job_id"]: s["decision"] for s in swipes}
        return self._cached_swipe_map

    def get_ats_score(self, obj):
        return self._get_ats_info(obj)["ats_score"]

    def get_skill_match_percentage(self, obj):
        return self._get_ats_info(obj)["skill_match_percentage"]

    def get_matched_skills(self, obj):
        return [str(s).title() for s in self._get_ats_info(obj)["matched_skills"]]

    def get_missing_skills(self, obj):
        return [str(s).title() for s in self._get_ats_info(obj)["missing_skills"]]

    def get_why_matches(self, obj):
        return self._get_ats_info(obj)["why_matches"]

    def get_tips(self, obj):
        return self._get_ats_info(obj)["tips"]

    def get_is_applied(self, obj):
        return obj.id in self._get_applied_map()

    def get_applied_at(self, obj):
        dt = self._get_applied_map().get(obj.id)
        return dt.isoformat() if dt else None

    def get_is_saved(self, obj):
        return self._get_swipe_map().get(obj.id) == "saved"

    def get_swipe_decision(self, obj):
        return self._get_swipe_map().get(obj.id)


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
        ]


# =====================================
# JOB SWIPE SERIALIZER
# =====================================

class JobSwipeSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
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
            "created_at",
        ]


# =====================================
# APPLICATION SERIALIZER
# =====================================

class ApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
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
            "applied_resume",
            "applied_at",
        ]


# =====================================
# RECOMMENDATION SERIALIZER
# =====================================

class RecommendationSerializer(serializers.Serializer):
    job = JobMiniSerializer(read_only=True)
    match_score = serializers.IntegerField(read_only=True)
    ats_score = serializers.IntegerField(read_only=True)
    skill_match_percentage = serializers.IntegerField(read_only=True)
    matched_skills = serializers.ListField(child=serializers.CharField(), read_only=True)
    missing_skills = serializers.ListField(child=serializers.CharField(), read_only=True)
    why_matches = serializers.CharField(read_only=True)
    tips = serializers.ListField(child=serializers.CharField(), read_only=True)
    is_applied = serializers.BooleanField(read_only=True)
    is_saved = serializers.BooleanField(read_only=True)
