import json
import re
from typing import List

import pinecone
from app.extensions import db
from app.models.table_metadata import TableMetadata
from app.models.type_metadata import TypeMetadata
from openai.embeddings_utils import get_embedding
from flask import current_app

from ..utils import get_assistant_message, get_few_shot_messages


TYPES_METADATA_DICT = {}
TABLES_METADATA_DICT = {}
def setup_metadata_dicts():
    """
    Setup metadata dicts for tables and types
    """
    global TYPES_METADATA_DICT
    global TABLES_METADATA_DICT

    try:
        types_metadata = TypeMetadata.query.all()
    except Exception as e:
        print(e)
        types_metadata = []
    for type_metadata in types_metadata:
        TYPES_METADATA_DICT[type_metadata.type_name] = type_metadata

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
    tables_to_use = []

    for table_name in table_names:
        tables_to_use.append(TABLES_METADATA_DICT.get(table_name))
    if not tables_to_use:
        tables_to_use = TABLES_METADATA_DICT.values()

    custom_types_to_use = set()
    tables_str_list = []
    for table in tables_to_use:
        tables_str = f"table name: {table.table_name}\n"
        if table.table_metadata.get("description"):
            tables_str += f"table description: {table.table_metadata.get('description')}\n"
        columns_str_list = []
        for column in table.table_metadata.get("columns", []):
            columns_str_list.append(f"{column['name']} [{column['type']}]")
            if column.get("type") in TYPES_METADATA_DICT.keys():
                custom_types_to_use.add(column.get("type"))
        tables_str += f"table columns: {', '.join(columns_str_list)}\n"
        tables_str_list.append(tables_str)
    tables_details = "\n\n".join(tables_str_list)

    custom_types_str_list = []
    for custom_type_str in custom_types_to_use:
        custom_type = TYPES_METADATA_DICT.get(custom_type_str)
        if custom_type:
            custom_types_str = f"custom type: {custom_type.type_name}\n"
            custom_types_str += f"valid values: {', '.join(custom_type.type_metadata.get('valid_values'))}\n"
            custom_types_str_list.append(custom_types_str)
    custom_types_details = "\n\n".join(custom_types_str_list)

    return custom_types_details + "\n\n" + tables_details


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
        "The following are descriptions of available tables and custom types:\n"
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
            "The following are descriptions of available tables and custom types:\n"
            "---------------------\n"
            + get_table_schemas_str() +
            "---------------------\n"
        )
    }]
    default_messages.extend(get_few_shot_messages(mode="table_selection"))
    return default_messages


def _extract_text_from_markdown(text):
    matches = re.findall(r"`([\s\S]+?)`", text)
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