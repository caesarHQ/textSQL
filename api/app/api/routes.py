import re

from flask import Blueprint, jsonify, make_response, request
from sentry_sdk import capture_exception

from .utils.geo_data import zip_lat_lon
from .utils.sql_explanation.sql_explanation import get_sql_explanation
from .utils.sql_gen.text_to_sql import (execute_sql,
                                        text_to_sql_chat_with_retry,
                                        text_to_sql_parallel,
                                        text_to_sql_with_retry)
from .utils.table_selection.table_details import get_all_table_names
from .utils.table_selection.table_selection import get_relevant_tables


def replace_unsupported_localities(original_string, scope="USA"):
    if scope == "USA":
        new_string = re.sub(r'\bneighborhood\b', 'zipcode', original_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bneighborhoods\b', 'zipcodes', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\barea\b', 'zipcode', original_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bareas\b', 'zipcodes', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bplace\b', 'zipcode', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bplaces\b', 'zipcodes', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bpart\b', 'zipcode', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bparts\b', 'zipcodes', new_string, flags=re.IGNORECASE)
    elif scope == "SF":
        new_string = re.sub(r'\barea\b', 'neighborhood', original_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bareas\b', 'neighborhoods', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bplace\b', 'neighborhood', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bplaces\b', 'neighborhoods', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bpart\b', 'neighborhood', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bparts\b', 'neighborhoods', new_string, flags=re.IGNORECASE)
    return new_string


bp = Blueprint('api_bp', __name__)


@bp.route('/get_tables', methods=['POST'])
def get_tables():
    """
    Select relevant tables given a natural language query
    """
    request_body = request.get_json()
    natural_language_query = request_body.get("natural_language_query")

    if not natural_language_query:
        error_msg = 'natural_language_query is missing from request body'
        return make_response(jsonify({"error": error_msg}), 400)
        
    scope = request_body.get('scope', "USA")
    natural_language_query = replace_unsupported_localities(natural_language_query, scope)

    
    table_names = get_relevant_tables(natural_language_query, scope)
    return make_response(jsonify({"table_names": table_names}), 200)


@bp.route('/explain_sql', methods=['POST'])
def explain_sql():
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


@bp.route('/text_to_sql', methods=['POST'])
def text_to_sql():
    """
    Convert natural language query to SQL
    """
    request_body = request.get_json()
    natural_language_query = request_body.get("natural_language_query")
    table_names = request_body.get("table_names")
    scope = request_body.get('scope', "USA")

    if not natural_language_query:
        error_msg = '`natural_language_query` is missing from request body'
        return make_response(jsonify({"error": error_msg}), 400)
    
    natural_language_query = replace_unsupported_localities(natural_language_query, scope)

    # if not table_names or len(table_names) == 0:
    #     error_msg = 'non-empty `table_names` array is missing from request body'
    #     return make_response(jsonify({"error": error_msg}), 400)

    try:
        # LM outputs are non-deterministic, so same natural language query may result in different SQL queries (some of which may be invalid)
        # Generate queries in parallel and use the first one that works
        # result, sql_query, messages = text_to_sql_parallel(natural_language_query)
        # if result is None or sql_query is None:
        #     result, sql_query = text_to_sql_with_retry(natural_language_query, messages=messages)
        if not table_names:
            table_names = get_all_table_names(scope=scope)
            # table_names = get_relevant_tables(natural_language_query, scope)
        result, sql_query = text_to_sql_with_retry(natural_language_query, table_names, scope=scope)
    except Exception as e:
        capture_exception(e)
        error_msg = f'Error processing request: {str(e)}'
        return make_response(jsonify({"error": error_msg}), 500)

    return make_response(jsonify({'result': result, 'sql_query': sql_query}), 200)


@bp.route('/text_to_sql_chat', methods=['POST'])
def text_to_sql_chat():
    """
    Convert natural language query to SQL
    """
    request_body = request.get_json()
    messages = request_body.get('messages')

    if not messages:
        error_msg = '`messages` is missing from request body'
        return make_response(jsonify({"error": error_msg}), 400)

    try:
        result, sql_query, messages = text_to_sql_chat_with_retry(messages)
    except Exception as e:
        capture_exception(e)
        error_msg = f'Error processing request: {str(e)}'
        return make_response(jsonify({"error": error_msg}), 500)

    return make_response(jsonify({
        'result': result,
        'sql_query': sql_query,
        'messages': messages
        }), 200)


@bp.route('/zip_to_lat_lon', methods=['GET'])
def zip_to_lat_lon():
    """
    Get lat/lon coordinates for a zip code
    """
    zip_code = request.args.get('zip_code')

    if not zip_code:
        error_msg = '`zip_code` is missing from request parameters'
        return make_response(jsonify({"error": error_msg}), 400)

    try:
        lat = zip_lat_lon[zip_code]['lat']
        lon = zip_lat_lon[zip_code]['lon']
    except KeyError as e:
        capture_exception(e)
        error_msg = f'Invalid zip_code: {zip_code}'
        return make_response(jsonify({"error": error_msg}), 400)

    return make_response(jsonify({'lat': lat, 'lon': lon}), 200)

@bp.route('/execute_sql', methods=['POST'])
def run_sql():
    request_body = request.get_json()
    try:
        result = execute_sql(request_body.get('sql'))
    except Exception as e:
        return make_response(jsonify({"error": f'Error processing request: {str(e)}' }), 400)
    return make_response(jsonify({'result': result}), 200)
