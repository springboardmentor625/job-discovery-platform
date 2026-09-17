"""
Real AI-powered ATS scoring using Groq (an LLM API, OpenAI-compatible).
This replaces keyword-matching with an actual language model reading the
resume and job description and reasoning about the match.

Requires GROQ_API_KEY in your .env file. Get one at https://console.groq.com

NOTE: I can't test the live API call in my own environment since I don't
have your API key — the request shape below follows Groq's documented
chat-completions format exactly, but the first live call is on you to
verify. If it errors, paste me the traceback and I'll fix it.
"""
import json

from decouple import config
from groq import Groq

GROQ_API_KEY = config("GROQ_API_KEY", default="")
GROQ_MODEL = config("GROQ_MODEL", default="openai/gpt-oss-20b")  # configurable in case Groq changes availability again

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
    """
    Returns a dict: {match_score, matching_skills, missing_skills, suggestion}
    or {"error": "..."} if Groq isn't configured or the call fails.
    """
    if not GROQ_API_KEY:
        return {
            "error": "GROQ_API_KEY is not set in .env — add it to enable AI ATS scoring."
        }

    prompt = PROMPT_TEMPLATE.format(
        job_title=job.title,
        job_description=job.description,
        job_skills=", ".join(job.skills_required),
        resume_text=(resume_text or "")[:6000],  # keep the request a reasonable size
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
    except Exception as exc:  # noqa: BLE001 — surface any Groq/network error to the caller
        return {"error": f"Groq request failed: {exc}"}


DESCRIPTION_CLEANUP_PROMPT = """The job description below was scraped from a job board and may have \
formatting problems: run-together words with missing spaces, jumbled section \
headers mashed into sentences, repeated staffing-agency boilerplate, or \
abrupt cut-offs. Rewrite it as a clean, well-organized description using \
ONLY facts that are actually present in the original text below — do not \
invent or assume any details that aren't there. Use short paragraphs with \
blank lines between them, and where the original clearly has distinct \
sections (like responsibilities vs requirements), use a short bold-style \
heading in plain text (no markdown symbols) for each. If the original is \
genuinely cut off mid-sentence, just end cleanly at the last complete \
thought — don't invent an ending. Respond with ONLY the cleaned text, no \
preamble, no explanation, no markdown fences.

JOB TITLE: {job_title}

ORIGINAL DESCRIPTION:
{raw_description}
"""


def clean_job_description(job):
    """
    Returns a cleaned-up version of job.description as a plain string, or
    None if Groq isn't configured or the call fails — callers should fall
    back to the raw description in that case, not show an error to the user
    for what's a nice-to-have polish step.
    """
    if not GROQ_API_KEY:
        return None

    prompt = DESCRIPTION_CLEANUP_PROMPT.format(
        job_title=job.title,
        raw_description=(job.description or "")[:6000],
    )

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        cleaned = response.choices[0].message.content.strip()
        return cleaned or None
    except Exception:  # noqa: BLE001 — this is a polish step, fail silently to raw text
        return None