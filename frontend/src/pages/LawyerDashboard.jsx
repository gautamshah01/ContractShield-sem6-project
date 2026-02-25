import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { appointmentsApi } from '../api/appointments';
import WebRTCCallModal from '../components/WebRTCCallModal';
import ProfileEditModal from '../components/ProfileEditModal';
import Discussion from './Discussion';
import {
    Scale, Bell, CheckCircle, XCircle, MessageSquare,
    Phone, Video, LogOut, User, Star, Clock, Send,
    Edit2, Users, BarChart2, ChevronRight, MapPin,
    IndianRupee, Briefcase, Sparkles, X
} from 'lucide-react';


// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ appointment, onClose }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const loadingRef = useRef(false);   // guard: skip if a request is already in flight

    const load = async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
            const { data } = await appointmentsApi.getMessages(appointment.id);
            setMessages(data.messages || []);
        } catch { } finally {
            loadingRef.current = false;
        }
    };

    useEffect(() => { load(); }, [appointment.id]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => {
        const t = setInterval(load, 8000);   // 8s — Railway proxy is slower than local
        return () => clearInterval(t);
    }, [appointment.id]);

    const send = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            await appointmentsApi.sendMessage(appointment.id, input.trim());
            setInput('');
            await load();
        } finally { setSending(false); }
    };

    const userId = (() => { try { return JSON.parse(atob(user?.token?.split('.')[1])).sub; } catch { return ''; } })();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg flex flex-col rounded-3xl shadow-2xl overflow-hidden" style={{ background: '#0a1020', border: '1px solid rgba(139,92,246,0.2)', height: 580 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(139,92,246,0.08)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-white shrink-0">
                            {appointment.client_name?.[0] || 'C'}
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">{appointment.client_name}</p>
                            <p className="text-xs text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" /> Approved consultation
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition">
                        <X size={16} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-700">
                            <MessageSquare size={32} />
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs">Start the conversation!</p>
                        </div>
                    )}
                    {messages.map(m => {
                        const isMe = String(m.sender_id) === String(userId);
                        return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe
                                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-sm'
                                    : 'text-slate-200 rounded-bl-sm'
                                    }`} style={!isMe ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                                    <p>{m.message}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-slate-600'}`}>
                                        {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 pb-4 pt-3 border-t flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 outline-none text-sm transition"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={send} disabled={sending || !input.trim()}
                        className="px-4 py-2.5 rounded-xl text-white font-semibold disabled:opacity-40 transition"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}


// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusDot({ label, color }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            {label}
        </span>
    );
}


// ─── Main Lawyer Dashboard ────────────────────────────────────────────────────
export default function LawyerDashboard() {
    const { user, logout } = useAuth();
    const { initiateCall, onCallAccepted, onCallRejected } = useCall();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [chatAppt, setChatAppt] = useState(null);
    const [callAppt, setCallAppt] = useState(null);
    const [callMode, setCallMode] = useState('video');
    const [remoteSocket, setRemoteSocket] = useState(null);
    const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });
    const [showProfile, setShowProfile] = useState(false);
    const [profileUser, setProfileUser] = useState(user);

    const toast = (text, type = 'success') => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg({ text: '', type: 'success' }), 3000);
    };

    const fetchData = async () => {
        try {
            const { data: d } = await appointmentsApi.lawyerDashboard();
            setData(d);
        } catch { toast('Failed to load dashboard', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { const t = setInterval(fetchData, 15000); return () => clearInterval(t); }, []);

    useEffect(() => {
        const off = onCallAccepted?.(({ callee_socket_id }) => { setRemoteSocket(callee_socket_id); });
        return () => off?.();
    }, []);

    useEffect(() => {
        const off = onCallRejected?.(() => { setCallAppt(null); setRemoteSocket(null); toast('Call was declined.', 'error'); });
        return () => off?.();
    }, []);

    function startCall(appt, mode) {
        setCallMode(mode);
        setCallAppt(appt);
        setRemoteSocket(null);
        initiateCall(appt, mode, appt.client_id);
    }

    const approve = async (id) => {
        try { await appointmentsApi.approve(id); toast('Appointment approved! Chat & calls enabled.'); fetchData(); }
        catch { toast('Failed to approve', 'error'); }
    };

    const reject = async (id) => {
        try { await appointmentsApi.reject(id); toast('Appointment rejected.', 'error'); fetchData(); }
        catch { toast('Failed to reject', 'error'); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#050812' }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" style={{ borderTopColor: 'transparent' }} />
                <p className="text-slate-500 text-sm">Loading your dashboard...</p>
            </div>
        </div>
    );

    const pending = data?.pending_appointments || [];
    const approved = data?.approved_appointments || [];
    const stats = data?.stats || {};
    const lawyer = data?.lawyer || {};
    const currentLawyer = profileUser || lawyer;

    const NAV = [
        { id: 'pending', label: 'Pending Requests', icon: Bell, badge: pending.length },
        { id: 'approved', label: 'Active Clients', icon: Users, badge: approved.length },
        { id: 'discussion', label: 'Community', icon: MessageSquare },
        { id: 'profile', label: 'My Profile', icon: User },
    ];

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#050812', fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}>

            {/* Toast */}
            {toastMsg.text && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl transition-all ${toastMsg.type === 'error'
                    ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`} style={{ backdropFilter: 'blur(8px)' }}>
                    {toastMsg.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {toastMsg.text}
                </div>
            )}

            {/* Modals */}
            {chatAppt && <ChatPanel appointment={chatAppt} onClose={() => setChatAppt(null)} />}
            {callAppt && (
                <WebRTCCallModal appointment={callAppt} mode={callMode} role="caller"
                    remoteSocketId={remoteSocket}
                    onClose={() => { setCallAppt(null); setRemoteSocket(null); }} />
            )}
            {showProfile && (
                <ProfileEditModal user={currentLawyer} role="lawyer"
                    onSave={(u) => { setProfileUser(u); setShowProfile(false); toast('Profile updated!'); }}
                    onDelete={logout}
                    onClose={() => setShowProfile(false)} />
            )}

            {/* ── Sidebar ── */}
            <aside className="w-64 flex-shrink-0 flex flex-col border-r" style={{ background: '#07091a', borderColor: 'rgba(255,255,255,0.06)' }}>
                {/* Logo */}
                <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Scale size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">ContractShield</p>
                            <p className="text-[10px] text-violet-400 uppercase tracking-widest font-semibold">Lawyer Portal</p>
                        </div>
                    </div>
                </div>

                {/* Profile card — clickable to edit */}
                <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <button onClick={() => setShowProfile(true)}
                        title="Click to edit your profile"
                        className="w-full rounded-2xl p-4 text-center group transition-all"
                        style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.07))', border: '1px solid rgba(139,92,246,0.18)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.background = 'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(59,130,246,0.12))'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.18)'; e.currentTarget.style.background = 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.07))'; }}>
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-lg font-black shadow-lg shadow-violet-500/30">
                            {currentLawyer.full_name?.[0] || 'L'}
                        </div>
                        <p className="font-bold text-white text-sm group-hover:text-violet-300 transition">{currentLawyer.full_name || 'Lawyer'}</p>
                        <p className="text-violet-400 text-xs truncate">{currentLawyer.specialization?.split(',')[0] || 'Legal Expert'}</p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            <span className="text-amber-400 text-xs font-bold">{currentLawyer.rating || '5.0'}</span>
                            <span className="text-slate-600 text-xs">· {currentLawyer.experience_yrs || 0} yrs</span>
                        </div>
                        {currentLawyer.available
                            ? <StatusDot label="Available" color="#22c55e" />
                            : <StatusDot label="Busy" color="#ef4444" />}
                        <p className="text-[10px] text-slate-700 mt-2 group-hover:text-violet-600 transition">Click to edit profile</p>
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest px-3 mb-2">Navigation</p>
                    {NAV.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style={isActive
                                    ? { background: 'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(59,130,246,0.12))', color: '#fff', border: '1px solid rgba(139,92,246,0.25)' }
                                    : { color: '#94a3b8', border: '1px solid transparent' }}>
                                <tab.icon size={16} style={isActive ? { color: '#a78bfa' } : { color: '#64748b' }} />
                                <span className="flex-1 text-left">{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500">{tab.badge}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Sign Out only */}
                <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <button onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        style={{ border: '1px solid transparent' }}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                {/* Top bar */}
                <div className="sticky top-0 z-10 px-8 py-4 border-b flex items-center justify-between"
                    style={{ background: 'rgba(5,8,18,0.85)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div>
                        <h1 className="text-white font-bold text-xl tracking-tight">
                            {activeTab === 'pending' && 'Pending Requests'}
                            {activeTab === 'approved' && 'Active Clients'}
                            {activeTab === 'discussion' && 'Community Discussion'}
                            {activeTab === 'profile' && 'My Profile'}
                        </h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            {activeTab === 'pending' && `${pending.length} client${pending.length !== 1 ? 's' : ''} waiting for your response`}
                            {activeTab === 'approved' && `${approved.length} active consultation${approved.length !== 1 ? 's' : ''}`}
                            {activeTab === 'discussion' && 'Connect with clients and other legal professionals'}
                            {activeTab === 'profile' && 'Manage your public profile and availability'}
                        </p>
                    </div>
                    {/* Stats row in topbar */}
                    <div className="flex items-center gap-3">
                        {[
                            { label: 'Total', value: stats.total || 0, color: '#6366f1' },
                            { label: 'Pending', value: stats.pending || 0, color: '#f59e0b' },
                            { label: 'Active', value: stats.approved || 0, color: '#22c55e' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <span className="text-lg font-black" style={{ color: s.color }}>{s.value}</span>
                                <span className="text-[10px] text-slate-600 font-semibold uppercase">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 p-8">

                    {/* ── PENDING TAB ── */}
                    {activeTab === 'pending' && (
                        <div className="space-y-4">
                            {pending.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-4">
                                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                        <Bell size={36} className="text-violet-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold text-lg mb-1">No pending requests</p>
                                        <p className="text-slate-500 text-sm">When clients book consultations, they'll appear here for review.</p>
                                    </div>
                                </div>
                            ) : pending.map(appt => (
                                <div key={appt.id} className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                                    style={{ background: '#0a1020', border: '1px solid rgba(245,158,11,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shrink-0"
                                            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                                            {appt.client_name?.[0] || 'C'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-white font-bold">{appt.client_name}</p>
                                                    <p className="text-slate-500 text-xs">{appt.client_email}</p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Clock size={10} className="text-slate-600" />
                                                        <span className="text-slate-600 text-xs">{new Date(appt.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                    </div>
                                                </div>
                                                <StatusDot label="Pending" color="#f59e0b" />
                                            </div>

                                            {appt.message && (
                                                <div className="mt-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <p className="text-slate-400 text-sm italic leading-relaxed">"{appt.message}"</p>
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-4">
                                                <button onClick={() => approve(appt.id)}
                                                    className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:scale-[1.02]"
                                                    style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                                                    <CheckCircle size={15} /> Approve
                                                </button>
                                                <button onClick={() => reject(appt.id)}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 transition hover:text-white"
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                    <XCircle size={15} /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── APPROVED TAB ── */}
                    {activeTab === 'approved' && (
                        <div className="space-y-4">
                            {approved.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-4">
                                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                        <Users size={36} className="text-emerald-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold text-lg mb-1">No active clients yet</p>
                                        <p className="text-slate-500 text-sm">Approve pending requests to start consulting with clients.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {approved.map(appt => (
                                        <div key={appt.id} className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                                            style={{ background: '#0a1020', border: '1px solid rgba(34,197,94,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shrink-0"
                                                    style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                                    {appt.client_name?.[0] || 'C'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold truncate">{appt.client_name}</p>
                                                    <p className="text-slate-500 text-xs truncate">{appt.client_email}</p>
                                                </div>
                                                <StatusDot label="Active" color="#22c55e" />
                                            </div>

                                            <div className="flex items-center gap-1 text-xs text-slate-600 mb-4">
                                                <Clock size={10} />
                                                <span>Since {new Date(appt.created_at).toLocaleDateString('en-IN')}</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button onClick={() => startCall(appt, 'audio')}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition hover:scale-[1.02]"
                                                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                                    <Phone size={13} className="text-emerald-400" /> Audio
                                                </button>
                                                <button onClick={() => startCall(appt, 'video')}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition hover:scale-[1.02]"
                                                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                                                    <Video size={13} className="text-blue-400" /> Video
                                                </button>
                                                <button onClick={() => setChatAppt(appt)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition hover:scale-[1.02]"
                                                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                                    <MessageSquare size={13} className="text-violet-400" /> Chat
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── DISCUSSION TAB ── */}
                    {activeTab === 'discussion' && (
                        <Discussion user={lawyer} />
                    )}

                    {/* ── PROFILE TAB ── */}
                    {activeTab === 'profile' && (
                        <div className="max-w-2xl">
                            <div className="rounded-2xl overflow-hidden" style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {/* Profile header */}
                                <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.06))' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-500/30">
                                            {currentLawyer.full_name?.[0] || 'L'}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">{currentLawyer.full_name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-amber-400 text-sm font-bold">{currentLawyer.rating || '5.0'}</span>
                                                <span className="text-slate-600 text-sm">· {currentLawyer.experience_yrs || 0} years exp.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowProfile(true)}
                                        className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                                        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                                        <Edit2 size={14} /> Edit Profile
                                    </button>
                                </div>

                                {/* Fields */}
                                <div className="px-6 py-5 space-y-4">
                                    {[
                                        { label: 'Email', value: currentLawyer.email, icon: User },
                                        { label: 'Specialization', value: currentLawyer.specialization, icon: Briefcase },
                                        { label: 'Bar Council ID', value: currentLawyer.bar_council_id, icon: BarChart2 },
                                        { label: 'Location', value: currentLawyer.location, icon: MapPin },
                                        { label: 'Experience', value: currentLawyer.experience_yrs ? `${currentLawyer.experience_yrs} years` : null, icon: Clock },
                                        { label: 'Hourly Rate', value: currentLawyer.hourly_rate ? `₹${currentLawyer.hourly_rate?.toLocaleString('en-IN')}/hr` : null, icon: IndianRupee },
                                        { label: 'Availability', value: currentLawyer.available ? 'Available for new clients' : 'Currently busy', icon: CheckCircle },
                                        { label: 'Bio', value: currentLawyer.bio, icon: Sparkles },
                                    ].map(f => (
                                        <div key={f.label} className="flex gap-4 items-start">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                                <f.icon size={13} className="text-violet-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">{f.label}</p>
                                                <p className="text-white text-sm">{f.value || <span className="text-slate-700">Not set</span>}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Danger zone */}
                                    <div className="pt-4 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-3">Danger Zone</p>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
                                                    logout();
                                                }
                                            }}
                                            className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition hover:scale-[1.01]"
                                            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}>
                                            <X size={15} /> Delete My Account
                                        </button>
                                        <p className="text-slate-700 text-[11px] mt-2">This is permanent and cannot be reversed.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
