from ..few_shot_examples import get_few_shot_example_messages
from ..messages import get_assistant_message_from_openai
from app.config import DIALECT


def get_message_with_descriptions():
    message = (
        f"Provide a concise explanation for the following {DIALECT}"
        " query: ```{sql}```"
    )
    return message


def get_default_messages():
    default_messages = [{
        "role": "system",
        "content": (
            f"You are a helpful assistant for providing an explanation for a {DIALECT} query."
        )
    }]
    default_messages.extend(get_few_shot_example_messages(mode="sql_explanation"))
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

    # model = "gpt-4"
    model = "gpt-3.5-turbo"

    assistant_message_content = get_assistant_message_from_openai(
        messages=messages,
        model=model,
        purpose="sql_explanation"
    )["message"]["content"]
    return assistant_message_content