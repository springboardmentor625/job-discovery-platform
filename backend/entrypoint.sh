#!/bin/sh

set -e

echo "Starting database setup..."

echo "Running database migrations..."
python manage.py migrate --noinput --verbosity 0

echo "Importing jobs..."
python manage.py import_jobs --verbosity 1

echo "Checking imported jobs..."
python manage.py shell -c "from candidates.models import Job; print('Total jobs:', Job.objects.count())"

echo "Starting SwipeX Django API server..."

if command -v gunicorn > /dev/null 2>&1; then
    exec gunicorn config.wsgi:application \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers 1 \
        --threads 2 \
        --timeout 120
else
    exec python manage.py runserver 0.0.0.0:${PORT:-8000}
fi