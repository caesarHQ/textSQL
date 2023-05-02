
import json
import re
from collections import OrderedDict
from typing import Dict, List

import pandas as pd
from app.config import ENGINE
from app.databases import logging_db
from app.sql_generation.prompt_helpers import query_prompt, schema_prompt
from app.utils import (get_few_shot_messages, get_openai_results,
                       safe_get_sql_from_yaml)
from sqlalchemy import text


def get_retry_message(raw_message):
    error_message = raw_message.split("\n")[0]
    # print('parsed error: ', error_message)
    model_message = f"""
You are an expert SQL programmer.
    
The SQL query your student generated resulted in the following error message:
---------------------
{error_message}
---------------------

- Provide an explanation of what went wrong and provide a revised query that runs correctly. It should have each table.column specified to avoid ambiguity.
- Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year (e.g. XXX14 for 2014-2015, XXX20 for 2020-2021), and GGGGG refers to the game number (1-1230 for a full 30-team regular season).
  You do not need to use the game_id in all queries but this is helpful for understanding the data.

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:
Explanation: |
    (tabbed in) why the error happened
    (tabbed in) how to fix it
SQL: |
    (tabbed in) --(comment describing what the SQL does)
    (tabbed in) the revised SQL query
    (tabbed in) the rest of the query ...

    
PROVIDE A | AFTER EACH YAML KEY SO THE YAML GETS PARSED CORRECTLY.
Provide the YAML and only the YAML.
        """
    return model_message


def make_default_messages(schemas_str: str) -> List[Dict[str, str]]:
    default_messages = []
    default_messages.extend(get_few_shot_messages(mode="text_to_sql"))
    return default_messages


def is_read_only_query(sql_query: str) -> bool:
    """
    Checks if the given SQL query string is read-only.
    Returns True if the query is read-only, False otherwise.
    """
    # List of SQL statements that modify data in the database
    modifying_statements = [
        r'\bINSERT\b', r'\bUPDATE\b', r'\bDELETE\b', r'\bDROP\b', r'\bCREATE\b',
        r'\bALTER\b', r'\bGRANT\b', r'\bTRUNCATE\b', r'\bLOCK\s+TABLES\b', r'\bUNLOCK\s+TABLES\b'
    ]

    # Compile the regex pattern
    pattern = re.compile('|'.join(modifying_statements), re.IGNORECASE)

    # Check if the query contains any modifying statements
    if pattern.search(sql_query):
        return False

    # If no modifying statements are found, the query is read-only
    return True


class NotReadOnlyException(Exception):
    pass


class NullValueException(Exception):
    pass


def dtype_to_pytype(column):
    if column.dtype.kind == 'i':
        return int
    elif column.dtype.kind == 'f':
        return float
    elif column.dtype.kind == 'O':
        # Check if all elements in the column are strings
        if column.apply(lambda x: isinstance(x, str) or pd.isna(x)).all():
            return str
        else:
            return object
    elif column.dtype.kind == 'b':
        return bool
    elif column.dtype.kind == 'M':
        return pd.Timestamp
    else:
        return column.dtype


def execute_sql(sql_query: str, attempt_number=0, original_text=''):
    if not is_read_only_query(sql_query):
        raise NotReadOnlyException("Only read-only queries are allowed.")

    with ENGINE.connect() as connection:
        connection = connection.execution_options(postgresql_readonly=True)
        with connection.begin():
            try:
                result = connection.execute(text(sql_query))
                df = pd.DataFrame(result.fetchall())
            except Exception as e:
                logging_db.log_sql_failure(
                    original_text, sql_query, str(e), attempt_number)
                raise e

        return {
            "column_names": df.columns.tolist(),
            "results": df.to_dict(orient='records'),
            "column_types": [ t.__name__ for t in df.apply(dtype_to_pytype).tolist() ]
        }


def text_to_sql_with_retry_multi(natural_language_query, table_names, k=3, messages=None, examples=[], session_id=None, labels=[]):
    """
    Tries to take a natural language query and generate valid SQL to answer it K times
    """
    schema_message = [{'role': 'user', 'content': ''}]
    message_history = []
    model = "gpt-3.5-turbo-0301"

    example_messages = [{'role': 'user', 'content': 'Question:\n' + example.get(
        'query', '') + '\nAnswer:\n' + example.get('sql', '')} for example in examples if len(example.get('sql', '')) > 10]

    if not messages:
        # ask the assistant to rephrase before generating the query
        _, table_content = schema_prompt.get_enums_and_tables(
            table_names)

        if len(table_names) > 2:
            table_content = schema_prompt.remove_sql_comments(table_content)

        schema_message[0]['content'] = table_content

        content = query_prompt.command_prompt_cte(
            natural_language_query, labels)

        message_history.append({
            "role": "user",
            "content": content
        })
    assistant_message = None
    sql_query = ""

    for attempt_number in range(k):
        yield {'status': 'working', 'step': 'sql', 'state': 'Starting SQL Generation Attempt ' + str(attempt_number + 1) + ' of ' + str(k) + '...'}
        try:
            try:

                payload = schema_message + message_history

                if attempt_number == 0:
                    payload = example_messages[:1] + payload

                possible_sql_results = get_openai_results(
                    payload, model=model, n=2)
            except Exception as assistant_error:
                print('error getting assistant message', assistant_error)
                continue

            parsed_results = [safe_get_sql_from_yaml(
                result) for result in possible_sql_results]

            # Filter out null values
            parsed_results = [result.get(
                'SQL') for result in parsed_results if result.get('SQL')]

            yield {'status': 'working', 'step': 'sql', 'state': 'have ' + str(len(parsed_results)) + ' possible SQL queries'}

            executed = False

            last_error = None
            response = None

            for result in parsed_results:

                try:
                    attempted_response = execute_sql(
                        result, attempt_number=attempt_number, original_text=natural_language_query)
                    response = attempted_response
                    sql_query = result
                    executed = True
                    break
                except Exception as e:
                    last_error = e
                    continue

            if not executed:
                raise Exception(str(last_error))

            yield {'status': 'success', 'final_answer': True, 'step': 'sql', 'response': response, 'sql_query': sql_query}
            return

        except Exception as e:

            yield {'status': 'working', 'step': 'sql', 'state': 'Error: ' + str(e), 'bad_sql': sql_query}
            try:
                print('error executing sql: ', str(e).split('\n')[0])
                message_history.append({
                    "role": "assistant",
                    "content": sql_query
                })
                message_history.append({
                    "role": "user",
                    "content": get_retry_message(str(e))
                })
            except Exception as exc:
                print('oops, error: ', exc)

    print("Could not generate SQL query after {k} tries.".format(k=k))
    yield {'status': 'error', 'step': 'sql', 'response': None, 'sql_query': None}


def run_cached_sql(sql_query):
    response = execute_sql(sql_query)
    yield {'status': 'success', 'final_answer': True, 'step': 'sql', 'response': response, 'sql_query': sql_query}
