#!/bin/sh
set -e

echo "Starting entrypoint: applying migrations and collecting static files"

# Wait for DB if needed (sqlite doesn't need waiting)

python _server/manage.py migrate --noinput

# Collect static files (may be a no-op depending on settings)
python _server/manage.py collectstatic --noinput || true

echo "Starting Gunicorn..."
# Configurable Gunicorn options (set via env vars if desired):
#  GUNICORN_TIMEOUT (seconds) - default 120
#  GUNICORN_WORKERS - default 3
#  GUNICORN_WORKER_CLASS - default gthread (no extra deps)
#  GUNICORN_THREADS - default 4 (only used with threaded workers)

GUNICORN_TIMEOUT=${GUNICORN_TIMEOUT:-600}
GUNICORN_WORKERS=${GUNICORN_WORKERS:-3}
GUNICORN_WORKER_CLASS=${GUNICORN_WORKER_CLASS:-gthread}
GUNICORN_THREADS=${GUNICORN_THREADS:-4}

echo "gunicorn settings: timeout=${GUNICORN_TIMEOUT} workers=${GUNICORN_WORKERS} worker_class=${GUNICORN_WORKER_CLASS} threads=${GUNICORN_THREADS}"

exec gunicorn _server.wsgi:application \
	--chdir /app/_server \
	--bind 0.0.0.0:8000 \
	--workers ${GUNICORN_WORKERS} \
	--worker-class ${GUNICORN_WORKER_CLASS} \
	--threads ${GUNICORN_THREADS} \
	--timeout ${GUNICORN_TIMEOUT}
