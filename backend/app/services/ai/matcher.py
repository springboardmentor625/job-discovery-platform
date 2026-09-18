# app/services/ai/matcher.py
from typing import List, Dict, Any
from app.services.ai.embedder import vector_engine

def analyze_ats_match(
    candidate_skills: List[str], 
    job_skills: List[str], 
    candidate_vector: List[float], 
    job_vector: List[float]
) -> Dict[str, Any]:
    """
    Executes the strict 7-step ATS Workflow.
    Returns the final ATS Report JSON.
    """
    
    # 1. Normalize skill text for comparison
    c_skills_set = {s.lower().strip() for s in candidate_skills}
    j_skills_set = {s.lower().strip() for s in job_skills}
    
    # 2. Extract & Compare
    matched_skills = c_skills_set.intersection(j_skills_set)
    missing_skills = j_skills_set - c_skills_set
    
    # Calculate Skill Overlap Ratio (0.0 to 1.0)
    skill_ratio = len(matched_skills) / len(j_skills_set) if j_skills_set else 1.0
    
    # Calculate Vector Similarity (0.0 to 1.0)
    vector_sim = vector_engine.calculate_cosine_similarity(candidate_vector, job_vector)
    
    # 3. Calculate Hybrid ATS Score (40% Skills, 60% Semantic Vector)
    hybrid_score = (skill_ratio * 0.4) + (vector_sim * 0.6)
    final_percentage = round(hybrid_score * 100, 2)
    
    # 4. Generate Improvement Suggestions based on Missing Skills
    suggestions = []
    if missing_skills:
        for missing in list(missing_skills)[:3]: # Top 3 missing skills
            suggestions.append(f"Consider adding {missing.title()} to your profile or portfolio to improve your match rate for this role.")
    else:
        suggestions.append("Your skill profile perfectly matches the hard requirements for this role!")
        
    # 5. Store ATS Report format
    return {
        "status": "applied",
        "ats_score": final_percentage,
        "missing_skills": [s.title() for s in missing_skills],
        "improvement_suggestions": suggestions
    }