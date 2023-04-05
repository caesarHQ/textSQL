import re

from ..utils import get_assistant_message, get_few_shot_messages


def make_default_visualize_data_messages():
    default_messages = [{
        "role": "system",
        "content": (
            "You are a helpful assistant for generating syntactically correct Vega JSON that is best for visualizing the given data."
            " Write your responses in markdown format."
        )
    }]
    default_messages.extend(get_few_shot_messages(mode="visualization"))
    return default_messages


def make_visualize_data_message():
    return (
        "Generate syntactically correct Vega JSON to best visualize the following data: {data}"
    )


def make_default_visualization_change_messages():
    default_messages = [{
        "role": "system",
        "content": (
            "You are a helpful assistant for making changes to Vega JSON."
            " You generate syntactically correct Vega JSON."
            " You will be given Vega JSON and a command."
            " Write your responses in markdown format."
        )
    }]
    default_messages.extend(get_few_shot_messages(mode="visualization_edits"))
    return default_messages


def make_visualization_change_message():
    return (
        "Make the following changes to the following Vega JSON to best visualize the data."
        "changes: {command}"
        "Vega JSON: {vega_json}"
    )


def get_changed_vega(command, vega_json):
    messages = make_default_visualization_change_messages()
    messages.append({
        "role": "user",
        "content": make_visualization_change_message().format(
            command=command,
            vega_json=vega_json
        )
    })
    vega = extract_json_from_markdown(
        get_assistant_message(messages)["message"]["content"]
    )
    return vega


def extract_json_from_markdown(assistant_message_content):
    matches = re.findall(r"```([\s\S]+?)```", assistant_message_content)

    if matches:
        code_str = matches[0]
        match = re.search(r"(?i)bash\s+(.*)", code_str, re.DOTALL)
        if match:
            code_str = match.group(1)
    else:
        code_str = assistant_message_content

    return code_str