from flask import Blueprint, jsonify, make_response, request

from .utils import get_relevant_tables_from_pinecone

bp = Blueprint('table_selection_bp', __name__)

@bp.route('/get_tables', methods=['POST'])
def get_tables():
    """
    Select relevant tables given a natural language query
    """
    request_body = request.get_json()
    natural_language_query = request_body.get("natural_language_query")

    if not natural_language_query:
        error_msg = '`natural_language_query` is missing from request body'
        return make_response(jsonify({"error": error_msg}), 400)
    
    table_names = get_relevant_tables_from_pinecone(natural_language_query)
    return make_response(jsonify({"table_names": table_names}), 200)