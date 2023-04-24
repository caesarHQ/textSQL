def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted JSON object with the following information. Ensure to escape any special characters so it can be parsed as JSON.

{{

    "Required Answer": str, required (the type of information the query is asking for),
    "Input Types": str, required (a summary of the enums or other conversion that are related to the query),
    "Plan": str, required (Explain the simplest way to answer the question/command with the schemas available),
    "Additional Data to Get: str[], required (brainstorm what information related to the original query should also be returned to answer the question/command.),
    "SQL": str, required (formatted '''line1\\nnext line\\netc''')
}}

Provide the JSON and only the JSON. It should be formatted for parsing in Python. Ensure everything is properly escaped for parsing and executing.
""".format(command)
