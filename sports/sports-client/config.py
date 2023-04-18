from os import getenv

from dotenv import load_dotenv


load_dotenv()

API_BASE = getenv("API_BASE")
ADMIN_BASE = getenv("API_BASE") + "/admin"
