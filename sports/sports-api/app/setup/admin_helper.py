from functools import wraps
import os
import json
from app.config import ENV, update_engine

# wrapper function; if ENV is localhost returns it, else returns None

CREDS_PATH = "./app/models/creds.json"


def localhost_only(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if ENV == "localhost":
            return f(*args, **kwargs)
        else:
            return None
    return wrapper


@localhost_only
def get_db_credentials():
    """
    Get database credentials from request body
    """

    with open(CREDS_PATH) as f:
        creds = json.load(f)
    return {
        "creds": creds, 'status': 'success'
    }


@localhost_only
def set_db_credentials(new_creds):
    """
    Set database credentials in request body
    """
    with open(CREDS_PATH, 'w') as f:
        json.dump(new_creds, f)
    return {
        "status": "success"
    }
