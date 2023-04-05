import pandas as pd
import requests
import streamlit as st
from config import API_BASE

SQL_TEMPLATE = """
```sql
{sql_query}
```
"""


def main():
    st.title("Text-to-SQL")



    SQL = SQL_TEMPLATE.format(
        sql_query="SELECT city, state, \n       (violent_crime + murder_and_nonnegligent_manslaughter + rape + robbery + aggravated_assault + property_crime + burglary + larceny_theft + motor_vehicle_theft + arson) AS total_crime\nFROM crime_by_city\nORDER BY total_crime DESC\nLIMIT 5"
    )


    natural_language_query = st.text_input(
        "Ask me anything",
        placeholder="Crime statistics",
        help="SQL will be generated to address your question/command entered here."
    )

    if natural_language_query:
        response = requests.post(f"{API_BASE}/text_to_sql", json={"natural_language_query": natural_language_query})
        if response.status_code == 200:
            SQL = SQL_TEMPLATE.format(
                sql_query=response.json().get("sql_query")
            )
            st.text(SQL)
            RESULT = response.json().get("result")
            # TODO: get Vega spec to visualize result
        else:
            st.text("Sorry, I don't understand your question/command. Please try again.")

    st.markdown(SQL)


    VEGA_SPEC = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "A basic bar chart example",
        "data": {
            "values": [
                {"category": "A", "value": 10},
                {"category": "B", "value": 5},
                {"category": "C", "value": 15},
                {"category": "D", "value": 7},
                {"category": "E", "value": 20}
            ]
        },
        "mark": {"type": "bar", "color": "yellow"},
        "encoding": {
            "x": {"field": "category", "type": "nominal"},
            "y": {"field": "value", "type": "quantitative"}
        }
    }

    if VEGA_SPEC:
        st.vega_lite_chart(VEGA_SPEC)


    def set_vega_spec(vega_spec):
        VEGA_SPEC = vega_spec


    @st.cache_data(ttl=60)    # cache data for 1 min (=60 seconds)
    def load_data():
        """
        Sends a GET request to the API to load data
        """
        response = requests.get(f'{API_BASE}/tables')
        if response.status_code == 200:
            # If the request was successful, print the response body
            response_data = response.json()
            table_names = response_data['table_names']
            return table_names
        else:
            st.warning(f'Request failed with status code {response.status_code}', icon='⚠️')
        return []


if __name__ == "__main__":
    main()