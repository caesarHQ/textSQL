from ..utils import get_assistant_message, get_few_shot_messages


def get_message_with_descriptions():
    message = (
        "Provide a concise explanation for the following SQL query: ```{sql}```"
    )
    return message


def get_default_messages():
    default_messages = [{
        "role": "system",
        "content": "You are a helpful assistant for providing an explanation for a SQL query."
    }]
    default_messages.extend(get_few_shot_messages(mode="sql_explanation"))
    return default_messages


def get_sql_explanation(sql) -> str:
    """
    Use language model to generate explanation of SQL query
    """
    content = get_message_with_descriptions().format(sql=sql)
    messages = get_default_messages().copy()
    messages.append({
        "role": "user",
        "content": content
    })

    model = "gpt-3.5-turbo"

    assistant_message_content = get_assistant_message(messages=messages, model=model)["message"]["content"]
    return assistant_message_content