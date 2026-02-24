"""
Contract model for storing uploaded contracts.
Supports version history and file metadata.
"""

from datetime import datetime
from app import db


class Contract(db.Model):
    """Contract model with version history support."""
    
    __tablename__ = 'contracts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(500), nullable=False)
    file_path = db.Column(db.String(1000), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    extracted_text = db.Column(db.Text)
    version = db.Column(db.Integer, default=1)
    parent_contract_id = db.Column(db.Integer, db.ForeignKey('contracts.id'), nullable=True)
    status = db.Column(db.String(50), default='uploaded')  # uploaded, processing, analyzed, error
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    analysis_results = db.relationship('AnalysisResult', backref='contract', lazy='dynamic', cascade='all, delete-orphan')
    versions = db.relationship('Contract', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    
    def to_dict(self, include_text=False):
        """Convert contract to dictionary."""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'version': self.version,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_text:
            data['extracted_text'] = self.extracted_text
            
        return data
    
    def __repr__(self):
        return f'<Contract {self.title}>'
