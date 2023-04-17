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
def set_db_credentials(request_body):
    """
    Set database credentials in request body
    """
    db_credentials = {}
    db_credentials["address"] = request_body.get("host")
    db_credentials["database"] = request_body.get("database")
    db_credentials["username"] = request_body.get("username")
    db_credentials["password"] = request_body.get("password")
    db_credentials["port"] = request_body.get("port", 5432)

    for key, value in db_credentials.items():
        if not value:
            error_msg = f"`{key}` is missing from request body"
            raise Exception(error_msg)
    db_connection_string = f"postgresql://{db_credentials['username']}:{db_credentials['password']}@{db_credentials['address']}:{db_credentials['port']}/{db_credentials['database']}"

    return update_engine(db_connection_string)
