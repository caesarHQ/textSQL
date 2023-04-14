from app.config import DIALECT


from ..few_shot_examples import get_few_shot_example_messages
from ..messages import get_assistant_message_from_openai
from ..table_selection.table_details import get_table_schemas
from .prompts import get_retry_prompt
from .text_to_sql import text_to_sql_with_retry

MSG_WITH_ERROR_TRY_AGAIN = (
    "Try again. "
    f"Only respond with valid {DIALECT}. Write your answer in markdown format. "
    f"The {DIALECT} query you just generated resulted in the following error message:\n"
    "{error_message}"
)

def make_default_messages(schemas: str, scope="USA"):
    default_messages = []

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
    rephrased_query = get_assistant_message_from_openai(rephrase)["message"]["content"]

    content = get_retry_prompt(DIALECT, rephrased_query, schemas, scope) 
    # Don't return messages_copy to the front-end. It contains extra information for prompting
    messages_copy = make_default_messages(schemas)
    messages_copy.extend(messages)
    messages_copy[-1] = {
        "role": "user",
        "content": content
    }

    # Send all messages
    response, sql_query = text_to_sql_with_retry(natural_language_query, table_names, k=3, messages=messages_copy, scope=scope)

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