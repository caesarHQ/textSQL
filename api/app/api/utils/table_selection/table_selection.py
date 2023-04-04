import json
from typing import List

import pinecone
from openai.embeddings_utils import get_embedding

from ..few_shot_examples import get_few_shot_example_messages
from ..messages import extract_code_from_markdown, get_assistant_message
from .table_details import get_table_schemas


def get_message_with_descriptions(scope="USA"):
    message = (
        "Return a JSON object with relevant SQL tables for answering the following natural language query: {natural_language_query}"
        " Respond in JSON format with your answer in a field named \"tables\" which is a list of strings."
        " Respond with an empty list if you cannot identify any relevant tables."
        " Write your answer in markdown format."
        "\n"
    )
    if scope == "USA":
        return (
        message +
        "The following are descriptions of available tables and custom types:\n"
        "---------------------\n"
        + get_table_schemas(scope=scope) +
        "---------------------\n"
        )
    else:
        return message
    

def get_default_messages(scope="USA"):
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
            + get_table_schemas(scope=scope) +
            "---------------------\n"
        )
    }]
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

    print(results["matches"])

    if scope == "USA" or scope == "SF":
        if len(tables_set) == 1 and "crime_by_city" in tables_set:
            pass
        else:
            tables_set.add("location_data")
    
    return list(tables_set)


def get_relevant_tables(natural_language_query, scope="USA") -> List[str]:
    """
    Identify relevant tables for answering a natural language query
    """
    content = get_message_with_descriptions(scope=scope).format(
        natural_language_query=natural_language_query,
        )

    messages = get_default_messages(scope=scope).copy()
    messages.append({
        "role": "user",
        "content": content
    })

    if scope == "SF":
        # model = "gpt-4"
        model = "gpt-3.5-turbo"
        return get_relevant_tables_from_pinecone(natural_language_query, scope=scope)
    elif scope == "USA":
        model = "gpt-3.5-turbo"
        return get_relevant_tables_from_pinecone(natural_language_query, scope=scope)

    assistant_message_content = get_assistant_message(messages=messages, model=model)["message"]["content"]
    tables_json_str = extract_code_from_markdown(assistant_message_content)
    tables = json.loads(tables_json_str).get('tables')
    return tables