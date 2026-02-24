/**
 * CallContext
 *
 * Fix for "subscription before socket ready":
 * All on<Event> functions are now stable function references (useCallback).
 * They check socketRef.current at call-time. BUT because the socket connects
 * asynchronously, a component mounting simultaneously may call onCallAccepted()
 * before the socket is set.
 *
 * Solution: maintain a pending-listeners queue (_pendingRef). When a listener
 * is registered before the socket is ready, it's stored in the queue and
 * attached as soon as the socket connects. Each pending entry also returns a
 * proper cleanup that removes from both queue and socket.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const CallCtx = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function CallProvider({ children }) {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const pendingRef = useRef([]);   // [{ event, cb }] — attach once socket ready
    const [connected, setConnected] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);

    // ── Connect / disconnect on auth change ──────────────────────
    useEffect(() => {
        if (!user?.token) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            setConnected(false);
            return;
        }

        const sock = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        sock.on('connect', () => {
            setConnected(true);
            sock.emit('authenticate', { token: user.token });

            // Flush any listeners that were registered before socket was ready
            pendingRef.current.forEach(({ event, cb }) => sock.on(event, cb));
            pendingRef.current = [];
        });

        sock.on('disconnect', () => setConnected(false));
        sock.on('auth:ok', () => console.log('[CallCtx] authenticated'));
        sock.on('auth:error', (d) => console.warn('[CallCtx] auth error:', d?.message));

        sock.on('call:incoming', (data) => {
            console.log('[CallCtx] Incoming call:', data);
            setIncomingCall(data);
        });
        sock.on('call:cancelled', () => setIncomingCall(null));

        socketRef.current = sock;

        return () => {
            sock.disconnect();
            socketRef.current = null;
            pendingRef.current = [];
            setConnected(false);
        };
    }, [user?.token]);

    // ── Generic subscribe helper ──────────────────────────────────
    // Returns an unsubscribe fn. Safely queues if socket not yet ready.
    const subscribe = useCallback((event, cb) => {
        const sock = socketRef.current;
        if (sock && sock.connected) {
            sock.on(event, cb);
            return () => sock.off(event, cb);
        }
        // Queue for when socket connects
        const entry = { event, cb };
        pendingRef.current.push(entry);
        return () => {
            // Cleanup: remove from queue OR from live socket
            pendingRef.current = pendingRef.current.filter(e => e !== entry);
            socketRef.current?.off(event, cb);
        };
    }, []);

    // ── Call actions ─────────────────────────────────────────────
    const initiateCall = useCallback((appointment, mode, targetUserId) => {
        socketRef.current?.emit('call:initiate', {
            target_user_id: targetUserId,
            appointment_id: appointment.id,
            mode,
        });
    }, []);

    const acceptCall = useCallback((callData) => {
        socketRef.current?.emit('call:accept', {
            appointment_id: callData.appointment_id,
            caller_socket_id: callData.caller_socket_id,
        });
        setIncomingCall(null);
    }, []);

    const rejectCall = useCallback((callData) => {
        socketRef.current?.emit('call:reject', {
            appointment_id: callData.appointment_id,
            caller_socket_id: callData.caller_socket_id,
        });
        setIncomingCall(null);
    }, []);

    const cancelCall = useCallback((appointment, targetUserId) => {
        socketRef.current?.emit('call:cancel', {
            appointment_id: appointment.id,
            target_user_id: targetUserId,
        });
    }, []);

    const sendOffer = useCallback((sdp, targetSocketId, appointmentId) => {
        socketRef.current?.emit('call:offer', {
            sdp,
            appointment_id: appointmentId,
            target_socket_id: targetSocketId,
        });
    }, []);

    const sendAnswer = useCallback((sdp, callerSocketId, appointmentId) => {
        socketRef.current?.emit('call:answer', {
            sdp,
            appointment_id: appointmentId,
            caller_socket_id: callerSocketId,
        });
    }, []);

    const sendIce = useCallback((candidate, targetSocketId, appointmentId) => {
        socketRef.current?.emit('call:ice', {
            candidate,
            appointment_id: appointmentId,
            target_socket_id: targetSocketId,
        });
    }, []);

    const endCall = useCallback((targetSocketId, appointmentId) => {
        socketRef.current?.emit('call:end', {
            appointment_id: appointmentId,
            target_socket_id: targetSocketId,
        });
    }, []);

    // ── Event subscriptions ───────────────────────────────────────
    // All use the subscribe() helper which queues if socket not ready.

    /** Fires on caller when callee picks up → { appointment_id, callee_socket_id } */
    const onCallAccepted = useCallback((cb) => subscribe('call:accepted', cb), [subscribe]);

    /** Fires on caller when callee declines → { appointment_id } */
    const onCallRejected = useCallback((cb) => subscribe('call:rejected', cb), [subscribe]);

    /** SDP offer from caller (callee receives) → { appointment_id, sdp } */
    const onCallOffer = useCallback((cb) => subscribe('call:offer', cb), [subscribe]);

    /** SDP answer from callee (caller receives) → { appointment_id, sdp } */
    const onCallAnswer = useCallback((cb) => subscribe('call:answer', cb), [subscribe]);

    /** ICE candidate from remote → { appointment_id, candidate } */
    const onCallIce = useCallback((cb) => subscribe('call:ice', cb), [subscribe]);

    /** Remote hung up → { appointment_id } */
    const onCallEnded = useCallback((cb) => subscribe('call:ended', cb), [subscribe]);

    return (
        <CallCtx.Provider value={{
            socket: socketRef.current,
            connected,
            incomingCall,
            setIncomingCall,
            initiateCall,
            acceptCall,
            rejectCall,
            cancelCall,
            sendOffer,
            sendAnswer,
            sendIce,
            endCall,
            onCallAccepted,
            onCallRejected,
            onCallOffer,
            onCallAnswer,
            onCallIce,
            onCallEnded,
        }}>
            {children}
        </CallCtx.Provider>
    );
}

export const useCall = () => useContext(CallCtx);
