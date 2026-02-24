"""
User model for authentication and authorization.
Implements role-based access control (RBAC).
Supports roles: client, lawyer, admin
"""

from datetime import datetime
from app import db
import bcrypt


class User(db.Model):
    """User model with role-based access control."""

    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name     = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.String(50), nullable=False, default='client')  # client|lawyer|admin
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Lawyer-specific profile fields ─────────────────────
    specialization = db.Column(db.String(255), nullable=True)
    experience_yrs = db.Column(db.Integer,     nullable=True)
    bar_council_id = db.Column(db.String(100), nullable=True)
    bio            = db.Column(db.Text,        nullable=True)
    hourly_rate    = db.Column(db.Float,       nullable=True)
    available      = db.Column(db.Boolean,     default=True)
    rating         = db.Column(db.Float,       default=4.5)
    location       = db.Column(db.String(255), nullable=True)

    # ── Approval status (lawyers must be approved by admin before login) ─
    is_approved    = db.Column(db.Boolean, default=False, nullable=False)

    # Relationships
    contracts = db.relationship('Contract', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def __init__(self, email, password, full_name, role='client', **kwargs):
        self.email     = email
        self.full_name = full_name
        self.role      = role
        # Clients and admins are auto-approved; lawyers need admin approval
        self.is_approved = (role in ('client', 'admin'))
        self.set_password(password)
        for k, v in kwargs.items():
            if hasattr(self, k):
                setattr(self, k, v)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def to_dict(self, include_sensitive=False):
        data = {
            'id':          self.id,
            'email':       self.email,
            'full_name':   self.full_name,
            'role':        self.role,
            'is_approved': self.is_approved,
            'created_at':  self.created_at.isoformat() if self.created_at else None,
        }
        if self.role == 'lawyer':
            data.update({
                'specialization': self.specialization,
                'experience_yrs': self.experience_yrs,
                'bar_council_id': self.bar_council_id,
                'bio':            self.bio,
                'hourly_rate':    self.hourly_rate,
                'available':      self.available,
                'rating':         self.rating,
                'location':       self.location,
            })
        if include_sensitive:
            data['updated_at'] = self.updated_at.isoformat() if self.updated_at else None
        return data

    def __repr__(self):
        return f'<User {self.email} ({self.role})>'
