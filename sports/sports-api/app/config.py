from os import getenv
import json
import openai
import pinecone
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

PINECONE_KEY = getenv("PINECONE_KEY")
PINECONE_ENV = getenv("PINECONE_ENV")
DB_MANAGED_METADATA = getenv("DB_MANAGED_METADATA")
DB_MANAGED_METADATA = False if DB_MANAGED_METADATA is None else DB_MANAGED_METADATA.lower() == 'true'
ENV = getenv("ENV")


CREDS_PATH = "./app/models/"
try:
    with open(CREDS_PATH + 'creds.json') as f:
        CREDS = json.load(f)
except:
    CREDS = {}

OPENAI_KEY = CREDS.get("OPENAI_API_KEY") or getenv("OPENAI_API_KEY")


def load_openai_key(new_openai_key=None):
    global OPENAI_KEY
    if new_openai_key:
        OPENAI_KEY = new_openai_key
        with open(CREDS_PATH + 'creds.json', 'w') as f:
            CREDS["OPENAI_API_KEY"] = OPENAI_KEY
            json.dump(CREDS, f)
    else:
        OPENAI_KEY = CREDS.get("OPENAI_API_KEY") or getenv("OPENAI_API_KEY")
    openai.api_key = OPENAI_KEY


load_openai_key()


DB_URL = CREDS.get("DB_URL")

if DB_URL:
    ENGINE = create_engine(DB_URL)
else:
    ENGINE = None


def update_engine(new_db_url):
    global ENGINE, DB_URL
    DB_URL = new_db_url
    try:
        NEW_ENGINE = create_engine(new_db_url)
        # try to get the current user
        with NEW_ENGINE.connect() as connection:
            connection = connection.execution_options(
                postgresql_readonly=True
            )
            with connection.begin():
                sql_text = text(f"""SELECT CURRENT_USER;""")
                connection.execute(sql_text)

        # if we got here, the new engine is valid
        ENGINE = create_engine(new_db_url)
        with open(CREDS_PATH + 'creds.json', 'w') as f:
            CREDS["DB_URL"] = new_db_url
            json.dump(CREDS, f)

    except Exception as e:
        raise e


class FlaskAppConfig:
    CORS_HEADERS = "Content-Type"
    SQLALCHEMY_DATABASE_URI = DB_URL or "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


if PINECONE_KEY and PINECONE_ENV:
    pinecone.init(
        api_key=PINECONE_KEY,
        environment=PINECONE_ENV
    )
