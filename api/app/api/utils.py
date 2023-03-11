import openai
from typing import List, Dict
from app.config import engine
from sqlalchemy import text
from .lat_lon import zip_lat_lon, city_lat_lon
from ..config import OPENAI_KEY
from collections import OrderedDict
import joblib


openai.api_key = OPENAI_KEY


DEFAULT_MESSAGES = [
    {
        "role": "system",
        "content": (
                "You are a helpful assistant for generating syntactically correct read-only SQL to answer a given question or command, generally about crime, demographics, and population."
                "\n"
                "The following are schemas of tables you can query:\n"
                "---------------------\n"
                "Schema of table 'crime_by_city':\n"
                "Table 'crime_by_city' has columns: city (TEXT), violent_crime (DOUBLE_PRECISION), murder_and_nonnegligent_manslaughter (DOUBLE_PRECISION), rape (DOUBLE_PRECISION), robbery (DOUBLE_PRECISION), aggravated_assault (DOUBLE_PRECISION), property_crime (DOUBLE_PRECISION), burglary (DOUBLE_PRECISION), larceny_theft (DOUBLE_PRECISION), motor_vehicle_theft (DOUBLE_PRECISION), arson (DOUBLE_PRECISION), state (TEXT)."
                "\n\n"
                "Schema of table 'acs_census_data':\n"
                "Table 'acs_census_data' has columns: total_population (DOUBLE_PRECISION), elderly_population (DOUBLE_PRECISION), male_population (DOUBLE_PRECISION), female_population (DOUBLE_PRECISION), white_population (DOUBLE_PRECISION), black_population (DOUBLE_PRECISION), native_american_population (DOUBLE_PRECISION), asian_population (DOUBLE_PRECISION), two_or_more_population (DOUBLE_PRECISION), hispanic_population (DOUBLE_PRECISION), adult_population (DOUBLE_PRECISION), citizen_adult_population (DOUBLE_PRECISION), average_household_size (DOUBLE_PRECISION), pop_under_5_years (DOUBLE_PRECISION), pop_5_to_9_years (DOUBLE_PRECISION), pop_10_to_14_years (DOUBLE_PRECISION), pop_15_to_19_years (DOUBLE_PRECISION), pop_20_to_24_years (DOUBLE_PRECISION), pop_25_to_34_years (DOUBLE_PRECISION), pop_35_to_44_years (DOUBLE_PRECISION), pop_45_to_54_years (DOUBLE_PRECISION), pop_55_to_59_years (DOUBLE_PRECISION), pop_60_to_64_years (DOUBLE_PRECISION), pop_65_to_74_years (DOUBLE_PRECISION), pop_75_to_84_years (DOUBLE_PRECISION), pop_85_years_and_over (DOUBLE_PRECISION), per_capita_income (DOUBLE_PRECISION), median_income_for_workers (DOUBLE_PRECISION), zip_code (TEXT), city (TEXT), state (TEXT), county (TEXT), lat (DOUBLE_PRECISION), lon (DOUBLE_PRECISION)."
                "\n\n"
                "---------------------\n"
                "Use state abbreviations for states."
                " Table 'crime_by_city' does not have columns 'zip_code' or 'county'."
                " Do not use ambiguous column names."
                " For example, 'city' can be ambiguous because both tables 'acs_census_data' and 'crime_by_city' have a column named 'city'."
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
        "content": "SELECT zip_code, (pop_75_to_84_years / total_population) * 100 AS percentage\nFROM acs_census_data\nWHERE total_population > 0\nORDER BY percentage DESC\nLIMIT 1;"
    },
    {
        "role": "user",
        "content": "Which 5 counties have the most arson?"
    },
    {
        "role": "assistant",
        "content": "SELECT acs_census_data.county, SUM(crime_by_city.arson) AS total_arson\nFROM crime_by_city\nJOIN acs_census_data ON crime_by_city.city = acs_census_data.city\nWHERE crime_by_city.arson IS NOT NULL\nGROUP BY acs_census_data.county\nORDER BY total_arson DESC\nLIMIT 5;"
    },
    {
        "role": "user",
        "content": "Which 5 cities have the most females?"
    },
    {
        "role": "assistant",
        "content": "SELECT acs_census_data.city, acs_census_data.state, SUM(female_population) AS city_female_population\nFROM acs_census_data\nWHERE female_population IS NOT NULL\nGROUP BY acs_census_data.city\nORDER BY female_population DESC\nLIMIT 5;"
    },
    {
        "role": "user",
        "content": "Which city in Washington has the highest population?"
    },
    {
        "role": "assistant",
        "content": "SELECT city, state, SUM(total_population) AS total_city_population\nFROM acs_census_data\nWHERE state = 'WA'\nGROUP BY city, state\nORDER BY total_city_population DESC\nLIMIT 1;"
    },
    {
        "role": "user",
        "content": "Which area in San Francisco has the highest racial diversity and what is the percentage population of each race in that area?"
    },
    {
        "role": "assistant",
        "content": "SELECT zip_code, \n       (white_population / NULLIF(total_population, 0)) * 100 AS white_percentage,\n       (black_population / NULLIF(total_population, 0)) * 100 AS black_percentage,\n       (native_american_population / NULLIF(total_population, 0)) * 100 AS native_american_percentage,\n       (asian_population / NULLIF(total_population, 0)) * 100 AS asian_percentage,\n       (two_or_more_population / NULLIF(total_population, 0)) * 100 AS two_or_more_percentage,\n       (hispanic_population / NULLIF(total_population, 0)) * 100 AS hispanic_percentage\nFROM acs_census_data\nWHERE city = 'San Francisco'\nORDER BY (white_population + black_population + native_american_population + asian_population + two_or_more_population + hispanic_population) DESC\nLIMIT 1;"
    },
]


MSG_WITH_SCHEMA_AND_WARNINGS = (
    "Generate syntactically correct read-only SQL to answer the following question/command: {natural_language_query}"
    "The following are schemas of tables you can query:\n"
    "---------------------\n"
    "Schema of table 'crime_by_city':\n"
    "Table 'crime_by_city' has columns: city (TEXT), violent_crime (DOUBLE_PRECISION), murder_and_nonnegligent_manslaughter (DOUBLE_PRECISION), rape (DOUBLE_PRECISION), robbery (DOUBLE_PRECISION), aggravated_assault (DOUBLE_PRECISION), property_crime (DOUBLE_PRECISION), burglary (DOUBLE_PRECISION), larceny_theft (DOUBLE_PRECISION), motor_vehicle_theft (DOUBLE_PRECISION), arson (DOUBLE_PRECISION), state (TEXT)."
    "\n\n"
    "Schema of table 'acs_census_data':\n"
    "Table 'acs_census_data' has columns: total_population (DOUBLE_PRECISION), elderly_population (DOUBLE_PRECISION), male_population (DOUBLE_PRECISION), female_population (DOUBLE_PRECISION), white_population (DOUBLE_PRECISION), black_population (DOUBLE_PRECISION), native_american_population (DOUBLE_PRECISION), asian_population (DOUBLE_PRECISION), two_or_more_population (DOUBLE_PRECISION), hispanic_population (DOUBLE_PRECISION), adult_population (DOUBLE_PRECISION), citizen_adult_population (DOUBLE_PRECISION), average_household_size (DOUBLE_PRECISION), pop_under_5_years (DOUBLE_PRECISION), pop_5_to_9_years (DOUBLE_PRECISION), pop_10_to_14_years (DOUBLE_PRECISION), pop_15_to_19_years (DOUBLE_PRECISION), pop_20_to_24_years (DOUBLE_PRECISION), pop_25_to_34_years (DOUBLE_PRECISION), pop_35_to_44_years (DOUBLE_PRECISION), pop_45_to_54_years (DOUBLE_PRECISION), pop_55_to_59_years (DOUBLE_PRECISION), pop_60_to_64_years (DOUBLE_PRECISION), pop_65_to_74_years (DOUBLE_PRECISION), pop_75_to_84_years (DOUBLE_PRECISION), pop_85_years_and_over (DOUBLE_PRECISION), per_capita_income (DOUBLE_PRECISION), median_income_for_workers (DOUBLE_PRECISION), zip_code (TEXT), city (TEXT), state (TEXT), county (TEXT), lat (DOUBLE_PRECISION), lon (DOUBLE_PRECISION)."
    "\n\n"
    "---------------------\n"
    "Use state abbreviations for states."
    " Table 'crime_by_city' does not have columns 'zip_code' or 'county'."
    " Do not use ambiguous column names."
    " For example, 'city' can be ambiguous because both tables 'acs_census_data' and 'crime_by_city' have a column named 'city'."
    " Always specify the table where you are using the column."
    " If you include a 'city' column in the result table, include a 'state' column too."
    " If you include a 'county' column in the result table, include a 'state' columntoo."
    " Make sure each value in the result table is not null.\n"
)


MSG_WITH_ERROR_TRY_AGAIN = (
    "Try again. "
    "The SQL query you just generated resulted in the following error message:\n"
    "{error_message}"
)


def is_read_only_query(sql_query: str):
    """
    Checks if the given SQL query string is read-only.
    Returns True if the query is read-only, False otherwise.
    """
    # List of SQL statements that modify data in the database
    modifying_statements = ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "GRANT", "TRUNCATE"]
    
    # Check if the query contains any modifying statements
    for statement in modifying_statements:
        if statement in sql_query.upper():
            return False
    
    # If no modifying statements are found, the query is read-only
    return True


class NotReadOnlyException(Exception):
    pass


def get_assistant_message(
        temperature: int = 0,
        model: str = "gpt-3.5-turbo",
        messages: List[Dict[str, str]] = DEFAULT_MESSAGES,
        ) -> str:
    res = openai.ChatCompletion.create(
            model=model,
            temperature=temperature,
            messages=messages
        )
    # completion = res['choices'][0]['message']['content']
    assistant_message = res['choices'][0]
    return assistant_message


class CityOrCountyWithoutStateException(Exception):
    pass


class NullValueException(Exception):
    pass


def execute_sql(sql_query: str):
     
     if not is_read_only_query(sql_query):
         raise NotReadOnlyException("Only read-only queries are allowed.")

     with engine.connect() as connection:
        sql_text = text(sql_query)

        # result = connection.execute(sql_text, {'param': 'value'})
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
            # column_names.append("zip_code_lat")
            # column_names.append("zip_code_lon")
            column_names.append("lat")
            # column_names.append("lon")
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
                # column_names.append("city_lat")
                # column_names.append("city_lon")
                column_names.append("lat")
                # column_names.append("lon")
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


        # return {
        #     'column_names': column_names,
        #     'values': values,
        # }


def text_to_sql_parallel(natural_language_query, k=3):
    """
    Generates K SQL queries in parallel and returns the first one that does not produce an exception.
    """
    content = MSG_WITH_SCHEMA_AND_WARNINGS.format(natural_language_query=natural_language_query)
    messages = DEFAULT_MESSAGES.copy()
    messages.append({
        "role": "user",
        "content": content
    })

    # Create K completions in parallel
    jobs = []
    for _ in range(k):
        jobs.append(joblib.delayed(get_assistant_message)(0, "gpt-3.5-turbo", messages))
    assistant_messages = joblib.Parallel(n_jobs=k, verbose=10)(jobs)

    # Try each completion in order
    attempts_contexts = []
    for assistant_message in assistant_messages:
        sql_query = _clean_message_content(assistant_message['message']['content'])

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


def text_to_sql_with_retry(natural_language_query, k=3, messages=None):
    """
    Tries to take a natural language query and generate valid SQL to answer it K times
    """
    if not messages:
        content = MSG_WITH_SCHEMA_AND_WARNINGS.format(natural_language_query=natural_language_query)
        messages = DEFAULT_MESSAGES.copy()
        messages.append({
            "role": "user",
            "content": content
        })

    assistant_message = None

    for _ in range(k):

        try:
            assistant_message = get_assistant_message(messages=messages)
            sql_query = _clean_message_content(assistant_message['message']['content'])

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


def _clean_message_content(assistant_message_content):
    """
    Cleans message content to extract the SQL query
    """
    # Ignore text after the SQL query terminator `;`
    assistant_message_content = assistant_message_content.split(";")[0]

    # Remove prefix for corrected query assistant message
    split_corrected_query_message = assistant_message_content.split(":")
    if len(split_corrected_query_message) > 1:
        sql_query = split_corrected_query_message[1].strip()
    else:
        sql_query = assistant_message_content
    return sql_query