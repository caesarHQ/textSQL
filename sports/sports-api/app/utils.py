import json
import re
import yaml
from typing import Dict, List
import pinecone
import uuid

import openai
from app.config import DB_MANAGED_METADATA, PINECONE_INDEX
from app.extensions import db
from app.models.in_context_examples import InContextExamples
from app.databases import events_db

IN_CONTEXT_EXAMPLES_DICT = {}


def load_in_context_examples():
    """
    Setup in context examples dict
    """
    global IN_CONTEXT_EXAMPLES_DICT

    if not DB_MANAGED_METADATA:
        try:
            with open("app/models/json/in_context_examples.json", "r") as f:
                IN_CONTEXT_EXAMPLES_DICT = json.load(f)
        except:
            IN_CONTEXT_EXAMPLES_DICT = {}
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
        model: str = "gpt-3.5-turbo",
        # model: str = "gpt-4",
):
    try:
        res = openai.ChatCompletion.create(
            model=model,
            temperature=0,
            presence_penalty=0,
            frequency_penalty=0,
            messages=messages
        )
    except Exception as e:
        print('OpenAI Error: ', e)
        print('INPUT: ', messages)
        return None
    # completion = res['choices'][0]["message"]["content"]
    assistant_message = res['choices'][0]
    return assistant_message


def get_openai_results(
        messages: List[Dict[str, str]],
        model: str = "gpt-3.5-turbo",
        n: int = 1,
        temperature: float = 0.2,
        # model: str = "gpt-4",
):
    try:
        res = openai.ChatCompletion.create(
            model=model,
            temperature=temperature,
            presence_penalty=0,
            frequency_penalty=0,
            messages=messages,
            n=n
        )
    except Exception as e:
        print('OpenAI Error: ', e)
        print('INPUT: ', messages)
        return None
    # completion = res['choices'][0]["message"]["content"]
    messages = [choice['message']['content'] for choice in res['choices']]
    return messages


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


def extract_sql_query_from_json(assistant_message_content):
    try:
        data = json.loads(assistant_message_content)
    except Exception as e:
        print('e: ', e)
        raise e

    if data.get('MissingData'):
        return data

    sql = data['SQL']

    return {"SQL": sql}


def extract_sql_query_from_yaml(assistant_message_content):

    try:
        data = yaml.safe_load(assistant_message_content)
    except Exception as e:
        print('e: ', e)
        raise e

    print('data: ', data)

    if data.get('MissingData'):
        return data

    sql = data['SQL']

    return {"SQL": sql}


def safe_get_sql_from_yaml(assistant_message_content):

    print('parsing yaml from: ', assistant_message_content)

    try:
        data = yaml.safe_load(assistant_message_content)
        sql = data['SQL']

    except Exception as e:
        return {"SQL": None, "error_message": str(e)}

    return {"SQL": sql}


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


def save_example_to_pinecone(query, sql):
    """
    Get embedding for a query
    """
    new_id = events_db.add_example_with_sql(query, sql)
    if not new_id:
        new_id = 'nodb-' + str(uuid.uuid4())

    MODEL = "text-embedding-ada-002"

    res = openai.Embedding.create(input=[query], engine=MODEL)
    embedding = res['data'][0]['embedding']

    index = pinecone.Index(PINECONE_INDEX)

    # NOTE: WE NEED TO GO BACK AND DELETE THE INDEX AND RE-CREATE IT SO IT IGNORE THE ORIGINAL QUERY
    # NOTE: unless it turns out we can weight pinecone in which case math
    status = index.upsert(
        [(new_id, embedding, {"purpose": "example", 'app': 'nbai', 'sql': sql, 'query': query})])

    print('status of upsert: ', status)

    return True
