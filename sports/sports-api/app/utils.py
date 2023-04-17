import json
import re
from typing import Dict, List

import openai
from app.config import DB_MANAGED_METADATA
from app.extensions import db
from app.models.in_context_examples import InContextExamples

IN_CONTEXT_EXAMPLES_DICT = {}
def load_in_context_examples():
    """
    Setup in context examples dict
    """
    global IN_CONTEXT_EXAMPLES_DICT

    if not DB_MANAGED_METADATA:
        with open("app/models/json/in_context_examples.json", "r") as f:
            IN_CONTEXT_EXAMPLES_DICT = json.load(f)
        return

    try:
        in_context_examples = InContextExamples.query.all()
    except Exception as e:
        print(e)
        in_context_examples = []
    for in_context_example in in_context_examples:
        IN_CONTEXT_EXAMPLES_DICT[in_context_example.mode] = in_context_example.examples


def get_few_shot_messages(mode: str = "text_to_sql") -> List[Dict]:
    global IN_CONTEXT_EXAMPLES_DICT
    
    examples = IN_CONTEXT_EXAMPLES_DICT.get(mode, [])
    messages = []
    for example in examples:
        messages.append({
            "role": "user",
            "content": example["user"],
        })
        messages.append({
            "role": "assistant",
            "content": example["assistant"],
        })
    return messages


def get_assistant_message(
        messages: List[Dict[str, str]],
        temperature: int = 0,
        model: str = "gpt-3.5-0301",
        # model: str = "gpt-3.5-turbo",
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
    print(assistant_message_content)
    content = extract_code_from_markdown(assistant_message_content)
    return clean_message_content(content)


def extract_code_from_markdown(assistant_message_content):
    matches = re.findall(r"```([\s\S]+?)```", assistant_message_content)

    if matches:
        code_str = matches[0]
        match = re.search(r"(?i)sql\s+(.*)", code_str, re.DOTALL)
        if match:
            code_str = match.group(1)
    else:
        code_str = assistant_message_content

    return code_str