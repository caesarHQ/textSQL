from os import getenv

import openai
import pinecone
import sentry_sdk
from dotenv import load_dotenv
from sentry_sdk.integrations.flask import FlaskIntegration
from sqlalchemy import create_engine

load_dotenv()

ENV = getenv("ENVIRONMENT") or "unknown"
DB_URL = getenv("DB_URL")
OPENAI_KEY = getenv("OPENAI_KEY")
PINECONE_KEY = getenv("PINECONE_KEY")
PINECONE_ENV = getenv("PINECONE_ENV")

openai.api_key = OPENAI_KEY

sentry_sdk.init(
    dsn="https://0e7943646a4242138f99898cd421560e@o4504813129826304.ingest.sentry.io/4504817446617088",
    environment=ENV,
    integrations=[
        FlaskIntegration(),
    ],
    traces_sample_rate=1.0
)

class FlaskAppConfig:
    CORS_HEADERS = "Content-Type"
    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    TIMEOUT = 60

if DB_URL:
    ENGINE = create_engine(DB_URL)
    dialect_mapping = {
        "postgresql": "PostgreSQL 15.2",
        "mysql": "MySQL",
    }
    DIALECT = dialect_mapping.get(ENGINE.dialect.name)
else:
    print('DB_URL not found, please check your environment')
    exit(1)

if PINECONE_KEY and PINECONE_ENV:
    pinecone.init(
        api_key=PINECONE_KEY,
        environment=PINECONE_ENV,
    )