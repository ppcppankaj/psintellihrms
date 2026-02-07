#!/bin/bash
set -e

echo "🚀 Starting PS IntelliHR Backend..."

# Wait for DB
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "⏳ Waiting for Postgres..."
  sleep 2
done

echo "✅ Postgres ready"

# Migrate
python manage.py migrate --noinput

python manage.py collectstatic --noinput


case "$1" in
  web|"")
    exec python manage.py runserver 0.0.0.0:8000
    ;;
  celery-worker)
    exec celery -A config worker -l info
    ;;
  celery-beat)
    exec celery -A config beat -l info
    ;;
  *)
    exec "$@"
    ;;
esac
