from flask import Blueprint, jsonify

from extensions import limiter
from utils.jwt_utils import token_required
from services.dashboard_service import get_dashboard


dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)


# =========================================================
# GET DASHBOARD
# =========================================================

@dashboard_bp.route("", methods=["GET"])
@limiter.limit("20 per minute")
@token_required
def dashboard(payload):

    try:
        dashboard_data = get_dashboard(
            payload["sub"]
        )

    except Exception:
        return jsonify({
            "message": "Unable to fetch dashboard"
        }), 500

    return jsonify({
        "message": "Dashboard fetched successfully",
        "dashboard": dashboard_data
    }), 200