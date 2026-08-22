import jwt

from datetime import datetime, timedelta, timezone

from flask import jsonify, current_app
from werkzeug.security import check_password_hash

from config import supabase


def login_user(data):

    # =====================================================
    # VALIDATE REQUEST BODY
    # =====================================================

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    if len(email) > 255 or len(password) > 128:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # =====================================================
    # GET USER
    # =====================================================

    try:
        response = (
            supabase
            .table("users")
            .select(
                """
                id,
                full_name,
                email,
                password_hash,
                profile_photo,
                language,
                role,
                is_active,
                email_verified
                """
            )
            .eq("email", email)
            .maybe_single()
            .execute()
        )

    except Exception:
        return jsonify({
            "message": "Unable to process login request"
        }), 500

    user = response.data

    # =====================================================
    # INVALID CREDENTIALS
    # =====================================================

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not check_password_hash(
        user["password_hash"],
        password
    ):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # =====================================================
    # ACCOUNT STATUS
    # =====================================================

    if not user["is_active"]:
        return jsonify({
            "message": "Your account is inactive"
        }), 403

    # =====================================================
    # JWT PAYLOAD
    # =====================================================

    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }

    # =====================================================
    # GENERATE ACCESS TOKEN
    # =====================================================

    try:
        access_token = jwt.encode(
            payload,
            current_app.config["JWT_SECRET_KEY"],
            algorithm="HS256"
        )

    except Exception:
        return jsonify({
            "message": "Unable to generate access token"
        }), 500

    # =====================================================
    # RESPONSE USER DATA
    # =====================================================

    response_user = {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "profile_photo": user["profile_photo"],
        "language": user["language"],
        "role": user["role"],
        "is_active": user["is_active"],
        "email_verified": user["email_verified"]
    }

    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": response_user
    }), 200