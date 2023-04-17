
import streamlit as st


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


def admin_management_display():
    st.title("Admin Management")

    # add a form to include a database URL or the user/host/database/port
    database_url = st.text_input(
        label="Database URL", label_visibility="hidden", placeholder="Database URL")
    if database_url:
        values = parse_database_fields_connection(database_url)
        if values:
            for key, value in values.items():
                if key == 'password':
                    st.write(f"{key}: ********")
                else:
                    st.write(f"{key}: {value}")
        else:
            st.error("Invalid database URL")
