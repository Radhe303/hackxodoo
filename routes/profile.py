from flask import Blueprint, request, jsonify

from extensions import limiter

from utils.jwt_utils import token_required
from utils.csrf import verify_csrf

from services.profile_service import (
    get_profile,
    update_profile,
    delete_account
)


profile_bp = Blueprint(
    "profile",
    __name__,
    url_prefix="/api/profile"
)


# =========================================================
# GET PROFILE
# =========================================================

@profile_bp.route("", methods=["GET"])
@limiter.limit("20 per minute")
@token_required
def profile(payload):

    try:
        user = get_profile(
            payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch profile"
        }), 500

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not user["is_active"]:
        return jsonify({
            "message": "Account is inactive"
        }), 403

    return jsonify({
        "message": "Profile fetched successfully",
        "user": user
    }), 200


# =========================================================
# UPDATE PROFILE
# =========================================================

@profile_bp.route("", methods=["PUT"])
@limiter.limit("10 per minute")
@token_required
def update(payload):

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

        user, error = update_profile(
            user_id=payload["sub"],
            full_name=data.get("full_name"),
            profile_photo=data.get("profile_photo"),
            language=data.get("language")
        )

    except Exception:
        return jsonify({
            "message": "Unable to update profile"
        }), 500

    if error:

        return jsonify({
            "message": error
        }), 400

    return jsonify({
        "message": "Profile updated successfully",
        "user": user
    }), 200


# =========================================================
# DELETE ACCOUNT
# =========================================================

@profile_bp.route("", methods=["DELETE"])
@limiter.limit("5 per minute")
@token_required
def delete(payload):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    try:

        success, error = delete_account(
            payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to delete account"
        }), 500

    if error:

        return jsonify({
            "message": error
        }), 404

    return jsonify({
        "message": "Account deleted successfully"
    }), 200