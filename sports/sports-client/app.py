import streamlit as st
from displays.credentials_management import admin_management_display
from displays.query_datasource import query_datasource_display
from displays.schema_management import schema_management_display
from config import API_BASE


def main():

    is_localhost = 'localhost' in API_BASE

    if is_localhost:
        state = st.sidebar.radio(
            "Change Mode", ["Credentials", "Schema Management", "Query"])
    else:
        state = 'Query'
    if state == "Credentials":
        admin_management_display()

    if state == "Schema Management":
        schema_management_display()

    if state == "Query":
        query_datasource_display()


if __name__ == "__main__":
    main()
