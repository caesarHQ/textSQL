import json
from typing import List
import re


table_details = {}
with open("app/data/tables_many.json", "r") as f:
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

def get_all_table_names(scope="USA") -> List[str]:
    if scope == "USA":
        return [table["name"] for table in table_details["tables"]]
    elif scope == "SF":
        return [table["name"] for table in sf_table_details["tables"]]
    return []


def get_table_schemas(table_names: List[str] = None, scope="USA") -> str:
    enums_list = []
    tables_list = []
    
    if scope == "USA":
        enums_list = table_details.get("enums", [])
        if table_names:
            for table in table_details['tables']:
                if table['name'] in table_names:
                    tables_list.append(table)
        else:
            tables_list = table_details["tables"]
    elif scope == "SF":
        enums_list = sf_table_details["enums"]
        if table_names:
            for table in sf_table_details['tables']:
                if table['name'] in table_names:
                    tables_list.append(table)
        else:
            tables_list = sf_table_details["tables"]

    enums_str_set = set()
    tables_str_list = []
    for table in tables_list:
        if scope == "SF":

            tables_str = table['table_creation_query']
            
            # get all the vars in backticks using regex from tables_str
            regex = r"`([\s\S]+?)`"
            matches = re.findall(regex, tables_str)
            if matches:
                # add each to enums_str_set
                for match in matches:
                    enums_str_set.add(match)

        else:
            tables_str = f"table name: {table['name']}\n"
            tables_str += f"table description: {table['description']}\n"
            columns_str_list = []
            for column in table['columns']:
                if column.get('description'):
                    columns_str_list.append(f"{column['name']} [{column['type']}] ({column['description']})")
                    if 'custom type' in column['description']:
                        enums_str_set.add(extract_text_from_markdown(column['description']))
                else:
                    columns_str_list.append(f"{column['name']} [{column['type']}]")
            tables_str += f"table columns: {', '.join(columns_str_list)}\n"
        tables_str_list.append(tables_str)
    tables_description = "\n\n".join(tables_str_list)

    enums_str_list = []
    for custom_type_str in enums_str_set:
        custom_type = next((t for t in enums_list if t["type"] == custom_type_str), None)
        if custom_type:
            enums_str = f"custom type: {custom_type['type']}\n"
            enums_str += f"valid values: {', '.join(custom_type['valid_values'])}\n"
            enums_str_list.append(enums_str)
    enums_description = "\n\n".join(enums_str_list)

    # return tables_description
    return enums_description + "\n\n" + tables_description

def get_table_and_enums(table_names: List[str] = None, scope="USA") -> tuple[str, str]:
    enums_list = []
    tables_list = []
    
    if scope == "USA":
        enums_list = table_details.get("enums", [])
        if table_names:
            for table in table_details['tables']:
                if table['name'] in table_names:
                    tables_list.append(table)
        else:
            tables_list = table_details["tables"]
    elif scope == "SF":
        enums_list = sf_table_details["enums"]
        if table_names:
            for table in sf_table_details['tables']:
                if table['name'] in table_names:
                    tables_list.append(table)
        else:
            tables_list = sf_table_details["tables"]

    enums_str_set = set()
    tables_str_list = []
    for table in tables_list:
        if scope == "SF":

            tables_str = table['table_creation_query']
            
            # get all the vars in backticks using regex from tables_str
            regex = r"`([\s\S]+?)`"
            matches = re.findall(regex, tables_str)
            if matches:
                # add each to enums_str_set
                for match in matches:
                    enums_str_set.add(match)

        else:
            tables_str = f"table name: {table['name']}\n"
            tables_str += f"table description: {table['description']}\n"
            columns_str_list = []
            for column in table['columns']:
                if column.get('description'):
                    columns_str_list.append(f"{column['name']} [{column['type']}] ({column['description']})")
                    if 'custom type' in column['description']:
                        enums_str_set.add(extract_text_from_markdown(column['description']))
                else:
                    columns_str_list.append(f"{column['name']} [{column['type']}]")
            tables_str += f"table columns: {', '.join(columns_str_list)}\n"
        tables_str_list.append(tables_str)
    tables_description = "\n\n".join(tables_str_list)

    enums_str_list = []
    for custom_type_str in enums_str_set:
        custom_type = next((t for t in enums_list if t["type"] == custom_type_str), None)
        if custom_type:
            enums_str = f"custom type: {custom_type['type']}\n"
            enums_str += f"valid values: {', '.join(custom_type['valid_values'])}\n"
            enums_str_list.append(enums_str)
    enums_description = "\n\n".join(enums_str_list)

    # return tables_description
    return tables_description, enums_description

def get_minimal_table_schemas(scope="USA") -> str:
    
    tables_list = []

    if scope == "USA":
        tables_list = table_details["tables"]
    elif scope == "SF":
        tables_list = sf_table_details["tables"]

    tables_str_list = []
    for table in tables_list:
        if scope == "SF":
            tables_str = f"table name: {table['name']}\n"
            tables_str += f"table description: {table['description']}\n"
        else:
            tables_str = f"table name: {table['name']}\n"
            tables_str += f"table description: {table['description']}\n"
        tables_str_list.append(tables_str)

    tables_description = "\n\n".join(tables_str_list)

    # return tables_description
    return tables_description
