from functools import wraps
import json
import pinecone

from app.config import CREDS, update_engine, ENV, load_openai_key, CREDS_PATH, start_pinecone
from app import utils

# wrapper function; if ENV is localhost returns it, else returns None


def localhost_only(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if ENV == "localhost":
            return f(*args, **kwargs)
        else:
            return {"error": "This requires a localhost connection for dev purposes"}
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

    if db_credentials["username"] == "":
        db_credentials["username"] = None
    if db_credentials["password"] == "":
        db_credentials["password"] = None

    # if it's localhost and no username/password is provided
    if db_credentials["address"] == "localhost" and not db_credentials["username"] and not db_credentials["password"]:
        db_connection_string = f"postgresql://{db_credentials['address']}:{db_credentials['port']}/{db_credentials['database']}"
        print('db connection string: ', db_connection_string)
    else:
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
def set_pinecone_credentials(request_body):
    """
    Set pinecone credentials in request body
    """

    pc_index = request_body.get("index")
    pc_key = request_body.get("key")
    pc_env = request_body.get("env")

    if not pc_index or not pc_key:
        error_msg = f"`index` or `key` is missing from request body"
        raise Exception(error_msg)

    return start_pinecone(
        pinecone_key=pc_key,
        pinecone_index=pc_index,
        pinecone_environment=pc_env
    )


@localhost_only
def get_pinecone_credentials():
    """
    Get pinecone credentials from request body
    """
    return {
        'status': 'success', 'PINECONE_INDEX': CREDS.get("PINECONE_INDEX"), 'PINECONE_KEY': CREDS.get("PINECONE_KEY"), 'PINECONE_ENV': CREDS.get("PINECONE_ENV")
    }


@localhost_only
def get_tables():
    """
    Get tables from database
    """
    # check if the table exists
    try:
        print('checking for existing table metadata')
        with open(CREDS_PATH + '/json/table_metadata.json', 'r') as f:
            tables = json.load(f)
            if len(tables) == 0:
                raise Exception('no tables found')
            parsed_results = []
            for key in tables:
                parsed_results.append(tables[key])
            tables = parsed_results
    except:
        print('no table metadata found, pulling from database')
        tables = []
        for table_name in utils.get_table_names():
            new_table = utils.generate_table_metadata(table_name)
            tables.append(new_table)

    tables = sorted(tables, key=lambda k: k['name'])

    return {
        'status': 'success', 'tables': tables
    }


@localhost_only
def clear_table_data():
    """
    Clear local table data
    """
    print('clearing table')
    try:
        with open(CREDS_PATH + '/json/table_metadata.json', 'r') as f:
            with open(CREDS_PATH + '/json/backups/table_metadata_backup.json', 'w') as f2:
                f2.write(f.read())
    except:
        pass

    print('wooo')

    with open(CREDS_PATH + '/json/table_metadata.json', 'w') as f:
        json.dump({}, f)

    return {
        'status': 'success'
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


@localhost_only
def get_examples():
    """
    load the examples from pinecone
    """

    # check if we have the pinecone credentials (if not, we can't load examples)
    if not CREDS.get("PINECONE_INDEX") or not CREDS.get("PINECONE_KEY") or not CREDS.get("PINECONE_ENV"):
        return {
            'status': 'failure', 'message': 'pinecone is not loaded yet'
        }
    index = pinecone.Index(CREDS.get('PINECONE_INDEX'))
    res = index.query([0]*1536, top_k=10000,
                      include_metadata=True, filter={'purpose': 'example'})

    formatted_results = [
        {'sql': x['metadata'].get('sql', ''), 'query':x['metadata'].get('query', '')} for x in res['matches']]

    return {'status': 'success', 'examples': formatted_results}


@localhost_only
def save_example(example):
    """
    save example ({query, sql}) to pinecone
    """

    query = example['query']
    sql = example['sql']

    # check if we have the pinecone credentials (if not, we can't load examples)
    if not CREDS.get("PINECONE_INDEX") or not CREDS.get("PINECONE_KEY") or not CREDS.get("PINECONE_ENV"):
        return {
            'status': 'failure', 'message': 'pinecone is not loaded yet'
        }
    # get the embeddings for the query
    res = utils.save_example_to_pinecone(query, sql)

    return {'status': 'success'}
