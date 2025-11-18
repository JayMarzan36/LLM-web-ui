#!/bin/sh
set -e

echo "Starting entrypoint: applying migrations and collecting static files"

# Wait for DB if needed (sqlite doesn't need waiting)

python _server/manage.py migrate --noinput

# Collect static files (may be a no-op depending on settings)
python _server/manage.py collectstatic --noinput || true

echo "Starting Gunicorn..."
# Ensure Gunicorn runs with the Django project directory on the Python path
# so the inner `_server` package is importable. Use --chdir to change
# Gunicorn's working directory to the project root that contains manage.py
exec gunicorn _server.wsgi:application --chdir /app/_server --bind 0.0.0.0:8000 --workers 3
