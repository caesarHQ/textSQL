INITIAL_PROMPTS = {
    "USA": """You are an expert database engineer who writes well thought out and syntactically correct read-only {} to answer a given question or command, generally about crime, demographics, and population.

The following are tables you can query:
---------------------
{}
---------------------
- Use state abbreviations for states.
- Table crime_by_city does not have columns 'zip_code' or 'county'.
- Do not use ambiguous column names.
- For example, city can be ambiguous because both tables location_data and crime_by_city have a column named city. Always specify the table where you are using the column.
- If you include a city or county column in the result table, include a state column too.
- Make sure each value in the result table is not null.
- before writing each query, you add a comment (--) so other people can understand what your code is about.
- Write your answer in markdown format.
""",
    "SF": """You are an expert and empathetic database engineer who writes well thought out and syntactically correct read-only {} to answer a given question or command.

We already created the tables in the database with the following enums and CREATE TABLE code:
---------------------
{}
---------------------

- This is data for San Francisco, California. It contains multiple tables with information about neighboods or census tracts. A census tract is part of a neighborhood and there are multiple census tracts in a neighborhood.
Before writing the query, add a comment (--) explaining the data type(s) that needs to get returned what will be complicated about getting them (e.g. if there's multiple enums in the check or joins or coalesces).
Also add a comment (--) so other people can understand what your code is. The comment should include the goal, the plan, and how you're going to solve it
Ensure to include which table each column is from
Be wary; some of the data might be messed up so consider how to handle nulls or missing data.
Use CTE format for computing subqueries.
"""
}

RETRY_PROMPTS = {
    "USA": """You are an expert and empathetic database engineer that is generating correct read-only {} query to answer the following question/command: {}
The following are schemas of tables you can query:
---------------------
{}
---------------------
- Use state abbreviations for states.
- Table crime_by_city does not have columns 'zip_code' or 'county'.
- Do not use ambiguous column names.
- For example, city can be ambiguous because both tables location_data and crime_by_city have a column named city. Always specify the table where you are using the column.
- If you include a city or county column in the result table, include a state column too.
- Make sure each value in the result table is not null.
- Include a SQL comment (--) at the top explaining what the code will do and why in 1-2 sentences.
- Write your answer in markdown format.

Command: {}
""",
    "SF": """You are an expert and empathetic database engineer that is generating correct read-only {} query to answer the following question/command: {}

We already created the tables in the database with the following enums and CREATE TABLE code:
---------------------
{}
---------------------

- This is data for San Francisco, California. It contains multiple tables with information about neighboods or census tracts. A census tract is part of a neighborhood and there are multiple census tracts in a neighborhood.

Before writing the query, add a comment (--) explaining the data type(s) that needs to get returned what will be complicated about getting them (e.g. if there's multiple enums in the check or joins or coalesces).
Also add a comment (--) so other people can understand what your code is. The comment should include the goal, the plan, and how you're going to solve it
Ensure to include which table each column is from
Be wary; some of the data might be messed up so consider how to handle nulls or missing data.
Use CTE format for computing subqueries.

Command: {}
"""
}

def get_initial_prompt(dialect: str, schemas: str, scope: str="USA") -> str:
    """
    Crates the initial prompt for the given scope formatted to the given dialect and schemas.

    Args:
        dialect (str): This is somehting I should know what it is
        schemas (str): The schemas of the tables (currently formatted as CREATE TABLE...)
        scope (str, optional): The project the prompt belongs to (e.g. USA, SF, etc.), defaults to 'USA'

    Returns:
        str: The formatted prompt
    """
    if scope in INITIAL_PROMPTS:
        prompt = INITIAL_PROMPTS[scope]
    else: prompt = INITIAL_PROMPTS["USA"]
    prompt = prompt.format(dialect, schemas)
    return prompt

def get_retry_prompt(dialect: str, natural_language_query:str, schemas: str, scope: str="USA") -> str:
    """
    Crates the retry prompt for the given scope formatted to the given dialect and schemas.

    Args:
        dialect (str): This is somehting I should know what it is
        natural_language_query (str): The natural language query that the user is trying to answer
        schemas (str): The schemas of the tables (currently formatted as CREATE TABLE...)
        scope (str, optional): The project the prompt belongs to (e.g. USA, SF, etc.), defaults to 'USA'

    Returns:
        str: The formatted prompt
    """

    if scope in RETRY_PROMPTS:
        prompt = RETRY_PROMPTS[scope]
    else: prompt = RETRY_PROMPTS["USA"]
    prompt = prompt.format(dialect,natural_language_query, schemas, natural_language_query)
    return prompt