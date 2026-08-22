from flask import jsonify
from werkzeug.security import generate_password_hash

from config import supabase


def register_user(data):

    # =====================================================
    # VALIDATE REQUEST BODY
    # =====================================================

    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request body"
        }), 400

    # =====================================================
    # GET INPUT
    # =====================================================

    full_name = str(
        data.get("full_name", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = data.get("password", "")

    # =====================================================
    # REQUIRED FIELDS
    # =====================================================

    if not full_name or not email or not password:
        return jsonify({
            "message": "Full name, email and password are required"
        }), 400

    # =====================================================
    # VALIDATION
    # =====================================================

    if len(full_name) < 2 or len(full_name) > 100:
        return jsonify({
            "message": "Full name must be between 2 and 100 characters"
        }), 400

    if len(email) > 255:
        return jsonify({
            "message": "Invalid email"
        }), 400

    if len(password) < 8:
        return jsonify({
            "message": "Password must be at least 8 characters"
        }), 400

    if len(password) > 128:
        return jsonify({
            "message": "Password is too long"
        }), 400

    # =====================================================
    # CHECK EXISTING USER
    # =====================================================

    try:

        existing_response = (
            supabase
            .table("users")
            .select("id")
            .eq("email", email)
            .maybe_single()
            .execute()
        )

    except Exception:
        return jsonify({
            "message": "Unable to process registration request"
        }), 500

    if existing_response.data:
        return jsonify({
            "message": "An account with this email already exists"
        }), 409

    # =====================================================
    # HASH PASSWORD
    # =====================================================

    password_hash = generate_password_hash(
        password
    )

    # =====================================================
    # CREATE USER
    #
    # role is NOT accepted from client.
    #
    # Database defaults:
    # role = user
    # is_active = true
    # email_verified = false
    # language = English
    # =====================================================

    user_data = {
        "full_name": full_name,
        "email": email,
        "password_hash": password_hash
    }

    try:

        response = (
            supabase
            .table("users")
            .insert(user_data)
            .execute()
        )

    except Exception:
        return jsonify({
            "message": "Unable to create account"
        }), 500

    if not response.data:
        return jsonify({
            "message": "Unable to create account"
        }), 500

    user = response.data[0]

    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "is_active": user["is_active"],
            "email_verified": user["email_verified"],
            "created_at": user["created_at"]
        }
    }), 201