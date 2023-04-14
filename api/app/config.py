from os import getenv

import openai
import pinecone
from dotenv import load_dotenv
from sqlalchemy import create_engine

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

load_dotenv()

ENV = getenv("ENVIRONMENT") or "unknown"
DB_URL = getenv("DB_URL")
OPENAI_KEY = getenv("OPENAI_KEY")
PINECONE_KEY = getenv("PINECONE_KEY")
PINECONE_ENV = getenv("PINECONE_ENV")
EVENTS_URL = getenv("EVENTS_URL")
SENTRY_URL = getenv("SENTRY_URL")

if SENTRY_URL:
    sentry_sdk.init(
    dsn=SENTRY_URL,
    environment=ENV,
    integrations=[
        FlaskIntegration(),
    ],
    traces_sample_rate=1.0
)


openai.api_key = OPENAI_KEY

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

if EVENTS_URL:
    EVENTS_ENGINE = create_engine(EVENTS_URL)
else:
    EVENTS_ENGINE = None

if PINECONE_KEY and PINECONE_ENV:
    pinecone.init(
        api_key=PINECONE_KEY,
        environment=PINECONE_ENV,
    )