from sentry_sdk import capture_exception

from app.config import SENTRY_URL

def log_sentry_exception(e):
    if SENTRY_URL:
        capture_exception(e)
