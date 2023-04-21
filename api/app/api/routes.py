import asyncio
import re

from flask import Blueprint, jsonify, make_response, request

from .utils.geo_data import zip_lat_lon
from .utils.sql_explanation.sql_explanation import get_sql_explanation
from .utils.sql_gen.text_to_sql import text_to_sql_with_retry
from .utils.sql_gen.sql_helper import execute_sql
from .utils.sql_gen.text_to_sql_chat import text_to_sql_chat_with_retry

from .utils.classification.input_classification import create_labels 
from .utils.cached_queries import featured_queries
from .utils.table_selection.table_details import get_all_table_names
from .utils.table_selection.table_selection import get_relevant_tables_async
from .utils.suggestions.suggestions import generate_suggestion_failed_query, generate_suggestion
from .utils.caesar_logging import update_suggestion_as_used, create_session, update_input_classification
from .utils.logging.sentry import capture_exception

def replace_unsupported_localities(original_string, scope="USA"):
    if scope == "USA":
        new_string = re.sub(r'\bneighborhood\b', 'zipcode', original_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\bneighborhoods\b', 'zipcodes', new_string, flags=re.IGNORECASE)
        new_string = re.sub(r'\barea\b', 'zipcode', new_string, flags=re.IGNORECASE)
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
    session_id = request_body.get("session_id")
    parent_id = request_body.get("parent_id")
    if parent_id in ["", "None", "null" ]:
        parent_id = None
    if session_id in ["", "None", "null" ]:
        session_id = None

    if not natural_language_query:
        error_msg = 'natural_language_query is missing from request body'
        return make_response(jsonify({"error": error_msg}), 400)
    
    # if it's featured, just pull it from the db
    scope = request_body.get('scope', "USA")
    cached_tables = featured_queries.get_featured_table(natural_language_query, scope)
    if cached_tables and len(cached_tables) > 0:
        return make_response(jsonify({"table_names": cached_tables}), 200)

    natural_language_query = replace_unsupported_localities(natural_language_query, scope)

    async def run_tasks():
        relevant_tables_task = asyncio.create_task(get_relevant_tables_async(natural_language_query, scope, session_id = session_id))
        labels_task = asyncio.create_task(create_labels(natural_language_query, scope, parent_id=parent_id, session_id = session_id))

        table_names = await relevant_tables_task
        generation_id = await labels_task
        return table_names, generation_id

    table_names, generation_id = asyncio.run(run_tasks())

    return make_response(jsonify({"table_names": table_names, 'generation_id': generation_id}), 200)


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
    session_id = request_body.get("session_id")
    generation_id = request_body.get("generation_id")
    if session_id in ["", "None", "null" ]:
        session_id = None

    if not natural_language_query:
        error_msg = '`natural_language_query` is missing from request body'
        return make_response(jsonify({"error": error_msg}), 400)
    
    # if it's featured, just pull it from the db
    cached_sql = featured_queries.get_featured_sql(natural_language_query, scope)
    if cached_sql:
        result = execute_sql(cached_sql)
        return make_response(jsonify({'result': result, 'sql_query': cached_sql}), 200)
        
    natural_language_query = replace_unsupported_localities(natural_language_query, scope)

    try:
        if not table_names:
            table_names = get_all_table_names(scope=scope)
            # table_names = get_relevant_tables(natural_language_query, scope)
        result, sql_query = text_to_sql_with_retry(natural_language_query, table_names, scope=scope, session_id=session_id)
    except Exception as e:
        capture_exception(e)
        error_msg = f'Error processing request: {str(e)}'
        if generation_id:
            update_input_classification(generation_id, False, 0, None)

        return make_response(jsonify({"error": error_msg}), 500)
    
    if generation_id:
        is_successful = result is not None
        temp_result = result or {}
        update_input_classification(generation_id, is_successful, len(temp_result.get('results', [])), sql_query)

    return make_response(jsonify({'result': result, 'sql_query': sql_query}), 200)


@bp.route('/get_suggestion_failed_query', methods=['POST'])
def get_suggestion_failed_query():
    """
    Get suggested query for a query that we don't have data for
    """
    request_body = request.get_json()
    natural_language_query = request_body.get("natural_language_query")
    scope = request_body.get("scope", "USA")
    parent_id = request_body.get("generation_id")
    session_id = request_body.get("session_id")
    if session_id in ["", "None", "null" ]:
        session_id = None

    suggested_query, generation_id = generate_suggestion_failed_query(scope, natural_language_query, parent_id, session_id)

    return make_response(jsonify({"suggested_query": suggested_query, "generation_id": generation_id}), 200)


@bp.route('/get_suggestion', methods=['POST'])
def get_suggestion():
    """
    Get suggested query, to build on top of a given query or as a similar query
    """
    request_body = request.get_json()
    natural_language_query = request_body.get("natural_language_query")
    scope = request_body.get("scope", "USA")
    parent_id = request_body.get("generation_id")
    session_id = request_body.get("session_id")
    if session_id in ["", "None", "null" ]:
        session_id = None

    suggested_query, generation_id = generate_suggestion(scope, natural_language_query, parent_id, session_id)
    return make_response(jsonify({"suggested_query": suggested_query, "generation_id": generation_id}), 200)


@bp.route('/execute_sql', methods=['POST'])
def run_sql():
    request_body = request.get_json()
    try:
        result = execute_sql(request_body.get('sql'))
    except Exception as e:
        return make_response(jsonify({"error": f'Error processing request: {str(e)}' }), 400)
    return make_response(jsonify({'result': result}), 200)


# DEPRECATED
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

@bp.route('/accept_suggestion', methods=['POST'])
def accept_suggestion():
    # get id from route
    request_body = request.get_json()
    generation_id = request_body.get('id')
    update_suggestion_as_used(generation_id)
    return {"status": "success"}

@bp.route('/session', methods=['POST'])
def get_session_id():
    # check the JSON
    request_body = request.get_json()
    user_id = request_body.get('user_id')
    scope = request_body.get('scope', 'USA')
    session = create_session(scope, user_id)
    return make_response(jsonify({'session_id': session}), 200)
