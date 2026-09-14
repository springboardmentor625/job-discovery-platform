import os
import re

def analyze_resume_mock(file_path: str):
    """
    Heuristic/NLP Resume Analysis Service.
    Extracts text using pdfplumber, matches against a tech skill dictionary,
    and generates an ATS score based on length and keyword density.
    """
    if not os.path.exists(file_path):
        return _fallback_mock_response()
        
    text = ""
    try:
        # Only import inside here so if pdfplumber isn't installed it won't crash the whole app at startup
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return _fallback_mock_response()
        
    # If PDF is an image or unreadable
    if len(text.strip()) < 50:
        return {
            "ats_score": 15,
            "extracted_skills": [],
            "missing_keywords": ["Unreadable PDF", "Text extraction failed"],
            "missing_skills": ["Machine Learning", "Cloud", "Agile"],
            "improvement_suggestions": [
                "Your resume appears to be an image or unreadable. Use a standard text-based PDF.",
                "Ensure ATS systems can highlight text in your document."
            ]
        }
        
    # Standard tech skills pool to check against
    tech_skills = {
        "Python": r"\bpython\b",
        "React": r"\breact(?:\.js)?\b",
        "Node.js": r"\bnode(?:\.js)?\b",
        "SQL": r"\bsql\b",
        "Docker": r"\bdocker\b",
        "AWS": r"\baws\b",
        "Machine Learning": r"\bmachine learning\b|\bml\b",
        "FastAPI": r"\bfastapi\b",
        "TypeScript": r"\btypescript\b|\bts\b",
        "JavaScript": r"\bjavascript\b|\bjs\b",
        "Java": r"\bjava\b",
        "Go": r"\bgolang\b|\bgo\b",
        "C++": r"\bc\+\+\b",
        "Git": r"\bgit\b",
        "Kubernetes": r"\bkubernetes\b|\bk8s\b"
    }
    
    keywords_pool = {
        "Agile": r"\bagile\b",
        "REST API": r"\brest\s?api\b",
        "Microservices": r"\bmicroservices\b",
        "CI/CD": r"\bci/cd\b|\bcontinuous integration\b",
        "Team Leadership": r"\bleadership\b|\blead\b",
        "Problem Solving": r"\bproblem solving\b",
        "Architecture": r"\barchitecture\b"
    }
    
    text_lower = text.lower()
    
    extracted_skills = []
    missing_skills = []
    
    for skill, pattern in tech_skills.items():
        if re.search(pattern, text_lower):
            extracted_skills.append(skill)
        else:
            missing_skills.append(skill)
            
    extracted_keywords = []
    missing_keywords = []
    
    for kw, pattern in keywords_pool.items():
        if re.search(pattern, text_lower):
            extracted_keywords.append(kw)
        else:
            missing_keywords.append(kw)
            
    # Cap missing lists so it's not overwhelming
    missing_skills = missing_skills[:4]
    missing_keywords = missing_keywords[:3]
    
    # Calculate a rough ATS score
    # Base score on length (too short = bad, too long = bad)
    word_count = len(text.split())
    length_score = 0
    if 200 < word_count < 800:
        length_score = 40
    elif word_count <= 200:
        length_score = 15
    else:
        length_score = 30
        
    # Score based on skills found
    skill_score = min(len(extracted_skills) * 4, 40)
    keyword_score = min(len(extracted_keywords) * 5, 20)
    
    ats_score = length_score + skill_score + keyword_score
    
    # Generate dynamic suggestions
    suggestions = []
    if word_count < 200:
        suggestions.append("Your resume is very short. Consider adding more detail to your experience.")
    elif word_count > 800:
        suggestions.append("Your resume is quite long. Consider condensing it to the most relevant information.")
        
    if missing_skills:
        suggestions.append(f"Consider adding skills like: {', '.join(missing_skills)}")
        
    if missing_keywords:
        suggestions.append(f"Include missing industry keywords: {', '.join(missing_keywords)}")
        
    if not re.search(r"\b(managed|led|achieved|improved|increased|decreased|developed)\b", text_lower):
        suggestions.append("Use strong action verbs (e.g., Achieved, Developed, Managed).")
        
    if not re.search(r"\b\d+%\b|\b\d+\s*(?:dollars|usd)\b", text_lower):
        suggestions.append("Quantify your achievements with numbers or percentages.")
        
    # Guarantee at least something
    if not suggestions:
        suggestions.append("Tailor your resume headline more towards specific job roles.")
        
    return {
        "ats_score": ats_score,
        "extracted_skills": extracted_skills if extracted_skills else ["No technical skills detected"],
        "missing_keywords": missing_keywords,
        "missing_skills": missing_skills,
        "improvement_suggestions": suggestions
    }

def _fallback_mock_response():
    import random
    return {
        "ats_score": random.randint(40, 75),
        "extracted_skills": ["Python", "SQL", "Git"],
        "missing_keywords": ["Agile", "REST API"],
        "missing_skills": ["Docker", "AWS", "React"],
        "improvement_suggestions": [
            "We could not fully parse your PDF. Are you sure it's text-based?",
            "Quantify your achievements with numbers."
        ]
    }
