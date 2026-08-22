from flask import Blueprint, request, jsonify

from extensions import limiter
from utils.jwt_utils import token_required
from utils.csrf import verify_csrf

from services.budget_service import (
    calculate_trip_budget,
    save_trip_budget,
    get_trip_budget
)


budget_bp = Blueprint(
    "budget",
    __name__,
    url_prefix="/api/budget"
)


@budget_bp.route(
    "/trips/<uuid:trip_id>/calculate",
    methods=["POST"]
)
@limiter.limit("15 per minute")
@token_required
def calculate_budget(payload, trip_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    data = request.get_json(silent=True)

    if data is None:
        data = {}

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    miscellaneous_cost = data.get(
        "miscellaneous_cost",
        0
    )

    budget_limit = data.get(
        "budget_limit"
    )

    try:
        miscellaneous_cost = float(
            miscellaneous_cost or 0
        )
    except (TypeError, ValueError):
        return jsonify({
            "message": "Invalid miscellaneous cost"
        }), 400

    if miscellaneous_cost < 0:
        return jsonify({
            "message": "Miscellaneous cost cannot be negative"
        }), 400

    if budget_limit is not None:

        try:
            budget_limit = float(
                budget_limit
            )
        except (TypeError, ValueError):
            return jsonify({
                "message": "Invalid budget limit"
            }), 400

        if budget_limit < 0:
            return jsonify({
                "message": "Budget limit cannot be negative"
            }), 400

    try:

        result, error = calculate_trip_budget(
            trip_id=str(trip_id),
            user_id=payload["sub"],
            miscellaneous_cost=miscellaneous_cost,
            budget_limit=budget_limit
        )

    except Exception:
        return jsonify({
            "message": "Unable to calculate trip budget"
        }), 500

    if error:

        return jsonify({
            "message": error
        }), 400

    try:

        saved_budget, save_error = save_trip_budget(
            trip_id=str(trip_id),
            user_id=payload["sub"],
            budget_data=result
        )

    except Exception:
        return jsonify({
            "message": "Budget calculated but could not be saved"
        }), 500

    if save_error:
        return jsonify({
            "message": save_error
        }), 500

    return jsonify({
        "message": (
            "Trip budget calculated successfully"
            if not result["is_over_budget"]
            else "Trip is over budget"
        ),
        "budget": result,
        "saved_budget": saved_budget
    }), 200


@budget_bp.route(
    "/trips/<uuid:trip_id>",
    methods=["GET"]
)
@limiter.limit("30 per minute")
@token_required
def get_budget(payload, trip_id):

    try:

        budget, error = get_trip_budget(
            trip_id=str(trip_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch trip budget"
        }), 500

    if error:
        return jsonify({
            "message": error
        }), 404

    if not budget:
        return jsonify({
            "message": "Trip budget not found"
        }), 404

    return jsonify({
        "message": "Trip budget fetched successfully",
        "budget": budget
    }), 200