import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/admin';
import {
    Shield, Users, UserCheck, Clock, LogOut,
    CheckCircle, XCircle, Trash2, RefreshCw, Briefcase,
    AlertTriangle, Star, MapPin, Hash, Calendar, Mail
} from 'lucide-react';

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, accent, sub }) {
    return (
        <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#0a1020', border: `1px solid ${accent}22` }}>
            <div className="absolute top-3 right-3 opacity-8">
                <Icon size={44} style={{ color: accent }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>{label}</p>
            <p className="text-4xl font-black text-white mb-1">{value ?? '—'}</p>
            {sub && <p className="text-xs font-medium" style={{ color: accent }}>{sub}</p>}
        </div>
    );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusPill({ approved }) {
    return approved ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Approved
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Pending
        </span>
    );
}

// ── Lawyer Card ───────────────────────────────────────────────────────────────
function LawyerCard({ lawyer: l, acting, onApprove, onReject, onDelete }) {
    const busy = acting === l.id;
    return (
        <div className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
            style={{ background: '#0a1020', border: `1px solid ${l.is_approved ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}`, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-xl shadow-lg"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 6px 20px rgba(124,58,237,0.3)' }}>
                        {l.full_name?.[0]?.toUpperCase() || 'L'}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-white font-bold">{l.full_name}</h3>
                            <StatusPill approved={l.is_approved} />
                        </div>
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                            <Mail size={10} /> {l.email}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2.5">
                            {l.specialization && (
                                <span className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
                                    style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    <Briefcase size={10} /> {l.specialization?.split(',')[0]}
                                </span>
                            )}
                            {l.location && (
                                <span className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 text-slate-500"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <MapPin size={10} /> {l.location}
                                </span>
                            )}
                            {l.experience_yrs && (
                                <span className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 text-slate-500"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <Star size={10} /> {l.experience_yrs} yrs
                                </span>
                            )}
                            {l.bar_council_id && (
                                <span className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 text-slate-500"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <Hash size={10} /> {l.bar_council_id}
                                </span>
                            )}
                        </div>

                        {l.bio && (
                            <p className="text-slate-600 text-xs mt-2.5 leading-relaxed line-clamp-2">{l.bio}</p>
                        )}
                    </div>

                    {/* Meta */}
                    <div className="text-right shrink-0 hidden sm:flex flex-col items-end gap-1">
                        <p className="text-slate-700 text-xs flex items-center gap-1">
                            <Calendar size={10} /> {l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN') : '—'}
                        </p>
                        {l.hourly_rate && (
                            <p className="text-emerald-400 text-sm font-bold">₹{l.hourly_rate?.toLocaleString('en-IN')}/hr</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Action bar */}
            <div className="px-5 py-3.5 flex items-center justify-end gap-2.5 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                {onApprove && (
                    <button onClick={onApprove} disabled={busy}
                        className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 hover:scale-[1.02]"
                        style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                        {busy ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                    </button>
                )}
                {onReject && (
                    <button onClick={onReject} disabled={busy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                        style={l.is_approved
                            ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }
                            : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {busy ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                        {l.is_approved ? 'Revoke' : 'Reject'}
                    </button>
                )}
                <button onClick={onDelete} disabled={busy}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <Trash2 size={13} /> Delete
                </button>
            </div>
        </div>
    );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { user, logout } = useAuth();

    const [stats, setStats] = useState(null);
    const [lawyers, setLawyers] = useState([]);
    const [clients, setClients] = useState([]);
    const [tab, setTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);
    const [toast, setToast] = useState({ msg: '', type: 'success' });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
    };

    const load = async () => {
        setLoading(true);
        try {
            const [s, l, c] = await Promise.all([
                adminApi.stats(),
                adminApi.lawyers(),
                adminApi.clients(),
            ]);
            setStats(s.data.stats);
            setLawyers(l.data.lawyers || []);
            setClients(c.data.clients || []);
        } catch { showToast('Failed to load data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const approve = async (id) => {
        setActing(id);
        try {
            await adminApi.approveLawyer(id);
            setLawyers(p => p.map(l => l.id === id ? { ...l, is_approved: true } : l));
            setStats(s => s ? { ...s, pending_lawyers: s.pending_lawyers - 1, approved_lawyers: s.approved_lawyers + 1 } : s);
            showToast('Lawyer approved successfully');
        } catch { showToast('Failed to approve', 'error'); }
        finally { setActing(null); }
    };

    const reject = async (id) => {
        setActing(id);
        try {
            await adminApi.rejectLawyer(id);
            setLawyers(p => p.map(l => l.id === id ? { ...l, is_approved: false } : l));
            showToast('Lawyer rejected / access revoked', 'error');
        } catch { showToast('Failed to reject', 'error'); }
        finally { setActing(null); }
    };

    const deleteUser = async (id, name) => {
        if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        setActing(id);
        try {
            await adminApi.deleteUser(id);
            setLawyers(p => p.filter(l => l.id !== id));
            setClients(p => p.filter(c => c.id !== id));
            await load();
            showToast(`User "${name}" deleted`);
        } catch { showToast('Failed to delete', 'error'); }
        finally { setActing(null); }
    };

    const pendingLawyers = lawyers.filter(l => !l.is_approved);
    const approvedLawyers = lawyers.filter(l => l.is_approved);

    const TABS = [
        { id: 'pending', label: 'Pending Approval', count: pendingLawyers.length, icon: Clock, accent: '#f59e0b' },
        { id: 'approved', label: 'Approved Lawyers', count: approvedLawyers.length, icon: UserCheck, accent: '#22c55e' },
        { id: 'clients', label: 'Registered Clients', count: clients.length, icon: Users, accent: '#6366f1' },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#050812', fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}>

            {/* Toast */}
            {toast.msg && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl text-white ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                    {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Top Nav ── */}
            <header className="sticky top-0 z-40 border-b"
                style={{ background: 'rgba(5,8,18,0.85)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: 'linear-gradient(135deg,#dc2626,#ea580c)', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
                            <Shield size={18} className="text-white" />
                        </div>
                        <div>
                            <span className="text-white font-bold text-base">ContractShield</span>
                            <span className="text-[10px] font-bold ml-2 px-2 py-0.5 rounded-full uppercase tracking-wider"
                                style={{ background: 'rgba(220,38,38,0.12)', color: '#f87171', border: '1px solid rgba(220,38,38,0.25)' }}>
                                Admin
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs hidden sm:block">
                            {user?.email}
                        </span>
                        <button onClick={() => load()}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={logout}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400 px-4 py-2 rounded-xl transition"
                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* ── Hero banner ── */}
                <div className="rounded-2xl p-6 mb-8 flex items-center gap-5"
                    style={{ background: 'linear-gradient(135deg,rgba(220,38,38,0.08),rgba(234,88,12,0.05))', border: '1px solid rgba(220,38,38,0.15)' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shrink-0"
                        style={{ background: 'linear-gradient(135deg,#dc2626,#ea580c)', boxShadow: '0 6px 20px rgba(220,38,38,0.35)' }}>
                        <Shield size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-2xl tracking-tight">Admin Control Panel</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Manage lawyer approvals, user accounts, and platform oversight</p>
                    </div>
                </div>

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <KpiCard icon={Users} label="Total Clients" value={stats?.total_clients} accent="#6366f1" sub="Registered users" />
                    <KpiCard icon={Briefcase} label="Total Lawyers" value={stats?.total_lawyers} accent="#a78bfa" sub="All lawyer accounts" />
                    <KpiCard icon={Clock} label="Pending Approval" value={stats?.pending_lawyers} accent="#f59e0b" sub="Awaiting review" />
                    <KpiCard icon={UserCheck} label="Approved Lawyers" value={stats?.approved_lawyers} accent="#22c55e" sub="Active on platform" />
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={tab === t.id
                                ? { background: `${t.accent}18`, color: '#fff', border: `1px solid ${t.accent}35` }
                                : { color: '#64748b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <t.icon size={15} style={tab === t.id ? { color: t.accent } : {}} />
                            {t.label}
                            {t.count > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                    style={{ background: t.id === 'pending' ? '#f59e0b' : 'rgba(255,255,255,0.15)' }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-600 text-sm">Loading platform data...</p>
                    </div>
                )}

                {/* ── PENDING LAWYERS ── */}
                {!loading && tab === 'pending' && (
                    <div className="space-y-4">
                        {pendingLawyers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                    <CheckCircle size={36} className="text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg mb-1">All Clear!</p>
                                    <p className="text-slate-500 text-sm">No lawyers are pending approval right now.</p>
                                </div>
                            </div>
                        ) : pendingLawyers.map(l => (
                            <LawyerCard key={l.id} lawyer={l} acting={acting}
                                onApprove={() => approve(l.id)}
                                onReject={() => reject(l.id)}
                                onDelete={() => deleteUser(l.id, l.full_name)} />
                        ))}
                    </div>
                )}

                {/* ── APPROVED LAWYERS ── */}
                {!loading && tab === 'approved' && (
                    <div className="space-y-4">
                        {approvedLawyers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                    <AlertTriangle size={36} className="text-amber-500" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg mb-1">No approved lawyers yet</p>
                                    <p className="text-slate-500 text-sm">Approve pending applications to onboard lawyers.</p>
                                </div>
                            </div>
                        ) : approvedLawyers.map(l => (
                            <LawyerCard key={l.id} lawyer={l} acting={acting}
                                onApprove={null}
                                onReject={() => reject(l.id)}
                                onDelete={() => deleteUser(l.id, l.full_name)} />
                        ))}
                    </div>
                )}

                {/* ── CLIENTS ── */}
                {!loading && tab === 'clients' && (
                    <div className="rounded-2xl overflow-hidden" style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(99,102,241,0.05)' }}>
                            <div>
                                <h2 className="text-white font-bold">Registered Clients</h2>
                                <p className="text-slate-600 text-xs mt-0.5">{clients.length} total users</p>
                            </div>
                        </div>
                        {clients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-700">
                                <Users size={36} />
                                <p className="text-sm">No clients registered yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                {clients.map((c, i) => (
                                    <div key={c.id}
                                        className="px-6 py-4 flex items-center justify-between transition"
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-sm"
                                                style={{ background: `hsl(${(i * 47) % 360},60%,35%)` }}>
                                                {c.full_name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold text-sm">{c.full_name}</p>
                                                <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} /> {c.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-slate-700 text-xs hidden md:flex items-center gap-1">
                                                <Calendar size={10} />
                                                {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}
                                            </p>
                                            <button onClick={() => deleteUser(c.id, c.full_name)} disabled={!!acting}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center transition disabled:opacity-40"
                                                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}
