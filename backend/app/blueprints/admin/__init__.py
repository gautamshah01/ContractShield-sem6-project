"""
Admin blueprint.
All routes require a valid JWT from a user with role='admin'.

Routes:
  GET  /api/admin/stats                   — dashboard KPIs
  GET  /api/admin/lawyers                 — list all lawyers (pending + approved + rejected)
  PUT  /api/admin/lawyers/<id>/approve    — approve a lawyer
  PUT  /api/admin/lawyers/<id>/reject     — reject / revoke a lawyer
  GET  /api/admin/clients                 — list all clients
  DELETE /api/admin/users/<id>            — delete any non-admin user
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from app import db
from app.models.user import User

admin_bp = Blueprint('admin', __name__)


# ── Admin-only guard ──────────────────────────────────────────────────────────
def admin_required(fn):
    """Decorator: passes only if the JWT belongs to an admin user."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        uid  = int(get_jwt_identity())
        user = User.query.get(uid)
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ── GET /api/admin/stats ──────────────────────────────────────────────────────
@admin_bp.route('/stats', methods=['GET'])
@admin_required
def admin_stats():
    total_clients  = User.query.filter_by(role='client').count()
    total_lawyers  = User.query.filter_by(role='lawyer').count()
    pending        = User.query.filter_by(role='lawyer', is_approved=False).count()
    approved       = User.query.filter_by(role='lawyer', is_approved=True).count()

    return jsonify({
        'success': True,
        'stats': {
            'total_clients':   total_clients,
            'total_lawyers':   total_lawyers,
            'pending_lawyers': pending,
            'approved_lawyers': approved,
        }
    }), 200


# ── GET /api/admin/lawyers ────────────────────────────────────────────────────
@admin_bp.route('/lawyers', methods=['GET'])
@admin_required
def list_all_lawyers():
    """Return ALL lawyers, grouped by approval status."""
    lawyers = User.query.filter_by(role='lawyer').order_by(User.created_at.desc()).all()
    return jsonify({
        'success': True,
        'lawyers': [l.to_dict(include_sensitive=True) for l in lawyers],
    }), 200


# ── PUT /api/admin/lawyers/<id>/approve ──────────────────────────────────────
@admin_bp.route('/lawyers/<int:lawyer_id>/approve', methods=['PUT'])
@admin_required
def approve_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    if not lawyer:
        return jsonify({'success': False, 'error': 'Lawyer not found'}), 404
    lawyer.is_approved = True
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'{lawyer.full_name} has been approved.',
        'lawyer':  lawyer.to_dict(),
    }), 200


# ── PUT /api/admin/lawyers/<id>/reject ───────────────────────────────────────
@admin_bp.route('/lawyers/<int:lawyer_id>/reject', methods=['PUT'])
@admin_required
def reject_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    if not lawyer:
        return jsonify({'success': False, 'error': 'Lawyer not found'}), 404
    lawyer.is_approved = False
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'{lawyer.full_name} has been rejected/revoked.',
        'lawyer':  lawyer.to_dict(),
    }), 200


# ── GET /api/admin/clients ────────────────────────────────────────────────────
@admin_bp.route('/clients', methods=['GET'])
@admin_required
def list_clients():
    clients = User.query.filter_by(role='client').order_by(User.created_at.desc()).all()
    return jsonify({
        'success': True,
        'clients': [c.to_dict(include_sensitive=True) for c in clients],
    }), 200


# ── DELETE /api/admin/users/<id> ─────────────────────────────────────────────
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    if user.role == 'admin':
        return jsonify({'success': False, 'error': 'Cannot delete admin account'}), 403
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': f'User {user.email} deleted'}), 200
