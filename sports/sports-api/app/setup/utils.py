from typing import Dict, List

from app.config import DB_MANAGED_METADATA
from app.extensions import db
from sqlalchemy import text

from ..config import ENGINE
from ..models.in_context_examples import InContextExamples
from ..models.table_metadata import TableMetadata
from ..models.type_metadata import TypeMetadata
from ..table_selection.utils import (ENUMS_METADATA_DICT, TABLES_METADATA_DICT,
                                     save_enums_metadata_to_json,
                                     save_tables_metadata_to_json)

# TODO: implement commands for MySQL


def save_table_metadata(table_name, table_metadata):
    """
    Save table metadata to database
    """
    if not DB_MANAGED_METADATA:
        TABLES_METADATA_DICT[table_name] = table_metadata
        save_tables_metadata_to_json()
        return
    try:
        tm = TableMetadata.query.filter_by(table_name=table_name).one_or_none()
        if tm:
            tm.table_metadata = table_metadata
        else:
            tm = TableMetadata(
                table_name=table_name,
                table_metadata=table_metadata
            )
            db.session.add(tm)
        db.session.commit()
    except Exception as e:
        print(e)
        db.session.rollback()


def save_type_metadata(type_name, type_metadata):
    """
    Save type metadata to database
    """
    if not DB_MANAGED_METADATA:
        ENUMS_METADATA_DICT[type_name] = type_metadata
        save_enums_metadata_to_json()
        return
    try:
        tm = TypeMetadata.query.filter_by(type_name=type_name).one_or_none()
        if tm:
            tm.type_metadata = type_metadata
        else:
            tm = TypeMetadata(
                type_name=type_name,
                type_metadata=type_metadata
            )
            db.session.add(tm)
        db.session.commit()
    except Exception as e:
        print(e)
        db.session.rollback()


def save_types_metadata_to_db():
    """
    Save types metadata to database
    """
    for type_name in get_type_names():
        metadata = generate_type_metadata(type_name)
        try:
            tm = TypeMetadata.query.filter_by(type_name=type_name).one_or_none()
            if tm:
                tm.type_metadata = metadata
            else:
                tm = TypeMetadata(
                    type_name=type_name,
                    type_metadata=metadata
                )
                db.session.add(tm)
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()


def get_current_user():
    """
    Get current db user
    """
    try:
        with ENGINE.connect() as connection:
            connection = connection.execution_options(
                postgresql_readonly=True
            )
            with connection.begin():
                sql_text = text(f"""SELECT CURRENT_USER;""")
                result = connection.execute(sql_text)
                rows = [list(r) for r in result.all()]
                return rows[0][0]
            
    except Exception as e:
        print(e)
        return None


def save_tables_metadata_to_db():
    """
    Save tables metadata to database
    """
    for table_name in get_table_names():
        metadata = generate_table_metadata(table_name)
        try:
            tm = TableMetadata.query.filter_by(table_name=table_name).one_or_none()
            if tm:
                tm.table_metadata = metadata
            else:
                tm = TableMetadata(
                    table_name=table_name,
                    table_metadata=metadata
                )
                db.session.add(tm)
            db.session.commit()
        except Exception as e:
            print(e)
            db.session.rollback()


# columns:
# - mode (VARCHAR) - `table_selection`, `sql_generation`
# - examples (JSON) [{"user": "", "assistant": ""}]
def save_in_context_examples_to_db(in_context_examples: List[Dict[str, str]]):
    """
    Save in-context-examples to database
    """
    pass


def generate_few_shot_queries():
    """
    Generate few shot queries for each table
    - table selection
    - SQL generation
    """
    pass


def get_type_names() -> List[str]:
    """
    Get names of user-defined types in the database
    """
    try:
        with ENGINE.connect() as connection:
            connection = connection.execution_options(
                postgresql_readonly=True
            )
            with connection.begin():
                sql_text = text(f"""
                    SELECT t.typname AS enum_name
                    FROM pg_type t
                    JOIN pg_enum e ON t.oid = e.enumtypid
                    GROUP BY t.typname;
                """)
                result = connection.execute(sql_text)
                rows = [list(r) for r in result.all()]

                type_names = []
                for row in rows:
                    type_names.append(row[0])

                return type_names
            
    except Exception as e:
        print(e)
        return None


def get_table_names(username=get_current_user()) -> List[str]:
    """
    Get names of tables in the database
    """
    IGNORE_TABLES = ["ai_sql_table_metadata", "ai_sql_type_metadata", "ai_sql_in_context_examples"]
    try:
        with ENGINE.connect() as connection:
            connection = connection.execution_options(
                postgresql_readonly=True
            )
            with connection.begin():
                # sql_text = text(f"""
                #     SELECT tablename
                #     FROM pg_catalog.pg_tables
                #     WHERE tableowner = '{username}';
                # """)
                sql_text = text(f"""
                    SELECT tablename
                    FROM pg_catalog.pg_tables
                    WHERE schemaname = 'public';
                """)
                result = connection.execute(sql_text)
                rows = [list(r) for r in result.all()]

                table_names = []
                for row in rows:
                    if row[0] not in IGNORE_TABLES:
                        table_names.append(row[0])

                return table_names
            
    except Exception as e:
        print(e)
        return None


def generate_type_metadata(type_name):
    """
    Generate metadata for user defined enum
    """
    try:
        with ENGINE.connect() as connection:
            connection = connection.execution_options(
                postgresql_readonly=True
            )
            with connection.begin():
                sql_text = text(f"""
                    SELECT enumlabel
                    FROM pg_enum
                    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '{type_name}')
                    ORDER BY enumsortorder;
                """)
                result = connection.execute(sql_text)
                rows = [list(r) for r in result.all()]

                valid_values = []
                for row in rows:
                    valid_values.append(row[0])

                return {
                    "type": type_name,
                    "valid_values": valid_values
                }
            
    except Exception as e:
        print(e)
        return None


def generate_table_metadata(table_name):
    """
    Generate table metadata
    """
    try:
        with ENGINE.connect() as connection:
            connection = connection.execution_options(
                postgresql_readonly=True
            )
            with connection.begin():
                sql_text = text(f"""
                    SELECT column_name, data_type, udt_name
                    FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '{table_name}';
                """)
                result = connection.execute(sql_text)

            rows = [list(r) for r in result.all()]

            columns_metadata = []
            for row in rows:
                if row[1] == "USER-DEFINED":
                    column_type = row[2]
                else:
                    column_type = row[1]
                columns_metadata.append({
                    "name": row[0],
                    "type": column_type
                })

            
            # TODO: generate table description
            # TODO: generate column description (FK, PK, etc.)
            table_description = ""
            return {
                "name": table_name,
                "description": table_description,
                "columns": columns_metadata
            }
    
    except Exception as e:
        print(e)
        return None