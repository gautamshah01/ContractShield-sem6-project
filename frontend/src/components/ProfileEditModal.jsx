/**
 * ProfileEditModal
 *
 * Props:
 *   user          — current user object
 *   role          — 'client' | 'lawyer'
 *   onSave(data)  — called with API response user object
 *   onDelete()    — called after account deleted (should log out)
 *   onClose()     — close without saving
 */
import { useState } from 'react';
import {
    X, User, Mail, Lock, Briefcase, MapPin, Star,
    Clock, IndianRupee, FileText, Trash2, Save, Loader2,
    CheckCircle, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../api';

export default function ProfileEditModal({ user, role, onSave, onDelete, onClose }) {
    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        password: '',
        specialization: user?.specialization || '',
        bio: user?.bio || '',
        location: user?.location || '',
        experience_yrs: user?.experience_yrs ?? '',
        hourly_rate: user?.hourly_rate ?? '',
        bar_council_id: user?.bar_council_id || '',
        available: user?.available ?? true,
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [msg, setMsg] = useState(null);   // { type: 'ok'|'err', text }
    const [confirmDel, setConfirmDel] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    async function save() {
        setSaving(true); setMsg(null);
        try {
            const payload = {
                full_name: form.full_name,
                email: form.email,
            };
            if (form.password) payload.password = form.password;
            if (role === 'lawyer') {
                Object.assign(payload, {
                    specialization: form.specialization,
                    bio: form.bio,
                    location: form.location,
                    experience_yrs: form.experience_yrs || null,
                    hourly_rate: form.hourly_rate || null,
                    bar_council_id: form.bar_council_id,
                    available: form.available,
                });
            }
            const { data } = await api.put('/auth/profile', payload);
            setMsg({ type: 'ok', text: 'Profile saved!' });
            onSave?.(data.user);
        } catch (e) {
            setMsg({ type: 'err', text: e.response?.data?.error || 'Save failed' });
        } finally { setSaving(false); }
    }

    async function deleteAccount() {
        setDeleting(true);
        try {
            await api.delete('/auth/account');
            onDelete?.();
        } catch (e) {
            setMsg({ type: 'err', text: e.response?.data?.error || 'Delete failed' });
            setDeleting(false);
        }
    }

    const InputRow = ({ icon: Icon, label, name, type = 'text', placeholder, textarea }) => (
        <div>
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Icon size={11} /> {label}
            </label>
            {textarea ? (
                <textarea rows={3} value={form[name]} onChange={set(name)}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition resize-none" />
            ) : (
                <input type={type} value={form[name]} onChange={set(name)}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition" />
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <User size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold">Edit Profile</p>
                            <p className="text-slate-400 text-xs capitalize">{role} · {user?.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition">
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {/* Status message */}
                    {msg && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${msg.type === 'ok'
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/15 border border-red-500/30 text-red-400'
                            }`}>
                            {msg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {msg.text}
                        </div>
                    )}

                    {/* Common fields */}
                    <div className="space-y-3">
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Account Info</p>
                        <InputRow icon={User} label="Full Name" name="full_name" placeholder="Your full name" />
                        <InputRow icon={Mail} label="Email Address" name="email" type="email" placeholder="your@email.com" />
                        <InputRow icon={Lock} label="New Password" name="password" type="password" placeholder="Leave blank to keep current" />
                    </div>

                    {/* Lawyer fields */}
                    {role === 'lawyer' && (
                        <div className="space-y-3 pt-2 border-t border-white/8">
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest pt-1">Lawyer Profile</p>
                            <InputRow icon={Briefcase} label="Specialization" name="specialization" placeholder="e.g. Employment Law, Contract Law" />
                            <InputRow icon={FileText} label="Bio" name="bio" placeholder="Tell clients about yourself…" textarea />
                            <InputRow icon={MapPin} label="Location" name="location" placeholder="City, State" />
                            <InputRow icon={Star} label="Bar Council ID" name="bar_council_id" placeholder="BCI registration number" />
                            <div className="grid grid-cols-2 gap-3">
                                <InputRow icon={Clock} label="Experience (yrs)" name="experience_yrs" type="number" placeholder="5" />
                                <InputRow icon={IndianRupee} label="Hourly Rate (₹)" name="hourly_rate" type="number" placeholder="500" />
                            </div>
                            {/* Available toggle */}
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-white text-sm font-medium">Available for bookings</p>
                                    <p className="text-slate-500 text-xs">Clients can see and book you when enabled</p>
                                </div>
                                <button onClick={() => setForm(f => ({ ...f, available: !f.available }))}
                                    className="transition">
                                    {form.available
                                        ? <ToggleRight size={32} className="text-emerald-400" />
                                        : <ToggleLeft size={32} className="text-slate-600" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Danger zone */}
                    <div className="pt-2 border-t border-white/8">
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Danger Zone</p>
                        {!confirmDel ? (
                            <button onClick={() => setConfirmDel(true)}
                                className="w-full flex items-center gap-2 justify-center py-2.5 px-4 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition">
                                <Trash2 size={14} /> Delete My Account
                            </button>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                                <p className="text-red-400 text-sm font-semibold">⚠️ This is irreversible!</p>
                                <p className="text-slate-500 text-xs">All your data, contracts, and appointments will be permanently deleted.</p>
                                <div className="flex gap-2">
                                    <button onClick={deleteAccount} disabled={deleting}
                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                                        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        {deleting ? 'Deleting…' : 'Yes, Delete Forever'}
                                    </button>
                                    <button onClick={() => setConfirmDel(false)}
                                        className="flex-1 bg-white/8 hover:bg-white/15 text-slate-300 py-2 rounded-xl text-sm transition">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/8 flex gap-3 shrink-0">
                    <button onClick={onClose}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-2xl text-sm font-medium transition">
                        Cancel
                    </button>
                    <button onClick={save} disabled={saving}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
