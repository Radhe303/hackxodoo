from flask import (
    Blueprint,
    request,
    jsonify,
    make_response,
    current_app
)

from extensions import limiter

from utils.jwt_utils import token_required
from utils.csrf import (
    set_csrf_cookie,
    verify_csrf
)

from services.register_service import register_user
from services.login_service import login_user

from config import supabase


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api"
)


# =========================================================
# CSRF TOKEN
# =========================================================

@auth_bp.route("/csrf", methods=["GET"])
def csrf():

    response = make_response(jsonify({
        "message": "CSRF token ready"
    }))

    return set_csrf_cookie(response)


# =========================================================
# REGISTER
# =========================================================

@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "message": "Invalid JSON request body"
        }), 400

    return register_user(data)


# =========================================================
# LOGIN
# =========================================================

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "message": "Invalid JSON request body"
        }), 400

    return login_user(data)


# =========================================================
# PROFILE
# =========================================================

@auth_bp.route("/profile", methods=["GET"])
@limiter.limit("10 per minute")
@token_required
def profile(payload):

    user_id = payload.get("sub")

    if not user_id:
        return jsonify({
            "message": "Invalid authentication token"
        }), 401

    try:

        response = (
            supabase
            .table("users")
            .select(
                """
                id,
                full_name,
                email,
                profile_photo,
                language,
                role,
                is_active,
                email_verified,
                created_at,
                updated_at
                """
            )
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch profile"
        }), 500

    user = response.data

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not user["is_active"]:
        return jsonify({
            "message": "Account is inactive"
        }), 403

    return jsonify({
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "profile_photo": user["profile_photo"],
        "language": user["language"],
        "role": user["role"],
        "is_active": user["is_active"],
        "email_verified": user["email_verified"],
        "created_at": user["created_at"],
        "updated_at": user["updated_at"]
    }), 200


# =========================================================
# LOGOUT
# =========================================================

@auth_bp.route("/logout", methods=["POST"])
@limiter.limit("10 per minute")
@token_required
def logout(payload):

    if not verify_csrf():
        return jsonify({
            "message": "Invalid CSRF token"
        }), 403

    response = make_response(jsonify({
        "message": "Logged out successfully"
    }))

    response.set_cookie(
        key="csrf_token",
        value="",
        expires=0,
        max_age=0,
        secure=current_app.config["COOKIE_SECURE"],
        httponly=False,
        samesite="Lax",
        path="/"
    )

    return response