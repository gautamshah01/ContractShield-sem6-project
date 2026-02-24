from . import db
from datetime import datetime
import bcrypt

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='Client') # Client, Lawyer, Admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Contract(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    original_text = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(200))
    risk_score = db.Column(db.Float, default=0.0)
    version = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    clauses = db.relationship('Clause', backref='contract', lazy=True, cascade="all, delete-orphan")
    risks = db.relationship('Risk', backref='contract', lazy=True, cascade="all, delete-orphan")

class Clause(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'), nullable=False)
    clause_type = db.Column(db.String(50)) # Payment, Termination, etc.
    text = db.Column(db.Text, nullable=False)
    start_idx = db.Column(db.Integer)
    end_idx = db.Column(db.Integer)

class Risk(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('contract.id'), nullable=False)
    clause_id = db.Column(db.Integer, db.ForeignKey('clause.id'), nullable=True)
    severity = db.Column(db.String(20)) # Low, Medium, High
    risk_type = db.Column(db.String(100))
    description = db.Column(db.Text)
    explanation = db.Column(db.Text)
