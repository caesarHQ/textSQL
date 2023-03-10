from sqlalchemy import create_engine

DB_URL = "DATABASE_CONNECTION_URI"
OPENAI_KEY = "OPENAI_KEY"

class FlaskAppConfig:
    CORS_HEADERS = 'Content-Type'
    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


engine = create_engine(DB_URL, echo=True)