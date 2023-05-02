import json
import re
from typing import List

import pinecone
from app.config import DB_MANAGED_METADATA
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

    if not DB_MANAGED_METADATA:
        try:
            with open("app/models/json/table_metadata.json", "r") as f:
                TABLES_METADATA_DICT = json.load(f)
        except:
            TABLES_METADATA_DICT = {}
        try:
            with open("app/models/json/type_metadata.json", "r") as f:
                ENUMS_METADATA_DICT = json.load(f)
        except:
            ENUMS_METADATA_DICT = {}
        return

    try:
        enums_metadata = TypeMetadata.query.all()
    except Exception as e:
        print(e)
        enums_metadata = []
    for enum_metadata in enums_metadata:
        # ENUMS_METADATA_DICT[enum_metadata.type_name] = enum_metadata
        ENUMS_METADATA_DICT[enum_metadata.type_name] = enum_metadata.type_metadata

    try:
        tables_metadata = TableMetadata.query.all()
    except Exception as e:
        print(e)
        tables_metadata = []
    for table_metadata in tables_metadata:
        # TABLES_METADATA_DICT[table_metadata.table_name] = table_metadata
        TABLES_METADATA_DICT[table_metadata.table_name] = table_metadata.table_metadata


def save_tables_metadata_to_json():
    with open("app/models/json/table_metadata.json", "w") as f:
        json.dump(TABLES_METADATA_DICT, f, indent=4)


def save_enums_metadata_to_json():
    with open("app/models/json/type_metadata.json", "w") as f:
        json.dump(ENUMS_METADATA_DICT, f, indent=4)

# # TODO: load few shot from json
# def save_few_shots_to_json():
#     with open("app/models/json/in_context_examples.json", "w") as f:
#         json.dump(IN_CONTEXT_EXAMPLES_DICT, f, indent=4)


# TODO: refac this to access JSON fields instead of tables
def get_table_schemas_str(table_names: List[str] = []) -> str:
    """
    Format table and types metadata into string to be used in prompt
    """
    global ENUMS_METADATA_DICT
    global TABLES_METADATA_DICT

    if len(TABLES_METADATA_DICT) == 0:
        load_tables_and_types_metadata()

    tables_to_use = []
    if table_names:
        tables_to_use = [TABLES_METADATA_DICT[t_name]
                         for t_name in table_names]
    else:
        tables_to_use = [t for t in TABLES_METADATA_DICT.values()]

    enums_to_use = set()
    tables_str_list = []
    for table in tables_to_use:
        if not table.get('active'):
            continue
        if len(table.get("schema", "")) > 0:
            tables_str_list.append(table.get("schema"))
            continue
        tables_str = f"table name: {table['name']}\n"
        if table.get("description"):
            tables_str += f"table description: {table.get('description')}\n"
        columns_str_list = []
        for column in table.get("columns", []):
            if not column.get("active"):
                continue
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
            enums_str = f"enum: {custom_type['type']}\n"
            enums_str += f"valid values: {', '.join(custom_type.get('valid_values'))}\n"
            enums_str_list.append(enums_str)
    enums_details = "\n\n".join(enums_str_list)

    return enums_details + "\n\n" + tables_details


def get_table_names():
    global TABLES_METADATA_DICT

    if len(TABLES_METADATA_DICT) == 0:
        load_tables_and_types_metadata()

    return list(TABLES_METADATA_DICT.keys())


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


def _get_table_selection_message_with_descriptions(natural_language_query):
    return f"""
        Return a JSON object with relevant SQL tables for answering the following natural language query:
        ---------------------
        {natural_language_query}
        ---------------------
        The following are descriptions of available tables and enums:
        ---------------------
        {get_table_schemas_str()}
        ---------------------

        Make sure to write your answer in markdown format. Provide the JSON and only the JSON for the response.
        Provide any comments before the JSON, include the JSON object in a markdown code block with nothing afterwards.

        Possible Labels to Choose From:
            REGULAR: Is this asking about only regular Games?
            PRESEASON: Is this asking about only Pre Season Games?
            ALL STAR: Is this asking about only Allstar Games?
            PRESEASON: Is this asking about only Playoff Games?
            SEASON: IS this restricted to a time period?
        
        Use this format:
        ```
        {{
            "Rephrased Input": string (any assumptions about words in the input and what they refer to)
            "required answer": string[] (the final variables that will be needed)
            "input conversions": string[] (the variables/tables that will be needed to interpret the input)
            "internal relations": string (describe how the required tables relate to one another and how to make sure relevant information is not lost)
            "reasoning": string (Reverse walkthrough from end to start where the information will come from (what joins are needed). Column B.A gives Y, but B doesn't have Z we need to pull D.A to get Z.))
            "double_check": string (Walking through the tables mentioned above, check that each column that will be used to find any missing columns, add any additional tables that could be useful)
            "labels": string[] //any of the labels above that apply
            "tables": string[] //max 4
        }}
        ```
        Provide this JSON and only the JSON for the response.
        """


def _get_table_selection_messages():
    # default_messages = [{
    #     "role": "system",
    #     "content": (
    #         f"""
    #         You are a helpful assistant for identifying relevant SQL tables to use for answering a natural language query.
    #         You respond in JSON format with your answer in a field named \"tables\" which is a list of strings.
    #         Respond with an empty list if you cannot identify any relevant tables.
    #         Make sure to write your answer in markdown format.
    #         The following are descriptions of available tables and enums:
    #         ---------------------
    #         {get_table_schemas_str()}
    #         ---------------------
    #         """
    #     )
    # }]
    default_messages = []
    default_messages.extend(get_few_shot_messages(mode="table_selection"))
    return default_messages


def _extract_text_from_markdown(text):
    matches = re.findall(r"```([\s\S]+?)```", text)
    if matches:
        return matches[0]
    return text


def strip_sql_comments(text):
    return re.sub(r"--.*?\n", "\n", text)


def get_relevant_tables_from_lm(natural_language_query, ignore_comments=False):
    """
    Identify relevant tables for answering a natural language query via LM. 
    """
    content = _get_table_selection_message_with_descriptions(
        natural_language_query)

    if ignore_comments:
        content = strip_sql_comments(content)

    messages = _get_table_selection_messages().copy()
    messages.append({
        "role": "user",
        "content": content
    })

    print('got messages')

    asst_message = get_assistant_message(
        messages=messages,
        model="gpt-3.5-turbo-0301",
    )["message"]["content"]

    tables_json_str = _extract_text_from_markdown(asst_message)

    tables = json.loads(tables_json_str).get("tables")

    allowable_names = get_table_names()
    tables = [t for t in tables if t in allowable_names]

    labels = json.loads(tables_json_str).get("labels")

    return tables, labels
