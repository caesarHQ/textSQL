from flask import Blueprint, jsonify, make_response, request
from .utils import text_to_sql_with_retry
from .lat_lon import zip_lat_lon


bp = Blueprint('api_bp', __name__)


@bp.route('/text_to_sql', methods=['POST'])
def text_to_sql():
    """
    Convert natural language query to SQL
    """
    request_body = request.get_json()
    natural_language_query = request_body.get('natural_language_query')

    if not natural_language_query:
        error_msg = 'natural_language_query is missing from request body'
        return make_response(jsonify({'error': error_msg}), 400)

    try:
        result, sql_query = text_to_sql_with_retry(natural_language_query)
    except Exception as e:
        error_msg = f'Error processing request: {str(e)}'
        return make_response(jsonify({'error': error_msg}), 500)

    return make_response(jsonify({'result': result, 'sql_query': sql_query}), 200)


@bp.route('/zip_to_lat_lon', methods=['GET'])
def zip_to_lat_lon():
    """
    Get lat/lon coordinates for a zip code
    """
    zip_code = request.args.get('zip_code')

    if not zip_code:
        error_msg = 'zip_code is missing from request parameters'
        return make_response(jsonify({'error': error_msg}), 400)

    try:
        lat = zip_lat_lon[zip_code]['lat']
        lon = zip_lat_lon[zip_code]['lon']
    except KeyError:
        error_msg = f'Invalid zip_code: {zip_code}'
        return make_response(jsonify({'error': error_msg}), 400)

    return make_response(jsonify({'lat': lat, 'lon': lon}), 200)
