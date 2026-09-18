import sys
import math
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from app.routes.job_routes import (  # noqa: E402
    MIN_SWIPES_FOR_PERSONALIZATION,
    calculate_recommendation_score,
    _cache_recommendations,
    _get_cached_recommendations,
    invalidate_recommendation_cache,
)
from app.services.ats_service import guess_job_category  # noqa: E402
from app.services.candidate_data import (  # noqa: E402
    extract_resume_experience_range,
    experience_match_score,
    experience_range_match_score,
    experience_years,
    parse_experience_range,
)
from app.services.skill_utils import merge_skills  # noqa: E402
from app.migrations import legacy_experience_years  # noqa: E402


def test_skill_union_and_aliases():
    assert merge_skills({"Python", "JS"}, {"React", "javascript"}) == {
        "python", "javascript", "react"
    }


def test_experience_levels_and_ranges():
    assert experience_years("Intern") is None
    assert experience_years("Fresher") is None
    assert experience_years("3.5 years") == 3.5
    assert experience_years("3+ years") == 3
    assert parse_experience_range("1-3 years") == (1, 3)
    assert parse_experience_range("1 to 3 years") == (1, 3)
    assert parse_experience_range("1 – 3 years") == (1, 3)
    assert parse_experience_range("3+ years") == (3, None)
    assert parse_experience_range("3.5 years") == (3.5, 3.5)
    assert parse_experience_range("Senior") == (5, None)
    assert extract_resume_experience_range("Worked as an engineer for 2-4 yrs") == (2, 4)
    assert extract_resume_experience_range("Worked on a 3-year academic program") == (None, None)
    assert experience_match_score(0, "0-1 years") == 100
    assert experience_match_score(3, "2-4 years") == 100
    assert experience_match_score(3, "5+ years") == 60
    assert experience_match_score(8, "0-2 years") == 60
    assert experience_range_match_score(1, 1, "1-3 years") == 100


def test_legacy_experience_migration_mapping():
    assert legacy_experience_years("Intern") == 0
    assert legacy_experience_years("Fresher") == 0
    assert legacy_experience_years("Junior") == 1
    assert legacy_experience_years("Mid-Level") == 3
    assert legacy_experience_years("Senior-Level") == 6
    assert legacy_experience_years("Lead") == 8
    assert legacy_experience_years("Manager") == 10


def test_role_matching_uses_boundaries():
    assert guess_job_category("HR Manager") == "hr"
    assert guess_job_category("Analyst", "three years") == "other"


def test_personalization_threshold_and_cache_invalidation():
    assert MIN_SWIPES_FOR_PERSONALIZATION == 10
    assert math.isclose(0.70 + 0.20 + 0.10, 1.0)
    assert math.isclose(0.40 + 0.30 + 0.20 + 0.10, 1.0)

    _cache_recommendations(999999, [{"job_id": 1}])
    assert _get_cached_recommendations(999999) == [{"job_id": 1}]
    invalidate_recommendation_cache(999999)
    assert _get_cached_recommendations(999999) is None


def test_recommendation_formula_activates_only_after_ten_swipes():
    inputs = (80, 20, 60, 40)
    assert calculate_recommendation_score(*inputs, 0) == 72
    assert calculate_recommendation_score(*inputs, 5) == 72
    assert calculate_recommendation_score(*inputs, 10) == 72
    assert calculate_recommendation_score(*inputs, 11) == 54
    assert calculate_recommendation_score(*inputs, 40) == 54


def test_embedding_uses_truncated_text_for_large_inputs(monkeypatch):
    import app.services.embeddings as embeddings

    captured = {}

    class DummyArray:
        def tolist(self):
            return [0.1, 0.2]

    class DummyModel:
        def encode(self, text):
            captured["text_len"] = len(text)
            return DummyArray()

    monkeypatch.setattr(embeddings, "_model", DummyModel())
    monkeypatch.setattr(embeddings, "EMBEDDINGS_AVAILABLE", True)

    result = embeddings.get_embedding("x" * 20000)

    assert result == [0.1, 0.2]
    assert captured["text_len"] <= embeddings.EMBEDDING_MAX_CHARS


def test_semantic_candidate_limit_is_tighter_for_large_job_pools():
    from app.routes.job_routes import _semantic_candidate_limit

    assert _semantic_candidate_limit(100) == 100
    assert _semantic_candidate_limit(500) == 150
    assert _semantic_candidate_limit(2000) == 150
    assert _semantic_candidate_limit(10000) == 250
    assert _semantic_candidate_limit(20000) == 400
