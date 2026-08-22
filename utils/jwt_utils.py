import jwt

from functools import wraps
from flask import current_app, request, jsonify


# =========================================================
# VERIFY ACCESS TOKEN
# =========================================================

def verify_access_token(token):
    """
    Decode and verify JWT access token.
    """

    return jwt.decode(
        token,
        current_app.config["JWT_SECRET_KEY"],
        algorithms=["HS256"]
    )


# =========================================================
# TOKEN REQUIRED
# =========================================================

def token_required(function):
    """
    Protect a route.

    Requires:
        Authorization: Bearer <access_token>

    Passes decoded JWT payload to the route.
    """

    @wraps(function)
    def wrapper(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        # -------------------------------------------------
        # Authorization header missing
        # -------------------------------------------------

        if not auth_header:
            return jsonify({
                "message": "Authorization token is required"
            }), 401

        # -------------------------------------------------
        # Validate Bearer format
        # -------------------------------------------------

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "message": "Invalid authorization header"
            }), 401

        token = parts[1]

        # -------------------------------------------------
        # Decode and verify token
        # -------------------------------------------------

        try:

            payload = verify_access_token(token)

        except jwt.ExpiredSignatureError:
            return jsonify({
                "message": "Token expired"
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "message": "Invalid token"
            }), 401

        # -------------------------------------------------
        # Validate required claims
        # -------------------------------------------------

        required_claims = (
            "sub",
            "email",
            "role",
            "exp"
        )

        if not all(
            claim in payload
            for claim in required_claims
        ):
            return jsonify({
                "message": "Invalid token"
            }), 401

        # -------------------------------------------------
        # Validate role
        # GlobeTrotter roles:
        #   user
        #   admin
        # -------------------------------------------------

        role = str(payload["role"]).lower()

        allowed_roles = {
            "user",
            "admin"
        }

        if role not in allowed_roles:
            return jsonify({
                "message": "Invalid user role"
            }), 403

        # Keep normalized role in payload
        payload["role"] = role

        # -------------------------------------------------
        # Pass decoded payload to route
        # -------------------------------------------------

        return function(
            payload,
            *args,
            **kwargs
        )

    return wrapper


# =========================================================
# ROLE REQUIRED
# =========================================================

def role_required(required_role):
    """
    Restrict a route to a specific role.

    Example:

        @route(...)
        @token_required
        @role_required("admin")
        def admin_dashboard(payload):
            ...

    GlobeTrotter roles:
        user
        admin
    """

    required_role = str(required_role).lower()

    allowed_roles = {
        "user",
        "admin"
    }

    # -----------------------------------------------------
    # Validate developer-defined required role
    # -----------------------------------------------------

    if required_role not in allowed_roles:
        raise ValueError(
            f"Invalid role: {required_role}"
        )

    def decorator(function):

        @wraps(function)
        def wrapper(payload, *args, **kwargs):

            user_role = str(
                payload.get("role", "")
            ).lower()

            if user_role != required_role:
                return jsonify({
                    "message": "Access denied"
                }), 403

            return function(
                payload,
                *args,
                **kwargs
            )

        return wrapper

    return decorator