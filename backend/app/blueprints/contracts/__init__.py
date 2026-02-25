"""Contracts blueprint - handles contract upload and retrieval."""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.contract import Contract
from app.models.analysis import AnalysisResult
from app.models.clause import Clause
from app.models.missing_clause import MissingClause
from app.services.nlp_service import NLPService
from app.services.risk_service import RiskService
from app.services.explanation_service import ExplanationService
from app.services.pdf_extractor import PDFExtractor
from app.services.compliance_service import ComplianceService
from app.services.groq_service import GroqService
from app.models.compliance_check import ComplianceCheck

contracts_bp = Blueprint('contracts', __name__)

# Instantiate services — wrapped in try/except so a missing spaCy model
# or other init failure doesn't crash the entire Flask app at startup.
try:
    nlp_service = NLPService()
except Exception as e:
    print(f'[contracts] NLPService init failed (spaCy model missing?): {e}')
    nlp_service = None

try:
    risk_service = RiskService()
except Exception as e:
    print(f'[contracts] RiskService init failed: {e}')
    risk_service = None

try:
    explanation_service = ExplanationService()
except Exception as e:
    print(f'[contracts] ExplanationService init failed: {e}')
    explanation_service = None

try:
    pdf_extractor = PDFExtractor()
except Exception as e:
    print(f'[contracts] PDFExtractor init failed: {e}')
    pdf_extractor = None

try:
    compliance_service = ComplianceService()
except Exception as e:
    print(f'[contracts] ComplianceService init failed: {e}')
    compliance_service = None

try:
    groq_service = GroqService()
except Exception as e:
    print(f'[contracts] GroqService init failed: {e}')
    groq_service = None

ALLOWED_EXTENSIONS = {'pdf', 'txt'}



def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ──────────────────────────────────────────────────────────
# POST /api/contracts/upload
# ──────────────────────────────────────────────────────────
@contracts_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_contract():
    """Upload a contract and run full AI analysis pipeline."""
    user_id = int(get_jwt_identity())

    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename or not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'Invalid file. Use PDF or TXT.'}), 400

    title = request.form.get('title', file.filename)

    # Save file to disk
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    ext         = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path   = os.path.join(upload_folder, unique_name)
    file.save(file_path)

    try:
        # ── Extract text from file ──────────────────────────
        if ext == 'pdf':
            text = pdf_extractor.extract_text(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()

        if not text.strip():
            return jsonify({'success': False, 'error': 'Could not extract text from file.'}), 400

        # ── AI Component #1: Clause Extraction (spaCy NLP) ──
        clauses_raw = nlp_service.extract_clauses(text)

        # ── AI Component #2: Risk Detection (Rule-based) ────
        risk_analysis = risk_service.analyze_risk(clauses_raw)

        # ── AI Component #3: Plain-English Explanations ─────
        for clause in clauses_raw:
            exp = explanation_service.explain_clause(clause)
            clause['plain_english'] = exp

        # ── Detect missing mandatory clauses ─────────────────
        found_types = {c['type'] for c in clauses_raw}
        mandatory   = ['payment', 'termination', 'confidentiality',
                       'liability', 'governing_law', 'dispute_resolution']
        missing_list = [m for m in mandatory if m not in found_types]

        completeness = round(
            (len(found_types & set(mandatory)) / len(mandatory)) * 100, 1
        )

        # ── Persist Contract ──────────────────────────────────
        contract = Contract(
            title=title,
            user_id=user_id,
            file_name=unique_name,
            file_path=file_path,
            file_type=ext,
            status='analyzed',
            extracted_text=text[:10000]  # store first 10k chars
        )
        db.session.add(contract)
        db.session.flush()

        # ── Persist AnalysisResult ────────────────────────────
        summary_text = explanation_service.generate_executive_summary({
            **risk_analysis,
            'missing_clauses': [{'name': m} for m in missing_list]
        })

        analysis = AnalysisResult(
            contract_id=contract.id,
            overall_risk_score=risk_analysis['overall_risk_score'],
            risk_level=risk_analysis['risk_level'],
            completeness_score=completeness,
            compliance_status='partial' if missing_list else 'pass',
            total_clauses=len(clauses_raw),
            flagged_clauses=risk_analysis['flagged_clauses'],
            missing_clauses=len(missing_list),
            analysis_metadata={'summary': summary_text}
        )
        db.session.add(analysis)
        db.session.flush()

        # ── Persist Clauses ───────────────────────────────────
        for c in clauses_raw[:50]:
            cl = Clause(
                analysis_id=analysis.id,
                clause_type=c.get('type', 'general'),
                clause_text=c.get('text', '')[:2000],
                clause_position=c.get('position', 0),
                risk_level=c.get('risk_level', 'none') or 'none',
                plain_explanation=str(c.get('plain_english', {}).get('summary', ''))
            )
            db.session.add(cl)

        # ── Persist Missing Clauses ───────────────────────────
        for m in missing_list:
            mc = MissingClause(
                analysis_id=analysis.id,
                clause_name=m.replace('_', ' ').title(),
                clause_category='mandatory',
                importance='mandatory',
                description=f'Add a {m.replace("_", " ")} clause to protect both parties.'
            )
            db.session.add(mc)

        # ── Compliance Checks (Indian Law) ────────────────────
        compliance_result = compliance_service.check_compliance(clauses_raw, text)
        for check in compliance_result['checks']:
            cc = ComplianceCheck(
                analysis_id=analysis.id,
                rule_name=check['rule_name'],
                rule_reference=check['reference'],
                status=check['status'],
                explanation=check['explanation']
            )
            db.session.add(cc)

        db.session.commit()

        return jsonify({
            'success': True,
            'id': contract.id,
            'title': title,
            'risk_score': float(risk_analysis['overall_risk_score']),
            'risk_level': risk_analysis['risk_level'],
            'total_clauses': len(clauses_raw),
            'flagged_clauses': risk_analysis['flagged_clauses'],
            'missing_clauses': len(missing_list),
            'completeness_score': completeness,
            'compliance_score': compliance_result['compliance_score'],
            'groq_available': groq_service.is_available(),
            'analysis_id': analysis.id
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Upload error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


# ──────────────────────────────────────────────────────────
# GET /api/contracts/
# ──────────────────────────────────────────────────────────
@contracts_bp.route('/', methods=['GET'])
@jwt_required()
def list_contracts():
    """List all contracts for the logged-in user."""
    user_id   = int(get_jwt_identity())
    contracts = (Contract.query
                 .filter_by(user_id=user_id)
                 .order_by(Contract.created_at.desc())
                 .all())

    result = []
    for c in contracts:
        analysis = AnalysisResult.query.filter_by(contract_id=c.id).first()
        result.append({
            'id': c.id,
            'title': c.title,
            'status': c.status,
            'file_type': c.file_type,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'risk_score': float(analysis.overall_risk_score) if analysis else 0,
            'risk_level': analysis.risk_level if analysis else 'unknown',
            'total_clauses': analysis.total_clauses if analysis else 0,
            'flagged_clauses': analysis.flagged_clauses if analysis else 0,
        })

    return jsonify({'success': True, 'contracts': result, 'total': len(result)}), 200


# ──────────────────────────────────────────────────────────
# GET /api/contracts/<id>
# ──────────────────────────────────────────────────────────
@contracts_bp.route('/<int:contract_id>', methods=['GET'])
@jwt_required()
def get_contract(contract_id):
    """Get full analysis details for a contract."""
    user_id  = int(get_jwt_identity())
    contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()

    if not contract:
        return jsonify({'success': False, 'error': 'Contract not found'}), 404

    analysis = AnalysisResult.query.filter_by(contract_id=contract_id).first()

    clauses = []
    risks   = []
    missing = []

    if analysis:
        for cl in Clause.query.filter_by(analysis_id=analysis.id).all():
            clauses.append({
                'id': cl.id,
                'type': cl.clause_type,
                'text': cl.clause_text,
                'position': cl.clause_position,
                'risk_level': cl.risk_level,
                'explanation': cl.plain_explanation
            })
            if cl.risk_level in ('high', 'medium'):
                risks.append({
                    'type': cl.clause_type.replace('_', ' ').title(),
                    'severity': cl.risk_level.capitalize(),
                    'text': cl.clause_text[:300],
                    'explanation': cl.plain_explanation or ''
                })

        for m in MissingClause.query.filter_by(analysis_id=analysis.id).all():
            missing.append({
                'name': m.clause_name,
                'importance': m.importance,
                'recommendation': m.description
            })

    summary = ''
    if analysis and analysis.analysis_metadata:
        summary = analysis.analysis_metadata.get('summary', '')

    return jsonify({
        'success': True,
        'id': contract.id,
        'title': contract.title,
        'status': contract.status,
        'file_type': contract.file_type,
        'created_at': contract.created_at.isoformat() if contract.created_at else None,
        'risk_score': float(analysis.overall_risk_score) if analysis else 0,
        'risk_level': analysis.risk_level if analysis else 'unknown',
        'completeness_score': float(analysis.completeness_score) if analysis else 0,
        'total_clauses': analysis.total_clauses if analysis else 0,
        'flagged_clauses': analysis.flagged_clauses if analysis else 0,
        'missing_clauses_count': analysis.missing_clauses if analysis else 0,
        'summary': summary,
        'clauses': clauses,
        'risks': risks,
        'missing_clauses': missing,
        'text': contract.extracted_text or ''
    }), 200


# ──────────────────────────────────────────────────────────
# DELETE /api/contracts/<id>
# ──────────────────────────────────────────────────────────
@contracts_bp.route('/<int:contract_id>', methods=['DELETE'])
@jwt_required()
def delete_contract(contract_id):
    """Delete a contract and all associated data."""
    user_id  = int(get_jwt_identity())
    contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()

    if not contract:
        return jsonify({'success': False, 'error': 'Contract not found'}), 404

    if contract.file_path and os.path.exists(contract.file_path):
        try:
            os.remove(contract.file_path)
        except Exception:
            pass

    db.session.delete(contract)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Contract deleted successfully'}), 200
