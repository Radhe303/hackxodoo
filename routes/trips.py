from flask import Blueprint, request, jsonify

from extensions import limiter

from utils.jwt_utils import token_required
from utils.csrf import verify_csrf

from services.trip_service import (
    create_trip,
    get_user_trips,
    get_trip_details,
    update_trip,
    delete_trip,
    add_trip_stop,
    get_trip_stops,
    update_trip_stop,
    delete_trip_stop
)


trips_bp = Blueprint(
    "trips",
    __name__,
    url_prefix="/api/trips"
)


# =========================================================
# CREATE TRIP
# =========================================================

@trips_bp.route("", methods=["POST"])
@limiter.limit("10 per minute")
@token_required
def create(payload):

    # -----------------------------------------------------
    # CSRF
    # -----------------------------------------------------

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    # -----------------------------------------------------
    # JSON BODY
    # -----------------------------------------------------

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    trip_name = data.get("trip_name")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    description = data.get("description")
    cover_photo = data.get("cover_photo")

    if not trip_name or not start_date or not end_date:
        return jsonify({
            "message": (
                "Trip name, start date and end date "
                "are required"
            )
        }), 400

    try:

        trip, error = create_trip(
            user_id=payload["sub"],
            trip_name=trip_name,
            start_date=start_date,
            end_date=end_date,
            description=description,
            cover_photo=cover_photo
        )

    except Exception:
        return jsonify({
            "message": "Unable to create trip"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Trip created successfully",
        "trip": trip
    }), 201


# =========================================================
# MY TRIPS
# =========================================================

@trips_bp.route("", methods=["GET"])
@limiter.limit("30 per minute")
@token_required
def my_trips(payload):

    try:

        limit = int(
            request.args.get("limit", 20)
        )

        offset = int(
            request.args.get("offset", 0)
        )

    except ValueError:

        return jsonify({
            "message": "Invalid pagination values"
        }), 400

    if limit < 1 or limit > 100:
        return jsonify({
            "message": "Limit must be between 1 and 100"
        }), 400

    if offset < 0:
        return jsonify({
            "message": "Offset cannot be negative"
        }), 400

    try:

        result = get_user_trips(
            user_id=payload["sub"],
            limit=limit,
            offset=offset
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch trips"
        }), 500

    return jsonify({
        "message": "Trips fetched successfully",
        **result
    }), 200


# =========================================================
# TRIP DETAILS
# =========================================================

@trips_bp.route("/<uuid:trip_id>", methods=["GET"])
@limiter.limit("30 per minute")
@token_required
def details(payload, trip_id):

    try:

        result = get_trip_details(
            trip_id=str(trip_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch trip"
        }), 500

    if not result:
        return jsonify({
            "message": "Trip not found"
        }), 404

    return jsonify({
        "message": "Trip fetched successfully",
        **result
    }), 200


# =========================================================
# UPDATE TRIP
# =========================================================

@trips_bp.route("/<uuid:trip_id>", methods=["PUT"])
@limiter.limit("10 per minute")
@token_required
def update(payload, trip_id):

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

        trip, error = update_trip(
            trip_id=str(trip_id),
            user_id=payload["sub"],
            trip_name=data.get("trip_name"),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            description=data.get("description"),
            cover_photo=data.get("cover_photo"),
            status=data.get("status"),
            visibility=data.get("visibility")
        )

    except Exception:
        return jsonify({
            "message": "Unable to update trip"
        }), 500

    if error:
        status_code = (
            404
            if error == "Trip not found"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Trip updated successfully",
        "trip": trip
    }), 200


# =========================================================
# DELETE TRIP
# =========================================================

@trips_bp.route("/<uuid:trip_id>", methods=["DELETE"])
@limiter.limit("10 per minute")
@token_required
def remove(payload, trip_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    try:

        success, error = delete_trip(
            trip_id=str(trip_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to delete trip"
        }), 500

    if error:
        status_code = (
            404
            if error == "Trip not found"
            else 500
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Trip deleted successfully"
    }), 200


# =========================================================
# ADD CITY / STOP
# =========================================================

@trips_bp.route(
    "/<uuid:trip_id>/stops",
    methods=["POST"]
)
@limiter.limit("20 per minute")
@token_required
def add_stop(payload, trip_id):

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
    arrival_date = data.get("arrival_date")
    departure_date = data.get("departure_date")
    notes = data.get("notes")
    stop_order = data.get("stop_order")

    if (
        not city_id
        or not arrival_date
        or not departure_date
    ):
        return jsonify({
            "message": (
                "City, arrival date and departure date "
                "are required"
            )
        }), 400

    try:

        stop, error = add_trip_stop(
            trip_id=str(trip_id),
            user_id=payload["sub"],
            city_id=city_id,
            arrival_date=arrival_date,
            departure_date=departure_date,
            notes=notes,
            stop_order=stop_order
        )

    except Exception:
        return jsonify({
            "message": "Unable to add city to trip"
        }), 500

    if error:

        status_code = (
            404
            if error in {
                "Trip not found",
                "City not found"
            }
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "City added to trip successfully",
        "stop": stop
    }), 201


# =========================================================
# GET TRIP STOPS
# =========================================================

@trips_bp.route(
    "/<uuid:trip_id>/stops",
    methods=["GET"]
)
@limiter.limit("30 per minute")
@token_required
def stops(payload, trip_id):

    try:

        result, error = get_trip_stops(
            trip_id=str(trip_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch trip stops"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Trip stops fetched successfully",
        "stops": result
    }), 200


# =========================================================
# UPDATE STOP
# =========================================================

@trips_bp.route(
    "/stops/<uuid:stop_id>",
    methods=["PUT"]
)
@limiter.limit("15 per minute")
@token_required
def update_stop(payload, stop_id):

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

        stop, error = update_trip_stop(
            stop_id=str(stop_id),
            user_id=payload["sub"],
            arrival_date=data.get("arrival_date"),
            departure_date=data.get("departure_date"),
            notes=data.get("notes"),
            stop_order=data.get("stop_order")
        )

    except Exception:
        return jsonify({
            "message": "Unable to update trip stop"
        }), 500

    if error:

        status_code = (
            404
            if error in {
                "Trip stop not found",
                "Trip not found"
            }
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Trip stop updated successfully",
        "stop": stop
    }), 200


# =========================================================
# DELETE STOP
# =========================================================

@trips_bp.route(
    "/stops/<uuid:stop_id>",
    methods=["DELETE"]
)
@limiter.limit("15 per minute")
@token_required
def remove_stop(payload, stop_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    try:

        success, error = delete_trip_stop(
            stop_id=str(stop_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to delete trip stop"
        }), 500

    if error:

        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Trip stop deleted successfully"
    }), 200