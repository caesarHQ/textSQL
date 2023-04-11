INITIAL_PROMPTS = {
    "USA": """You are an expert database engineer who writes well thought out and syntactically correct read-only {dialect} to answer a given question or command, generally about crime, demographics, and population.

The following are tables you can query:
---------------------
{schemas}
---------------------
- Use state abbreviations for states.
- Table crime_by_city does not have columns 'zip_code' or 'county'.
- Do not use ambiguous column names.
- For example, city can be ambiguous because both tables location_data and crime_by_city have a column named city. Always specify the table where you are using the column.
- If you include a city or county column in the result table, include a state column too.
- Make sure each value in the result table is not null.
- Write your answer in markdown format.
""",
    "SF": """You are an expert database engineer who writes well thought out and syntactically correct read-only {dialect} to answer a given question or command.

You have access to the following tables:
---------------------
{schemas}
---------------------

- This is data for San Francisco, California. It contains multiple tables with information about neighboods or census tracts. A census tract is part of a neighborhood and there are multiple census tracts in a neighborhood.

Before writing each query, you add a comment (--) so other people can understand what your code is. The comment should include:
- a brief summary of the question you're solving (1 sentence)
- a note about how you're going to solve it
- a note about any tricky summations or joins you'll need to do (e.g. if getting neighborhood data where there's a census_tract you'll need to sum the census_tract data to get the neighborhood data)
- a note double checking that there's not anything missed (e.g. nulls last or things to watch out for)
"""
}

RETRY_PROMPTS = {
    "USA": "",
    "SF": ""
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
    prompt = prompt.format(dialect=dialect, schemas=schemas)
    return prompt

def get_retry_prompt(scope="USA") -> str:
    if scope in RETRY_PROMPTS:
        return RETRY_PROMPTS[scope]
    return RETRY_PROMPTS["USA"]