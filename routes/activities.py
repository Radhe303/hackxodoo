from flask import Blueprint, request, jsonify

from extensions import limiter

from services.activity_service import (
    search_activities,
    get_activity
)


activities_bp = Blueprint(
    "activities",
    __name__,
    url_prefix="/api/activities"
)


# =========================================================
# SEARCH / FILTER ACTIVITIES
# =========================================================

@activities_bp.route("", methods=["GET"])
@limiter.limit("30 per minute")
def search():

    city_id = request.args.get("city_id")
    query = request.args.get("q")
    category = request.args.get("category")

    min_cost_raw = request.args.get(
        "min_cost"
    )

    max_cost_raw = request.args.get(
        "max_cost"
    )

    max_duration_raw = request.args.get(
        "max_duration"
    )

    # -----------------------------------------------------
    # PAGINATION
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # COST
    # -----------------------------------------------------

    try:

        min_cost = (
            float(min_cost_raw)
            if min_cost_raw is not None
            else None
        )

        max_cost = (
            float(max_cost_raw)
            if max_cost_raw is not None
            else None
        )

    except ValueError:

        return jsonify({
            "message": "Invalid cost filter"
        }), 400

    if min_cost is not None and min_cost < 0:

        return jsonify({
            "message": "Minimum cost cannot be negative"
        }), 400

    if max_cost is not None and max_cost < 0:

        return jsonify({
            "message": "Maximum cost cannot be negative"
        }), 400

    if (
        min_cost is not None
        and max_cost is not None
        and min_cost > max_cost
    ):

        return jsonify({
            "message": (
                "Minimum cost cannot be greater "
                "than maximum cost"
            )
        }), 400

    # -----------------------------------------------------
    # DURATION
    # -----------------------------------------------------

    try:

        max_duration = (
            int(max_duration_raw)
            if max_duration_raw is not None
            else None
        )

    except ValueError:

        return jsonify({
            "message": "Invalid duration filter"
        }), 400

    if max_duration is not None and max_duration < 0:

        return jsonify({
            "message": "Duration cannot be negative"
        }), 400

    # -----------------------------------------------------
    # SERVICE
    # -----------------------------------------------------

    try:

        result = search_activities(
            city_id=city_id,
            query=query,
            category=category,
            min_cost=min_cost,
            max_cost=max_cost,
            max_duration=max_duration,
            limit=limit,
            offset=offset
        )

    except Exception:

        return jsonify({
            "message": "Unable to search activities"
        }), 500

    return jsonify({
        "message": "Activities fetched successfully",
        **result
    }), 200


# =========================================================
# ACTIVITY DETAILS
# =========================================================

@activities_bp.route(
    "/<uuid:activity_id>",
    methods=["GET"]
)
@limiter.limit("30 per minute")
def details(activity_id):

    try:

        activity = get_activity(
            activity_id
        )

    except Exception:

        return jsonify({
            "message": "Unable to fetch activity"
        }), 500

    if not activity:

        return jsonify({
            "message": "Activity not found"
        }), 404

    return jsonify({
        "message": "Activity fetched successfully",
        "activity": activity
    }), 200