from collections import OrderedDict
import json
from typing import Dict, List

import joblib
from app.config import engine
from sqlalchemy import text

from ..lat_lon import city_lat_lon, zip_lat_lon
from ..messages import get_assistant_message, clean_message_content
from ..table_details import table_details


MSG_WITH_ERROR_TRY_AGAIN = (
    "Try again. "
    "The SQL query you just generated resulted in the following error message:\n"
    "{error_message}"
)

def generate_msg_with_schemas(table_names: List[str]):

    tables_list = []
    for table in table_details['tables']:
        if table['name'] in table_names:
            tables_list.append(table)

    return json.dumps(tables_list, indent=4)


def make_default_messages(table_names: List[str]):
    return [
        {
            "role": "system",
            "content": (
                    "You are a helpful assistant for generating syntactically correct read-only SQL to answer a given question or command, generally about crime, demographics, and population."
                    "\n"
                    "The following are tables you can query:\n"
                    "---------------------\n"
                    "{schemas}"
                    "\n\n"
                    "---------------------\n"
                    "Use state abbreviations for states."
                    " Table 'crime_by_city' does not have columns 'zip_code' or 'county'."
                    " Do not use ambiguous column names."
                    " For example, 'city' can be ambiguous because both tables 'demographic_data' and 'crime_by_city' have a column named 'city'."
                    " Always specify the table where you are using the column."
                    " If you include a 'city' column in the result table, include a 'state' column too."
                    " If you include a 'county' column in the result table, include a 'state' column too."
                    " Make sure each value in the result table is not null.\n"
            )
        },
        {
            "role": "user",
            "content": "Which top 5 cities have the most total crime?"
        },
        {
            "role": "assistant",
            "content": "SELECT city, sum(violent_crime + murder_and_nonnegligent_manslaughter + rape + robbery + aggravated_assault + property_crime + burglary + larceny_theft + motor_vehicle_theft + arson) as total_crime\nFROM crime_by_city\nGROUP BY city\nORDER BY total_crime DESC\nLIMIT 5;"
        },
        {
            "role": "user",
            "content": "What zip code has the highest percentage of people of age 75?"
        },
        {
            "role": "assistant",
            "content": "SELECT zip_code, (population_75_to_84_years / total_population) * 100 AS percentage\nFROM demographic_data\nWHERE total_population > 0\nORDER BY percentage DESC\nLIMIT 1;"
        },
        {
            "role": "user",
            "content": "Which 5 counties have the most arson?"
        },
        {
            "role": "assistant",
            "content": "SELECT demographic_data.county, SUM(crime_by_city.arson) AS total_arson\nFROM crime_by_city\nJOIN demographic_data ON crime_by_city.city = demographic_data.city\nWHERE crime_by_city.arson IS NOT NULL\nGROUP BY demographic_data.county\nORDER BY total_arson DESC\nLIMIT 5;"
        },
        {
            "role": "user",
            "content": "Which 5 cities have the most females?"
        },
        {
            "role": "assistant",
            "content": "SELECT demographic_data.city, demographic_data.state, SUM(female_population) AS city_female_population\nFROM demographic_data\nWHERE female_population IS NOT NULL\nGROUP BY demographic_data.city\nORDER BY female_population DESC\nLIMIT 5;"
        },
        {
            "role": "user",
            "content": "Which city in Washington has the highest population?"
        },
        {
            "role": "assistant",
            "content": "SELECT city, state, SUM(total_population) AS total_city_population\nFROM demographic_data\nWHERE state = 'WA'\nGROUP BY city, state\nORDER BY total_city_population DESC\nLIMIT 1;"
        },
        {
            "role": "user",
            "content": "Which area in San Francisco has the highest racial diversity and what is the percentage population of each race in that area?"
        },
        {
            "role": "assistant",
            "content": "SELECT zip_code, \n       (white_population / NULLIF(total_population, 0)) * 100 AS white_percentage,\n       (black_population / NULLIF(total_population, 0)) * 100 AS black_percentage,\n       (native_american_population / NULLIF(total_population, 0)) * 100 AS native_american_percentage,\n       (asian_population / NULLIF(total_population, 0)) * 100 AS asian_percentage,\n       (two_or_more_population / NULLIF(total_population, 0)) * 100 AS two_or_more_percentage,\n       (hispanic_population / NULLIF(total_population, 0)) * 100 AS hispanic_percentage\nFROM demographic_data\nWHERE city = 'San Francisco'\nORDER BY (white_population + black_population + native_american_population + asian_population + two_or_more_population + hispanic_population) DESC\nLIMIT 1;"
        },
    ]

def make_rephrase_msg_with_schema_and_warnings():
    return (
            "Let's start by rephrasing the query to be more analytical. Use the schema context to rephrase the user question in a way that leads to optimal query results: {natural_language_query}"
            "The following are schemas of tables you can query:\n"
            "---------------------\n"
            "{schemas}"
            "\n"
            "---------------------\n"
            "Do not include any of the table names in the query."
            " Ask the natural language query the way a data analyst, with knowledge of these tables, would."
    )

def make_msg_with_schema_and_warnings():
    return (
            "Generate syntactically correct read-only SQL to answer the following question/command: {natural_language_query}"
            "The following are schemas of tables you can query:\n"
            "---------------------\n"
            "{schemas}"
            "\n"
            "---------------------\n"
            "Use state abbreviations for states."
            " Table 'crime_by_city' does not have columns 'zip_code' or 'county'."
            " Do not use ambiguous column names."
            " For example, 'city' can be ambiguous because both tables 'demographic_data' and 'crime_by_city' have a column named 'city'."
            " Always specify the table where you are using the column."
            " If you include a 'city' column in the result table, include a 'state' column too."
            " If you include a 'county' column in the result table, include a 'state' columntoo."
            " Make sure each value in the result table is not null.\n"
    )

def is_read_only_query(sql_query: str):
    """
    Checks if the given SQL query string is read-only.
    Returns True if the query is read-only, False otherwise.
    """
    # List of SQL statements that modify data in the database
    modifying_statements = ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "GRANT", "TRUNCATE", "LOCK TABLES", "UNLOCK TABLES"]

    # Check if the query contains any modifying statements
    for statement in modifying_statements:
        if statement in sql_query.upper():
            return False

    # If no modifying statements are found, the query is read-only
    return True


class NotReadOnlyException(Exception):
    pass


class CityOrCountyWithoutStateException(Exception):
    pass


class NullValueException(Exception):
    pass


def execute_sql(sql_query: str):
    if not is_read_only_query(sql_query):
        raise NotReadOnlyException("Only read-only queries are allowed.")

    with engine.connect() as connection:
        connection = connection.execution_options(
            postgresql_readonly=True
        )
        with connection.begin():
            sql_text = text(sql_query)
            result = connection.execute(sql_text)

        column_names = list(result.keys())
        if 'state' not in column_names and any(c in column_names for c in ['city', 'county']):
            CityOrCountyWithoutStateException("Include 'state' in the result table, too.")

        rows = [list(r) for r in result.all()]

        # Check for null values
        for row in rows:
            for value in row:
                if value is None:
                    raise NullValueException("Make sure each value in the result table is not null.")

        # Add lat and lon to zip_code
        zip_code_idx = None
        try:
            zip_code_idx = column_names.index("zip_code")
        except ValueError:
            zip_code_idx = None

        if zip_code_idx is not None:
            column_names.append("lat")
            column_names.append("long")
            for row in rows:
                zip_code = row[zip_code_idx]
                lat = zip_lat_lon.get(zip_code, {}).get('lat')
                lon = zip_lat_lon.get(zip_code, {}).get('lon')
                row.append(lat)
                row.append(lon)

        # No zip_code lat lon, so try to get city lat lon
        else:
            # Add lat and lon to city
            city_idx = None
            state_idx = None
            try:
                city_idx = column_names.index("city")
                state_idx = column_names.index("state")
            except ValueError:
                city_idx = None
                state_idx = None

            if city_idx is not None and state_idx is not None:
                column_names.append("lat")
                column_names.append("long")
                for row in rows:
                    city = row[city_idx]
                    state = row[state_idx]
                    lat = city_lat_lon.get(state, {}).get(city, {}).get('lat')
                    lon = city_lat_lon.get(state, {}).get(city, {}).get('lon')

                    if "St." in city:
                        new_city = city.replace("St.", "Saint")
                        lat = city_lat_lon.get(state, {}).get(new_city, {}).get('lat')
                        lon = city_lat_lon.get(state, {}).get(new_city, {}).get('lon')

                    row.append(lat)
                    row.append(lon)

        results = []
        for row in rows:
            result = OrderedDict()
            for i, column_name in enumerate(column_names):
                result[column_name] = row[i]
            results.append(result)

        return {
            'column_names': column_names,
            'results': results,
        }


def text_to_sql_parallel(natural_language_query, table_names, k=3):
    """
    Generates K SQL queries in parallel and returns the first one that does not produce an exception.
    """
    content = make_msg_with_schema_and_warnings().format(
        natural_language_query=natural_language_query,
        schemas=generate_msg_with_schemas(table_names),
        )
    messages = make_default_messages(table_names).copy()
    messages.append({
        "role": "user",
        "content": content
    })

    # Create K completions in parallel
    jobs = []
    for _ in range(k):
        jobs.append(joblib.delayed(get_assistant_message)(messages, 0, "gpt-3.5-turbo"))
    assistant_messages = joblib.Parallel(n_jobs=k, verbose=10)(jobs)

    # Try each completion in order
    attempts_contexts = []
    for assistant_message in assistant_messages:
        sql_query = clean_message_content(assistant_message['message']['content'])

        try:
            response = execute_sql(sql_query)
            # Generated SQL query did not produce exception. Return result
            return response, sql_query, messages
        except Exception as e:
            attempts_context = messages.copy()
            attempts_context.append({
                "role": "assistant",
                "content": assistant_message['message']['content']
            })
            attempts_context.append({
                "role": "user",
                "content": MSG_WITH_ERROR_TRY_AGAIN.format(error_message=str(e))
            })
            attempts_contexts.append(attempts_context)

        # No valid completions from initial batch. Return first attempt context
        return None, None, attempts_contexts[0]


def text_to_sql_with_retry(natural_language_query, table_names, k=3, messages=None):
    """
    Tries to take a natural language query and generate valid SQL to answer it K times
    """
    if not messages:
        # ask the assistant to rephrase before generating the query
        rephrase = [{
            "role": "user",
            "content": make_rephrase_msg_with_schema_and_warnings().format(
                natural_language_query=natural_language_query,
                schemas=generate_msg_with_schemas(table_names)
                )
        }]
        assistant_message = get_assistant_message(rephrase)
        content = make_msg_with_schema_and_warnings().format(
            natural_language_query=assistant_message['message']['content'],
            schemas=generate_msg_with_schemas(table_names)
            )
        messages = make_default_messages(table_names).copy()
        messages.append({
            "role": "user",
            "content": content
        })

    assistant_message = None

    for _ in range(k):
        try:
            assistant_message = get_assistant_message(messages)
            sql_query = clean_message_content(assistant_message['message']['content'])

            response = execute_sql(sql_query)
            # Generated SQL query did not produce exception. Return result
            return response, sql_query

        except Exception as e:
            messages.append({
                "role": "assistant",
                "content": assistant_message['message']['content']
            })
            messages.append({
                "role": "user",
                "content": MSG_WITH_ERROR_TRY_AGAIN.format(error_message=str(e))
            })

    print("Could not generate SQL query after {k} tries.".format(k=k))
    return None, None
