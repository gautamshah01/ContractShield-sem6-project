/**
 * WebRTCCallModal — socket-powered real-time P2P call
 *
 * Critical fixes vs previous version:
 * 1. Socket listeners registered FIRST (sync), before async getUserMedia,
 *    so offers/ICE/answers arriving early are never missed.
 * 2. ICE candidates are QUEUED (iceCandidateQueue) and only added to the PC
 *    after setRemoteDescription — fixes "remote description was null" error.
 * 3. Offer is queued (offerQueued) if it arrives before the PC is created —
 *    processed immediately once setup() finishes.
 * 4. Caller only sends SDP offer after remoteSocketId is non-null (callee accepted).
 * 5. onCallRejected handled inside modal with auto-close.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2,
} from 'lucide-react';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

export default function WebRTCCallModal({
    appointment, mode, role, remoteSocketId, onClose
}) {
    const {
        sendOffer, sendAnswer, sendIce, endCall,
        onCallOffer, onCallAnswer, onCallIce, onCallEnded, onCallRejected,
    } = useCall();
    const { user } = useAuth();

    // ── UI state ──────────────────────────────────────────────────
    const [status, setStatus] = useState(
        role === 'caller' ? 'ringing' : 'connecting'
    );
    const [muted, setMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [duration, setDuration] = useState(0);
    const [statusMsg, setStatusMsg] = useState(
        role === 'caller' ? 'Ringing… waiting for answer' : 'Connecting…'
    );

    // ── Refs ──────────────────────────────────────────────────────
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const streamRef = useRef(null);
    const remoteRef = useRef(remoteSocketId);
    const offerSentRef = useRef(false);   // prevent double-offer (caller)

    // These refs are used INSIDE the sync listener closures below
    // so they must be refs (not state) to stay mutable across renders
    const iceCandidateQueueRef = useRef([]);   // ICE queue before remote desc is set
    const remoteDescSetRef = useRef(false); // true after setRemoteDescription
    const offerQueuedRef = useRef(null);  // offer that arrived before PC ready
    const pcReadyRef = useRef(false); // true after createPeerConnection

    // Keep remoteRef in sync when prop updates (caller: filled after accept)
    useEffect(() => { remoteRef.current = remoteSocketId; }, [remoteSocketId]);

    // Duration timer
    useEffect(() => {
        if (status !== 'in-call') return;
        const t = setInterval(() => setDuration(d => d + 1), 1000);
        return () => clearInterval(t);
    }, [status]);

    const fmt = s =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ── Cleanup ───────────────────────────────────────────────────
    const socketCleanups = useRef([]);
    const cleanup = useCallback(() => {
        socketCleanups.current.forEach(fn => fn?.());
        socketCleanups.current = [];
        streamRef.current?.getTracks().forEach(t => t.stop());
        try { pcRef.current?.close(); } catch { }
        streamRef.current = null;
        pcRef.current = null;
    }, []);

    // ── processOffer (callee) ─────────────────────────────────────
    // Called once PeerConnection is ready AND offer is available
    const processOffer = useCallback(async (sdp) => {
        if (!pcRef.current) return;
        try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            remoteDescSetRef.current = true;

            // Drain ICE queue
            const queued = iceCandidateQueueRef.current.splice(0);
            for (const c of queued) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => { });
            }

            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            sendAnswer(pcRef.current.localDescription, remoteRef.current, appointment?.id);
        } catch (err) {
            console.error('[WebRTC] processOffer error:', err);
        }
    }, [sendAnswer, appointment?.id]);

    // ── processAnswer (caller) ────────────────────────────────────
    const processAnswer = useCallback(async (sdp) => {
        if (!pcRef.current) return;
        try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            remoteDescSetRef.current = true;

            // Drain ICE queue
            const queued = iceCandidateQueueRef.current.splice(0);
            for (const c of queued) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => { });
            }
        } catch (err) {
            console.error('[WebRTC] processAnswer error:', err);
        }
    }, []);

    // ── Main effect: register socket listeners FIRST, then setup PC ──
    useEffect(() => {
        let cancelled = false;
        const apptId = appointment?.id;

        // ── 1. Register ALL socket listeners synchronously (before async) ──
        // This prevents any event arriving during getUserMedia from being lost.

        if (role === 'callee') {
            // Offer from caller
            const c1 = onCallOffer(async ({ sdp }) => {
                if (!pcReadyRef.current) {
                    // PC not created yet — queue the offer
                    offerQueuedRef.current = sdp;
                    return;
                }
                await processOffer(sdp);
            });
            socketCleanups.current.push(c1);
        }

        if (role === 'caller') {
            // Answer from callee
            const c3 = onCallAnswer(async ({ sdp }) => {
                await processAnswer(sdp);
            });
            socketCleanups.current.push(c3);
        }

        // ICE from remote — QUEUE if remote description not set yet
        const c2 = onCallIce(({ candidate }) => {
            if (!candidate) return;
            if (remoteDescSetRef.current && pcRef.current) {
                pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
            } else {
                console.log('[WebRTC] Queuing ICE candidate (remote desc not set yet)');
                iceCandidateQueueRef.current.push(candidate);
            }
        });
        socketCleanups.current.push(c2);

        // Remote hung up
        const c4 = onCallEnded(() => {
            setStatus('ended');
            setStatusMsg('Call ended by remote');
            setTimeout(() => onClose?.(), 1500);
        });
        socketCleanups.current.push(c4);

        // Remote rejected (caller side only)
        if (role === 'caller') {
            const c5 = onCallRejected(() => {
                setStatus('ended');
                setStatusMsg('Call declined');
                cleanup();
                setTimeout(() => onClose?.(), 1500);
            });
            socketCleanups.current.push(c5);
        }

        // ── 2. Async: get media + create PeerConnection ───────────────
        async function setup() {
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(
                    mode === 'video'
                        ? { video: { width: 1280, height: 720 }, audio: true }
                        : { audio: true }
                );
            } catch {
                try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
                catch {
                    setStatusMsg('Mic/camera access denied');
                    setStatus('ended');
                    return;
                }
            }
            if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

            streamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            // Create PC
            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;
            pcReadyRef.current = true;

            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            pc.ontrack = e => {
                if (remoteVideoRef.current && e.streams[0])
                    remoteVideoRef.current.srcObject = e.streams[0];
            };

            pc.onconnectionstatechange = () => {
                const s = pc.connectionState;
                console.log('[WebRTC] connection state:', s);
                if (s === 'connected') {
                    setStatus('in-call');
                    setStatusMsg('In call');
                }
                if (s === 'disconnected' || s === 'failed' || s === 'closed') {
                    setStatus('ended');
                    setStatusMsg('Call ended');
                }
            };

            // Send gathered ICE to remote
            pc.onicecandidate = e => {
                if (e.candidate && remoteRef.current) {
                    sendIce(e.candidate, remoteRef.current, apptId);
                }
            };

            pc.onicegatheringstatechange = () =>
                console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);

            // PC is ready — process any queued offer (callee)
            if (role === 'callee' && offerQueuedRef.current) {
                await processOffer(offerQueuedRef.current);
                offerQueuedRef.current = null;
            }
        }

        setup().catch(console.error);

        return () => {
            cancelled = true;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Phase 2 (Caller): send offer once remoteSocketId is known ──
    useEffect(() => {
        if (role !== 'caller') return;
        if (!remoteSocketId || offerSentRef.current || !pcRef.current) return;

        offerSentRef.current = true;
        setStatusMsg('Connected — preparing offer…');

        async function doOffer() {
            try {
                const offer = await pcRef.current.createOffer();
                await pcRef.current.setLocalDescription(offer);
                console.log('[WebRTC] Sending offer to', remoteSocketId);
                sendOffer(pcRef.current.localDescription, remoteSocketId, appointment?.id);
                setStatusMsg('Offer sent — waiting for answer…');
            } catch (err) {
                console.error('[WebRTC] Offer error:', err);
            }
        }
        // Small delay to ensure callee's listeners are registered
        setTimeout(doOffer, 300);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remoteSocketId]);

    // ── Hang up ───────────────────────────────────────────────────
    function hangUp() {
        if (remoteRef.current) endCall(remoteRef.current, appointment?.id);
        cleanup();
        setStatus('ended');
        onClose?.();
    }

    // ── Media toggles ─────────────────────────────────────────────
    function toggleMute() {
        setMuted(m => {
            const next = !m;
            streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
            return next;
        });
    }

    function toggleCam() {
        if (mode !== 'video') return;
        setCamOff(c => {
            const next = !c;
            streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !next; });
            return next;
        });
    }

    // remoteName = the OTHER person on the call.
    // Determined by the current user's role in the appointment (client ↔ lawyer),
    // NOT by their call role (caller ↔ callee) — which caused the old bug.
    const isClientUser = user?.role === 'client';
    const remoteName = isClientUser
        ? (appointment?.lawyer_name || 'Lawyer')   // client's remote is always the lawyer
        : (appointment?.client_name || 'Client');  // lawyer's remote is always the client

    const dotCls =
        status === 'in-call' ? 'bg-emerald-400 animate-pulse' :
            status === 'ended' ? 'bg-red-500' :
                'bg-amber-400 animate-pulse';

    const containerCls = expanded
        ? 'fixed inset-0 z-[60] bg-slate-950 flex flex-col'
        : 'fixed bottom-6 right-6 z-[60] w-96 bg-slate-900 rounded-3xl border border-white/15 shadow-2xl shadow-black/70 overflow-hidden flex flex-col';

    return (
        <div className={containerCls}>

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotCls}`} />
                    <div>
                        <p className="text-white text-sm font-bold">{remoteName}</p>
                        <p className="text-slate-400 text-xs">
                            {statusMsg}{status === 'in-call' ? ` · ${fmt(duration)}` : ''}
                        </p>
                    </div>
                </div>
                <button onClick={() => setExpanded(e => !e)}
                    className="text-slate-400 hover:text-white transition p-1">
                    {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
            </div>

            {/* Video / Avatar area */}
            <div className={`relative bg-slate-950 flex items-center justify-center flex-1 ${expanded ? 'min-h-0' : 'aspect-video'}`}>
                {mode === 'video' ? (
                    <>
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        {status !== 'in-call' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-3 shadow-2xl">
                                    <span className="text-white text-2xl font-bold">{remoteName[0]?.toUpperCase()}</span>
                                </div>
                                <p className="text-slate-300 text-sm font-medium">{remoteName}</p>
                                <p className="text-slate-500 text-xs mt-1 animate-pulse">{statusMsg}</p>
                            </div>
                        )}
                        <video ref={localVideoRef} autoPlay playsInline muted
                            className="absolute bottom-3 right-3 w-24 rounded-xl border border-white/20 object-cover shadow-lg"
                            style={{ height: 72 }} />
                    </>
                ) : (
                    <div className="text-center py-10 space-y-3">
                        <div className={`w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 ${status !== 'in-call' ? 'animate-pulse' : ''}`}>
                            <span className="text-white text-3xl font-bold">{remoteName[0]?.toUpperCase()}</span>
                        </div>
                        <p className="text-white font-bold text-lg">{remoteName}</p>
                        <p className="text-slate-400 text-sm animate-pulse">{statusMsg}</p>
                        {status === 'in-call' &&
                            <p className="text-emerald-400 font-mono text-xl">{fmt(duration)}</p>}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-slate-900 border-t border-white/8 px-5 py-4 flex items-center justify-center gap-4">
                <button onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${muted ? 'bg-red-500 shadow-red-500/40 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
                    {muted ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-white" />}
                </button>
                {mode === 'video' && (
                    <button onClick={toggleCam}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition ${camOff ? 'bg-red-500 shadow-red-500/40 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
                        {camOff ? <VideoOff size={18} className="text-white" /> : <Video size={18} className="text-white" />}
                    </button>
                )}
                <button onClick={hangUp}
                    className="w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition shadow-xl shadow-red-600/50">
                    <PhoneOff size={22} className="text-white" />
                </button>
            </div>
        </div>
    );
}
