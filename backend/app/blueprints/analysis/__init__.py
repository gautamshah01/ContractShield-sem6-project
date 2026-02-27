"""
Analysis blueprint — Compliance checking, Contract Comparison, Groq LLM.
"""

import difflib
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.contract import Contract
from app.models.analysis import AnalysisResult
from app.models.clause import Clause
from app.models.compliance_check import ComplianceCheck
from app.services.compliance_service import ComplianceService
from app.services.groq_service import GroqService

analysis_bp = Blueprint('analysis', __name__)

try:
    compliance_service = ComplianceService()
except Exception as e:
    print(f'[analysis] ComplianceService init failed: {e}')
    compliance_service = None

try:
    groq_service = GroqService()
except Exception as e:
    print(f'[analysis] GroqService init failed: {e}')
    groq_service = None


# ──────────────────────────────────────────────────────────
# GET /api/analysis/<contract_id>/compliance
# ──────────────────────────────────────────────────────────
@analysis_bp.route('/<int:contract_id>/compliance', methods=['GET'])
@jwt_required()
def get_compliance(contract_id):
    """Run Indian law compliance checks on a contract."""
    user_id  = int(get_jwt_identity())
    contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()

    if not contract:
        return jsonify({'success': False, 'error': 'Contract not found'}), 404

    # Get clauses from DB
    analysis = AnalysisResult.query.filter_by(contract_id=contract_id).first()
    clauses  = []
    if analysis:
        clauses = [
            {'type': c.clause_type, 'text': c.clause_text}
            for c in Clause.query.filter_by(analysis_id=analysis.id).all()
        ]

    contract_text = contract.extracted_text or ''

    # Check if we already ran compliance checks (avoid re-running)
    existing = ComplianceCheck.query.filter_by(analysis_id=analysis.id).first() if analysis else None
    if existing and analysis:
        checks = [c.to_dict() for c in ComplianceCheck.query.filter_by(analysis_id=analysis.id).all()]
        # Rebuild summary
        passed   = sum(1 for c in checks if c['status'] == 'pass')
        failed   = sum(1 for c in checks if c['status'] == 'fail')
        warnings = sum(1 for c in checks if c['status'] in ('warning', 'info'))
        mandatory_total  = sum(1 for r in compliance_service.rules if r['importance'] == 'mandatory')
        # Fix: match by rule_name (stored in DB) — rule_id is NOT stored in ComplianceCheck model
        mandatory_rule_names = {r['name'] for r in compliance_service.rules if r['importance'] == 'mandatory'}
        mandatory_passed = sum(
            1 for c in checks
            if c['status'] == 'pass' and c.get('rule_name') in mandatory_rule_names
        )
        score = round((mandatory_passed / mandatory_total * 100) if mandatory_total else 100, 1)

        return jsonify({
            'success': True,
            'contract_id': contract_id,
            'compliance_score': score,
            'overall_status': 'pass' if failed == 0 else 'partial' if failed <= 2 else 'fail',
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'checks': checks,
            'disclaimer': ComplianceService.DISCLAIMER,
            'jurisdiction': 'India',
            'legal_framework': [
                'Indian Contract Act, 1872',
                'Information Technology Act, 2000',
                'Minimum Wages Act, 1948',
                'Arbitration and Conciliation Act, 1996',
            ]
        }), 200

    # Run fresh compliance check
    result = compliance_service.check_compliance(clauses, contract_text)

    # Persist to DB
    if analysis:
        for check in result['checks']:
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
        'contract_id': contract_id,
        **result
    }), 200


# ──────────────────────────────────────────────────────────
# POST /api/analysis/compare
# ──────────────────────────────────────────────────────────
@analysis_bp.route('/compare', methods=['POST'])
@jwt_required()
def compare_contracts():
    """
    Compare two contracts using Python difflib.
    Returns unified diff + risk score comparison.
    """
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    id1 = data.get('id1')
    id2 = data.get('id2')

    if not id1 or not id2:
        return jsonify({'success': False, 'error': 'Both contract IDs required'}), 400
    if id1 == id2:
        return jsonify({'success': False, 'error': 'Select two different contracts'}), 400

    c1 = Contract.query.filter_by(id=id1, user_id=user_id).first()
    c2 = Contract.query.filter_by(id=id2, user_id=user_id).first()

    if not c1 or not c2:
        return jsonify({'success': False, 'error': 'One or both contracts not found'}), 404

    text1 = (c1.extracted_text or '').splitlines(keepends=True)
    text2 = (c2.extracted_text or '').splitlines(keepends=True)

    # Generate unified diff
    diff = list(difflib.unified_diff(
        text1, text2,
        fromfile=c1.title,
        tofile=c2.title,
        lineterm=''
    ))

    # Colored diff for frontend
    colored_diff = []
    for line in diff[:200]:  # limit to 200 lines
        if line.startswith('+') and not line.startswith('+++'):
            colored_diff.append({'type': 'added',   'text': line})
        elif line.startswith('-') and not line.startswith('---'):
            colored_diff.append({'type': 'removed', 'text': line})
        elif line.startswith('@@'):
            colored_diff.append({'type': 'hunk',    'text': line})
        else:
            colored_diff.append({'type': 'context', 'text': line})

    # Similarity score (0-100)
    similarity = round(
        difflib.SequenceMatcher(
            None,
            c1.extracted_text or '',
            c2.extracted_text or ''
        ).ratio() * 100, 1
    )

    # Risk scores
    a1 = AnalysisResult.query.filter_by(contract_id=id1).first()
    a2 = AnalysisResult.query.filter_by(contract_id=id2).first()

    s1 = float(a1.overall_risk_score) if a1 else 0
    s2 = float(a2.overall_risk_score) if a2 else 0

    # Clause type comparison
    cls1 = set(c.clause_type for c in Clause.query.filter_by(analysis_id=a1.id).all()) if a1 else set()
    cls2 = set(c.clause_type for c in Clause.query.filter_by(analysis_id=a2.id).all()) if a2 else set()

    clauses_only_in_1 = list(cls1 - cls2)
    clauses_only_in_2 = list(cls2 - cls1)
    common_clauses    = list(cls1 & cls2)

    return jsonify({
        'success': True,
        'contract1': {'id': id1, 'title': c1.title},
        'contract2': {'id': id2, 'title': c2.title},
        'c1_score': s1,
        'c2_score': s2,
        'score_diff': round(s2 - s1, 1),
        'similarity_pct': similarity,
        'diff': ''.join(diff[:200]),
        'colored_diff': colored_diff,
        'clause_comparison': {
            'common': common_clauses,
            'only_in_contract1': clauses_only_in_1,
            'only_in_contract2': clauses_only_in_2,
        },
        'risk_verdict': (
            f"Contract B is {'higher' if s2 > s1 else 'lower'} risk than Contract A "
            f"by {abs(round(s2-s1,1))} points."
        ) if s1 != s2 else "Both contracts have the same risk score."
    }), 200


# ──────────────────────────────────────────────────────────
# POST /api/analysis/<contract_id>/groq-explain
# ──────────────────────────────────────────────────────────
@analysis_bp.route('/<int:contract_id>/groq-explain', methods=['POST'])
@jwt_required()
def groq_explain(contract_id):
    """
    Get Groq LLM explanation for a specific clause.
    Falls back to rule-based if Groq unavailable.
    """
    user_id  = int(get_jwt_identity())
    contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()

    if not contract:
        return jsonify({'success': False, 'error': 'Contract not found'}), 404

    data         = request.get_json()
    clause_text  = data.get('clause_text', '')
    clause_type  = data.get('clause_type', 'general')
    risk_level   = data.get('risk_level', 'none')

    if not clause_text:
        return jsonify({'success': False, 'error': 'clause_text required'}), 400

    result = groq_service.explain_clause(clause_text, clause_type, risk_level)

    return jsonify({
        'success': True,
        'explanation': result['explanation'],
        'source': result['source'],
        'model': result['model'],
        'groq_available': groq_service.is_available()
    }), 200


# ──────────────────────────────────────────────────────────
# GET /api/analysis/status
# ──────────────────────────────────────────────────────────
@analysis_bp.route('/status', methods=['GET'])
def analysis_status():
    """Return AI component availability status."""
    return jsonify({
        'success': True,
        'ai_components': {
            'nlp_clause_extraction': True,
            'risk_detection': True,
            'plain_english_explanation': True,
            'groq_llm': groq_service.is_available(),
            'compliance_engine': True,
        },
        'groq_model': groq_service.model if groq_service.is_available() else None,
        'disclaimer': ComplianceService.DISCLAIMER
    }), 200
