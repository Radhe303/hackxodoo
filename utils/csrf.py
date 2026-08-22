import secrets

from flask import request, current_app


CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"


def set_csrf_cookie(response):
    """
    Generate and set a CSRF token cookie.
    """

    token = secrets.token_urlsafe(32)

    response.set_cookie(
        key=CSRF_COOKIE,
        value=token,
        httponly=False,
        secure=current_app.config["COOKIE_SECURE"],
        samesite="Lax",
        max_age=30 * 24 * 60 * 60,
        path="/"
    )

    return response


def verify_csrf():
    """
    Verify CSRF token from request header
    against the token stored in the cookie.
    """

    cookie_token = request.cookies.get(
        CSRF_COOKIE
    )

    header_token = request.headers.get(
        CSRF_HEADER
    )

    if not cookie_token or not header_token:
        return False

    return secrets.compare_digest(
        cookie_token,
        header_token
    )