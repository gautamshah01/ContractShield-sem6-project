"""
Appointment model.
Manages booking requests between clients and lawyers.
Status lifecycle: pending → approved | rejected
"""

from datetime import datetime
from app import db


class Appointment(db.Model):
    __tablename__ = 'appointments'

    id          = db.Column(db.Integer, primary_key=True)
    client_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lawyer_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status      = db.Column(db.String(20), default='pending')   # pending|approved|rejected
    message     = db.Column(db.Text, default='')                # optional note from client
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Communication enabled once approved
    chat_enabled  = db.Column(db.Boolean, default=False)
    call_enabled  = db.Column(db.Boolean, default=False)

    # Relationships
    client = db.relationship('User', foreign_keys=[client_id], backref='appointments_as_client')
    lawyer = db.relationship('User', foreign_keys=[lawyer_id], backref='appointments_as_lawyer')

    def approve(self):
        self.status       = 'approved'
        self.chat_enabled = True
        self.call_enabled = True
        self.updated_at   = datetime.utcnow()

    def reject(self):
        self.status       = 'rejected'
        self.chat_enabled = False
        self.call_enabled = False
        self.updated_at   = datetime.utcnow()

    def to_dict(self):
        return {
            'id':            self.id,
            'client_id':     self.client_id,
            'lawyer_id':     self.lawyer_id,
            'status':        self.status,
            'message':       self.message,
            'chat_enabled':  self.chat_enabled,
            'call_enabled':  self.call_enabled,
            'created_at':    self.created_at.isoformat() if self.created_at else None,
            'client_name':   self.client.full_name  if self.client else '',
            'client_email':  self.client.email      if self.client else '',
            'lawyer_name':   self.lawyer.full_name  if self.lawyer else '',
            'lawyer_email':  self.lawyer.email      if self.lawyer else '',
        }
