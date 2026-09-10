import os
import json

from groq import Groq
from django.conf import settings


def generate_resume_feedback(
    parsed_resume,
    ats_score,
    missing_skills,
):
    """
    Generate AI-powered resume improvement suggestions.
    """

    prompt = f"""
You are an expert ATS resume reviewer.

Candidate Details

Skills:
{", ".join(parsed_resume.get("skills", []))}

Experience:
{parsed_resume.get("experience", "")}

Education:
{parsed_resume.get("education", "")}

Projects:
{parsed_resume.get("projects", [])}

ATS Score:
{ats_score}

Missing Skills:
{", ".join(missing_skills)}

Give your response ONLY as valid JSON.

Format:

{{
  "summary":"...",
  "strengths":[
      "...",
      "..."
  ],
  "improvements":[
      "...",
      "...",
      "..."
  ]
}}
"""

    groq_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if not groq_key:
        return {
            "summary": "Resume parsed successfully. Review suggestions below to improve ATS readiness.",
            "strengths": ["Clear technical background", "Identified core competencies"],
            "improvements": [
                "Include quantifiable achievements in your work experience (e.g. 'boosted efficiency by 25%').",
                "Ensure standard section headings (Skills, Experience, Education, Projects) for ATS parsers.",
                "Tailor resume keywords to match specific job descriptions you are targeting."
            ]
        }

    try:
        client = Groq(api_key=groq_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            response_format={
                "type": "json_object"
            }
        )

        return json.loads(
            response.choices[0].message.content
        )

    except Exception as e:
        print("GROQ API WARNING/FALLBACK:", repr(e))
        return {
            "summary": "Resume parsed successfully. Apply these suggestions to optimize your ATS visibility.",
            "strengths": [
                "Technical skills successfully extracted",
                "Relevant education and project history detected"
            ],
            "improvements": [
                "Add measurable metrics and impact to your project bullet points.",
                "Incorporate targeted industry keywords from your desired job listings.",
                "Consider highlighting industry certifications to validate your skill set."
            ]
        }