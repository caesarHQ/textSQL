import time
import openai
import re
from typing import List, Dict
from app.api.utils.caesar_logging import log_apicall


def get_assistant_message_from_openai(
        messages: List[Dict[str, str]],
        temperature: int = 0,
        model: str = "gpt-3.5-turbo",
        scope: str = "USA",
        purpose: str = "Generic",
        # model: str = "gpt-4",
):
    # alright, it looks like gpt-3.5-turbo is ignoring the user messages in history
    # let's go and re-create the chat in the last message!
    final_payload = messages

    if scope == "USA" and "text_to_sql" in purpose:

        stringified_messages = []
        for message in messages:
            if message['role'] == 'user':
                stringified_messages.append(f'{message["role"]}: {message["content"]}')
            if message['role'] == 'assistant':
                stringified_messages.append(f'Correct Output: {message["content"]}')
        stringified_messages = '\n---\n'.join(stringified_messages)

        simplified_payload = [{
            "role": "user",
            "content": stringified_messages + '\n--pay close attention to the earlier examples for tricks for how to efficiently query this database.',
        }]
        final_payload = simplified_payload
    else:
        final_payload = messages

    start = time.time()
    res = openai.ChatCompletion.create(
        model=model,
        temperature=temperature,
        messages=final_payload
    )
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
    )

    # completion = res['choices'][0]["message"]["content"]
    assistant_message = res['choices'][0]
  
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

    print('SQL QUERY: ', sql_query)
    return sql_query


def extract_sql_query_from_message(assistant_message_content):
    print(assistant_message_content)
    content = extract_sql_from_markdown(assistant_message_content)
    # return clean_sql_message_content(content)
    return content


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