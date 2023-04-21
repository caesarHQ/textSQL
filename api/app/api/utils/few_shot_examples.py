import json
from typing import List


few_shot_examples = {}
with open("app/data/few_shot_examples.json", "r") as f:
    few_shot_examples = json.load(f)


def get_few_shot_example_messages(mode: str = "text_to_sql", scope="USA", n=-1) -> List[dict]:
    examples = few_shot_examples.get(scope, {}).get(mode, [])
    if n > 0:
        examples = examples[:n]
    if n == 0:
        examples = []
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