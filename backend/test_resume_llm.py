from users.llm.resume_extractor import extract_resume_information


resume_text = """
BHANU TEJA RAJANA

Aspiring Data Science and Full Stack Developer.

Education:
B.Tech in Computer Science Engineering
XYZ University
2026

Skills:
Python, Django, React, JavaScript, HTML, CSS, MySQL, PostgreSQL,
Flask, REST API, Git, GitHub

Experience:
Software Development Intern
ABC Technologies
January 2026 - June 2026

Worked on full-stack web applications using Python, Django and React.
Developed REST APIs and integrated frontend applications with backend
services.

Projects:

SWIPEX - Job Discovery Platform
Developed a full-stack job discovery platform using React and Django.
Implemented candidate authentication, resume upload, job discovery
and ATS resume analysis.

Certifications:
Python Programming Certification
ABC Institute
"""


result = extract_resume_information(resume_text)

print("\n===== LLM RESUME EXTRACTION RESULT =====\n")

print(result)