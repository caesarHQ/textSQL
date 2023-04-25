from flask import Blueprint, jsonify, make_response, request
from app.games.games_db import get_games_by_month

games_bp = Blueprint('games_bp', __name__, url_prefix='/games')

# takes an optional MONTH parameter which is YYYY-MM


@games_bp.route('/list', methods=['GET'])
def list_games():
    """
    Get game names from database
    """
    date = request.args.get('date')

    games = get_games_by_month(date)

    return make_response(jsonify({"games": games, "status": "success"}), 200)
