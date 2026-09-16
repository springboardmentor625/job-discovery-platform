#!/bin/sh

set -e

echo "Waiting for PostgreSQL database at ${DB_HOST:-db}:${DB_PORT:-5432}..."

python -c "
import socket, time, os, sys

host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', '5432'))

ready = False

for _ in range(60):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect((host, port))
        s.close()
        ready = True
        break
    except Exception:
        time.sleep(1)

if not ready:
    print('Timed out waiting for database')
    sys.exit(1)

print('PostgreSQL is ready!')
"

echo "Running database migrations..."
python manage.py migrate --noinput --verbosity 0

echo "Starting SwipeX Django API server..."
exec python manage.py runserver 0.0.0.0:${PORT:-8000}