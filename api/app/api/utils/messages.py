import openai
import re
from typing import List, Dict
from ...config import OPENAI_KEY


openai.api_key = OPENAI_KEY


def get_assistant_message(
        messages: List[Dict[str, str]],
        temperature: int = 0,
        model: str = "gpt-3.5-turbo",
        # model: str = "gpt-4",
) -> str:
    res = openai.ChatCompletion.create(
        model=model,
        temperature=temperature,
        messages=messages
    )
    # completion = res['choices'][0]['message']['content']
    assistant_message = res['choices'][0]
    return assistant_message


def clean_message_content(assistant_message_content):
    """
    Cleans message content to extract the SQL query
    """
    # Ignore text after the SQL query terminator `;`
    assistant_message_content = assistant_message_content.split(";")[0]

    # Remove prefix for corrected query assistant message
    split_corrected_query_message = assistant_message_content.split(":")
    if len(split_corrected_query_message) > 1:
        sql_query = split_corrected_query_message[1].strip()
    else:
        sql_query = assistant_message_content
    return sql_query


def extract_sql_query_from_message(assistant_message_content):
    content = extract_code_from_markdown(assistant_message_content)
    return clean_message_content(content)



def extract_code_from_markdown(assistant_message_content):
    regex = r"```([\s\S]+?)```"
    matches = re.findall(regex, assistant_message_content)

    if matches:
        code_str = matches[0]
    else:
        code_str = assistant_message_content

    return code_str