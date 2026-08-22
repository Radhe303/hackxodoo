from flask import Blueprint, request, jsonify

from extensions import limiter

from services.city_service import (
    search_cities,
    get_city
)


cities_bp = Blueprint(
    "cities",
    __name__,
    url_prefix="/api/cities"
)


# =========================================================
# SEARCH CITIES
# =========================================================

@cities_bp.route("", methods=["GET"])
@limiter.limit("30 per minute")
def search():

    query = request.args.get("q")
    country = request.args.get("country")
    region = request.args.get("region")

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

        result = search_cities(
            query=query,
            country=country,
            region=region,
            limit=limit,
            offset=offset
        )

    except Exception:

        return jsonify({
            "message": "Unable to search cities"
        }), 500

    return jsonify({
        "message": "Cities fetched successfully",
        **result
    }), 200


# =========================================================
# CITY DETAILS
# =========================================================

@cities_bp.route(
    "/<uuid:city_id>",
    methods=["GET"]
)
@limiter.limit("30 per minute")
def details(city_id):

    try:

        city = get_city(
            city_id
        )

    except Exception:

        return jsonify({
            "message": "Unable to fetch city"
        }), 500

    if not city:

        return jsonify({
            "message": "City not found"
        }), 404

    return jsonify({
        "message": "City fetched successfully",
        "city": city
    }), 200