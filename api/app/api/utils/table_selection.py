import json
from typing import List
from .messages import get_assistant_message, extract_code_from_markdown
from .table_details import get_table_schemas
from .few_shot_examples import get_few_shot_example_messages


MSG_WITH_DESCRIPTIONS = (
    "Return a JSON object with relevant SQL tables for answering the following natural language query: {natural_language_query}"
    " Respond in JSON format with your answer in a field named \"tables\" which is a list of strings."
    " Respond with an empty list if you cannot identify any relevant tables."
    " Write your answer in markdown format."
    "\n"
    "The following are descriptions of available tables:\n"
    "---------------------\n"
    "{table_details}"
    "---------------------\n"
)

DEFAULT_MESSAGES = [
    {
        "role": "system",
        "content": (
                "You are a helpful assistant for identifying relevant SQL tables to use for answering a natural language query."
                " You respond in JSON format with your answer in a field named \"tables\" which is a list of strings."
                " Respond with an empty list if you cannot identify any relevant tables."
                " Write your answer in markdown format."
                "\n"
                "The following are descriptions of available tables:\n"
                + get_table_schemas()
            )
    },
]
DEFAULT_MESSAGES.extend(get_few_shot_example_messages("table_selection"))


def get_relevant_tables(natural_language_query) -> List[str]:
    """
    Identify relevant tables for answering a natural language query
    """
    content = MSG_WITH_DESCRIPTIONS.format(
        natural_language_query=natural_language_query,
        table_details=get_table_schemas()
        )

    messages = DEFAULT_MESSAGES.copy()
    messages.append({
        "role": "user",
        "content": content
    })

    assistant_message_content = get_assistant_message(messages=messages)['message']['content']
    tables_json_str = extract_code_from_markdown(assistant_message_content)
    tables = json.loads(tables_json_str).get('tables')
    return tables