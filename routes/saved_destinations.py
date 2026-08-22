from flask import Blueprint, request, jsonify

from extensions import limiter

from utils.jwt_utils import token_required
from utils.csrf import verify_csrf

from services.saved_destination_service import (
    save_destination,
    get_saved_destinations,
    remove_saved_destination
)


saved_destinations_bp = Blueprint(
    "saved_destinations",
    __name__,
    url_prefix="/api/saved-destinations"
)


# =========================================================
# GET SAVED DESTINATIONS
# =========================================================

@saved_destinations_bp.route(
    "",
    methods=["GET"]
)
@limiter.limit("20 per minute")
@token_required
def get_saved(payload):

    try:
        destinations = get_saved_destinations(
            payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch saved destinations"
        }), 500

    return jsonify({
        "message": "Saved destinations fetched successfully",
        "saved_destinations": destinations
    }), 200


# =========================================================
# SAVE DESTINATION
# =========================================================

@saved_destinations_bp.route(
    "",
    methods=["POST"]
)
@limiter.limit("20 per minute")
@token_required
def save(payload):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    city_id = data.get("city_id")

    if not city_id:
        return jsonify({
            "message": "City ID is required"
        }), 400

    try:

        destination, error = save_destination(
            user_id=payload["sub"],
            city_id=city_id
        )

    except Exception:
        return jsonify({
            "message": "Unable to save destination"
        }), 500

    if error:

        status_code = (
            404
            if error == "City not found"
            else 409
            if error == "Destination is already saved"
            else 500
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Destination saved successfully",
        "saved_destination": destination
    }), 201


# =========================================================
# REMOVE DESTINATION
# =========================================================

@saved_destinations_bp.route(
    "/<uuid:city_id>",
    methods=["DELETE"]
)
@limiter.limit("20 per minute")
@token_required
def remove(payload, city_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    try:

        success, error = remove_saved_destination(
            user_id=payload["sub"],
            city_id=str(city_id)
        )

    except Exception:
        return jsonify({
            "message": "Unable to remove saved destination"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Destination removed successfully"
    }), 200