"""
Compliance check model for Indian legal compliance tracking.
"""

from datetime import datetime
from app import db


class ComplianceCheck(db.Model):
    """Compliance check model for legal requirements."""
    
    __tablename__ = 'compliance_checks'
    
    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('analysis_results.id'), nullable=False)
    rule_name = db.Column(db.String(255), nullable=False)
    rule_reference = db.Column(db.String(500))
    status = db.Column(db.String(50), nullable=False)  # pass, fail, warning
    explanation = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert compliance check to dictionary."""
        return {
            'id': self.id,
            'rule_name': self.rule_name,
            'rule_reference': self.rule_reference,
            'status': self.status,
            'explanation': self.explanation
        }
    
    def __repr__(self):
        return f'<ComplianceCheck {self.rule_name} - {self.status}>'
