from functools import wraps
import os
import json
from app.config import CREDS, update_engine, ENV

# wrapper function; if ENV is localhost returns it, else returns None


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
    return {
        "creds": CREDS, 'status': 'success'
    }


@localhost_only
def set_db_credentials(new_db_url):
    """
    Set database credentials in request body
    """

    return update_engine(new_db_url)
