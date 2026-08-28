import re
import json
import pandas as pd
from collections import Counter


DATASET_PATH = "/app/dataset/indian-job-market-dataset-2025.xlsx"
OUTPUT_PATH = "/app/skill_vocabulary.json"


def normalize_key(value):
    """Normalize a skill for comparison."""

    value = value.lower().strip()

    # Replace multiple spaces with one
    value = re.sub(r"\s+", " ", value)

    # Remove leading/trailing punctuation
    value = value.strip(" .,:;|-/")

    return value


def clean_skill(value):
    """Remove obvious garbage from a dataset skill."""

    value = str(value).strip()

    if not value:
        return None

    # Remove phone numbers
    if re.search(r"\d{7,}", value):
        return None

    # Remove URLs/emails
    if re.search(r"(https?://|www\.|@\w+\.)", value, re.IGNORECASE):
        return None

    # Remove values containing too many characters
    # These are usually descriptions rather than skills.
    if len(value) > 100:
        return None

    # Remove punctuation-only values
    if not re.search(r"[A-Za-z]", value):
        return None

    # Remove excessive punctuation
    if len(re.findall(r"[#@|]", value)) >= 3:
        return None

    # Remove obvious sentence-like values
    words = value.split()

    if len(words) > 12:
        return None

    return value


def build_vocabulary():

    print("=" * 60)
    print("SwipeX - Clean Skill Vocabulary Builder")
    print("=" * 60)

    print("\nReading dataset...")

    df = pd.read_excel(
        DATASET_PATH,
        usecols=["tagsAndSkills"]
    )

    raw_skills = (
        df["tagsAndSkills"]
        .dropna()
        .astype(str)
        .str.split(",")
        .explode()
        .str.strip()
    )

    print(f"Raw skill entries: {len(raw_skills):,}")

    # ---------------------------------------------------------
    # CLEAN
    # ---------------------------------------------------------

    cleaned = []

    for skill in raw_skills:

        skill = clean_skill(skill)

        if skill:
            cleaned.append(skill)

    print(f"After basic cleaning: {len(cleaned):,}")

    # ---------------------------------------------------------
    # COUNT NORMALIZED VALUES
    # ---------------------------------------------------------

    normalized_counts = Counter()

    display_values = {}

    for skill in cleaned:

        key = normalize_key(skill)

        if not key:
            continue

        normalized_counts[key] += 1

        # Keep the first readable version
        if key not in display_values:
            display_values[key] = skill

    # ---------------------------------------------------------
    # BUILD FINAL VOCABULARY
    # ---------------------------------------------------------

    vocabulary = {}

    for key, count in normalized_counts.items():

        vocabulary[key] = {
            "name": display_values[key],
            "frequency": count
        }

    # Sort by frequency
    vocabulary = dict(
        sorted(
            vocabulary.items(),
            key=lambda x: x[1]["frequency"],
            reverse=True
        )
    )

    # ---------------------------------------------------------
    # SAVE
    # ---------------------------------------------------------

    with open(
        OUTPUT_PATH,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            vocabulary,
            f,
            indent=2,
            ensure_ascii=False
        )

    # ---------------------------------------------------------
    # STATISTICS
    # ---------------------------------------------------------

    print(f"\nUnique normalized values: {len(vocabulary):,}")

    print(f"\nVocabulary saved to:")
    print(OUTPUT_PATH)

    print("\nTop 50 vocabulary entries:")

    for key, data in list(vocabulary.items())[:50]:

        print(
            f"{data['name']} "
            f"({data['frequency']})"
        )

    print("\n" + "=" * 60)
    print("CLEAN VOCABULARY BUILD COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    build_vocabulary()