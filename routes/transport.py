from flask import Blueprint, request, jsonify

from extensions import limiter
from utils.jwt_utils import token_required
from utils.csrf import verify_csrf

from services.transport_service import (
    get_transport_modes,
    create_trip_transport,
    get_trip_transport
)


transport_bp = Blueprint(
    "transport",
    __name__,
    url_prefix="/api"
)


# =========================================================
# GET TRANSPORT MODES
# =========================================================

@transport_bp.route(
    "/transport-modes",
    methods=["GET"]
)
@limiter.limit("30 per minute")
def transport_modes():

    try:
        modes = get_transport_modes()

    except Exception:
        return jsonify({
            "message": "Unable to fetch transport modes"
        }), 500

    return jsonify({
        "message": "Transport modes fetched successfully",
        "transport_modes": modes
    }), 200


# =========================================================
# CREATE TRANSPORT SEGMENT
# =========================================================

@transport_bp.route(
    "/trips/<uuid:trip_id>/transport",
    methods=["POST"]
)
@limiter.limit("20 per minute")
@token_required
def create_transport(payload, trip_id):

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

    from_stop_id = data.get("from_stop")
    to_stop_id = data.get("to_stop")
    transport_mode_id = data.get(
        "transport_mode_id"
    )

    if not from_stop_id:
        return jsonify({
            "message": "Source stop is required"
        }), 400

    if not to_stop_id:
        return jsonify({
            "message": "Destination stop is required"
        }), 400

    if not transport_mode_id:
        return jsonify({
            "message": "Transport mode is required"
        }), 400

    # -----------------------------------------------------
    # SERVICE
    # -----------------------------------------------------

    try:

        transport, error = create_trip_transport(
            trip_id=str(trip_id),
            user_id=payload["sub"],
            from_stop_id=from_stop_id,
            to_stop_id=to_stop_id,
            transport_mode_id=transport_mode_id
        )

    except Exception:
        return jsonify({
            "message": "Unable to create transport segment"
        }), 500

    if error:

        not_found_errors = {
            "Trip not found",
            "Source stop not found",
            "Destination stop not found",
            "Transport mode not found"
        }

        status_code = (
            404
            if error in not_found_errors
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Transport segment created successfully",
        "transport": transport
    }), 201


# =========================================================
# GET TRIP TRANSPORT
# =========================================================

@transport_bp.route(
    "/trips/<uuid:trip_id>/transport",
    methods=["GET"]
)
@limiter.limit("30 per minute")
@token_required
def trip_transport(payload, trip_id):

    try:

        transport, error = get_trip_transport(
            trip_id=str(trip_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch trip transport"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Trip transport fetched successfully",
        "transport": transport
    }), 200