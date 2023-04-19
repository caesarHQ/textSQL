import requests
import functools

import streamlit as st
from config import ADMIN_BASE


def update_column_checked(columnIdx, table, *args, **kwargs):
    # it's {name: str, columns: str[], active: bool}
    isChecked = kwargs.get('isChecked', False)
    for table in st.session_state["tables"]:
        if table.get('name') == table:
            table['columns'][columnIdx]['active'] = isChecked


def schema_management_display():
    # for each of the tables, show the schema. Later it should be table columns + schema but one thing at a time.
    for idx, table in enumerate(st.session_state["tables"]):

        if table.get('active', False):
            # expandable table
            with st.expander(table.get('name')):

                st.subheader(table.get('name'))

                # have a Table label, a text area with the value of the table.schema, and a button to generate the schema, and a button to save the schema
                for column in table.get('columns', []):
                    column_checked = column.get('active', False)
                    original_value = column_checked
                    column_checked = st.checkbox(
                        '---Column: ' + column.get('name') + ', ' + column.get('type'), value=column_checked, key=table.get('name') + '_' + column.get('name'), on_change=functools.partial(update_column_checked, columnIdx=table.get('columns').index(column), table=table.get('name'), isChecked=column_checked))

                    if original_value != column_checked:
                        update_column_checked(table.get('columns').index(
                            column), table=table.get('name'), isChecked=column_checked)

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

    # expandable for enums
    with st.expander("Enums"):
        st.subheader("Enums")

        if st.button("Refresh Enums", key="refresh_enums"):
            # send the values to the backend to set up the database
            response = requests.get(f"{ADMIN_BASE}/load_enums")
            response = response.json()
            if response.get('status') == 'success':
                st.success(response.get('enums'))
            else:
                st.error(response.get('error'))

    # add a save button
    if st.button("Save", key="save_tables"):
        response = requests.post(f"{ADMIN_BASE}/tables",
                                 json={'tables': st.session_state["tables"]})
        response = response.json()
        if response.get('status') == 'success':
            st.success(response.get('message'))
        else:
            st.error(response.get('error'))
