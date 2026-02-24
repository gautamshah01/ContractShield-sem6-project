"""
Real-time WebSocket signaling via Flask-SocketIO.

Socket Events (client → server):
  authenticate      { token }             — map socket to user
  call:initiate     { target_user_id, appointment_id, mode }
  call:accept       { appointment_id, caller_socket_id }
  call:reject       { appointment_id, caller_socket_id }
  call:cancel       { appointment_id, target_user_id }
  call:offer        { appointment_id, sdp, target_user_id }
  call:answer       { appointment_id, sdp, caller_socket_id }
  call:ice          { appointment_id, candidate, target_socket_id }
  call:end          { appointment_id, target_socket_id }

Socket Events (server → client):
  call:incoming     { appointment_id, mode, caller_id, caller_name, caller_socket_id }
  call:accepted     { appointment_id, callee_socket_id }
  call:rejected     { appointment_id }
  call:cancelled    { appointment_id }
  call:offer        { appointment_id, sdp }
  call:answer       { appointment_id, sdp }
  call:ice          { appointment_id, candidate }
  call:ended        { appointment_id }
  auth:ok           { user_id }
  auth:error        { message }
"""

from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from app import db
from app.models.user import User

# Shared SocketIO instance — created in create_app
socketio = SocketIO()

# Map: user_id → socket_id   (single session per user for simplicity)
_user_sockets: dict[int, str] = {}   # { user_id: socket_id }
_socket_users: dict[str, int] = {}   # { socket_id: user_id }


def _user_room(user_id: int) -> str:
    return f"user_{user_id}"


def register_events(sio: SocketIO):
    """Attach all event handlers to the SocketIO instance."""

    @sio.on('authenticate')
    def on_auth(data):
        token = (data or {}).get('token', '')
        try:
            payload = decode_token(token)
            user_id = int(payload['sub'])
        except Exception:
            emit('auth:error', {'message': 'Invalid token'})
            disconnect()
            return

        from flask import request as freq
        sid = freq.sid

        # Remove any previous mapping for this user
        old_sid = _user_sockets.get(user_id)
        if old_sid and old_sid != sid:
            _socket_users.pop(old_sid, None)

        _user_sockets[user_id] = sid
        _socket_users[sid] = user_id
        join_room(_user_room(user_id))
        emit('auth:ok', {'user_id': user_id})

    @sio.on('disconnect')
    def on_disconnect():
        from flask import request as freq
        sid = freq.sid
        user_id = _socket_users.pop(sid, None)
        if user_id:
            _user_sockets.pop(user_id, None)
            leave_room(_user_room(user_id))

    # ── Initiate a call ───────────────────────────────────────────
    @sio.on('call:initiate')
    def on_call_initiate(data):
        from flask import request as freq
        caller_sid = freq.sid
        caller_id  = _socket_users.get(caller_sid)
        if not caller_id:
            return

        target_id    = int(data.get('target_user_id', 0))
        appointment_id = data.get('appointment_id')
        mode         = data.get('mode', 'video')

        caller = User.query.get(caller_id)
        caller_name = caller.full_name if caller else 'Unknown'

        # Forward to target user's room
        sio.emit('call:incoming', {
            'appointment_id':  appointment_id,
            'mode':            mode,
            'caller_id':       caller_id,
            'caller_name':     caller_name,
            'caller_socket_id': caller_sid,
        }, room=_user_room(target_id))

    # ── Accept a call ─────────────────────────────────────────────
    @sio.on('call:accept')
    def on_call_accept(data):
        from flask import request as freq
        callee_sid    = freq.sid
        caller_sid    = data.get('caller_socket_id')
        appointment_id = data.get('appointment_id')

        sio.emit('call:accepted', {
            'appointment_id':  appointment_id,
            'callee_socket_id': callee_sid,
        }, room=caller_sid)

    # ── Reject a call ─────────────────────────────────────────────
    @sio.on('call:reject')
    def on_call_reject(data):
        caller_sid    = data.get('caller_socket_id')
        appointment_id = data.get('appointment_id')
        sio.emit('call:rejected', {'appointment_id': appointment_id}, room=caller_sid)

    # ── Caller cancelled before pickup ────────────────────────────
    @sio.on('call:cancel')
    def on_call_cancel(data):
        target_id     = int(data.get('target_user_id', 0))
        appointment_id = data.get('appointment_id')
        sio.emit('call:cancelled', {'appointment_id': appointment_id},
                 room=_user_room(target_id))

    # ── WebRTC SDP offer ──────────────────────────────────────────
    @sio.on('call:offer')
    def on_offer(data):
        target_sid = data.get('target_socket_id')
        sio.emit('call:offer', {
            'appointment_id': data.get('appointment_id'),
            'sdp':            data.get('sdp'),
        }, room=target_sid)

    # ── WebRTC SDP answer ─────────────────────────────────────────
    @sio.on('call:answer')
    def on_answer(data):
        target_sid = data.get('caller_socket_id')
        sio.emit('call:answer', {
            'appointment_id': data.get('appointment_id'),
            'sdp':            data.get('sdp'),
        }, room=target_sid)

    # ── ICE candidates ────────────────────────────────────────────
    @sio.on('call:ice')
    def on_ice(data):
        target_sid = data.get('target_socket_id')
        sio.emit('call:ice', {
            'appointment_id': data.get('appointment_id'),
            'candidate':      data.get('candidate'),
        }, room=target_sid)

    # ── End call ──────────────────────────────────────────────────
    @sio.on('call:end')
    def on_call_end(data):
        target_sid = data.get('target_socket_id')
        if target_sid:
            sio.emit('call:ended', {
                'appointment_id': data.get('appointment_id'),
            }, room=target_sid)
