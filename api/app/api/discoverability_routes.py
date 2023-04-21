"""
Discoverability routes

This module contains the routes that are used to provide the feed and other discoverability information.
"""

from flask import Blueprint, jsonify, make_response
from app.config import EVENTS_ENGINE
from app.api.utils.caesar_logging import get_feed_data

discoverability = Blueprint('discoverability', __name__)

# discoverability is a get endpoint, takes a /{app}
@discoverability.route('/<app>', methods=['GET'])
def get_discoverability(app):
    """
    Get discoverability information for the app
    """

    if not EVENTS_ENGINE:
        return make_response(jsonify({
            "success": False,
            "error": "Events engine not configured"
        }), 200)
    
    feed_data = get_feed_data(app)
    if feed_data:
        return make_response(jsonify({
            "success": True,
            "examples": feed_data
        }), 200)

    return make_response(jsonify({
        "success": False,
        "error": "Not implemented"
    }), 200)

        