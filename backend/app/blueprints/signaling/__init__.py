"""
WebRTC Signaling Blueprint  (/api/signal)
Provides simple in-memory SDP + ICE-candidate exchange for peer-to-peer calls.

Routes:
  POST /api/signal/<appt_id>/offer      — caller stores SDP offer
  GET  /api/signal/<appt_id>/offer      — callee fetches SDP offer
  POST /api/signal/<appt_id>/answer     — callee stores SDP answer
  GET  /api/signal/<appt_id>/answer     — caller fetches SDP answer
  POST /api/signal/<appt_id>/ice        — either peer appends ICE candidate
  GET  /api/signal/<appt_id>/ice        — either peer fetches pending ICEs
  DELETE /api/signal/<appt_id>          — end/clear session
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User

signal_bp = Blueprint('signal', __name__)

# In-memory store  { appt_id: { offer, answer, ice: [] } }
_sessions: dict = {}


def _session(appt_id):
    if appt_id not in _sessions:
        _sessions[appt_id] = {'offer': None, 'answer': None, 'ice_caller': [], 'ice_callee': []}
    return _sessions[appt_id]


# ── POST /api/signal/<id>/offer ───────────────────────────────────────────────
@signal_bp.route('/<int:appt_id>/offer', methods=['POST'])
@jwt_required()
def post_offer(appt_id):
    data = request.get_json() or {}
    sdp  = data.get('sdp')
    if not sdp:
        return jsonify({'success': False, 'error': 'sdp required'}), 400
    s = _session(appt_id)
    s['offer']      = sdp
    s['answer']     = None       # reset on new call
    s['ice_caller'] = []
    s['ice_callee'] = []
    return jsonify({'success': True}), 200


# ── GET /api/signal/<id>/offer ────────────────────────────────────────────────
@signal_bp.route('/<int:appt_id>/offer', methods=['GET'])
@jwt_required()
def get_offer(appt_id):
    s = _sessions.get(appt_id)
    return jsonify({'success': True, 'sdp': s['offer'] if s else None}), 200


# ── POST /api/signal/<id>/answer ──────────────────────────────────────────────
@signal_bp.route('/<int:appt_id>/answer', methods=['POST'])
@jwt_required()
def post_answer(appt_id):
    data = request.get_json() or {}
    sdp  = data.get('sdp')
    if not sdp:
        return jsonify({'success': False, 'error': 'sdp required'}), 400
    _session(appt_id)['answer'] = sdp
    return jsonify({'success': True}), 200


# ── GET /api/signal/<id>/answer ───────────────────────────────────────────────
@signal_bp.route('/<int:appt_id>/answer', methods=['GET'])
@jwt_required()
def get_answer(appt_id):
    s = _sessions.get(appt_id)
    return jsonify({'success': True, 'sdp': s['answer'] if s else None}), 200


# ── POST /api/signal/<id>/ice ─────────────────────────────────────────────────
@signal_bp.route('/<int:appt_id>/ice', methods=['POST'])
@jwt_required()
def post_ice(appt_id):
    data      = request.get_json() or {}
    candidate = data.get('candidate')
    role      = data.get('role', 'caller')  # 'caller' | 'callee'
    if not candidate:
        return jsonify({'success': False, 'error': 'candidate required'}), 400
    key = f'ice_{role}'
    _session(appt_id)[key].append(candidate)
    return jsonify({'success': True}), 200


# ── GET /api/signal/<id>/ice ──────────────────────────────────────────────────
@signal_bp.route('/<int:appt_id>/ice', methods=['GET'])
@jwt_required()
def get_ice(appt_id):
    # Each peer requests the *other* peer's candidates
    role = request.args.get('role', 'caller')   # role of the REQUESTING peer
    other = 'ice_callee' if role == 'caller' else 'ice_caller'
    s = _sessions.get(appt_id)
    candidates = []
    if s:
        candidates = list(s[other])
        s[other] = []   # consume
    return jsonify({'success': True, 'candidates': candidates}), 200


# ── DELETE /api/signal/<id> ───────────────────────────────────────────────────
@signal_bp.route('/<int:appt_id>', methods=['DELETE'])
@jwt_required()
def end_session(appt_id):
    _sessions.pop(appt_id, None)
    return jsonify({'success': True}), 200
