from flask import Blueprint, jsonify, make_response, request, stream_with_context, Response

from ..config import PINECONE_ENV, PINECONE_KEY
from ..table_selection.utils import (get_relevant_tables_from_lm,
                                     get_relevant_tables_from_pinecone)
from .utils import text_to_sql_with_retry

from app.generation_engine import streaming_helper

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
            responses.append(response)
            if "error" in response:
                return make_response(jsonify(response), 500)
        return make_response(jsonify(responses[-1]), 200)
