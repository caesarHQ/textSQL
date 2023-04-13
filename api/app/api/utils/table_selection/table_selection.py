import json
import re
from typing import List

import pinecone
from openai.embeddings_utils import get_embedding

from ....config import PINECONE_ENV, PINECONE_KEY
from ..few_shot_examples import get_few_shot_example_messages
from ..messages import get_assistant_message
from .table_details import get_table_schemas


def _extract_text_from_markdown(text):
    matches = re.findall(r"```([\s\S]+?)```", text)
    if matches:
        return matches[0]
    return text

def _get_table_selection_message_with_descriptions(scope="USA"):
    message = (
        """
        Return a JSON object with relevant SQL tables for answering the following natural language query:
        ---------------
        {natural_language_query}
        ---------------
        Respond in JSON format with your answer in a field named \"tables\" which is a list of strings.
        Respond with an empty list if you cannot identify any relevant tables.
        Write your answer in markdown format.
        """
    )
    return (
        message +
        f"""
        The following are descriptions of available tables and enums:
        ---------------------
        {get_table_schemas(scope=scope)}
        ---------------------
        """
    )
    

def _get_table_selection_messages(scope="USA"):
    if scope == "USA":
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
                + get_table_schemas(scope=scope) +
                "---------------------\n"
            )
        }]
    else:
        default_messages = []
    default_messages.extend(get_few_shot_example_messages(mode="table_selection", scope=scope))
    return default_messages


def get_relevant_tables_from_pinecone(natural_language_query, scope="USA") -> List[str]:
    vector = get_embedding(natural_language_query, "text-embedding-ada-002")

    if scope == "SF":
        index_name = "sf-gpt"
    elif scope == "USA":
        index_name = "usa-gpt"

    results = pinecone.Index(index_name).query(
        vector=vector,
        top_k=5,
        include_metadata=True,
    )

    tables_set = set()
    for result in results["matches"]:
        for table_name in result.metadata["table_names"]:
            tables_set.add(table_name)

    if scope == "USA" or scope == "SF":
        if len(tables_set) == 1 and "crime_by_city" in tables_set:
            pass
        else:
            tables_set.add("location_data")
    
    return list(tables_set)

def get_relevant_tables_from_lm(natural_language_query, scope="USA", model="gpt-3.5-turbo"):
    """
    Identify relevant tables for answering a natural language query via LM
    """
    content = _get_table_selection_message_with_descriptions(scope).format(
        natural_language_query=natural_language_query,
    )

    messages = _get_table_selection_messages(scope).copy()
    messages.append({
        "role": "user",
        "content": content
    })

    tables_json_str = _extract_text_from_markdown(
        get_assistant_message(
            messages=messages,
            model=model,
            scope=scope,
            purpose="table_selection"
        )["message"]["content"]
    )

    try:
        tables = json.loads(tables_json_str).get("tables")
    except:
        tables = []
    return tables


def get_relevant_tables(natural_language_query, scope="USA") -> List[str]:
    """
    Identify relevant tables for answering a natural language query
    """


    # temporary hack to always use LM for SF
    if scope == "SF":
        # model = "gpt-4"
        model = "gpt-3.5-turbo"
        return get_relevant_tables_from_lm(natural_language_query, scope, model)

    if PINECONE_KEY and PINECONE_ENV:
        return get_relevant_tables_from_pinecone(natural_language_query, scope=scope)
    
    if scope == "SF":
        # model = "gpt-4"
        model = "gpt-3.5-turbo"
    else:
        model = "gpt-3.5-turbo"

    return get_relevant_tables_from_lm(natural_language_query, scope, model)

async def get_relevant_tables_async(natural_language_query, scope="USA") -> List[str]:
    """
    Identify relevant tables for answering a natural language query
    """

    # temporary hack to always use LM for SF
    if scope == "SF":
        # model = "gpt-4"
        model = "gpt-3.5-turbo"
        return get_relevant_tables_from_lm(natural_language_query, scope, model)

    if PINECONE_KEY and PINECONE_ENV:
        return get_relevant_tables_from_pinecone(natural_language_query, scope=scope)
    
    if scope == "SF":
        # model = "gpt-4"
        model = "gpt-3.5-turbo"
    else:
        model = "gpt-3.5-turbo"

    return get_relevant_tables_from_lm(natural_language_query, scope, model)
