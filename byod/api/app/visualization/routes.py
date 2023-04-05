from flask import Blueprint, jsonify, make_response, request

from .utils import get_changed_vega

bp = Blueprint('visualization_bp', __name__)


@bp.route('/text_to_viz', methods=['POST'])
def text_to_vega():
    """
    Change Vega JSON based on a command
    """
    request_body = request.get_json()
    natural_language_command = request_body.get('natural_language_command')
    vega_json = request_body.get('vega_json')

    if not natural_language_command:
        return make_response(jsonify({"error": "`natura_language_command` is missing from request body"}), 400)
    
    if not vega_json:
        return make_response(jsonify({"error": "`vega_json` is missing from request body"}), 400)
    
    changed_vega = get_changed_vega(natural_language_command, vega_json)
    return make_response(jsonify({"changed_vega": changed_vega}), 200)