from flask import Blueprint, request, jsonify

from extensions import limiter

from utils.jwt_utils import token_required, role_required
from utils.csrf import verify_csrf

from services.gemini_ingestion_service import ingest_city_data


gemini_bp = Blueprint(
    "gemini",
    __name__,
    url_prefix="/api/gemini"
)


# =========================================================
# INGEST CITY DATA
# =========================================================

@gemini_bp.route(
    "/ingest-city",
    methods=["POST"]
)
@limiter.limit("5 per minute")
@token_required
@role_required("admin")
def ingest_city(payload):

    # -----------------------------------------------------
    # CSRF
    # -----------------------------------------------------

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    # -----------------------------------------------------
    # REQUEST BODY
    # -----------------------------------------------------

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    city_name = data.get(
        "city_name"
    )

    country = data.get(
        "country"
    )

    activity_limit = data.get(
        "activity_limit",
        10
    )

    # -----------------------------------------------------
    # REQUIRED FIELDS
    # -----------------------------------------------------

    if not city_name:
        return jsonify({
            "message": "City name is required"
        }), 400

    if not country:
        return jsonify({
            "message": "Country is required"
        }), 400

    # -----------------------------------------------------
    # ACTIVITY LIMIT VALIDATION
    # -----------------------------------------------------

    try:
        activity_limit = int(
            activity_limit
        )
    except (TypeError, ValueError):
        return jsonify({
            "message": "Invalid activity limit"
        }), 400

    if activity_limit < 1 or activity_limit > 30:
        return jsonify({
            "message": "Activity limit must be between 1 and 30"
        }), 400

    # -----------------------------------------------------
    # INGEST
    # -----------------------------------------------------

    try:

        result, error = ingest_city_data(
            city_name=city_name,
            country=country,
            activity_limit=activity_limit
        )

    except Exception:
        return jsonify({
            "message": "Unable to ingest travel data"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 500

    return jsonify({
        "message": "Travel data ingested successfully",
        "data": result
    }), 201