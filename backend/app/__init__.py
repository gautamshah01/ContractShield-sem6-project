"""
Flask application factory.
Creates and configures the Flask application with all extensions and blueprints.
"""

import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO

from app.config import get_config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()


def create_app(config_name=None):
    """
    Application factory pattern.
    Creates and configures the Flask application.
    
    Args:
        config_name: Configuration environment name (development, testing, production)
        
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    config_class = get_config(config_name)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Parse allowed origins from env (comma-separated) or fall back to dev defaults
    cors_origins = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost'
    ).split(',')
    cors_origins = [o.strip() for o in cors_origins if o.strip()]

    # async_mode='threading' works with gunicorn threaded workers and Flask dev server.
    # SocketIO clients auto-fallback to long-polling on platforms without WebSocket support.
    socketio.init_app(
        app,
        cors_allowed_origins=cors_origins,
        async_mode='threading',
        logger=False,
        engineio_logger=False,
    )
    
    # ── Explicit OPTIONS preflight handler ───────────────────────────────────
    # Flask-CORS sometimes returns non-200 on OPTIONS — handle it explicitly.
    from flask import request as flask_request, make_response

    @app.before_request
    def handle_preflight():
        if flask_request.method == "OPTIONS":
            origin = flask_request.headers.get("Origin", "")
            if origin in cors_origins:
                res = make_response("", 200)
                res.headers["Access-Control-Allow-Origin"] = origin
                res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
                res.headers["Access-Control-Allow-Credentials"] = "true"
                res.headers["Access-Control-Max-Age"] = "3600"
                return res

    # Flask-CORS for actual requests (adds headers to GET/POST/etc responses)
    CORS(
        app,
        resources={r"/api/*": {
            "origins": cors_origins,
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        }}
    )

    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints
    register_blueprints(app)

    # Register socket events
    from app.blueprints.sockets import register_events
    register_events(socketio)

    # Register error handlers
    register_error_handlers(app)

    # Register JWT handlers
    register_jwt_handlers(app)

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for deployment monitoring."""
        return jsonify({
            'status': 'healthy',
            'environment': config_name
        }), 200

    return app


def register_blueprints(app):
    """Register all application blueprints."""
    from app.blueprints.auth import auth_bp
    from app.blueprints.contracts import contracts_bp
    from app.blueprints.analysis import analysis_bp
    from app.blueprints.reports import reports_bp
    from app.blueprints.appointments import appointments_bp
    from app.blueprints.agent import agent_bp
    from app.blueprints.admin import admin_bp
    from app.blueprints.signaling import signal_bp
    from app.blueprints.discussion import discussion_bp

    app.register_blueprint(auth_bp,          url_prefix='/api/auth')
    app.register_blueprint(contracts_bp,     url_prefix='/api/contracts')
    app.register_blueprint(analysis_bp,      url_prefix='/api/analysis')
    app.register_blueprint(reports_bp,       url_prefix='/api/reports')
    app.register_blueprint(appointments_bp,  url_prefix='/api/appointments')
    app.register_blueprint(agent_bp,         url_prefix='/api/agent')
    app.register_blueprint(admin_bp,         url_prefix='/api/admin')
    app.register_blueprint(signal_bp,        url_prefix='/api/signal')
    app.register_blueprint(discussion_bp,    url_prefix='/api/discussions')

    # Ensure new models are imported so Flask-Migrate generates migrations
    from app.models import appointment, chat_message, discussion  # noqa: F401


def register_error_handlers(app):
    """Register global error handlers."""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'error': 'Bad request',
            'message': str(error)
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'success': False,
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'Insufficient permissions'
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Not found',
            'message': 'Resource not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500


def register_jwt_handlers(app):
    """Register JWT-specific handlers."""
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'error': 'Token expired',
            'message': 'The token has expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'error': 'Invalid token',
            'message': 'Token verification failed'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'error': 'Missing token',
            'message': 'Authorization token is required'
        }), 401
