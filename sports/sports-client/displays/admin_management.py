import requests
import functools

import streamlit as st
from config import ADMIN_BASE


def parse_database_fields_connection(database_url):
    # parse the database url into host, port, username, password, database
    try:
        values = {}
        split = database_url.split("@")
        user_pass = split[0].split("//")[1]
        host_port = split[1].split("/")[0]
        database = split[1].split("/")[1]
        values["username"] = user_pass.split(":")[0]
        values["password"] = user_pass.split(":")[1]
        values["host"] = host_port.split(":")[0]
        values["database"] = database
        values['port'] = 5432
        return values
    except Exception as e:
        print('values so far:', values)
        return None


DB_DATA = requests.get(f"{ADMIN_BASE}/db_auth").json()
OPENAI_DATA = requests.get(f"{ADMIN_BASE}/openai_auth").json()

if "tables" not in st.session_state:
    st.session_state["tables"] = []


def update_table_checked(name, *args):
    isChecked = args[0] if args else False
    for table in st.session_state["tables"]:
        if table.get('name') == name:
            table['active'] = isChecked


def update_column_checked(columnIdx, table, *args):
    # it's {name: str, columns: str[], active: bool}
    isChecked = args[0] if args else False
    for table in st.session_state["tables"]:
        if table.get('name') == table:
            table['columns'][columnIdx]['active'] = isChecked


def admin_management_display():
    st.title("Set up your Database")
    if "tables" not in st.session_state:
        st.session_state["tables"] = []

    # closable container
    with st.expander("Database URL"):
        database_url = st.text_input(
            label="Database URL", label_visibility="hidden", placeholder="Database URL", value=DB_DATA.get('DB_URL', ''))
        if database_url:
            values = parse_database_fields_connection(database_url)
            if values:
                for key, value in values.items():
                    if key == 'password':
                        # add a password field that hides the password
                        st.text_input(
                            label=key, label_visibility="visible", value=value, type="password")
                    else:
                        # have the label as a display before it followed by the input
                        st.text_input(
                            label=key, label_visibility="visible", value=value)

            if st.button("Update", key="update_db"):
                # send the values to the backend to set up the database
                response = requests.post(f"{ADMIN_BASE}/db_auth",
                                         json=parse_database_fields_connection(database_url))
                response = response.json()
                if response.get('status') == 'success':
                    st.success(response.get('message'))
                else:
                    st.error(response.get('error'))

    with st.expander("OpenAI Config"):
        # input form with the openai api key, hidden
        openai_api_key = st.text_input(
            label="OpenAI API Key", label_visibility="hidden", placeholder="OpenAI API Key", type="password", value=OPENAI_DATA.get('OPENAI_API_KEY', ''))
        if openai_api_key:
            if st.button("Update", key="update_openai"):
                # send the values to the backend to set up the database
                response = requests.post(f"{ADMIN_BASE}/openai_auth",
                                         json={'OPENAI_API_KEY': openai_api_key})
                response = response.json()
                if response.get('status') == 'success':
                    st.success(response.get('message'))
                else:
                    st.error(response.get('error'))

    tables_expander = st.expander("Tables")
    with tables_expander:
        if st.button("Refresh Tables", key="refresh_tables"):
            response = requests.get(f"{ADMIN_BASE}/tables").json()

            if response.get('status') == 'success':
                all_tables = response.get('tables')
                print('all_tables: ', all_tables)
                st.session_state["tables"] = all_tables
            else:
                st.error(response.get('error'))

        for table in st.session_state["tables"]:
            is_checked = table.get('active', False)
            # when checked, find the table and set the active value to false/true
            st.checkbox(
                'Table: ' + table.get('name'), value=is_checked, key=table.get('name'), on_change=functools.partial(update_table_checked, name=table.get('name')))

    # for each of the tables, show the scheama. Later it should be table columns + schema but one thing at a time.

    for idx, table in enumerate(st.session_state["tables"]):

        if table.get('active', False):
            st.subheader(table.get('name'))

            # have a Table label, a text area with the value of the table.schema, and a button to generate the schema, and a button to save the schema
            for column in table.get('columns', []):
                column_checked = column.get('active', False)
                st.checkbox(
                    '---Column: ' + column.get('name') + ', ' + column.get('type'), value=column_checked, key=table.get('name') + '_' + column.get('name'), on_change=functools.partial(update_column_checked, columnIdx=table.get('columns').index(column), table=table.get('name')))

            if st.button("Generate Schema", key="generate_schema_" + table.get('name')):
                # send the values to the backend to set up the database
                response = requests.post(f"{ADMIN_BASE}/generate_schema",
                                         json=table)
                response = response.json()
                if response.get('status') == 'success':
                    new_sql = response.get('message')
                    if new_sql:
                        table['schema'] = new_sql
                        st.session_state["tables"][idx]['schema'] = new_sql
                        st.session_state["tables"][idx]['update_count'] = table.get(
                            'update_count', 0) + 1

                else:
                    st.error(response.get('error'))
            st.text_area(
                label="Schema", label_visibility="hidden", value=table.get('schema', ''), height=100, key="schema_" + table.get('name'))

    # add a save button
    if st.button("Save", key="save_tables"):
        print('table state: ', st.session_state["tables"])
        response = requests.post(f"{ADMIN_BASE}/tables",
                                 json={'tables': st.session_state["tables"]})
        response = response.json()
        if response.get('status') == 'success':
            st.success(response.get('message'))
        else:
            st.error(response.get('error'))
