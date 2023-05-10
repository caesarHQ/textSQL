import json
import re
from typing import List

import pinecone
from openai.embeddings_utils import get_embedding

from ....config import PINECONE_ENV, PINECONE_KEY
from ..few_shot_examples import get_few_shot_example_messages
from ..messages import get_assistant_message_from_openai
from .table_details import get_table_schemas, get_all_table_names


def _extract_text_from_markdown(text):
    matches = re.findall(r"```([\s\S]+?)```", text)
    if matches:
        return matches[0]
    return text

def _get_table_selection_message_with_descriptions(scope="USA"):
    message = (
        """
        You are an expert data scientist.
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
        The following are the scripts that created the tables and the definition of their enums:
        ---------------------
        {get_table_schemas(scope=scope)}
        ---------------------

        in your answer, provide the following information:
        
        - <one to two sentence comment explaining what tables can be relevant goes here>
        - <for each table identified, comment double checking the table is in the schema above along with what the first column in the table is or (none) if it doesn't exist. be careful that any tables suggested were actually above>
        - <if any tables were incorrectly identified, make a note here about what tables from the schema should actually be used if any>
        - the markdown formatted like this:
        ```
        <json of the tables>
        ```

        Provide only the list of related tables and nothing else after.
        """
    )
    

def _get_table_selection_messages(scope="USA"):
    # default_messages = [{
    #     "role": "system",
    #     "content": (
    #         f"""
    #         You are a helpful assistant for identifying relevant SQL tables to use for answering a natural language query.
    #         You respond in JSON format with your answer in a field named \"tables\" which is a list of strings.
    #         Respond with an empty list if you cannot identify any relevant tables.
    #         Write your answer in markdown format.
    #         The following are descriptions of available tables and enums:
    #         ---------------------
    #         {get_table_schemas(scope=scope)}
    #         ---------------------
    #         """
    #     )
    # }]
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

    if scope == "USA":
        if len(tables_set) == 1 and "crime_by_city" in tables_set:
            pass
        else:
            tables_set.add("location_data")
    
    return list(tables_set)

def get_relevant_tables_from_lm(natural_language_query, scope="USA", model="gpt-3.5-turbo", session_id=None):
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

    try:
        response = get_assistant_message_from_openai(
                messages=messages,
                model=model,
                scope=scope,
                purpose="table_selection",
                session_id=session_id,
            )["message"]["content"]
        tables_json_str = _extract_text_from_markdown(response)

        tables = json.loads(tables_json_str).get("tables")
    except:
        tables = []

    possible_tables = get_all_table_names(scope=scope)

    tables = [table for table in tables if table in possible_tables]

    # only get the first 7 tables
    tables = tables[:7]

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


async def get_relevant_tables_async(natural_language_query, scope="USA", session_id=None) -> List[str]:
    """
    Identify relevant tables for answering a natural language query
    """

    # temporary hack to always use LM for SF
    if scope == "SF":
        # model = "gpt-4"
        model = "gpt-3.5-turbo"
        return get_relevant_tables_from_lm(natural_language_query, scope, model, session_id=session_id)

    if PINECONE_KEY and PINECONE_ENV:
        return get_relevant_tables_from_pinecone(natural_language_query, scope=scope)
    
    if scope == "SF":
        # model = "gpt-4"
        model = "gpt-3.5-turbo"
    else:
        model = "gpt-3.5-turbo"

    return get_relevant_tables_from_lm(natural_language_query, scope, model)
