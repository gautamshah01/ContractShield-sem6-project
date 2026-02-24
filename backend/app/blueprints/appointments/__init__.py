"""
Appointments blueprint.
Handles lawyer booking, approval, chat messages, and call signalling.

Routes:
  GET  /api/appointments/lawyers          — list all available lawyers (client)
  POST /api/appointments/book             — client books a lawyer
  GET  /api/appointments/my              — get all appointments for current user
  PUT  /api/appointments/<id>/approve    — lawyer approves booking
  PUT  /api/appointments/<id>/reject     — lawyer rejects booking
  GET  /api/appointments/<id>/messages   — fetch chat history
  POST /api/appointments/<id>/messages   — send a chat message
  GET  /api/appointments/lawyer/dashboard — lawyer's own dashboard summary
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.user        import User
from app.models.appointment import Appointment
from app.models.chat_message import ChatMessage

appointments_bp = Blueprint('appointments', __name__)


# ─────────────────────────────────────────────────────────────
# GET /api/appointments/lawyers
# List all registered lawyers (publicly visible to clients)
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/lawyers', methods=['GET'])
@jwt_required()
def list_lawyers():
    lawyers = User.query.filter_by(role='lawyer', available=True, is_approved=True).all()
    return jsonify({
        'success': True,
        'lawyers': [l.to_dict() for l in lawyers]
    }), 200


# ─────────────────────────────────────────────────────────────
# POST /api/appointments/book
# Client books an appointment with a lawyer
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/book', methods=['POST'])
@jwt_required()
def book_appointment():
    client_id = int(get_jwt_identity())
    data      = request.get_json() or {}
    lawyer_id = data.get('lawyer_id')
    message   = data.get('message', 'I would like to consult you about a contract.')

    if not lawyer_id:
        return jsonify({'success': False, 'error': 'lawyer_id is required'}), 400

    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    if not lawyer:
        return jsonify({'success': False, 'error': 'Lawyer not found'}), 404

    # Prevent duplicate pending bookings
    existing = Appointment.query.filter_by(
        client_id=client_id, lawyer_id=lawyer_id, status='pending'
    ).first()
    if existing:
        return jsonify({'success': False, 'error': 'You already have a pending booking with this lawyer'}), 409

    appt = Appointment(
        client_id=client_id,
        lawyer_id=lawyer_id,
        message=message,
    )
    db.session.add(appt)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Booking request sent! The lawyer will respond shortly.',
        'appointment': appt.to_dict()
    }), 201


# ─────────────────────────────────────────────────────────────
# GET /api/appointments/my
# Get all appointments for the current user (client or lawyer)
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/my', methods=['GET'])
@jwt_required()
def my_appointments():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    if user.role == 'lawyer':
        appts = Appointment.query.filter_by(lawyer_id=user_id)\
                    .order_by(Appointment.created_at.desc()).all()
    else:
        appts = Appointment.query.filter_by(client_id=user_id)\
                    .order_by(Appointment.created_at.desc()).all()

    return jsonify({
        'success': True,
        'appointments': [a.to_dict() for a in appts]
    }), 200


# ─────────────────────────────────────────────────────────────
# PUT /api/appointments/<id>/approve
# Lawyer approves a booking → enables chat + call
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/<int:appt_id>/approve', methods=['PUT'])
@jwt_required()
def approve_appointment(appt_id):
    lawyer_id = int(get_jwt_identity())
    appt = Appointment.query.filter_by(id=appt_id, lawyer_id=lawyer_id).first()
    if not appt:
        return jsonify({'success': False, 'error': 'Appointment not found'}), 404

    appt.approve()
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Appointment approved. Chat and calls are now enabled.',
        'appointment': appt.to_dict()
    }), 200


# ─────────────────────────────────────────────────────────────
# PUT /api/appointments/<id>/reject
# Lawyer rejects a booking
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/<int:appt_id>/reject', methods=['PUT'])
@jwt_required()
def reject_appointment(appt_id):
    lawyer_id = int(get_jwt_identity())
    appt = Appointment.query.filter_by(id=appt_id, lawyer_id=lawyer_id).first()
    if not appt:
        return jsonify({'success': False, 'error': 'Appointment not found'}), 404

    appt.reject()
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Appointment rejected.',
        'appointment': appt.to_dict()
    }), 200


# ─────────────────────────────────────────────────────────────
# GET /api/appointments/<id>/messages
# Fetch chat history for an approved appointment
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/<int:appt_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(appt_id):
    user_id = int(get_jwt_identity())
    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({'success': False, 'error': 'Appointment not found'}), 404

    # Only participants can read
    if user_id not in (appt.client_id, appt.lawyer_id):
        return jsonify({'success': False, 'error': 'Forbidden'}), 403

    if not appt.chat_enabled:
        return jsonify({'success': False, 'error': 'Chat not yet enabled — awaiting approval'}), 403

    msgs = ChatMessage.query.filter_by(appointment_id=appt_id)\
               .order_by(ChatMessage.created_at.asc()).all()

    # Mark unread messages as read
    for m in msgs:
        if m.sender_id != user_id and not m.read:
            m.read = True
    db.session.commit()

    return jsonify({
        'success': True,
        'messages': [m.to_dict() for m in msgs]
    }), 200


# ─────────────────────────────────────────────────────────────
# POST /api/appointments/<id>/messages
# Send a chat message in an approved appointment
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/<int:appt_id>/messages', methods=['POST'])
@jwt_required()
def send_message(appt_id):
    user_id = int(get_jwt_identity())
    appt    = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({'success': False, 'error': 'Appointment not found'}), 404

    if user_id not in (appt.client_id, appt.lawyer_id):
        return jsonify({'success': False, 'error': 'Forbidden'}), 403

    if not appt.chat_enabled:
        return jsonify({'success': False, 'error': 'Chat not enabled'}), 403

    data = request.get_json() or {}
    text = (data.get('message') or '').strip()
    if not text:
        return jsonify({'success': False, 'error': 'Message cannot be empty'}), 400

    msg = ChatMessage(
        appointment_id=appt_id,
        sender_id=user_id,
        message=text,
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify({'success': True, 'message': msg.to_dict()}), 201


# ─────────────────────────────────────────────────────────────
# GET /api/appointments/lawyer/dashboard
# Lawyer-specific dashboard summary
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/lawyer/dashboard', methods=['GET'])
@jwt_required()
def lawyer_dashboard():
    lawyer_id = int(get_jwt_identity())
    lawyer    = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    if not lawyer:
        return jsonify({'success': False, 'error': 'Lawyer not found'}), 403

    all_appts   = Appointment.query.filter_by(lawyer_id=lawyer_id).all()
    pending     = [a for a in all_appts if a.status == 'pending']
    approved    = [a for a in all_appts if a.status == 'approved']
    rejected    = [a for a in all_appts if a.status == 'rejected']

    return jsonify({
        'success': True,
        'lawyer':  lawyer.to_dict(),
        'stats': {
            'total':    len(all_appts),
            'pending':  len(pending),
            'approved': len(approved),
            'rejected': len(rejected),
        },
        'pending_appointments':  [a.to_dict() for a in pending],
        'approved_appointments': [a.to_dict() for a in approved],
    }), 200


# ─────────────────────────────────────────────────────────────
# PUT /api/appointments/lawyer/profile
# Lawyer updates their profile
# ─────────────────────────────────────────────────────────────
@appointments_bp.route('/lawyer/profile', methods=['PUT'])
@jwt_required()
def update_lawyer_profile():
    lawyer_id = int(get_jwt_identity())
    lawyer    = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    if not lawyer:
        return jsonify({'success': False, 'error': 'Not a lawyer account'}), 403

    data = request.get_json() or {}
    fields = ['specialization', 'experience_yrs', 'bar_council_id',
              'bio', 'hourly_rate', 'available', 'location']
    for f in fields:
        if f in data:
            setattr(lawyer, f, data[f])

    db.session.commit()
    return jsonify({'success': True, 'lawyer': lawyer.to_dict()}), 200
