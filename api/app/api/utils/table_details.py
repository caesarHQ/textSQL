import json
from typing import List
import re


table_details = {}
with open("app/data/tables_new.json", "r") as f:
    table_details = json.load(f)

sf_table_details = {}
with open("app/data/sf_tables.json", "r") as f:
    sf_table_details = json.load(f)


def extract_text_from_markdown(text):
    regex = r"`([\s\S]+?)`"
    matches = re.findall(regex, text)

    if matches:
        extracted_text = matches[0]
    else:
        extracted_text = text

    return extracted_text


def get_table_schemas(table_names: List[str] = None, scope="USA") -> str:
    custom_types_list = []
    tables_list = []

    if table_names:
        for table in table_details['tables']:
            if table['name'] in table_names:
                tables_list.append(table)
    elif scope == "USA":
        custom_types_list = table_details.get('types', [])
        tables_list = table_details.get('tables', [])
    elif scope == "SF":
        custom_types_list = sf_table_details.get('types', [])
        tables_list = sf_table_details.get('tables', [])

    custom_types_str_list = []
    for custom_type in custom_types_list:
        custom_types_str = f"custom type: {custom_type['type']}\n"
        custom_types_str += f"valid values: {', '.join(custom_type['valid_values'])}\n"
        custom_types_str_list.append(custom_types_str)
    custom_types_description = "\n\n".join(custom_types_str_list)

    tables_str_list = []
    for table in tables_list:
        tables_str = f"table name: {table['name']}\n"
        tables_str += f"table description: {table['description']}\n"
        columns_str_list = []
        for column in table['columns']:
            if column.get('description'):
                columns_str_list.append(f"{column['name']} [{column['type']}] ({column['description']})")
                if 'custom type' in column['description']:
                    custom_type = extract_text_from_markdown(column['description'])
            else:
                columns_str_list.append(f"{column['name']} [{column['type']}]")
        tables_str += f"table columns: {', '.join(columns_str_list)}\n"
        tables_str_list.append(tables_str)
    tables_description = "\n\n".join(tables_str_list)

    return tables_description
