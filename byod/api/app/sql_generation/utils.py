from collections import OrderedDict
from typing import Dict, List

from app.config import ENGINE
from sqlalchemy import text

from ..table_selection.utils import get_table_schemas_str
from ..utils import (extract_sql_query_from_message, get_assistant_message,
                     get_few_shot_messages)

MSG_WITH_ERROR_TRY_AGAIN = (
    """
    Try again.
    Only respond with valid SQL. Make sure to write your answer in markdown format.
    The SQL query you just generated resulted in the following error message:
    ---------------------
    {error_message}
    ---------------------
    """
)


def make_default_messages(schemas_str: str) -> List[Dict[str, str]]:
    # default_messages = [{
    #     "role": "system",
    #     "content": (
    #         f"""
    #         You are a helpful assistant for generating syntactically correct read-only SQL to answer a given question or command.
    #         The following are tables you can query:
    #         ---------------------
    #         {schemas_str}
    #         ---------------------
    #         Make sure to write your answer in markdown format.
    #         """
    #         # TODO: place warnings here
    #         # i.e. "Make sure each value in the result table is not null."
    #     )
    # }]
    default_messages = []
    default_messages.extend(get_few_shot_messages(mode="text_to_sql"))
    return default_messages


def make_rephrase_msg_with_schema_and_warnings():
    return (
        """
        Let's start by fixing and rephrasing the query to be more analytical. Use the schema context to rephrase the user question in a way that leads to optimal query results: {natural_language_query}
        The following are schemas of tables you can query:
        ---------------------
        {schemas_str}
        ---------------------
        Do not include any of the table names in the query.
        Ask the natural language query the way a data analyst, with knowledge of these tables, would.
        """
    )

def make_msg_with_schema_and_warnings():
    return (
        """
        Generate syntactically correct read-only SQL to answer the following question/command: {natural_language_query}
        The following are schemas of tables you can query:
        ---------------------
        {schemas_str}
        ---------------------
        Make sure to write your answer in markdown format.
        """
        # TODO: place warnings here
        #  i.e. "Make sure each value in the result table is not null.""
    )

def is_read_only_query(sql_query: str) -> bool:
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


class NullValueException(Exception):
    pass


def execute_sql(sql_query: str):
    if not is_read_only_query(sql_query):
        raise NotReadOnlyException("Only read-only queries are allowed.")

    with ENGINE.connect() as connection:
        connection = connection.execution_options(postgresql_readonly=True)
        with connection.begin():
            result = connection.execute(text(sql_query))

        column_names = list(result.keys())

        rows = [list(r) for r in result.all()]

        # Check for null values
        # for row in rows:
        #     for value in row:
        #         if value is None:
        #             raise NullValueException("Make sure each value in the result table is not null.")


        results = []
        for row in rows:
            result = OrderedDict()
            for i, column_name in enumerate(column_names):
                result[column_name] = row[i]
            results.append(result)

        result_dict = {
            "column_names": column_names,
            "results": results,
        }
        if results:
            result_dict["column_types"] = [type(r).__name__ for r in results[0]]

        return result_dict


def text_to_sql_with_retry(natural_language_query, table_names, k=3, messages=None):
    """
    Tries to take a natural language query and generate valid SQL to answer it K times
    """
    if not messages:
        # ask the assistant to rephrase before generating the query
        schemas_str = get_table_schemas_str(table_names)
        # rephrase = [{
        #     "role": "user",
        #     "content": make_rephrase_msg_with_schema_and_warnings().format(
        #         natural_language_query=natural_language_query,
        #         schemas_str=schemas_str
        #         )
        # }]
        # rephrased_query = get_assistant_message(rephrase)["message"]["content"]
        # natural_language_query = rephrased_query

        content = make_msg_with_schema_and_warnings().format(
            natural_language_query=natural_language_query,
            schemas_str=schemas_str
        )

        messages = make_default_messages(schemas_str)
        messages.append({
            "role": "user",
            "content": content
        })

    assistant_message = None

    for _ in range(k):
        try:
            # model = "gpt-4"
            # model = "gpt-3.5-turbo"
            model = "gpt-3.5-turbo-0301"
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

    print("Could not generate SQL query after {k} tries.".format(k=k))
    return None, None
