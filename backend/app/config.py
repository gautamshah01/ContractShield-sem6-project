"""
Configuration management for Flask application.
Supports different environments: development, testing, production.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class with common settings."""
    
    # Flask Core
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-me'
    DEBUG = False
    TESTING = False
    
    # Database
    # Supabase uses 'postgres://' but SQLAlchemy needs 'postgresql://'
    _db_url = os.environ.get('DATABASE_URL') or 'sqlite:///contract_analyzer.db'
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    # Connection pool — tuned for Railway's external TCP proxy
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping':  True,       # test connection before checkout
        'pool_recycle':   120,        # recycle every 2 min (proxy kills idle conns at ~5 min)
        'pool_size':      5,
        'max_overflow':   5,
        'pool_timeout':   10,         # fail fast — don't block for 30s like default
        'connect_args': {
            'connect_timeout':      10,   # TCP connect timeout (seconds)
            'keepalives':           1,    # enable TCP keepalive
            'keepalives_idle':      10,   # start probing after 10s idle
            'keepalives_interval':  5,    # retransmit every 5s
            'keepalives_count':     3,    # drop after 3 failed probes
        },
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-me'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # File Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'pdf', 'txt'}
    
    # NLP Configuration
    SPACY_MODEL = os.environ.get('SPACY_MODEL', 'en_core_web_sm')
    
    # Groq API Configuration
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    GROQ_API_URL = os.environ.get('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions')
    GROQ_MODEL = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')
    GROQ_ENABLED = bool(os.environ.get('GROQ_API_KEY'))
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Pagination
    ITEMS_PER_PAGE = 20


class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    """Testing environment configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test_contract_analyzer.db'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


class ProductionConfig(Config):
    """Production environment configuration."""
    DEBUG = False
    SQLALCHEMY_ECHO = False

    # Add SSL for Supabase PostgreSQL
    @classmethod
    def init_app(cls, app):
        """Initialize production-specific settings."""
        # Ensure SECRET_KEY is set and not the dev default
        if not app.config.get('SECRET_KEY') or app.config['SECRET_KEY'] == 'dev-secret-key-change-me':
            raise ValueError("SECRET_KEY must be set to a strong random value in production!")

        # Ensure JWT_SECRET_KEY is set
        if not app.config.get('JWT_SECRET_KEY') or app.config['JWT_SECRET_KEY'] == 'jwt-secret-key-change-me':
            raise ValueError("JWT_SECRET_KEY must be set to a strong random value in production!")

        # Add SSL to PostgreSQL connection for Supabase
        db_url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if 'postgresql' in db_url or 'postgres' in db_url:
            engine_options = app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {})
            engine_options['connect_args'] = {'sslmode': 'require'}
            app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_options


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config(env=None):
    """Get configuration based on environment."""
    if env is None:
        env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
