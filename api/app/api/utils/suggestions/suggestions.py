from ..messages import get_assistant_message_from_openai
from ..few_shot_examples import get_few_shot_example_messages
from ..table_selection.table_details import get_table_schemas


def _get_failed_query_suggestion_message(scope="USA", natural_language_query=""):
    return f"""
        The following is a natural language query that cannot be answered with available data:
        ---------------------
        {natural_language_query}
        ---------------------
        Suggest a different query (as similar as possible to the one given) that can be answered with the available data.
        Avoid using table names and column names in the suggested query.
        The following are descriptions of available tables and enums:
        ---------------------
        {get_table_schemas(scope=scope)}
        ---------------------
        """
    

def _get_failed_query_suggestion_messages(scope="USA"):
    # default_messages = [{
    #     "role": "system",
    #     "content": (
    #         f"""
    #         Users come to you with a natural language query that cannot be answered with available data.
    #         You are a helpful assistant for suggesting a different query (as similar as possible to the one given) that can be answered with the available data.
    #         Avoid using table names and column names in the suggested query.        
    #         The following are descriptions of available tables and enums:
    #         ---------------------
    #         {get_table_schemas(scope=scope)}
    #         ---------------------
    #         """
    #     )
    # }]
    default_messages = []
    default_messages.extend(get_few_shot_example_messages(mode="failed_query_suggestion", scope=scope))
    return default_messages




def generate_suggested_query(scope, failed_query):
    """
    Get suggested query based on failed query
    """
    messages = _get_failed_query_suggestion_messages(scope)
    messages.append({
        "role": "user",
        "content": _get_failed_query_suggestion_message(scope, failed_query)
        })
    response = get_assistant_message_from_openai(
        messages=messages,
        model="gpt-3.5-turbo",
        scope="USA",
        purpose="failed_query_suggestion"
        )["message"]["content"]
    suggested_query = response
    return suggested_query