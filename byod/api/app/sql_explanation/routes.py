from flask import Blueprint, jsonify, make_response, request

from .utils import get_sql_explanation

bp = Blueprint('sql_explanation_bp', __name__)

@bp.route('/explain_sql', methods=['POST'])
def get_tables():
    """
    Explains SQL in natural language
    """
    request_body = request.get_json()
    sql = request_body.get('sql')

    if not sql:
        error_msg = '`sql` is missing from request body'
        return make_response(jsonify({"error": error_msg}), 400)
    
    explanation = get_sql_explanation(sql)
    return make_response(jsonify({'explanation': explanation}), 200)