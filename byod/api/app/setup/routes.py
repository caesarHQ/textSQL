from flask import Blueprint, jsonify, make_response, request

from ..config import ENGINE
from .utils import (ENUMS_METADATA_DICT, TABLES_METADATA_DICT,
                    generate_few_shot_queries, generate_table_metadata,
                    generate_type_metadata, get_table_names, get_type_names,
                    save_table_metadata, save_type_metadata)

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
        

@bp.route('/tables', methods=['GET'])
def get_tables():
    """
    Get table names from database
    """
    table_names = get_table_names()
    return make_response(jsonify({"table_names": table_names}), 200)


@bp.route('/get_tables_metadata', methods=['POST'])
def get_tables_metadata():
    """
    Get tables metadata
    """
    request_body = request.get_json()
    table_names = request_body.get('table_names')

    tables_metadata = {}
    for t in table_names:
        metadata = generate_table_metadata(t)
        tables_metadata[t] = metadata

    return make_response(jsonify({"tables_metadata": tables_metadata}), 200)


@bp.route('/types', methods=['GET'])
def get_types():
    """
    Get type names from database
    """
    type_names = get_type_names()
    return make_response(jsonify({"type_names": type_names}), 200)


@bp.route('/get_types_metadata', methods=['POST'])
def get_types_metadata():
    """
    Get types metadata
    """
    request_body = request.get_json()
    type_names = request_body.get('type_names')

    types_metadata = {}
    for t in type_names:
        metadata = generate_type_metadata(t)
        types_metadata[t] = metadata

    return make_response(jsonify({"types_metadata": types_metadata}), 200)


@bp.route('/save_metadata', methods=['POST'])
def save_metadata():
    request_body = request.get_json()
    tables_metadata_dict = request_body.get("tables_metadata_dict", {})
    types_metadata_dict = request_body.get("types_metadata_dict", {})

    for name, metadata in tables_metadata_dict.items():
        save_table_metadata(name, metadata)

    for name, metadata in types_metadata_dict.items():
        save_type_metadata(name, metadata)

    return "Success"


# TODO: delete metadata


# DEPRECATED
@bp.route('/setup_metadata', methods=['POST'])
def setup_metadata():

    # overwrite existing tables and enums metadata
    TABLES_METADATA_DICT = {}
    ENUMS_METADATA_DICT = {}

    for table_name in get_table_names():
        save_table_metadata(table_name, generate_table_metadata(table_name))
    for type_name in get_type_names():
        save_type_metadata(type_name, generate_type_metadata(type_name))
    
    return "Success"