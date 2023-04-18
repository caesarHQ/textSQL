from functools import wraps
from app.config import CREDS, update_engine, ENV, load_openai_key
from . import utils

# wrapper function; if ENV is localhost returns it, else returns None


def localhost_only(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if ENV == "localhost":
            return f(*args, **kwargs)
        else:
            return {"error": "not allowed"}
    return wrapper


@localhost_only
def get_db_credentials():
    """
    Get database credentials from request body
    """
    return {
        'status': 'success', "DB_URL": CREDS.get("DB_URL")
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


@localhost_only
def get_openai_credentials():
    """
    Get openAI credentials from request body
    """
    return {
        'status': 'success', 'OPENAI_API_KEY': CREDS.get("OPENAI_API_KEY")
    }


@localhost_only
def set_openai_credentials(request_body):
    """
    Set openAI credentials in request body
    """
    openai_credentials = {}
    openai_credentials["OPENAI_API_KEY"] = request_body.get("OPENAI_API_KEY")

    for key, value in openai_credentials.items():
        if not value:
            error_msg = f"`{key}` is missing from request body"
            raise Exception(error_msg)

    return load_openai_key(openai_credentials["OPENAI_API_KEY"])


@localhost_only
def get_tables():
    """
    Get tables from database
    """

    tables = utils.get_table_names()

    print('raw tables', tables)

    tables = [{"name": t, "active": True} for t in tables]

    print('tables: ', tables)

    return {
        'status': 'success', 'tables': tables
    }
