import os
import json

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def extract_resume_information(resume_text):

    prompt = f"""
You are an expert resume information extraction system.

Extract structured information from the resume below.

Return ONLY valid JSON.

The JSON must contain exactly these fields:

{{
    "skills": [],
    "experience": [],
    "education": [],
    "projects": []
}}

Rules:

1. skills:
   Extract technical and professional skills explicitly mentioned.

2. experience:
   Each item must contain:
   "company", "role", "duration", "description"

3. education:
   Each item must contain:
   "degree", "institution", "year"

4. projects:
   Each item must contain:
   "name", "description", "technologies"

5. Do not invent information.

6. If information is unavailable, use an empty array.

7. Keep descriptions very short.

8. Experience descriptions must be maximum 20 words.

9. Project descriptions must be maximum 25 words.

10. Do not use newline characters inside JSON string values.

11. Do not repeat information.

12. Return the complete JSON object.

13. Return ONLY JSON.
Do NOT return markdown.
Do NOT return ```json.
Do NOT return explanations.

RESUME:

{resume_text}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        max_completion_tokens=4000,
        reasoning_effort="low",
        reasoning_format="hidden",
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)

    except json.JSONDecodeError as e:

        print("\n========== LLM INVALID JSON ==========")
        print(content)
        print("======================================")
        print("JSON ERROR:", str(e))
        print("======================================\n")

        raise ValueError(
            f"LLM returned invalid JSON: {str(e)}"
        )