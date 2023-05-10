from app.config import DIALECT
import tiktoken
from ..few_shot_examples import get_few_shot_example_messages
from ..messages import extract_sql_query_from_message, get_assistant_message_from_openai
from ..table_selection.table_details import get_table_schemas, get_table_and_enums
from .prompts import get_retry_prompt
from ..caesar_logging import log_sql_failure
from .sql_helper import execute_sql

MSG_WITH_ERROR_TRY_AGAIN = (
    "Try again. "
    f"Only respond with valid {DIALECT}. Write your answer in JSON. "
    f"The {DIALECT} query you just generated resulted in the following error message:\n"
    "{error_message}"
    "Check the table schema and ensure that the columns for the table exist and will provide the expected results."
)

def make_default_messages(schemas: str, scope="USA", n=-1):
    default_messages = []

    default_messages.extend(get_few_shot_example_messages(mode="text_to_sql", scope=scope, n=n))
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

def text_to_sql_with_retry(natural_language_query, table_names, k=3, messages=None, scope="USA", session_id=None):
    """
    Tries to take a natural language query and generate valid SQL to answer it K times
    """
    if scope == "SF":
        model = "gpt-3.5-turbo"
    else:
        model = "gpt-3.5-turbo"

    example_messages = []
    enums_message = [{'role': 'user', 'content': ''}]
    schema_message = [{'role': 'user', 'content': ''}]
    message_history = []

    if not messages:
        table_text, enum_text = get_table_and_enums(table_names, scope)

        schema_message[0]['content'] = table_text
        enums_message[0]['content'] = enum_text

        enc = tiktoken.encoding_for_model(model)
        
        instruction_length = len(enc.encode(table_text + '\n\n' + enum_text))

        content = get_retry_prompt(DIALECT, natural_language_query, scope)

        max_messages = -1
        if instruction_length > 1000:
            max_messages = 3
        elif instruction_length > 1500:
            max_messages = 2
        elif instruction_length > 2000:
            max_messages = 1

        example_messages = make_default_messages('', scope, n=max_messages)
        message_history.append({
            "role": "user",
            "content": content
        })

    assistant_message = None
    sql_query = ""
    for attempt_number in range(k):
        sql_query_data = {}
        try:
            purpose = "text_to_sql" if attempt_number == 0 else "text_to_sql_retry"
            try:
                payload = schema_message + message_history
                if (attempt_number == 0):
                    payload = example_messages + enums_message + payload
                assistant_message = get_assistant_message_from_openai(payload, model=model, scope=scope, purpose=purpose, session_id=session_id)
            except:
                continue

            sql_query_data = extract_sql_query_from_message(assistant_message["message"]["content"])

            if sql_query_data.get('MissingData'):
                return {"MissingData": sql_query_data['MissingData']}, ""

            sql_query = sql_query_data["SQL"]

            response = execute_sql(sql_query)
            # Generated SQL query did not produce exception. Return result
            return response, sql_query

        except Exception as e:
            
            log_sql_failure(natural_language_query, sql_query_data.get('SQL', ""), str(e), attempt_number, scope, session_id=session_id)

            message_history.append({
                "role": "assistant",
                "content": assistant_message["message"]["content"]
            })
            message_history.append({
                "role": "user",
                "content": MSG_WITH_ERROR_TRY_AGAIN.format(error_message=str(e))
            })

    print(f"Could not generate {DIALECT} query after {k} tries.")
    return None, sql_query


def use_cached_sql(sql):
    return execute_sql(sql)