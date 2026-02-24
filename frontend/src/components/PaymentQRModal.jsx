/**
 * PaymentQRModal
 * Shows a UPI-style mock payment QR code when a lawyer approves an appointment.
 *
 * Props:
 *   appointment  – appointment object { id, lawyer_name, lawyer_email, hourly_rate }
 *   onClose      – callback to close modal
 *   onPaid       – callback after simulated payment confirmed
 */

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    X, CheckCircle, Shield, CreditCard, Clock,
    Smartphone, AlertCircle, IndianRupee
} from 'lucide-react';

// Build a UPI deep-link string
function buildUpiString({ amount, name, note }) {
    const pa = 'contractshield@upi';   // mock VPA
    const pn = encodeURIComponent('ContractShield Legal');
    const tn = encodeURIComponent(note || 'Legal Consultation');
    const am = Number(amount || 500).toFixed(2);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

export default function PaymentQRModal({ appointment, onClose, onPaid }) {
    const [step, setStep] = useState('qr');    // 'qr' | 'confirming' | 'done'
    const [countdown, setCountdown] = useState(5);

    // Lawyer info
    const lawyerName = appointment?.lawyer_name || 'Your Lawyer';
    const amount = appointment?.hourly_rate || 500;
    const apptId = appointment?.id;

    const upi = buildUpiString({
        amount,
        name: lawyerName,
        note: `Legal Consultation #${apptId}`,
    });

    // Simulate payment confirmation countdown
    useEffect(() => {
        if (step !== 'confirming') return;
        if (countdown <= 0) { setStep('done'); onPaid?.(); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [step, countdown]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={e => e.target === e.currentTarget && step !== 'confirming' && onClose()}>

            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl shadow-black/60 overflow-hidden">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-blue-900/60 to-purple-900/60 px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <CreditCard size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Consultation Payment</p>
                            <p className="text-slate-400 text-xs">Secure · UPI · Instant</p>
                        </div>
                    </div>
                    {step !== 'confirming' && (
                        <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition">
                            <X size={15} />
                        </button>
                    )}
                </div>

                {/* ── QR step ── */}
                {step === 'qr' && (
                    <div className="p-6">
                        {/* Lawyer card */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl p-3 mb-5">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-white font-bold">{lawyerName[0]?.toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{lawyerName}</p>
                                <p className="text-slate-400 text-xs">Employment Law Consultant</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold text-lg flex items-center gap-0.5">
                                    <IndianRupee size={14} className="text-emerald-400" />
                                    <span>{amount}</span>
                                </p>
                                <p className="text-slate-500 text-[10px]">per hour</p>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white rounded-2xl p-4 flex items-center justify-center mb-4 shadow-inner">
                            <div className="relative">
                                <QRCodeSVG
                                    value={upi}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                    imageSettings={{
                                        src: '',
                                        excavate: false,
                                    }}
                                />
                                {/* Center logo overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                                        <Shield size={18} className="text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* UPI label */}
                        <div className="text-center mb-5">
                            <p className="text-slate-400 text-xs">UPI ID</p>
                            <p className="text-white font-mono font-semibold text-sm mt-0.5">contractshield@upi</p>
                        </div>

                        {/* Payment apps row */}
                        <div className="flex justify-center gap-3 mb-5">
                            {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                <div key={app}
                                    className="flex flex-col items-center gap-1">
                                    <div className="w-10 h-10 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center">
                                        <Smartphone size={16} className="text-slate-400" />
                                    </div>
                                    <span className="text-[9px] text-slate-600">{app}</span>
                                </div>
                            ))}
                        </div>

                        {/* Info box */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2 mb-5">
                            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-amber-300 text-xs leading-relaxed">
                                This is a <strong>mock payment</strong> for demonstration. No real transaction will occur. Scan to simulate.
                            </p>
                        </div>

                        {/* CTA */}
                        <button onClick={() => setStep('confirming')}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition">
                            Simulate Payment — ₹{amount}
                        </button>
                        <p className="text-center text-slate-600 text-[10px] mt-2">
                            Appointment #{apptId} · ContractShield Legal Platform
                        </p>
                    </div>
                )}

                {/* ── Confirming step ── */}
                {step === 'confirming' && (
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 bg-blue-500/10 border-4 border-blue-500 rounded-full flex items-center justify-center mx-auto mb-5 animate-spin"
                            style={{ animationDuration: '1.2s' }}>
                            <Clock size={32} className="text-blue-400" />
                        </div>
                        <p className="text-white font-bold text-lg mb-1">Processing…</p>
                        <p className="text-slate-400 text-sm">Confirming payment with bank</p>
                        <p className="text-blue-400 font-mono text-2xl font-bold mt-4">{countdown}s</p>
                    </div>
                )}

                {/* ── Done step ── */}
                {step === 'done' && (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/40">
                            <CheckCircle size={40} className="text-emerald-400" />
                        </div>
                        <p className="text-white font-bold text-xl mb-1">Payment Successful!</p>
                        <p className="text-slate-400 text-sm mb-4">
                            ₹{amount} paid to {lawyerName}
                        </p>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-5 text-left space-y-1.5">
                            {[
                                ['Transaction ID', `CS${apptId}${Date.now().toString().slice(-6)}`],
                                ['Amount', `₹${amount}`],
                                ['To', `${lawyerName}`],
                                ['Via', 'UPI · contractshield@upi'],
                                ['Status', '✅ Confirmed'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between text-xs">
                                    <span className="text-slate-500">{k}</span>
                                    <span className="text-white font-medium">{v}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={onClose}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-bold text-sm transition">
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
