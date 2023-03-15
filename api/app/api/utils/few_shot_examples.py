import json
from typing import List


few_shot_examples = {}
with open("app/data/few_shot_examples.json", "r") as f:
    few_shot_examples = json.load(f)


def get_few_shot_example_messages(scope: str = "general_text_to_sql") -> List[dict]:
    examples = few_shot_examples.get(scope)
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