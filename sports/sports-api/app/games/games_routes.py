from flask import Blueprint, jsonify, make_response, request

games_bp = Blueprint('games_bp', __name__, url_prefix='/games')

# takes an optional MONTH parameter which is YYYY-MM


@games_bp.route('/list', methods=['GET'])
def list_games():
    """
    Get game names from database
    """
    date = request.args.get('date')
    print('month', date)
    return make_response(jsonify({"games": [1, 2, 3, 4], "status": "success"}), 200)
