import json
import re
from typing import List

import pinecone
from app.extensions import db
from app.models.table_metadata import TableMetadata
from app.models.type_metadata import TypeMetadata
from openai.embeddings_utils import get_embedding

from ..utils import get_assistant_message, get_few_shot_messages

ENUMS_METADATA_DICT = {}
TABLES_METADATA_DICT = {}
def load_tables_and_types_metadata():
    """
    Setup metadata dicts for tables and enums
    """
    global ENUMS_METADATA_DICT
    global TABLES_METADATA_DICT

    try:
        enums_metadata = TypeMetadata.query.all()
    except Exception as e:
        print(e)
        enums_metadata = []
    for enum_metadata in enums_metadata:
        ENUMS_METADATA_DICT[enum_metadata.type_name] = enum_metadata

    try:
        tables_metadata = TableMetadata.query.all()
    except Exception as e:
        print(e)
        tables_metadata = []
    for table_metadata in tables_metadata:
        TABLES_METADATA_DICT[table_metadata.table_name] = table_metadata


def get_table_schemas_str(table_names: List[str] = []) -> str:
    """
    Format table and types metadata into string to be used in prompt
    """
    global ENUMS_METADATA_DICT
    global TABLES_METADATA_DICT

    tables_to_use = []
    if table_names:
        tables_to_use = [TABLES_METADATA_DICT[t_name] for t_name in table_names]
    else:
        tables_to_use = [t for t in TABLES_METADATA_DICT.values()]

    enums_to_use = set()
    tables_str_list = []
    for table in tables_to_use:
        tables_str = f"table name: {table.table_name}\n"
        if table.table_metadata.get("description"):
            tables_str += f"table description: {table.table_metadata.get('description')}\n"
        columns_str_list = []
        for column in table.table_metadata.get("columns", []):
            columns_str_list.append(f"{column['name']} [{column['type']}]")
            if column.get("type") in ENUMS_METADATA_DICT.keys():
                enums_to_use.add(column.get("type"))
        tables_str += f"table columns: {', '.join(columns_str_list)}\n"
        tables_str_list.append(tables_str)
    tables_details = "\n\n".join(tables_str_list)

    enums_str_list = []
    for custom_type_str in enums_to_use:
        custom_type = ENUMS_METADATA_DICT.get(custom_type_str)
        if custom_type:
            enums_str = f"enum: {custom_type.type_name}\n"
            enums_str += f"valid values: {', '.join(custom_type.type_metadata.get('valid_values'))}\n"
            enums_str_list.append(enums_str)
    enums_details = "\n\n".join(enums_str_list)

    return enums_details + "\n\n" + tables_details


def get_relevant_tables_from_pinecone(natural_language_query, index_name="text_to_sql") -> List[str]:
    """
    Identify relevant tables for answering a natural language query via vector store
    """
    vector = get_embedding(natural_language_query, "text-embedding-ada-002")

    results = pinecone.Index(index_name).query(
        vector=vector,
        top_k=5,
        include_metadata=True,
    )

    table_names = set()
    for result in results["matches"]:
        for table_name in result.metadata["table_names"]:
            table_names.add(table_name)

    print(results["matches"])

    return list(table_names)


def _get_table_selection_message_with_descriptions():
    message = (
        "Return a JSON object with relevant SQL tables for answering the following natural language query: {natural_language_query}"
        " Respond in JSON format with your answer in a field named \"tables\" which is a list of strings."
        " Respond with an empty list if you cannot identify any relevant tables."
        " Write your answer in markdown format."
        "\n"
    )
    return (
        message +
        "The following are descriptions of available tables and enums:\n"
        "---------------------\n"
        + get_table_schemas_str() +
        "---------------------\n"
    )


def _get_table_selection_messages():
    default_messages = [{
        "role": "system",
        "content": (
            "You are a helpful assistant for identifying relevant SQL tables to use for answering a natural language query."
            " You respond in JSON format with your answer in a field named \"tables\" which is a list of strings."
            " Respond with an empty list if you cannot identify any relevant tables."
            " Write your answer in markdown format."
            "\n"
            "The following are descriptions of available tables and enums:\n"
            "---------------------\n"
            + get_table_schemas_str() +
            "---------------------\n"
        )
    }]
    default_messages.extend(get_few_shot_messages(mode="table_selection"))
    return default_messages


def _extract_text_from_markdown(text):
    matches = re.findall(r"```([\s\S]+?)```", text)
    if matches:
        return matches[0]
    return text


def get_relevant_tables_from_lm(natural_language_query):
    """
    Identify relevant tables for answering a natural language query via LM
    """
    content = _get_table_selection_message_with_descriptions().format(
        natural_language_query=natural_language_query,
    )

    messages = _get_table_selection_messages().copy()
    messages.append({
        "role": "user",
        "content": content
    })

    tables_json_str = _extract_text_from_markdown(
        get_assistant_message(
            messages=messages,
            model="gpt-3.5-turbo",
        )["message"]["content"]
    )
    tables = json.loads(tables_json_str).get("tables")
    return tables