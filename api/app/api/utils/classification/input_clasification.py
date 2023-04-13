import json

from app.config import EVENTS_ENGINE
from app.api.utils.messages import call_chat
from app.api.utils.caesar_logging import log_input_classification

async def create_labels(user_input, scope="USA"):
    """
    Create labels for the user input
    """

    if not EVENTS_ENGINE:
        return {"status": "no engine"}

    user_message = f"""The user asked our database for:
----
{user_input}
----

give me a JSON object for classifying it in our database. The object needs to consist of
 {{
  topics: str[],
  categories: str[],
  locations: str[]
}}
Thanks! Provide the JSON and only the JSON. Values should be in all lowercase."""

    messages = [{"role": "user", "content": user_message}]

    assistant_message = call_chat(messages, model="gpt-3.5-turbo", scope=scope, purpose="input_classification")

    try:
        parsed = json.loads(assistant_message)
    except:
        parsed = {}

    log_input_classification(scope, user_input, parsed)

    return {"status": "success"}