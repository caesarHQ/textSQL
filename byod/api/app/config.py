from os import getenv

import openai
import pinecone
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DB_URL = getenv("DB_URL")
OPENAI_KEY = getenv("OPENAI_KEY")
PINECONE_KEY = getenv("PINECONE_KEY")
PINECONE_ENV = getenv("PINECONE_ENV")

openai.api_key = OPENAI_KEY

class FlaskAppConfig:
    CORS_HEADERS = 'Content-Type'
    SQLALCHEMY_DATABASE_URI = DB_URL
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}


ENGINE = create_engine(DB_URL)

if PINECONE_KEY and PINECONE_ENV:
    pinecone.init(
        api_key=PINECONE_KEY,
        environment=PINECONE_ENV
    )