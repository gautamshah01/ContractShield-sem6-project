"""
Missing clause model for tracking absent mandatory clauses.
"""

from datetime import datetime
from app import db


class MissingClause(db.Model):
    """Missing clause model."""
    
    __tablename__ = 'missing_clauses'
    
    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('analysis_results.id'), nullable=False)
    clause_name = db.Column(db.String(255), nullable=False)
    clause_category = db.Column(db.String(100), nullable=False)
    importance = db.Column(db.String(50), nullable=False)  # mandatory, recommended, optional
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert missing clause to dictionary."""
        return {
            'id': self.id,
            'clause_name': self.clause_name,
            'clause_category': self.clause_category,
            'importance': self.importance,
            'description': self.description
        }
    
    def __repr__(self):
        return f'<MissingClause {self.clause_name}>'
