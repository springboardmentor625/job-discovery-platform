import os
import json

from groq import Groq
from django.conf import settings

client = Groq(api_key=settings.GROQ_API_KEY)


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

    try:

        response = client.chat.completions.create(

            model="openai/gpt-oss-20b",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            reasoning_effort="medium",
            temperature=0.3,

            response_format={
                "type": "json_object"
            }

        )

        return json.loads(
            response.choices[0].message.content
        )

    except Exception as e:

        return {
            "summary": "Unable to generate AI feedback.",
            "strengths": [],
            "improvements": [str(e)]
        }