from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..models import Contract
import difflib

bp = Blueprint('analysis', __name__, url_prefix='/api/analysis')

@bp.route('/compare', methods=['POST'])
@jwt_required()
def compare():
    data = request.get_json()
    id1 = data.get('id1')
    id2 = data.get('id2')
    
    c1 = Contract.query.get_or_404(id1)
    c2 = Contract.query.get_or_404(id2)
    
    diff = difflib.unified_diff(
        c1.original_text.splitlines(),
        c2.original_text.splitlines(),
        fromfile=c1.title,
        tofile=c2.title,
        lineterm=''
    )
    
    return jsonify({
        "diff": "\n".join(list(diff)),
        "score_diff": c2.risk_score - c1.risk_score,
        "c1_score": c1.risk_score,
        "c2_score": c2.risk_score
    })
