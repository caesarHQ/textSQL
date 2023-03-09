from sqlalchemy import create_engine


class FlaskAppConfig:
    CORS_HEADERS = 'Content-Type'
    SQLALCHEMY_DATABASE_URI = 'DATABASE_CONNECTION_STR'
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


engine = create_engine('DATABASE_CONNECTION_STR', echo=True)