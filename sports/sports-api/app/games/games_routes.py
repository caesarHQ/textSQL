from flask import Blueprint, jsonify, make_response, request
from app.games.games_db import get_games_by_month, get_all_teams, get_boxscores, get_games_by_id, get_games_stats_by_id, get_player_games_stats_by_id

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


@games_bp.route('/<game_id>', methods=['GET'])
def get_game(game_id):
    """
    Get game names from database
    """
    game = get_games_by_id(game_id)

    return make_response(jsonify({"game": game, "status": "success"}), 200)


@games_bp.route('/team_stats/<game_id>', methods=['GET'])
def get_game_stats(game_id):
    """
    Get game names from database
    """
    stats = get_games_stats_by_id(game_id)

    return make_response(jsonify({"stats": stats, "status": "success"}), 200)


@games_bp.route('/player_stats/<game_id>', methods=['GET'])
def get_player_game_stats(game_id):
    """
    Get game names from database
    """
    stats = get_player_games_stats_by_id(game_id)

    return make_response(jsonify({"stats": stats, "status": "success"}), 200)


@games_bp.route('/teams', methods=['GET'])
def list_teams():
    """
    Get team names from database
    """

    teams = get_all_teams()

    return make_response(jsonify({"teams": teams, "status": "success"}), 200)


@games_bp.route('/boxscores', methods=['POST'])
def list_boxscores():
    """
    Get boxscores from database
    """
    game_ids = request.json['game_ids']

    boxscores = get_boxscores(game_ids)

    return make_response(jsonify({"boxscores": boxscores, "status": "success"}), 200)
