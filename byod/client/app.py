import time

import requests
import streamlit as st
from config import API_BASE

VEGA_LITE_TYPES_MAP = {
    "int": "quantitative",
    "float": "quantitative",
    "str": "nominal",
    "bool": "nominal",
    "date": "temporal",
    "time": "temporal",
    "datetime": "temporal",
}


def create_viz_data_dict(column_names, column_types, results):
    data = {
        "fields": [],
        "total_rows": len(results),
    }
    for i, column_name in enumerate(column_names):
        data["fields"].append({
            "name": column_name,
            "type": VEGA_LITE_TYPES_MAP.get(column_types[i], "nominal"),
        })
    for i in range(len(results)):
        # include 1 sample
        if i == 1:
            break
        r = results[i]
        for j, column_name in enumerate(column_names):
            data["fields"][j]["sample_value"] = r[column_name]
    return data


def main():
    st.title("Text-to-SQL")

    natural_language_query = st.text_input(label="Ask anything...", label_visibility="hidden", placeholder="Ask anything...")

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
            """
            st.markdown(SQL)

            RESULT = response.json().get("result", {})
            st.table(RESULT.get("results", []))

            with st.spinner(text="Generating visualization..."):
                start_time = time.time()
                response = requests.post(f"{API_BASE}/viz",
                    json={
                        "data": create_viz_data_dict(
                            RESULT.get("column_names", []),
                            RESULT.get("column_types", []),
                            RESULT.get("results", []),
                        )
                    }
                )
                end_time = time.time()
                time_taken = end_time - start_time
            if response.status_code == 200:
                st.info(f"Visualization generated in {time_taken:.2f} seconds")
                VEGA_LITE_SPEC = response.json().get("vega_lite_spec")
                st.vega_lite_chart(data=RESULT.get("results", []), spec=VEGA_LITE_SPEC)
            else:
                st.error(f"{response.status_code}: {response.reason}")
                st.info("Sorry, I couldn't generate a visualization. Please try again.")
        else:
            st.error(f"{response.status_code}: {response.reason}")
            st.info("Sorry, I couldn't answer your question/command. Please try again.")


if __name__ == "__main__":
    main()