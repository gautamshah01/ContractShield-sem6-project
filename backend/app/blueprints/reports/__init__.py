"""Reports blueprint — generate PDF-like text summaries and download endpoints."""

from flask import Blueprint, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.models.contract import Contract
from app.models.analysis import AnalysisResult
from app.models.clause import Clause
from app.models.missing_clause import MissingClause
from app.models.compliance_check import ComplianceCheck
from app.services.compliance_service import ComplianceService

reports_bp = Blueprint('reports', __name__)


# ──────────────────────────────────────────────────────────
# GET /api/reports/<contract_id>/summary
# ──────────────────────────────────────────────────────────
@reports_bp.route('/<int:contract_id>/summary', methods=['GET'])
@jwt_required()
def get_summary(contract_id):
    """
    Get a comprehensive analysis summary for a contract.
    Returns structured JSON for frontend report display.
    """
    user_id  = int(get_jwt_identity())
    contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()

    if not contract:
        return jsonify({'success': False, 'error': 'Contract not found'}), 404

    analysis = AnalysisResult.query.filter_by(contract_id=contract_id).first()
    if not analysis:
        return jsonify({'success': False, 'error': 'Analysis not found'}), 404

    clauses = Clause.query.filter_by(analysis_id=analysis.id).all()
    missing = MissingClause.query.filter_by(analysis_id=analysis.id).all()
    checks  = ComplianceCheck.query.filter_by(analysis_id=analysis.id).all()

    # Clause type distribution for charts
    type_distribution = {}
    risk_distribution = {'none': 0, 'low': 0, 'medium': 0, 'high': 0}
    for c in clauses:
        type_distribution[c.clause_type] = type_distribution.get(c.clause_type, 0) + 1
        rl = c.risk_level or 'none'
        risk_distribution[rl] = risk_distribution.get(rl, 0) + 1

    return jsonify({
        'success': True,
        'report': {
            'generated_at': datetime.utcnow().isoformat(),
            'contract': {
                'id': contract.id,
                'title': contract.title,
                'file_type': contract.file_type,
                'created_at': contract.created_at.isoformat() if contract.created_at else None,
            },
            'risk_analysis': {
                'overall_score': float(analysis.overall_risk_score),
                'risk_level': analysis.risk_level,
                'total_clauses': analysis.total_clauses,
                'flagged_clauses': analysis.flagged_clauses,
                'completeness_score': float(analysis.completeness_score),
                'type_distribution': type_distribution,
                'risk_distribution': risk_distribution,
            },
            'missing_clauses': [m.to_dict() for m in missing],
            'compliance': {
                'checks': [c.to_dict() for c in checks],
                'total': len(checks),
                'passed': sum(1 for c in checks if c.status == 'pass'),
                'failed': sum(1 for c in checks if c.status == 'fail'),
            },
            'top_risks': [
                {
                    'type': c.clause_type,
                    'risk_level': c.risk_level,
                    'text': c.clause_text[:200],
                    'explanation': c.plain_explanation
                }
                for c in clauses if c.risk_level in ('high', 'medium')
            ][:10],
            'disclaimer': ComplianceService.DISCLAIMER,
        }
    }), 200


# ──────────────────────────────────────────────────────────
# GET /api/reports/<contract_id>/export
# ──────────────────────────────────────────────────────────
@reports_bp.route('/<int:contract_id>/export', methods=['GET'])
@jwt_required()
def export_report(contract_id):
    """
    Export contract analysis as a plain-text report (downloadable).
    For academic purposes — simulates PDF report generation.
    """
    user_id  = int(get_jwt_identity())
    contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()

    if not contract:
        return jsonify({'success': False, 'error': 'Contract not found'}), 404

    analysis = AnalysisResult.query.filter_by(contract_id=contract_id).first()
    clauses  = Clause.query.filter_by(analysis_id=analysis.id).all() if analysis else []
    missing  = MissingClause.query.filter_by(analysis_id=analysis.id).all() if analysis else []
    checks   = ComplianceCheck.query.filter_by(analysis_id=analysis.id).all() if analysis else []

    score = float(analysis.overall_risk_score) if analysis else 0
    level = (analysis.risk_level or 'unknown').upper() if analysis else 'UNKNOWN'

    lines = [
        "=" * 70,
        "     SMART CONTRACT REVIEW & RISK ANALYZER",
        "     Powered by AI + Indian Legal Compliance Engine",
        "=" * 70,
        "",
        f"Contract Title : {contract.title}",
        f"File Type      : {(contract.file_type or '').upper()}",
        f"Analyzed On    : {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}",
        f"Report ID      : RPT-{contract.id}-{datetime.utcnow().strftime('%Y%m%d')}",
        "",
        "-" * 70,
        "  OVERALL RISK ASSESSMENT",
        "-" * 70,
        f"  Risk Score   : {score:.1f} / 100",
        f"  Risk Level   : {level}",
        f"  Total Clauses: {analysis.total_clauses if analysis else 0}",
        f"  Flagged      : {analysis.flagged_clauses if analysis else 0}",
        f"  Completeness : {float(analysis.completeness_score) if analysis else 0:.1f}%",
        "",
    ]

    # Flagged clauses
    flagged = [c for c in clauses if c.risk_level in ('high', 'medium')]
    if flagged:
        lines += ["-" * 70, "  FLAGGED CLAUSES", "-" * 70]
        for i, c in enumerate(flagged[:10], 1):
            lines += [
                f"  {i}. [{c.risk_level.upper()}] {c.clause_type.replace('_',' ').title()}",
                f"     Text   : {c.clause_text[:120]}...",
                f"     Advice : {c.plain_explanation or 'Review carefully.'}",
                ""
            ]

    # Missing clauses
    if missing:
        lines += ["-" * 70, "  MISSING MANDATORY CLAUSES", "-" * 70]
        for m in missing:
            lines += [f"  ⚠ {m.clause_name} ({m.importance})", f"    {m.description or ''}"]
        lines.append("")

    # Compliance results
    if checks:
        lines += ["-" * 70, "  INDIAN LAW COMPLIANCE CHECKS", "-" * 70]
        for c in checks:
            icon = "✓" if c.status == 'pass' else "✗" if c.status == 'fail' else "⚠"
            lines += [f"  {icon} [{c.status.upper()}] {c.rule_name}", f"    Ref: {c.rule_reference or ''}"]
        lines.append("")

    # Disclaimer
    lines += [
        "=" * 70,
        "  ⚠ LEGAL DISCLAIMER",
        "=" * 70,
        "  This system provides AI-assisted analysis and does NOT constitute",
        "  legal advice. Always consult a qualified legal professional before",
        "  signing any contract.",
        "",
        "  Generated by: Smart Contract Review & Risk Analyzer",
        "  AI Components: spaCy NLP + Rule-based Risk Engine + Compliance AI",
        "=" * 70,
    ]

    report_text = "\n".join(lines)
    filename    = f"contract_report_{contract_id}_{datetime.utcnow().strftime('%Y%m%d')}.txt"

    return Response(
        report_text,
        mimetype='text/plain',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )
