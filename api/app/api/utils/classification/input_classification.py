import json

from app.config import EVENTS_ENGINE
from app.api.utils.messages import call_chat
from app.api.utils.caesar_logging import log_input_classification

from app.api.utils.table_selection.table_details import get_minimal_table_schemas

async def create_labels(user_input, scope="USA", parent_id=None, session_id=None) -> bool:
    """
    Create labels for the user input
    """

    if not EVENTS_ENGINE:
        return None
    
    table_prefix = get_minimal_table_schemas(scope)

    user_message = f"""The user asked our database for:
----
{user_input}
----

Our schema has the following tables (here's parts of the script to create them):
---
{table_prefix}
---

give me a JSON object for classifying it in our database as well as if we have it. The object needs to consist of
 {{
  topics: str[],
  categories: str[],
  locations: str[],
  relevant_tables_from_schema: str[],
  has_relevant_table: bool,
}}
Thanks! Provide the JSON and only the JSON. Values should be in all lowercase."""

    messages = [{"role": "user", "content": user_message}]

    assistant_message = call_chat(messages, model="gpt-3.5-turbo", scope=scope, purpose="input_classification", session_id=session_id)

    try:
        parsed = json.loads(assistant_message)
    except:
        parsed = {}

    generation_id = log_input_classification(scope, user_input, parsed, parent_id, session_id)

    # is_relevant_query = parsed.get("has_relevant_table", False)

    return generation_id