import json

table_details = {}
with open("app/data/tables.json", "r") as f:
    table_details = json.load(f)
    # Remove descriptions from table details for now
    for table in table_details["tables"]:
        for column in table["columns"]:
            del column["description"]