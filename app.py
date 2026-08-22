from flask import Flask, app, jsonify

from config import Config
from extensions import limiter

from routes.auth import auth_bp
from routes.cities import cities_bp
from routes.activities import activities_bp
from routes.trips import trips_bp
from routes.itinerary import itinerary_bp
from routes.transport import transport_bp
from routes.budget import budget_bp

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

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )