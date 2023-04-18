from functools import wraps
import json

from app.config import CREDS, update_engine, ENV, load_openai_key, CREDS_PATH
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
    # check if the table exists
    try:
        with open(CREDS_PATH + '/json/table_metadata.json', 'r') as f:
            tables = json.load(f)
            parsed_results = []
            for key in tables:
                parsed_results.append(tables[key])
            tables = parsed_results
    except:
        tables = []
        for table_name in utils.get_table_names():
            new_table = utils.generate_table_metadata(table_name)
            tables.append(new_table)

    return {
        'status': 'success', 'tables': tables
    }


@localhost_only
def save_tables(new_tables):
    """
    Save tables to local json file
    """
    with open(CREDS_PATH + '/json/table_metadata.json', 'w') as f:
        reformatted_tables = {}
        for table in new_tables:
            reformatted_tables[table['name']] = table
        json.dump(reformatted_tables, f, indent=4)

    return {
        'status': 'success', 'message': 'save worked'
    }


@localhost_only
def load_enums():
    """
    Load enums from local json file
    """

    enums = utils.list_all_enums()

    with open(CREDS_PATH + '/json/type_metadata.json', 'w') as f:
        json.dump(enums, f, indent=4)

    return {
        'status': 'success', 'enums': enums
    }
