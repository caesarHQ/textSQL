from os import getenv
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool
import sentry_sdk
from dotenv import load_dotenv
from sentry_sdk.integrations.flask import FlaskIntegration


load_dotenv()

ENV = getenv("ENVIRONMENT") or "unknown"
DB_URL = "postgresql://census_data_user:BvgUaxoocxdDrJ9Mam4HHkacPBWLYYt9@dpg-cg59te3hp8u9l20dqd40-b.replica-cyan.oregon-postgres.render.com/census_data"
OPENAI_KEY = getenv("OPENAI_KEY")

sentry_sdk.init(
    dsn="https://0e7943646a4242138f99898cd421560e@o4504813129826304.ingest.sentry.io/4504817446617088",
    environment=ENV,
    integrations=[
        FlaskIntegration(),
    ],
    traces_sample_rate=1.0
)

class FlaskAppConfig:
    CORS_HEADERS = 'Content-Type'
    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


engine = create_engine(DB_URL)
