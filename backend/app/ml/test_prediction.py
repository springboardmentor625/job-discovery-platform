from app.ml.predict import predict_job_match


resume_text = """
Python developer with experience in Python,
Django, React, Node.js, Docker and AWS.
"""


job_text = """
Looking for a Python developer with experience
in Python, Django and Git.
"""


score = predict_job_match(
    resume_text,
    job_text
)


print(
    f"Predicted Job Match Score: {score}%"
)