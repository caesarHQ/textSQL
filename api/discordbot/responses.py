import requests
from tabulate import tabulate

def get_response(message: str) -> str:
    p_message = message.lower()

    if p_message.startswith('!query'):
        natural_language_query = p_message.split('!query ')[-1]
        url = "https://text-sql-be.onrender.com/api/text_to_sql"

        payload = {"natural_language_query": natural_language_query}
        headers = {"Content-Type": "application/json"}

        response = requests.post(url, json=payload, headers=headers)
        if response.json()["result"] is None:
            return "Sorry, I couldn't find any results for that query"
        data = response.json()["result"]["results"]
        headers = response.json()["result"]["column_names"]
        table_data = [[d.get(header, "") for header in headers] for d in data]
        table = tabulate(table_data, headers=headers)
        return "```\n" + table + "\n```"
