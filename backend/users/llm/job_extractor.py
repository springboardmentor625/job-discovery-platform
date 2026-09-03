import os
import json

from dotenv import load_dotenv
from groq import Groq


load_dotenv()


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def extract_job_requirements(job_text):

    prompt = f"""
You are an expert job requirement extraction system.

Extract the technical and professional skills required
or strongly expected for the job from the job description below.

Return ONLY valid JSON.

The JSON must contain exactly this field:

{{
    "required_skills": []
}}

Rules:

1. Extract skills explicitly required or strongly expected
   for the role.

2. Include:
   - programming languages
   - frameworks
   - libraries
   - databases
   - cloud technologies
   - DevOps tools
   - APIs
   - software engineering concepts
   - data/AI/ML technologies
   - other relevant technical skills

3. Do not include generic words such as:
   - job
   - work
   - communication
   - team
   - company

4. Do not invent skills.

5. Avoid duplicate skills.

6. Use commonly recognized skill names.

7. Return an empty array if no skills are found.

8. Return JSON only.
   No explanation.
   No markdown.
   No ```json code fences.

JOB DESCRIPTION:

{job_text}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    content = response.choices[0].message.content.strip()

    # ---------------------------------------------------------
    # CLEAN POSSIBLE MARKDOWN CODE FENCES
    # ---------------------------------------------------------

    if content.startswith("```"):
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

    # ---------------------------------------------------------
    # FIND JSON OBJECT IF EXTRA TEXT IS RETURNED
    # ---------------------------------------------------------

    start = content.find("{")
    end = content.rfind("}")

    if start != -1 and end != -1:
        content = content[start:end + 1]

    # ---------------------------------------------------------
    # PARSE JSON
    # ---------------------------------------------------------

    try:
        result = json.loads(content)

    except json.JSONDecodeError as e:
        raise ValueError(
            f"LLM returned invalid JSON: {content}"
        ) from e

    # ---------------------------------------------------------
    # VALIDATE RESPONSE
    # ---------------------------------------------------------

    if not isinstance(result, dict):
        raise ValueError(
            "LLM response is not a JSON object."
        )

    required_skills = result.get(
        "required_skills",
        []
    )

    if not isinstance(required_skills, list):
        raise ValueError(
            "required_skills must be a list."
        )

    return {
        "required_skills": required_skills
    }