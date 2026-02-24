"""
Analysis result model for storing contract analysis results.
"""

from datetime import datetime
from app import db


class AnalysisResult(db.Model):
    """Analysis result model with comprehensive metrics."""
    
    __tablename__ = 'analysis_results'
    
    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('contracts.id'), nullable=False)
    overall_risk_score = db.Column(db.Numeric(5, 2), nullable=False)
    risk_level = db.Column(db.String(50), nullable=False)  # low, medium, high, critical
    completeness_score = db.Column(db.Numeric(5, 2), nullable=False)
    compliance_status = db.Column(db.String(50), nullable=False)  # pass, partial, fail
    total_clauses = db.Column(db.Integer, nullable=False)
    flagged_clauses = db.Column(db.Integer, nullable=False)
    missing_clauses = db.Column(db.Integer, nullable=False)
    analysis_metadata = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    clauses = db.relationship('Clause', backref='analysis', lazy='dynamic', cascade='all, delete-orphan')
    missing_clause_list = db.relationship('MissingClause', backref='analysis', lazy='dynamic', cascade='all, delete-orphan')
    compliance_checks = db.relationship('ComplianceCheck', backref='analysis', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_details=False):
        """Convert analysis to dictionary."""
        data = {
            'id': self.id,
            'contract_id': self.contract_id,
            'overall_risk_score': float(self.overall_risk_score),
            'risk_level': self.risk_level,
            'completeness_score': float(self.completeness_score),
            'compliance_status': self.compliance_status,
            'total_clauses': self.total_clauses,
            'flagged_clauses': self.flagged_clauses,
            'missing_clauses': self.missing_clauses,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_details and self.analysis_metadata:
            data['metadata'] = self.analysis_metadata
            
        return data
    
    def __repr__(self):
        return f'<AnalysisResult {self.id} - {self.risk_level}>'
