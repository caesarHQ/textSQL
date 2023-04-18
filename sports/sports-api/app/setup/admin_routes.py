from flask import Blueprint, jsonify, make_response, request

from . import admin_helper
from . import utils

admin_bp = Blueprint('admin_bp', __name__)

# note, make the wrapper for localhost around admin, not around the functions but for now this is fine


@admin_bp.route('/db_auth', methods=['GET'])
def get_db_auth():
    """
    Get database credentials from storage
    """
    return make_response(jsonify(admin_helper.get_db_credentials()), 200)


@admin_bp.route('/db_auth', methods=['POST'])
def set_db_auth():
    """
    Set database credentials in storage
    """
    try:
        request_body = request.get_json()
    except Exception as e:
        return make_response(jsonify({"error": 'Unable to parse form'}), 400)
    # try to connect to database
    try:
        admin_helper.set_db_credentials(request_body)
    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 400)

    return make_response(jsonify({"status": "success", "message": "database connection established"}), 200)


@admin_bp.route('/openai_auth', methods=['GET'])
def get_openai_auth():
    """
    Get openai credentials from storage
    """
    return make_response(jsonify(admin_helper.get_openai_credentials()), 200)


@admin_bp.route('/openai_auth', methods=['POST'])
def set_openai_auth():
    """
    Set openai credentials in storage
    """
    try:
        request_body = request.get_json()
    except Exception as e:
        return make_response(jsonify({"error": 'Unable to parse form'}), 400)
    # try to connect to database
    try:
        admin_helper.set_openai_credentials(request_body)
    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 400)

    return make_response(jsonify({"status": "success", "message": "openai key loaded"}), 200)


@admin_bp.route('/tables', methods=['GET'])
def get_tables():
    """
    Get the list of tables we're able to use
    """
    return make_response(jsonify(admin_helper.get_tables()), 200)
