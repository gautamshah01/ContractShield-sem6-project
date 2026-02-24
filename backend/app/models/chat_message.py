"""
Chat message model.
Stores messages between client and lawyer after appointment is approved.
"""

from datetime import datetime
from app import db


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id              = db.Column(db.Integer, primary_key=True)
    appointment_id  = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=False)
    sender_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message         = db.Column(db.Text, nullable=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    read            = db.Column(db.Boolean, default=False)

    sender      = db.relationship('User', foreign_keys=[sender_id])
    appointment = db.relationship('Appointment', backref='messages')

    def to_dict(self):
        return {
            'id':             self.id,
            'appointment_id': self.appointment_id,
            'sender_id':      self.sender_id,
            'sender_name':    self.sender.full_name if self.sender else '',
            'sender_role':    self.sender.role      if self.sender else '',
            'message':        self.message,
            'created_at':     self.created_at.isoformat() if self.created_at else None,
            'read':           self.read,
        }
