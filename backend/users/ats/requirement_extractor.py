import re


def clean_text(text):
    """
    Clean job description text before processing.
    """

    if not text:
        return ""

    # Replace HTML entities such as &amp;
    text = text.replace("&amp;", "&")

    # Replace multiple spaces/newlines with a single space
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def extract_requirement_sections(description):
    """
    Identify requirement-related portions of a job description.

    The complete description remains the source.
    We do not depend on one specific section such as 'Skill:'.
    """

    text = clean_text(description)

    if not text:
        return {
            "full_text": "",
            "requirement_text": "",
        }

    requirement_parts = []

    # Look for common requirement-related headings.
    headings = [
        "requirements",
        "required skills",
        "required qualifications",
        "qualifications",
        "skills required",
        "technical skills",
        "experience required",
    ]

    lower_text = text.lower()

    for heading in headings:

        position = lower_text.find(heading)

        if position != -1:

            section = text[position:]

            requirement_parts.append(section)

    # If no recognizable requirement heading exists,
    # keep the complete description as the source.
    if requirement_parts:

        requirement_text = " ".join(
            requirement_parts
        )

    else:

        requirement_text = text

    return {
        "full_text": text,
        "requirement_text": requirement_text,
    }