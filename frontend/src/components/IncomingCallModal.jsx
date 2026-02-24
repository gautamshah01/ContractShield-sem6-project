/**
 * IncomingCallModal
 * Shows a ringing notification when another user initiates a call via WebSocket.
 * Props come from CallContext.incomingCall
 *
 * Props: callData, onAccept(callData), onReject(callData)
 */

import { useEffect, useRef, useState } from 'react';
import { PhoneIncoming, PhoneOff, Phone, Video, User } from 'lucide-react';

export default function IncomingCallModal({ callData, onAccept, onReject }) {
    const [elapsed, setElapsed] = useState(0);
    const ringRef = useRef(null);

    // Auto-reject after 30 s
    useEffect(() => {
        const t = setInterval(() => {
            setElapsed(e => {
                if (e >= 29) { onReject(callData); return 30; }
                return e + 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    // Ring animation sound via Web Audio (silent if blocked)
    useEffect(() => {
        let ctx, osc, gain, interval;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            gain = ctx.createGain();
            gain.gain.value = 0.12;
            gain.connect(ctx.destination);

            const ring = () => {
                osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 480;
                osc.connect(gain);
                osc.start();
                setTimeout(() => { try { osc.stop(); } catch { } }, 400);
            };

            ring();
            interval = setInterval(ring, 1800);
        } catch { }
        return () => {
            clearInterval(interval);
            try { ctx?.close(); } catch { }
        };
    }, []);

    const isVideo = callData?.mode === 'video';
    const callerName = callData?.caller_name || 'Unknown';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-lg p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-xs shadow-2xl shadow-black/70 overflow-hidden">

                {/* Animated ring aura */}
                <div className="relative flex flex-col items-center px-8 py-10">
                    {/* Ripple rings */}
                    <div className="absolute inset-0 flex items-start justify-center pt-10 pointer-events-none">
                        {[1, 2, 3].map(i => (
                            <div key={i}
                                className="absolute w-32 h-32 rounded-full border-2 border-emerald-400/30 animate-ping"
                                style={{ animationDelay: `${i * 0.4}s`, animationDuration: '1.8s' }}
                            />
                        ))}
                    </div>

                    {/* Avatar */}
                    <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/40 mb-5">
                        <span className="text-white text-3xl font-bold">{callerName[0]?.toUpperCase()}</span>
                    </div>

                    {/* Info */}
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
                        Incoming {isVideo ? 'Video' : 'Audio'} Call
                    </p>
                    <h2 className="text-white text-xl font-bold mb-1">{callerName}</h2>
                    <p className="text-slate-500 text-xs">
                        Ringing… {30 - elapsed}s
                    </p>

                    {/* Progress bar */}
                    <div className="w-full bg-white/8 rounded-full h-1 mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 to-blue-400 h-1 rounded-full transition-all"
                            style={{ width: `${((30 - elapsed) / 30) * 100}%` }} />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex border-t border-white/8">
                    <button
                        onClick={() => onReject(callData)}
                        className="flex-1 flex flex-col items-center gap-1.5 py-5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition group">
                        <div className="w-12 h-12 bg-red-600 group-hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 transition">
                            <PhoneOff size={22} className="text-white" />
                        </div>
                        <span className="text-xs font-medium">Decline</span>
                    </button>
                    <div className="w-px bg-white/8" />
                    <button
                        onClick={() => onAccept(callData)}
                        className="flex-1 flex flex-col items-center gap-1.5 py-5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition group">
                        <div className="w-12 h-12 bg-emerald-600 group-hover:bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/40 transition animate-bounce">
                            {isVideo ? <Video size={22} className="text-white" /> : <Phone size={22} className="text-white" />}
                        </div>
                        <span className="text-xs font-medium">Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
