import streamlit as st
from displays.admin_management import admin_management_display
from displays.query_datasource import query_datasource_display
from config import API_BASE


def main():

    is_locahost = 'localhost' in API_BASE

    if is_locahost:
        state = st.sidebar.radio("Change Mode", ["Admin", "Query"])
    else:
        state = 'Query'
    if state == "Admin":
        admin_management_display()
    if state == "Query":
        query_datasource_display()


if __name__ == "__main__":
    main()
