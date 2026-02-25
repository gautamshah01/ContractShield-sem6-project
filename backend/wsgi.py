# wsgi.py — Production entry point for Gunicorn
# Gunicorn command: gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120 wsgi:app

from app import create_app, socketio  # noqa: E402

app = create_app()
