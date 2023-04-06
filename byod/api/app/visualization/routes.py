from flask import Blueprint, jsonify, make_response, request

from .utils import get_changed_vega, get_vega_lite_spec

bp = Blueprint('visualization_bp', __name__)


@bp.route("/viz", methods=["POST"])
def get_visualization():
    """
    Get Vega-Lite spec from data
    """
    request_body = request.get_json()
    data = request_body.get("data")

    if not data:
        return make_response(jsonify({"error": "`data` is missing from request body"}), 400)

    vega_lite_spec = get_vega_lite_spec(data)
    return make_response(jsonify({"vega_lite_spec": vega_lite_spec}), 200)


@bp.route('/text_to_viz', methods=['POST'])
def modify_visualization():
    """
    Change Vega-Lite spec based on a command
    """
    request_body = request.get_json()
    natural_language_command = request_body.get('natural_language_command')
    vega_lite_spec = request_body.get('vega_lite_spec')

    if not natural_language_command:
        return make_response(jsonify({"error": "`natural_language_command` is missing from request body"}), 400)
    
    if not vega_lite_spec:
        return make_response(jsonify({"error": "`vega_lite_spec` is missing from request body"}), 400)
    
    changed_vega = get_changed_vega(natural_language_command, vega_lite_spec)
    return make_response(jsonify({"changed_vega": changed_vega}), 200)