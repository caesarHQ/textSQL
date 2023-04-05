import time

import pandas as pd
import requests
import streamlit as st
from config import API_BASE


def main():
    st.title("Text-to-SQL")

    natural_language_query = st.text_input(
        "Ask me anything",
        placeholder="Crime statistics",
        help="SQL will be generated to address your question/command entered here."
    )

    if natural_language_query:
        with st.spinner(text="Generating SQL..."):
            start_time = time.time()
            response = requests.post(f"{API_BASE}/text_to_sql", json={"natural_language_query": natural_language_query})
            end_time = time.time()
            time_taken = end_time - start_time
        if response.status_code == 200:
            st.info(f"SQL generated in {time_taken:.2f} seconds")
            SQL = f"""```sql
                {response.json().get("sql_query")}
            ```"""
            st.markdown(SQL)

            RESULT = response.json().get("result")
            st.json(RESULT, expanded=False)

            # TODO: get Vega spec to visualize result
            with st.spinner(text="Generating visualization..."):
                start_time = time.time()
                response = requests.post(f"{API_BASE}/viz", json={"data": RESULT})
                end_time = time.time()
                time_taken = end_time - start_time
            if response.status_code == 200:
                st.info(f"Visualization generated in {time_taken:.2f} seconds")
                VEGA_SPEC = response.json().get("vega_spec")
                st.vega_lite_chart(VEGA_SPEC)
            else:
                st.error(f"{response.status_code}: {response.reason}")
                st.info("Sorry, I couldn't generate a visualization. Please try again.")
        else:
            st.error(f"{response.status_code}: {response.reason}")
            st.info("Sorry, I couldn't answer your question/command. Please try again.")


if __name__ == "__main__":
    main()