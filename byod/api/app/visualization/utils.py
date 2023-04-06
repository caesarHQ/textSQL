import json
import re

from ..utils import get_assistant_message, get_few_shot_messages


def make_default_visualize_data_messages():
    default_messages = [{
        "role": "system",
        "content": (
            "You are a helpful assistant for generating syntactically correct Vega specs that are best for visualizing given data."
            " Write responses in markdown format."
            " You will be given a JSON object in the following format."
            "\n\n"
            """
            {
                "fields": [
                    {
                        "name": "field_name",   // name of the field
                        "type": "nominal"    // type of the field (quantitative, nominal, ordinal, temporal)
                        "sample_value": "sample_value"  // example value for the field
                    }
                ],
                "total_rows": 100  // total number of rows in the result
            }
            """
        )
    }]
    default_messages.extend(get_few_shot_messages(mode="visualization"))
    return default_messages


def make_visualize_data_message():
    return (
        "Generate a syntactically correct Vega spec to best visualize the given data."
        "\n\n"
        "{data}"
    )


def make_default_visualization_change_messages():
    default_messages = [{
        "role": "system",
        "content": (
            "You are a helpful assistant for making changes to a Vega spec."
            " You generate a syntactically correct Vega spec."
            " You will be given a Vega spec and a command."
            " Write responses in markdown format."
        )
    }]
    default_messages.extend(get_few_shot_messages(mode="visualization_edits"))
    return default_messages


def make_visualization_change_message():
    return (
        "Make the following changes to the given Vega spec to best visualize the data."
        "\n\n"
        "changes: {command}"
        "\n\n"
        "Vega spec: {vega_spec}"
    )


def get_vega_spec(data):
    messages = make_default_visualize_data_messages()
    messages.append({
        "role": "user",
        "content": make_visualize_data_message().format(
            data=json.dumps(data, indent=2)
        )
    })
    vega = extract_json_from_markdown(
        get_assistant_message(messages)["message"]["content"]
    )
    return vega


def get_changed_vega(command, vega_spec):
    messages = make_default_visualization_change_messages()
    messages.append({
        "role": "user",
        "content": make_visualization_change_message().format(
            command=command,
            vega_spec=vega_spec
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