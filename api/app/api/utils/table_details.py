import json

table_details = {}
with open("app/data/tables.json", "r") as f:
    table_details = json.load(f)