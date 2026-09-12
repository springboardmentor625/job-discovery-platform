"""
Real AI-powered ATS scoring using Groq (an LLM API, OpenAI-compatible).
Requires GROQ_API_KEY in your .env file. Get one at https://console.groq.com
"""
import json

from decouple import config
from groq import Groq

GROQ_API_KEY = config("GROQ_API_KEY", default="")
GROQ_MODEL = "llama-3.1-8b-instant"

PROMPT_TEMPLATE = """You are an ATS (Applicant Tracking System) analyzer. \
Compare the candidate's resume against the job description below and \
respond with ONLY a JSON object (no other text, no markdown fences) in \
exactly this shape:

{{
  "match_score": <integer 0-100>,
  "matching_skills": [<strings>],
  "missing_skills": [<strings>],
  "suggestion": "<one or two sentences of concrete advice to improve the match>"
}}

JOB TITLE: {job_title}

JOB DESCRIPTION:
{job_description}

REQUIRED SKILLS: {job_skills}

RESUME TEXT:
{resume_text}
"""


def get_ats_score(resume_text, job):
    if not GROQ_API_KEY:
        return {
            "error": "GROQ_API_KEY is not set in .env — add it to enable AI ATS scoring."
        }

    prompt = PROMPT_TEMPLATE.format(
        job_title=job.title,
        job_description=job.description,
        job_skills=", ".join(job.skills_required),
        resume_text=(resume_text or "")[:6000],
    )

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except json.JSONDecodeError:
        return {"error": "Groq returned a response that wasn't valid JSON."}
    except Exception as exc:
        return {"error": f"Groq request failed: {exc}"}