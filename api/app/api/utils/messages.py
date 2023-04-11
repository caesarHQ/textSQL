import openai
import re
from typing import List, Dict


def get_assistant_message(
        messages: List[Dict[str, str]],
        temperature: int = 0,
        model: str = "gpt-3.5-turbo",
        # model: str = "gpt-4",
):
    res = openai.ChatCompletion.create(
        model=model,
        temperature=temperature,
        messages=messages
    )
    # completion = res['choices'][0]["message"]["content"]
    assistant_message = res['choices'][0]
  
    return assistant_message


def clean_sql_message_content(assistant_message_content):
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

    print('SQL QUERY: ', sql_query)
    return sql_query


def extract_sql_query_from_message(assistant_message_content):
    print(assistant_message_content)
    content = extract_sql_from_markdown(assistant_message_content)
    return clean_sql_message_content(content)



def extract_sql_from_markdown(assistant_message_content):
    regex = r"```([\s\S]+?)```"
    matches = re.findall(regex, assistant_message_content)

    if matches:
        code_str = matches[0]
        match = re.search(r"(?i)sql\s+(.*)", code_str, re.DOTALL)
        if match:
            code_str = match.group(1)
    else:
        code_str = assistant_message_content

    return code_str