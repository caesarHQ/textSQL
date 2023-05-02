from flask import Blueprint, jsonify, make_response, request, stream_with_context, Response
import json
from ..config import PINECONE_ENV, PINECONE_KEY
from ..table_selection.utils import (get_relevant_tables_from_lm,
                                     get_relevant_tables_from_pinecone)
from .utils import text_to_sql_with_retry

from app.generation_engine import streaming_helper
from app.databases import logging_db

bp = Blueprint('sql_generation_bp', __name__)


@bp.route('/text_to_sql', methods=['POST'])
def text_to_sql():
    """
    Convert natural language query to SQL
    """

    try:
        request_body = request.get_json()
    except:
        return make_response(jsonify({"status": "error", "error": "Error parsing request body. Params:\nnatural_language_query, scope"}), 400)

    if "stream" in request_body:
        # this might not be the best way to do it, will need to check if there's a more official way using the regular stream decorator
        return Response(stream_with_context(streaming_helper.stream_sql_response(request_body)), content_type="application/json")

    else:
        # get all the responses from the generator until there's an error (and return that) or until it's done (and return the last response)
        responses = []
        for response in streaming_helper.stream_sql_response(request_body):
            response = json.loads(response)
            responses.append(response)
            if "error" in response:
                return make_response(jsonify(response), 500)

        res = responses[-1]
        if "response" in res:
            res['result'] = res['response']
            del res['response']
        return make_response(res, 200)


@bp.route('/register_thread', methods=['POST'])
def register_thread():
    """
    Register a thread with Pinecone
    """
    try:
        request_body = request.get_json()
    except:
        return make_response(jsonify({"status": "error", "error": "Error parsing request body. Params:\nthread_id, session_id, app_name"}), 400)

    if "thread_id" not in request_body:
        return make_response(jsonify({"status": "error", "error": "thread_id not found in request body"}), 400)
    if "session_id" not in request_body:
        return make_response(jsonify({"status": "error", "error": "session_id not found in request body"}), 400)

    thread_id = request_body["thread_id"]
    session_id = request_body["session_id"]
    thread_app = request_body.get("app_name", "discord")
    logging_db.register_thread(thread_id, session_id, thread_app)
    return make_response(jsonify({"status": "success"}), 200)
