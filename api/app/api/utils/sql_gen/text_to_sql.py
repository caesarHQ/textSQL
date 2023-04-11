import json
from collections import OrderedDict
from typing import Dict, List

import joblib
import newrelic
import tiktoken
from app.config import DIALECT, ENGINE
from sqlalchemy import text

from ..few_shot_examples import get_few_shot_example_messages
from ..geo_data import city_lat_lon, neighborhood_shapes, zip_lat_lon
from ..messages import extract_sql_query_from_message, get_assistant_message
from ..table_selection.table_details import get_table_schemas
from .prompts import get_initial_prompt, get_retry_prompt

MSG_WITH_ERROR_TRY_AGAIN = (
    "Try again. "
    f"Only respond with valid {DIALECT}. Write your answer in markdown format. "
    f"The {DIALECT} query you just generated resulted in the following error message:\n"
    "{error_message}"
)

def make_default_messages(schemas: str, scope="USA"):
    default_messages = [{
        "role": "system",
        "content": get_initial_prompt(DIALECT, schemas, scope)
    }]

    default_messages.extend(get_few_shot_example_messages(mode="text_to_sql", scope=scope))
    return default_messages


def make_rephrase_msg_with_schema_and_warnings():
    return (
        "Let's start by rephrasing the query to be more analytical. Use the schema context to rephrase the user question in a way that leads to optimal query results: {natural_language_query}"
        "The following are schemas of tables you can query:\n"
        "---------------------\n"
        "{schemas}"
        "\n"
        "---------------------\n"
        "Do not include any of the table names in the query."
        " Ask the natural language query the way a data analyst, with knowledge of these tables, would."
    )

def is_read_only_query(sql_query: str):
    """
    Checks if the given SQL query string is read-only.
    Returns True if the query is read-only, False otherwise.
    """
    # List of SQL statements that modify data in the database
    modifying_statements = ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "GRANT", "TRUNCATE", "LOCK TABLES", "UNLOCK TABLES"]

    # Check if the query contains any modifying statements
    for statement in modifying_statements:
        if statement in sql_query.upper():
            return False

    # If no modifying statements are found, the query is read-only
    return True


class NotReadOnlyException(Exception):
    pass


class CityOrCountyWithoutStateException(Exception):
    pass


class NullValueException(Exception):
    pass


def execute_sql(sql_query: str):
    if not is_read_only_query(sql_query):
        raise NotReadOnlyException("Only read-only queries are allowed.")

    with ENGINE.connect() as connection:
        connection = connection.execution_options(
            postgresql_readonly=True
        )
        with connection.begin():
            sql_text = text(sql_query)
            result = connection.execute(sql_text)

        column_names = list(result.keys())
        if 'state' not in column_names and any(c in column_names for c in ['city', 'county']):
            raise CityOrCountyWithoutStateException("Include `state` in the result table, too.")

        rows = [list(r) for r in result.all()]

        # Check for null values
        for row in rows:
            for value in row:
                if value is None:
                    raise NullValueException("Make sure each value in the result table is not null.")
                
        # Add neighborhood boundaries to results that have `neighborhood`
        neighborhood_idx = None
        try:
            neighborhood_idx = column_names.index("neighborhood")
        except ValueError:
            neighborhood_idx = None
        if neighborhood_idx is not None:
            column_names.append("shape")
            for row in rows:
                neighborhood = row[neighborhood_idx]
                shape = neighborhood_shapes["neighborhoods"].get(neighborhood, {}).get("shape")
                row.append(shape)


        # Add lat and lon to zip_code
        zip_code_idx = None
        try:
            zip_code_idx = column_names.index("zip_code")
        except ValueError:
            zip_code_idx = None

        if zip_code_idx is not None:
            column_names.append("lat")
            column_names.append("long")
            for row in rows:
                zip_code = row[zip_code_idx]
                lat = zip_lat_lon.get(zip_code, {}).get('lat')
                lon = zip_lat_lon.get(zip_code, {}).get('lon')
                row.append(lat)
                row.append(lon)

        # No zip_code lat lon, so try to get city lat lon
        else:
            # Add lat and lon to city
            city_idx = None
            state_idx = None
            try:
                city_idx = column_names.index("city")
                state_idx = column_names.index("state")
            except ValueError:
                city_idx = None
                state_idx = None

            if city_idx is not None and state_idx is not None:
                column_names.append("lat")
                column_names.append("long")
                for row in rows:
                    city = row[city_idx]
                    state = row[state_idx]
                    lat = city_lat_lon.get(state, {}).get(city, {}).get('lat')
                    lon = city_lat_lon.get(state, {}).get(city, {}).get('lon')

                    if "St." in city:
                        new_city = city.replace("St.", "Saint")
                        lat = city_lat_lon.get(state, {}).get(new_city, {}).get('lat')
                        lon = city_lat_lon.get(state, {}).get(new_city, {}).get('lon')

                    row.append(lat)
                    row.append(lon)

        results = []
        for row in rows:
            result = OrderedDict()
            for i, column_name in enumerate(column_names):
                result[column_name] = row[i]
            results.append(result)

        return {
            'column_names': column_names,
            'results': results,
        }


def text_to_sql_parallel(natural_language_query, table_names, k=3, scope="USA"):
    """
    Generates K SQL queries in parallel and returns the first one that does not produce an exception.
    """
    schemas = get_table_schemas(table_names, scope)
    content = get_retry_prompt(DIALECT, natural_language_query, schemas)

    messages = make_default_messages(schemas)
    messages.append({
        "role": "user",
        "content": content
    })

    # Create K completions in parallel
    jobs = []
    for _ in range(k):
        if scope == "SF":
            # model = "gpt-4"
            model = "gpt-3.5-turbo"
        else:
            model = "gpt-3.5-turbo"
        jobs.append(joblib.delayed(get_assistant_message)(messages, 0, model))
    assistant_messages = joblib.Parallel(n_jobs=k, verbose=10)(jobs)

    # Try each completion in order
    attempts_contexts = []
    for assistant_message in assistant_messages:
        sql_query = extract_sql_query_from_message(assistant_message["message"]["content"])

        try:
            response = execute_sql(sql_query)
            # Generated SQL query did not produce exception. Return result
            return response, sql_query, messages
        except Exception as e:
            attempts_context = messages.copy()
            attempts_context.append({
                "role": "assistant",
                "content": assistant_message["message"]["content"]
            })
            attempts_context.append({
                "role": "user",
                "content": MSG_WITH_ERROR_TRY_AGAIN.format(error_message=str(e))
            })
            attempts_contexts.append(attempts_context)

        # No valid completions from initial batch. Return first attempt context
        return None, None, attempts_contexts[0]


def text_to_sql_with_retry(natural_language_query, table_names, k=3, messages=None, scope="USA"):
    """
    Tries to take a natural language query and generate valid SQL to answer it K times
    """
    if not messages:
        # ask the assistant to rephrase before generating the query
        schemas = get_table_schemas(table_names, scope)
        # rephrase = [{
        #     "role": "user",
        #     "content": make_rephrase_msg_with_schema_and_warnings().format(
        #         natural_language_query=natural_language_query,
        #         schemas=schemas
        #         )
        # }]
        # rephrased_query = get_assistant_message(rephrase)["message"]["content"]
        # print(f'[REPHRASED_QUERY] {rephrased_query}')
        # natural_language_query=rephrased_query

        content = get_retry_prompt(DIALECT, natural_language_query, schemas)
        try:
            enc = len(tiktoken.encoding_for_model("gpt-3.5-turbo").encode(content))
            newrelic.agent.add_custom_attribute("encoding_length", enc)
        except Exception as e:
            print(e)
            pass

        messages = make_default_messages(schemas, scope)
        messages.append({
            "role": "user",
            "content": content
        })

    assistant_message = None

    for _ in range(k):
        try:
            if scope == "SF":
                # model = "gpt-4"
                model = "gpt-3.5-turbo"
            else:
                model = "gpt-3.5-turbo"
            assistant_message = get_assistant_message(messages, model=model)
            sql_query = extract_sql_query_from_message(assistant_message["message"]["content"])

            response = execute_sql(sql_query)
            # Generated SQL query did not produce exception. Return result
            return response, sql_query

        except Exception as e:
            messages.append({
                "role": "assistant",
                "content": assistant_message["message"]["content"]
            })
            messages.append({
                "role": "user",
                "content": MSG_WITH_ERROR_TRY_AGAIN.format(error_message=str(e))
            })

    print(f"Could not generate {DIALECT} query after {k} tries.")
    return None, None


class NoMessagesException(Exception):
    pass

class LastMessageNotUserException(Exception):
    pass


def text_to_sql_chat_with_retry(messages, table_names=None, scope="USA"):
    """
    Takes a series of messages and tries to respond to a natural language query with valid SQL
    """
    if not messages:
        raise NoMessagesException("No messages provided.")
    if messages[-1]["role"] != "user":
        raise LastMessageNotUserException("Last message is not a user message.")
    
    # First question, prime with table schemas and rephrasing
    natural_language_query = messages[-1]["content"]
    # Ask the assistant to rephrase before generating the query
    schemas = get_table_schemas(table_names, scope)
    rephrase = [{
        "role": "user",
        "content": make_rephrase_msg_with_schema_and_warnings().format(
            natural_language_query=natural_language_query,
            schemas=schemas
            )
    }]
    rephrased_query = get_assistant_message(rephrase)["message"]["content"]

    content = get_retry_prompt(DIALECT, rephrased_query, schemas) 
    # Don't return messages_copy to the front-end. It contains extra information for prompting
    messages_copy = make_default_messages(schemas)
    messages_copy.extend(messages)
    messages_copy[-1] = {
        "role": "user",
        "content": content
    }

    # Send all messages
    response, sql_query = text_to_sql_with_retry(natural_language_query, table_names, k=3, messages=messages_copy)

    if response is None and sql_query is None:
        messages.append({
            "role": "assistant",
            "content": "Sorry, I wasn't able to answer that. Try rephrasing your question to make it more specific and easier to understand."
        })

    else:
        messages.append({
            "role": "assistant",
            "content": sql_query
        })

    return response, sql_query, messages