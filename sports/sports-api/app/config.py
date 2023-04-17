from os import getenv

import openai
import pinecone
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DB_URL = getenv("DB_URL")
OPENAI_KEY = getenv("OPENAI_KEY")
PINECONE_KEY = getenv("PINECONE_KEY")
PINECONE_ENV = getenv("PINECONE_ENV")
DB_MANAGED_METADATA = getenv("DB_MANAGED_METADATA")
DB_MANAGED_METADATA = False if DB_MANAGED_METADATA is None else DB_MANAGED_METADATA.lower() == 'true'
ENV = getenv("ENV")

openai.api_key = OPENAI_KEY


class FlaskAppConfig:
    CORS_HEADERS = "Content-Type"
    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


if DB_URL:
    ENGINE = create_engine(DB_URL)
else:
    print('DB_URL not found, please check your environment')
    exit(1)


def update_engine(new_db_url):
    global ENGINE, DB_URL
    DB_URL = new_db_url
    try:
        ENGINE = create_engine(DB_URL)
        # try to get the current user
        with ENGINE.connect() as connection:
            connection = connection.execution_options(
                postgresql_readonly=True
            )
            with connection.begin():
                sql_text = text(f"""SELECT CURRENT_USER;""")
                result = connection.execute(sql_text)
                rows = [list(r) for r in result.all()]
                return rows[0][0]

    except Exception as e:
        raise e


if PINECONE_KEY and PINECONE_ENV:
    pinecone.init(
        api_key=PINECONE_KEY,
        environment=PINECONE_ENV
    )
