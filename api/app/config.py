from os import getenv
from sqlalchemy import create_engine


DB_URL = "postgres://census_data_user:BvgUaxoocxdDrJ9Mam4HHkacPBWLYYt9@dpg-cg59te3hp8u9l20dqd40-b.replica-cyan.oregon-postgres.render.com/census_data"
OPENAI_KEY = getenv("OPENAI_KEY")

class FlaskAppConfig:
    CORS_HEADERS = 'Content-Type'
    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


engine = create_engine(DB_URL, echo=True)