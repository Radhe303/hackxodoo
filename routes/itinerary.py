from flask import Blueprint, request, jsonify

from extensions import limiter
from utils.jwt_utils import token_required
from utils.csrf import verify_csrf

from services.itinerary_service import (
    add_activity_to_stop,
    get_stop_itinerary,
    get_trip_itinerary,
    update_stop_activity,
    remove_activity_from_stop
)


itinerary_bp = Blueprint(
    "itinerary",
    __name__,
    url_prefix="/api/itinerary"
)


# =========================================================
# ADD ACTIVITY TO STOP
# =========================================================

@itinerary_bp.route("/stops/<uuid:stop_id>/activities", methods=["POST"])
@limiter.limit("20 per minute")
@token_required
def add_activity(payload, stop_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    activity_id = data.get("activity_id")
    activity_date = data.get("activity_date")
    activity_time = data.get("activity_time")
    custom_cost = data.get("custom_cost")

    if not activity_id:
        return jsonify({
            "message": "Activity ID is required"
        }), 400

    try:
        result, error = add_activity_to_stop(
            stop_id=str(stop_id),
            user_id=payload["sub"],
            activity_id=activity_id,
            activity_date=activity_date,
            activity_time=activity_time,
            custom_cost=custom_cost
        )

    except Exception:
        return jsonify({
            "message": "Unable to add activity to itinerary"
        }), 500

    if error:
        status_code = (
            404
            if error in {
                "Trip stop not found",
                "Activity not found"
            }
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Activity added to itinerary successfully",
        "itinerary_activity": result
    }), 201


# =========================================================
# GET STOP ITINERARY
# =========================================================

@itinerary_bp.route("/stops/<uuid:stop_id>", methods=["GET"])
@limiter.limit("30 per minute")
@token_required
def stop_itinerary(payload, stop_id):

    try:
        result, error = get_stop_itinerary(
            stop_id=str(stop_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch stop itinerary"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Stop itinerary fetched successfully",
        **result
    }), 200


# =========================================================
# GET COMPLETE TRIP ITINERARY
# =========================================================

@itinerary_bp.route("/trips/<uuid:trip_id>", methods=["GET"])
@limiter.limit("30 per minute")
@token_required
def trip_itinerary(payload, trip_id):

    try:
        result, error = get_trip_itinerary(
            trip_id=str(trip_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch trip itinerary"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Trip itinerary fetched successfully",
        **result
    }), 200


# =========================================================
# UPDATE ITINERARY ACTIVITY
# =========================================================

@itinerary_bp.route(
    "/activities/<uuid:stop_activity_id>",
    methods=["PUT"]
)
@limiter.limit("15 per minute")
@token_required
def update_activity(payload, stop_activity_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    try:
        result, error = update_stop_activity(
            stop_activity_id=str(stop_activity_id),
            user_id=payload["sub"],
            activity_date=data.get("activity_date"),
            activity_time=data.get("activity_time"),
            custom_cost=data.get("custom_cost")
        )

    except Exception:
        return jsonify({
            "message": "Unable to update itinerary activity"
        }), 500

    if error:
        status_code = (
            404
            if error == "Itinerary activity not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Itinerary activity updated successfully",
        "itinerary_activity": result
    }), 200


# =========================================================
# REMOVE ACTIVITY
# =========================================================

@itinerary_bp.route(
    "/activities/<uuid:stop_activity_id>",
    methods=["DELETE"]
)
@limiter.limit("15 per minute")
@token_required
def remove_activity(payload, stop_activity_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    try:
        success, error = remove_activity_from_stop(
            stop_activity_id=str(stop_activity_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to remove itinerary activity"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Activity removed from itinerary successfully"
    }), 200