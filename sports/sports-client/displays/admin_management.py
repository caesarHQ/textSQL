import requests

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

if "checked_tables" not in st.session_state:
    st.session_state["checked_tables"] = []

print('tables:', st.session_state["tables"])
print('checked_tables:', st.session_state["checked_tables"])


def admin_management_display():
    st.title("Set up your Database")

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
        if st.button("Refresh Tables"):
            response = requests.get(f"{ADMIN_BASE}/tables").json()
            if response.get('status') == 'success':
                st.session_state["tables"] = response.get('tables')
            else:
                st.error(response.get('error'))

        for table in st.session_state["tables"]:
            is_checked = table.get('name') in st.session_state.get(
                "checked_tables", [])
            checkbox_state = st.checkbox(
                table.get('name'), value=is_checked, key=table.get('name'))

            if checkbox_state:
                if table.get('name') not in st.session_state["checked_tables"]:
                    st.session_state["checked_tables"].append(
                        table.get('name'))
            else:
                if table.get('name') in st.session_state["checked_tables"]:
                    st.session_state["checked_tables"].remove(
                        table.get('name'))

        # add a save button
        if st.button("Save"):
            # send the list of checked tables to the backend
            response = requests.post(f"{ADMIN_BASE}/tables",
                                     json={'tables': st.session_state["checked_tables"]})
            response = response.json()
            if response.get('status') == 'success':
                st.success(response.get('message'))
            else:
                st.error(response.get('error'))
