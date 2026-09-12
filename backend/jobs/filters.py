from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from applications.models import Application


def apply_basic_filters(queryset, request):
    params = request.query_params

    company_type = params.get("company_type")
    if company_type:
        queryset = queryset.filter(company_type=company_type)

    job_type = params.get("job_type")
    if job_type:
        queryset = queryset.filter(job_type=job_type)

    experience_level = params.get("experience_level")
    if experience_level:
        queryset = queryset.filter(experience_level=experience_level)

    location = params.get("location")
    if location:
        queryset = queryset.filter(location__icontains=location)

    salary_min = params.get("salary_min")
    if salary_min:
        try:
            queryset = queryset.filter(salary_max__gte=int(salary_min))
        except ValueError:
            pass

    q = params.get("q")
    if q:
        queryset = queryset.filter(
            Q(title__icontains=q) | Q(company__icontains=q) | Q(description__icontains=q)
        )

    return queryset


def apply_skill_filter(jobs, request):
    skill = request.query_params.get("skill")
    if not skill:
        return jobs
    skill = skill.lower()
    return [j for j in jobs if skill in [s.lower() for s in j.skills_required]]


def get_applicant_count(job):
    return Application.objects.filter(job=job, status=Application.Status.APPLIED).count()


def get_competition_level(applicant_count):
    if applicant_count < 3:
        return "low"
    if applicant_count < 8:
        return "medium"
    return "high"


def apply_advanced_filters(jobs, request):
    params = request.query_params

    if params.get("recently_posted") == "true":
        cutoff = timezone.now() - timedelta(days=7)
        jobs = [j for j in jobs if j.posted_at >= cutoff]

    if params.get("low_competition") == "true":
        jobs = [j for j in jobs if get_competition_level(get_applicant_count(j)) == "low"]

    return jobs