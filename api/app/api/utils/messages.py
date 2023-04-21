import json
import re
import time
from typing import List, Dict

import openai
import tiktoken

from app.api.utils.caesar_logging import log_apicall


def get_assistant_message_from_openai(
        messages: List[Dict[str, str]],
        temperature: int = 0,
        model: str = "gpt-3.5-turbo",
        scope: str = "USA",
        purpose: str = "Generic",
        session_id: str = None,
        test_failure: bool = False,
        # model: str = "gpt-4",
):
    # alright, it looks like gpt-3.5-turbo is ignoring the user messages in history
    # let's go and re-create the chat in the last message!
    final_payload = messages

    start = time.time()
    try:
        if test_failure:
            raise Exception("Test failure")
        res = openai.ChatCompletion.create(
            model=model,
            temperature=0,
            messages=final_payload
        )
    except Exception as e:
        duration = time.time() - start
        log_apicall(
            duration,
            'openai',
            model,
            0,
            0,
            scope,
            purpose,
            session_id = session_id,
            success=False,
            log_message = str(e),
        )
        raise e
    duration = time.time() - start

    usage = res['usage']
    input_tokens = usage['prompt_tokens']
    output_tokens = usage['completion_tokens']

    log_apicall(
        duration,
        'openai',
        model,
        input_tokens,
        output_tokens,
        scope,
        purpose,
        session_id = session_id,
    )

    # completion = res['choices'][0]["message"]["content"]
    assistant_message = res['choices'][0]
  
    return assistant_message

def call_chat(
        messages: List[Dict[str, str]],
        temperature: int = 0,
        model: str = "gpt-3.5-turbo",
        scope: str = "USA",
        purpose: str = "Generic",
        session_id: str = None,
        # model: str = "gpt-4",
):

    start = time.time()
    try:
        res = openai.ChatCompletion.create(
            model=model,
            temperature=temperature,
            messages=messages
        )
    except Exception as e:
        duration = time.time() - start
        log_apicall(
            duration,
            'openai',
            model,
            0,
            0,
            scope,
            purpose,
            session_id = session_id,
            success=False,
            log_message = str(e),
        )
        raise e

    duration = time.time() - start

    usage = res['usage']
    input_tokens = usage['prompt_tokens']
    output_tokens = usage['completion_tokens']

    log_apicall(
        duration,
        'openai',
        model,
        input_tokens,
        output_tokens,
        scope,
        purpose,
        session_id = session_id,
    )

    # completion = res['choices'][0]["message"]["content"]
    assistant_message = res['choices'][0]['message']['content']
  
    return assistant_message

def clean_sql_message_content(assistant_message_content):
    """
    Cleans message content to extract the SQL query
    """
    # Ignore text after the last SQL query terminator `;`
    parts = assistant_message_content.split(";")
    assistant_message_content = ";".join(parts[:-1])

    # Remove prefix for corrected query assistant message
    split_corrected_query_message = assistant_message_content.split(":")
    if len(split_corrected_query_message) > 1:
        sql_query = split_corrected_query_message[1].strip()
    else:
        sql_query = assistant_message_content

    return sql_query


def extract_sql_query_from_message(assistant_message_content):
    try:
        data = json.loads(assistant_message_content)
    except Exception as e:
        print('e: ', e)
        raise e

    if data.get('MissingData'):
        return data

    sql = data['SQL']

    return {"SQL": sql}


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