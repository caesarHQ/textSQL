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
    except:
        try:
            # it might just be host:port/database
            values = {}
            split = database_url.split("//")
            host_info = split[1].split("/")[0]
            host_port = host_info.split(":")[1]
            host_name = host_port.split(":")[0]
            database = split[1].split("/")[1]
            # if host has an @ in it then it's got a username and it's broken
            if "@" in host_name:
                return None
            values["database"] = database
            values['port'] = host_port
            values['host'] = host_name
            return values

        except Exception as e:
            print('error: ', e)
            print('values so far:', values)
            return None


if "tables" not in st.session_state:
    st.session_state["tables"] = []


def update_table_checked(name, *args, **kwargs):
    isChecked = kwargs.get('isChecked', False)
    for table in st.session_state["tables"]:
        if table.get('name') == name:
            table['active'] = isChecked


def admin_management_display():
    if not st.session_state.get('DB_DATA', False):
        st.session_state["DB_DATA"] = requests.get(
            f"{ADMIN_BASE}/db_auth").json()
    if not st.session_state.get('OPENAI_DATA', False):
        st.session_state["OPENAI_DATA"] = requests.get(
            f"{ADMIN_BASE}/openai_auth").json()

    DB_DATA = st.session_state["DB_DATA"]
    OPENAI_DATA = st.session_state["OPENAI_DATA"]

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
                fields = parse_database_fields_connection(database_url)
                print('fields to upload: ', fields)
                # send the values to the backend to set up the database
                response = requests.post(f"{ADMIN_BASE}/db_auth",
                                         json=fields)
                response = response.json()
                if response.get('status') == 'success':
                    st.session_state["DB_DATA"] = {"DB_URL": database_url}
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
                st.session_state["tables"] = all_tables
            else:
                st.error(response.get('error'))

        for table in st.session_state["tables"]:
            is_checked = table.get('active', False)
            original_value = is_checked
            # when checked, find the table and set the active value to false/true
            is_checked = st.checkbox(
                'Table: ' + table.get('name'), value=is_checked, key=table.get('name'), on_change=functools.partial(update_table_checked, name=table.get('name'), isChecked=is_checked))
            if is_checked != original_value:
                update_table_checked(table.get('name'), isChecked=is_checked)

    # add a save button
    if st.button("Save", key="save_tables"):
        response = requests.post(f"{ADMIN_BASE}/tables",
                                 json={'tables': st.session_state["tables"]})
        response = response.json()
        if response.get('status') == 'success':
            st.success(response.get('message'))
        else:
            st.error(response.get('error'))
