"""
Clause model for extracted and classified clauses.
"""

from datetime import datetime
from app import db


class Clause(db.Model):
    """Extracted clause model with risk assessment."""
    
    __tablename__ = 'clauses'
    
    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('analysis_results.id'), nullable=False)
    clause_type = db.Column(db.String(100), nullable=False)
    clause_text = db.Column(db.Text, nullable=False)
    clause_position = db.Column(db.Integer, nullable=False)
    risk_level = db.Column(db.String(50))  # none, low, medium, high
    risk_explanation = db.Column(db.Text)
    plain_explanation = db.Column(db.Text)
    is_flagged = db.Column(db.Boolean, default=False)
    flagged_reasons = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert clause to dictionary."""
        return {
            'id': self.id,
            'clause_type': self.clause_type,
            'clause_text': self.clause_text,
            'clause_position': self.clause_position,
            'risk_level': self.risk_level,
            'risk_explanation': self.risk_explanation,
            'plain_explanation': self.plain_explanation,
            'is_flagged': self.is_flagged,
            'flagged_reasons': self.flagged_reasons
        }
    
    def __repr__(self):
        return f'<Clause {self.clause_type} - Position {self.clause_position}>'
