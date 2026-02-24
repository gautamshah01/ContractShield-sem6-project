from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Contract, Clause, Risk, db
from ..services.pdf_extractor import PDFExtractor
from ..services.nlp_processor import NLPProcessor
from ..services.risk_engine import RiskEngine
import os

bp = Blueprint('contracts', __name__, url_prefix='/api/contracts')
nlp_proc = NLPProcessor()
risk_eng = RiskEngine()

@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload():
    user_id = get_jwt_identity()
    file = request.files.get('file')
    title = request.form.get('title', 'Untitled')
    
    if not file:
        return jsonify({"msg": "No file uploaded"}), 400

    # Save file temporarily (in a real app, use S3 or similar)
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    
    file_path = os.path.join('uploads', file.filename)
    file.save(file_path)
    
    # Extract text
    if file.filename.endswith('.pdf'):
        text = PDFExtractor.extract_text(file_path)
    else:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
    # Process
    clauses_data = nlp_proc.segment_clauses(text)
    risks_data = nlp_proc.detect_risks(clauses_data)
    completeness = nlp_proc.get_completeness_score(clauses_data)
    overall_score = risk_eng.calculate_overall_score(risks_data, completeness['score'])
    
    # Save to DB
    contract = Contract(
        user_id=user_id,
        title=title,
        original_text=text,
        file_path=file_path,
        risk_score=overall_score
    )
    db.session.add(contract)
    db.session.flush() # Get contract.id
    
    for c in clauses_data:
        clause = Clause(
            contract_id=contract.id,
            clause_type=c['type'],
            text=c['text'],
            start_idx=c['start'],
            end_idx=c['end']
        )
        db.session.add(clause)
        
    for r in risks_data:
        risk = Risk(
            contract_id=contract.id,
            severity=r['severity'],
            risk_type=r['risk_type'],
            description=r['clause_text'],
            explanation=r['explanation']
        )
        db.session.add(risk)
        
    db.session.commit()
    
    return jsonify({"id": contract.id, "risk_score": overall_score}), 201

@bp.route('/', methods=['GET'])
@jwt_required()
def get_contracts():
    user_id = get_jwt_identity()
    contracts = Contract.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": c.id,
        "title": c.title,
        "risk_score": c.risk_score,
        "created_at": c.created_at
    } for c in contracts])

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_contract(id):
    c = Contract.query.get_or_404(id)
    return jsonify({
        "id": c.id,
        "title": c.title,
        "text": c.original_text,
        "risk_score": c.risk_score,
        "clauses": [{"type": cl.clause_type, "text": cl.text} for cl in c.clauses],
        "risks": [{"severity": r.severity, "type": r.risk_type, "explanation": r.explanation, "text": r.description} for r in c.risks]
    })
