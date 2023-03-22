import json
from typing import List
from .messages import get_assistant_message, extract_code_from_markdown
from .table_details import get_table_schemas
from .few_shot_examples import get_few_shot_example_messages


def get_message_with_descriptions():
    return (
        "Return a JSON object with relevant SQL tables for answering the following natural language query: {natural_language_query}"
        " Respond in JSON format with your answer in a field named \"tables\" which is a list of strings."
        " Respond with an empty list if you cannot identify any relevant tables."
        " Write your answer in markdown format."
        "\n"
        "The following are descriptions of available tables and custom types:\n"
        "---------------------\n"
        "{table_details}"
        "---------------------\n"
    )
    

def get_default_messages(scope="USA"):
    default_messages = [
        {
            "role": "system",
            "content": (
                    "You are a helpful assistant for identifying relevant SQL tables to use for answering a natural language query."
                    " You respond in JSON format with your answer in a field named \"tables\" which is a list of strings."
                    " Respond with an empty list if you cannot identify any relevant tables."
                    " Write your answer in markdown format."
                    "\n"
                    "The following are descriptions of available tables and custom types:\n"
                    + get_table_schemas(scope=scope)
                )
        },
    ]
    default_messages.extend(get_few_shot_example_messages(mode="table_selection", scope=scope))
    return default_messages


def get_relevant_tables(natural_language_query, scope="USA") -> List[str]:
    """
    Identify relevant tables for answering a natural language query
    """
    content = get_message_with_descriptions().format(
        natural_language_query=natural_language_query,
        table_details=get_table_schemas(scope=scope)
        )

    messages = get_default_messages(scope=scope).copy()
    messages.append({
        "role": "user",
        "content": content
    })

    if scope == "SF":
        model = "gpt-4"
    else:
        model = "gpt-3.5-turbo"
    assistant_message_content = get_assistant_message(messages=messages, model=model)['message']['content']
    tables_json_str = extract_code_from_markdown(assistant_message_content)
    tables = json.loads(tables_json_str).get('tables')
    return tables