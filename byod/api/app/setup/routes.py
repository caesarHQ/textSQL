from flask import Blueprint, jsonify, make_response, request

from ..config import ENGINE
from .utils import (generate_few_shot_queries, get_table_names,
                    save_table_metadata, save_tables_metadata_to_db,
                    save_type_metadata, save_types_metadata_to_db)

bp = Blueprint('setup_bp', __name__)

@bp.route('/setup', methods=['POST'])
def setup_db():
    """
    Set up database for text to SQL
    """
    request_body = request.get_json()
    db_credentials = {}
    db_credentials["address"] = request_body.get("address")
    db_credentials["database"] = request_body.get("database")
    db_credentials["username"] = request_body.get("username")
    db_credentials["password"] = request_body.get("password")
    db_credentials["port"] = request_body.get("port", 5432)

    for key, value in db_credentials.items():
        if not value:
            error_msg = f"`{key}` is missing from request body"
            return make_response(jsonify({"error": error_msg}), 400)
        

@bp.route('/get_tables', methods=['GET'])
def get_tables():
    """
    Get table names from database
    """
    table_names = get_table_names()
    return make_response(jsonify({"table_names": table_names}), 200)


@bp.route('/setup_metadata', methods=['POST'])
def setup_metadata():
    request_body = request.get_json()
    target_table_names = request_body.get("table_names")
    target_type_names = request_body.get("type_names")

    save_tables_metadata_to_db(target_table_names)
    save_types_metadata_to_db(target_type_names)
    
    return "Success"


@bp.route('/save_metadata', methods=['POST'])
def save_metadata():
    request_body = request.get_json()
    tables_metadata_dict = request_body.get("tables_metadata_dict", [])
    types_metadata_dict = request_body.get("types_metadata_dict", [])

    for table_name, table_metadata in tables_metadata_dict:
        save_table_metadata(table_name, table_metadata)

    for type_name, type_metadata in types_metadata_dict:
        save_type_metadata(type_name, type_metadata)

    return "Success"
