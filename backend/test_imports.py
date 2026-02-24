import flask
import spacy
import nltk
import fitz  # pymupdf
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
import bcrypt

print("All imports successful!")
print("Flask:", flask.__version__)
print("spaCy:", spacy.__version__)
