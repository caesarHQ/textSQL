from flask import Blueprint, current_app, jsonify, make_response, request
from .utils import text_to_sql_with_retry
from .lat_lon import zip_lat_lon


bp = Blueprint('api_bp', __name__)

@bp.route('/text_to_sql', methods=['POST'])
def text_to_sql():
    """
    Text to SQL bootstrapped
    """
    request_body = request.get_json()
    natural_language_query = request_body['natural_language_query']
    
    result, sql_query = text_to_sql_with_retry(natural_language_query)

    return make_response(
       jsonify({
           'result': result,
            'sql_query': sql_query,
       }),
       200,
    )

@bp.route('/zip_to_lat_lon', methods=['GET'])
def zip_to_lat_lon():
    """
    Get lat/lon coordinates for a zip code
    """
    zip_code = request.args.get('zip_code')

    lat = zip_lat_lon[zip_code]['lat']
    lon = zip_lat_lon[zip_code]['lon']

    return make_response(
       jsonify({
           'lat': lat,
            'lon': lon,
       }),
       200,
    )
