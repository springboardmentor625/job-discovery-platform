import json

from app import app, db, Job


def migrate_required_skills():
    with app.app_context():

        jobs = Job.query.all()

        converted = 0
        already_json = 0
        empty = 0

        print("Total jobs:", len(jobs))

        for job in jobs:

            value = job.required_skills

            if not value:
                empty += 1
                continue

            # Already JSON
            try:
                parsed = json.loads(value)

                if isinstance(parsed, list):
                    already_json += 1
                    continue

            except (json.JSONDecodeError, TypeError):
                pass

            # Dataset format:
            # Python,Flask,Docker,Git
            skills = [
                skill.strip()
                for skill in value.split(",")
                if skill.strip()
            ]

            # Remove duplicates while preserving order
            skills = list(dict.fromkeys(skills))

            job.required_skills = json.dumps(
                skills,
                ensure_ascii=False
            )

            converted += 1

        db.session.commit()

        print()
        print("========== MIGRATION COMPLETE ==========")
        print("Converted:", converted)
        print("Already JSON:", already_json)
        print("Empty:", empty)


if __name__ == "__main__":
    migrate_required_skills()