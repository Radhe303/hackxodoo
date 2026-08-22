from flask import Blueprint, request, jsonify

from extensions import limiter
from utils.jwt_utils import token_required
from utils.csrf import verify_csrf

from services.sharing_service import (
    create_share_link,
    get_shared_trip,
    delete_share_link,
    copy_shared_trip
)


sharing_bp = Blueprint(
    "sharing",
    __name__,
    url_prefix="/api/sharing"
)


# =========================================================
# CREATE SHARE LINK
# =========================================================

@sharing_bp.route(
    "/trips/<uuid:trip_id>",
    methods=["POST"]
)
@limiter.limit("10 per minute")
@token_required
def create_share(payload, trip_id):

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

    visibility = data.get(
        "visibility",
        "public"
    )

    expires_at = data.get(
        "expires_at"
    )

    try:

        shared_trip, error = create_share_link(
            trip_id=str(trip_id),
            user_id=payload["sub"],
            visibility=visibility,
            expires_at=expires_at
        )

    except Exception:
        return jsonify({
            "message": "Unable to create share link"
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
        "message": "Share link created successfully",
        "shared_trip": shared_trip
    }), 201


# =========================================================
# GET PUBLIC SHARED TRIP
# =========================================================

@sharing_bp.route(
    "/public/<string:share_token>",
    methods=["GET"]
)
@limiter.limit("30 per minute")
def public_trip(share_token):

    if not share_token:
        return jsonify({
            "message": "Share token is required"
        }), 400

    try:

        shared_trip, error = get_shared_trip(
            share_token
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch shared trip"
        }), 500

    if error:

        status_code = (
            404
            if error in {
                "Shared trip not found",
                "Trip not found"
            }
            else 410
            if error == "Share link has expired"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Shared trip fetched successfully",
        "shared_trip": shared_trip
    }), 200


# =========================================================
# DELETE SHARE LINK
# =========================================================

@sharing_bp.route(
    "/<uuid:share_id>",
    methods=["DELETE"]
)
@limiter.limit("10 per minute")
@token_required
def delete_share(payload, share_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    try:

        success, error = delete_share_link(
            share_id=str(share_id),
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to delete share link"
        }), 500

    if error:

        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Share link deleted successfully"
    }), 200
# =========================================================
# COPY SHARED TRIP
# =========================================================

@sharing_bp.route(
    "/public/<string:share_token>/copy",
    methods=["POST"]
)

@limiter.limit("10 per minute")
@token_required
def copy_trip(payload, share_token):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    try:

        result, error = copy_shared_trip(
            share_token=share_token,
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to copy shared trip"
        }), 500

    if error:

        if error in {
            "Shared trip not found",
            "Original trip not found"
        }:
            status_code = 404

        elif error == "Share link has expired":
            status_code = 410

        else:
            status_code = 400

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Trip copied successfully",
        "trip": result["trip"],
        "copied_stops": result["copied_stops"],
        "copied_activities": result["copied_activities"]
    }), 201
# =========================================================
# CREATE FRIENDS SHARE
# =========================================================

@sharing_bp.route(
    "/trips/<uuid:trip_id>/friends",
    methods=["POST"]
)
@limiter.limit("10 per minute")
@token_required
def create_friends_share_route(payload, trip_id):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    friend_user_ids = data.get(
        "friend_user_ids"
    )

    if not isinstance(
        friend_user_ids,
        list
    ):
        return jsonify({
            "message": "friend_user_ids must be a list"
        }), 400

    expires_at = data.get(
        "expires_at"
    )

    try:

        result, error = create_friends_share(
            trip_id=str(trip_id),
            user_id=payload["sub"],
            friend_user_ids=friend_user_ids,
            expires_at=expires_at
        )

    except Exception:
        return jsonify({
            "message": "Unable to create friends share"
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
        "message": "Friends share created successfully",
        "shared_trip": result
    }), 201


# =========================================================
# GET FRIENDS SHARED TRIP
# =========================================================

@sharing_bp.route(
    "/friends/<string:share_token>",
    methods=["GET"]
)
@limiter.limit("30 per minute")
@token_required
def friends_shared_trip(payload, share_token):

    try:

        result, error = get_friends_shared_trip(
            share_token=share_token,
            user_id=payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch shared trip"
        }), 500

    if error:

        status_code = (
            404
            if error in {
                "Shared trip not found",
                "Trip not found"
            }
            else 410
            if error == "Share link has expired"
            else 403
            if error == "Access denied"
            else 400
        )

        return jsonify({
            "message": error
        }), status_code

    return jsonify({
        "message": "Shared trip fetched successfully",
        "shared_trip": result
    }), 200