import json
from typing import List


def get_enums_and_tables(table_names: List[str] = []) -> tuple[str, str]:
    """
    Format table and types metadata into string to be used in prompt
    """
    try:
        with open("app/models/json/table_metadata.json", "r") as f:
            TABLES_METADATA_DICT = json.load(f)
    except:
        TABLES_METADATA_DICT = {}
    try:
        with open("app/models/json/type_metadata.json", "r") as f:
            ENUMS_METADATA_DICT = json.load(f)
    except:
        ENUMS_METADATA_DICT = {}

    tables_to_use = []
    if table_names:
        tables_to_use = [TABLES_METADATA_DICT[t_name]
                         for t_name in table_names]
    else:
        tables_to_use = [t for t in TABLES_METADATA_DICT.values()]

    enums_to_use = set()
    tables_str_list = []
    for table in tables_to_use:
        if not table.get('active'):
            continue
        if len(table.get("schema", "")) > 0:
            tables_str_list.append(table.get("schema"))
            continue
        tables_str = f"table name: {table['name']}\n"
        if table.get("description"):
            tables_str += f"table description: {table.get('description')}\n"
        columns_str_list = []
        for column in table.get("columns", []):
            if not column.get("active"):
                continue
            columns_str_list.append(f"{column['name']} [{column['type']}]")
            if column.get("type") in ENUMS_METADATA_DICT.keys():
                enums_to_use.add(column.get("type"))
        tables_str += f"table columns: {', '.join(columns_str_list)}\n"
        tables_str_list.append(tables_str)
    tables_details = "\n\n".join(tables_str_list)

    enums_str_list = []
    for custom_type_str in enums_to_use:
        custom_type = ENUMS_METADATA_DICT.get(custom_type_str)
        if custom_type:
            enums_str = f"enum: {custom_type['type']}\n"
            enums_str += f"valid values: {', '.join(custom_type.get('valid_values'))}\n"
            enums_str_list.append(enums_str)
    enums_details = "\n\n".join(enums_str_list)

    return enums_details, tables_details
