from flask import Flask, jsonify

from config import Config
from extensions import limiter, cors

from routes.auth import auth_bp
from routes.cities import cities_bp
from routes.activities import activities_bp
from routes.trips import trips_bp
from routes.itinerary import itinerary_bp
from routes.transport import transport_bp
from routes.budget import budget_bp
from routes.sharing import sharing_bp
from routes.profile import profile_bp
from routes.saved_destinations import saved_destinations_bp
from routes.dashboard import dashboard_bp
from routes.gemini import gemini_bp


def create_app():

    app = Flask(__name__)

    # =====================================================
    # CONFIGURATION
    # =====================================================

    app.config.from_object(Config)

    # =====================================================
    # EXTENSIONS
    # =====================================================

    limiter.init_app(app)

    cors(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["FRONTEND_URL"]
            }
        },
        supports_credentials=True
    )

    # =====================================================
    # BLUEPRINTS
    # =====================================================

    app.register_blueprint(auth_bp)
    app.register_blueprint(cities_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(itinerary_bp)
    app.register_blueprint(transport_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(sharing_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(saved_destinations_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(gemini_bp)

    # =====================================================
    # HEALTH CHECK
    # =====================================================

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "message": "GlobeTrotter API is running"
        }), 200

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "GlobeTrotter API"
        }), 200

    # =====================================================
    # 404 HANDLER
    # =====================================================

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "message": "Resource not found"
        }), 404

    # =====================================================
    # 405 HANDLER
    # =====================================================

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "message": "Method not allowed"
        }), 405

    # =====================================================
    # GENERAL ERROR HANDLER
    # =====================================================

    @app.errorhandler(Exception)
    def handle_exception(error):

        app.logger.exception(
            "Unhandled application error"
        )

        return jsonify({
            "message": "Internal server error"
        }), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )