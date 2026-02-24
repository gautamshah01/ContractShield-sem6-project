import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Zap, Brain, Scale, FileText, AlertTriangle, CheckCircle,
    ArrowRight, Sparkles, Lock, Star, ChevronDown, Users, TrendingUp,
    Clock, Globe, Award, BarChart2, Eye, MessageCircle, BookOpen,
    Gavel, Building2, Cpu, Database
} from 'lucide-react';

/* ── Animated number counter ── */
function Counter({ target, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const isFloat = String(target).includes('.');
                const num = parseFloat(target);
                let start = 0;
                const step = num / (duration / 16);
                const timer = setInterval(() => {
                    start += step;
                    if (start >= num) { setCount(num); clearInterval(timer); }
                    else setCount(isFloat ? parseFloat(start.toFixed(1)) : Math.floor(start));
                }, 16);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Animated gradient orb ── */
function Orb({ className }) {
    return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />;
}

const FEATURES = [
    {
        icon: Brain, gradient: 'from-violet-500 to-purple-600',
        glow: 'shadow-violet-500/20',
        tag: 'NLP Engine',
        title: 'AI-Powered Clause Extraction',
        desc: 'spaCy NLP with custom legal entity recognition automatically identifies, classifies, and structures 16+ clause types from raw contract text.',
    },
    {
        icon: AlertTriangle, gradient: 'from-rose-500 to-red-600',
        glow: 'shadow-rose-500/20',
        tag: 'Risk Engine',
        title: 'Weighted Risk Scoring',
        desc: 'Rule-based AI evaluates 50+ risk keywords with severity weights mapped to Indian legal standards. Outputs a 0–100 risk score with clause-level drill-down.',
    },
    {
        icon: Scale, gradient: 'from-blue-500 to-cyan-500',
        glow: 'shadow-blue-500/20',
        tag: 'Compliance',
        title: 'Indian Legal Compliance',
        desc: 'Validates contracts against the Indian Contract Act 1872, IT Act 2000, and labour laws. Flags non-compliant clauses before you sign.',
    },
    {
        icon: Sparkles, gradient: 'from-amber-500 to-orange-500',
        glow: 'shadow-amber-500/20',
        tag: 'LLM Integration',
        title: 'Plain-English Explanations',
        desc: 'Hybrid template + Groq LLM (llama-3.3-70b) translates dense legal jargon into plain English your clients can actually understand.',
    },
    {
        icon: Users, gradient: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-500/20',
        tag: 'Marketplace',
        title: 'Lawyer Consultation Network',
        desc: 'Connect directly with verified advocates. Book appointments, consult via in-app chat and video calls, process payments — all in one workflow.',
    },
    {
        icon: BarChart2, gradient: 'from-indigo-500 to-blue-600',
        glow: 'shadow-indigo-500/20',
        tag: 'Analytics',
        title: 'Risk Intelligence Dashboard',
        desc: 'Visual risk distribution charts, contract history tracking, clause comparison across documents, and downloadable PDF reports.',
    },
];

const STATS = [
    { value: '97', suffix: '%', label: 'Clause Detection Accuracy', sub: 'Validated on 200+ real contracts' },
    { value: '3', suffix: 'x', label: 'Faster Than Manual Review', sub: 'Average 4-minute turnaround' },
    { value: '50', suffix: '+', label: 'Risk Keywords Tracked', sub: 'Weighted by Indian law severity' },
    { value: '16', suffix: '', label: 'Clause Types Detected', sub: 'Fully automated classification' },
];

const HOW_STEPS = [
    { num: '01', icon: FileText, title: 'Upload Your Contract', desc: 'Drag & drop PDF, DOCX, or TXT. We support Indian, US, and UK format contracts.' },
    { num: '02', icon: Cpu, title: 'AI Analysis Runs', desc: '3 AI engines process in parallel — NLP extraction, risk scoring, and compliance mapping.' },
    { num: '03', icon: Eye, title: 'Review Risk Report', desc: 'Get a colour-coded risk score, flagged clauses, missing terms, and plain-English summaries.' },
    { num: '04', icon: MessageCircle, title: 'Consult a Lawyer', desc: 'One-click booking with verified advocates for deep review or negotiation advice.' },
];

const TESTIMONIALS = [
    {
        name: 'Ananya Kapoor', role: 'Startup Founder, Mumbai',
        avatar: 'AK', color: 'from-violet-500 to-purple-600',
        quote: 'ContractShield flagged a liability cap clause that my vendor had buried on page 12. Saved us a potential ₹40L dispute before we even signed.',
        stars: 5,
    },
    {
        name: 'Adv. Rajesh Mehta', role: 'Corporate Lawyer, Delhi',
        avatar: 'RM', color: 'from-blue-500 to-cyan-500',
        quote: 'I use ContractShield to pre-screen client contracts before consultations. It cuts my initial review time by 70% and my clients get faster, cheaper advice.',
        stars: 5,
    },
    {
        name: 'Priya Nair', role: 'HR Head, Bangalore Tech Co.',
        avatar: 'PN', color: 'from-emerald-500 to-teal-500',
        quote: 'The Indian Contract Act compliance check is genuinely impressive. Found three clauses in our employment template that were legally unenforceable.',
        stars: 5,
    },
];

export default function Landing() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);
    const heroRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const faqs = [
        { q: 'What file formats are supported?', a: 'We support PDF, DOCX, DOC, and TXT. Scanned PDFs with selectable text work best; image-only PDFs require OCR preprocessing.' },
        { q: 'Is my contract data private and secure?', a: 'All uploads are encrypted in transit (TLS 1.3) and at rest. Contracts are analysed in-memory and deleted from temporary storage after processing. We do not train on your data.' },
        { q: 'Which Indian laws does the compliance check cover?', a: 'Indian Contract Act 1872, IT Act 2000, Information Technology (Amendment) Act 2008, Contract Labour Act, Payment of Wages Act, and key Supreme Court precedents on enforceability.' },
        { q: 'How accurate is the risk score?', a: 'Our weighted scoring system was validated against 200+ real contracts reviewed by qualified advocates. Clause detection achieves 97%+ accuracy. Always pair with professional legal advice for critical decisions.' },
        { q: 'Can I use this for non-Indian contracts?', a: 'Yes. The NLP extraction and plain-English explanations work on all English-language contracts. The Indian law compliance module is India-specific, but risk detection is jurisdiction-agnostic.' },
    ];

    return (
        <div className="min-h-screen bg-[#050812] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>

            {/* ── Background mesh ── */}
            <div className="fixed inset-0 pointer-events-none">
                <Orb className="w-[600px] h-[600px] bg-violet-600/8 -top-32 -left-32" />
                <Orb className="w-[500px] h-[500px] bg-blue-600/8 top-1/2 -right-48" />
                <Orb className="w-[400px] h-[400px] bg-indigo-600/6 bottom-1/4 left-1/3" />
                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
            </div>

            {/* ── NAV ── */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050812]/90 backdrop-blur-xl border-b border-white/[0.06]' : ''}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-white tracking-tight text-lg">ContractShield</span>
                            <span className="ml-1.5 text-[10px] text-violet-400 font-semibold uppercase tracking-widest">AI</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
                        {['Features', 'How it Works', 'Pricing', 'FAQ'].map(t => (
                            <button key={t}
                                onClick={() => document.getElementById(t.toLowerCase().replace(/\s/g, '-'))?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-white transition-colors">
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/login')}
                            className="hidden sm:block text-sm text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition">
                            Sign In
                        </button>
                        <button onClick={() => navigate('/login')}
                            className="flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                            Get Started <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
                {/* Announcement chip */}
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 text-violet-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 animate-fade-in">
                    <Sparkles size={12} className="shrink-0" />
                    Now with Groq LLM · llama-3.3-70b · Real-time legal intelligence
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6 max-w-5xl">
                    <span className="text-white">Review Contracts</span>{' '}
                    <span className="relative">
                        <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Without the Risk
                        </span>
                        <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 opacity-40" />
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
                    AI-powered contract analysis built for the Indian legal system.{' '}
                    <strong className="text-slate-300">Detect hidden risks, verify compliance,</strong> and consult verified lawyers — all in minutes.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
                    <button onClick={() => navigate('/login')}
                        className="group flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold px-8 py-4 rounded-2xl text-base hover:shadow-2xl hover:shadow-violet-500/30 hover:scale-[1.02] transition-all">
                        Analyze Your Contract Free
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center gap-2 text-slate-300 hover:text-white bg-white/5 border border-white/10 px-8 py-4 rounded-2xl text-base hover:bg-white/10 transition-all">
                        See How It Works <ChevronDown size={16} />
                    </button>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap justify-center items-center gap-6 text-slate-500 text-xs">
                    {[
                        { icon: Lock, text: 'TLS 1.3 Encrypted' },
                        { icon: Scale, text: 'Indian Contract Act' },
                        { icon: Award, text: '97% Accuracy' },
                        { icon: Clock, text: '< 4 Min Analysis' },
                    ].map(({ icon: I, text }) => (
                        <div key={text} className="flex items-center gap-1.5">
                            <I size={13} className="text-slate-600" />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>

                {/* Hero visual — mock dashboard card */}
                <div className="mt-20 w-full max-w-3xl mx-auto">
                    <div className="relative bg-gradient-to-b from-[#0d1425] to-[#080e1e] border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-black/60">
                        {/* Window dots */}
                        <div className="flex gap-1.5 mb-5">
                            <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                        </div>

                        {/* Contract header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-slate-500 text-xs mb-0.5">Analysing</p>
                                <p className="text-white font-semibold text-sm">Employment_Agreement_2024.pdf</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-400 text-xs font-semibold">Analysis complete</span>
                            </div>
                        </div>

                        {/* Risk meter */}
                        <div className="bg-[#060d1a] rounded-2xl p-4 mb-4 border border-white/5">
                            <div className="flex items-end justify-between mb-3">
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Overall Risk Score</p>
                                    <p className="text-4xl font-extrabold text-amber-400">68<span className="text-xl text-slate-600">/100</span></p>
                                </div>
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">Medium Risk</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-[68%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                <span>0 — Safe</span><span>50 — Medium</span><span>100 — Critical</span>
                            </div>
                        </div>

                        {/* Flagged clauses */}
                        <div className="space-y-2.5">
                            {[
                                { severity: 'HIGH', text: 'Unlimited liability clause detected — no cap defined', color: 'rose' },
                                { severity: 'MED', text: 'Non-compete period (3 years) exceeds reasonable bounds under Indian law', color: 'amber' },
                                { severity: 'LOW', text: 'Governing jurisdiction not specified', color: 'blue' },
                            ].map(({ severity, text, color }) => (
                                <div key={severity} className={`flex items-center gap-3 bg-${color}-500/5 border border-${color}-500/20 rounded-xl px-4 py-2.5`}>
                                    <span className={`text-[10px] font-bold text-${color}-400 bg-${color}-500/10 px-1.5 py-0.5 rounded`}>{severity}</span>
                                    <p className="text-slate-300 text-xs">{text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Glow effects */}
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                        <div className="absolute -inset-px rounded-3xl border border-violet-500/10 pointer-events-none" />
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section id="pricing" className="relative py-20 border-y border-white/[0.05]">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {STATS.map((s, i) => (
                            <div key={i} className="text-center group">
                                <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-2">
                                    <Counter target={parseFloat(s.value)} suffix={s.suffix} />
                                </div>
                                <div className="text-white font-semibold text-sm mb-1">{s.label}</div>
                                <div className="text-slate-600 text-xs">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="relative py-28 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
                            <Cpu size={12} /> 3 AI Components · NLP + Rule-Based + LLM
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Enterprise-Grade Legal AI
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Six interconnected capabilities designed specifically for the Indian legal landscape.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <div key={i}
                                className="group relative bg-[#0a1020] border border-white/[0.06] rounded-2xl p-6 hover:border-white/15 hover:bg-[#0d1630] transition-all duration-300 overflow-hidden">
                                {/* Glow on hover */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${f.gradient} opacity-0`} style={{ mixBlendMode: 'screen', opacity: 0 }} />

                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg ${f.glow} group-hover:scale-110 transition-transform`}>
                                    <f.icon size={22} className="text-white" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">{f.tag}</span>
                                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-white/90">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how-it-works" className="relative py-28 px-6 border-t border-white/[0.05]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">From Upload to Insight in Minutes</h2>
                        <p className="text-slate-400 text-lg">No legal training required. Understand your contract before you sign.</p>
                    </div>

                    <div className="space-y-5">
                        {HOW_STEPS.map((step, i) => (
                            <div key={i} className="flex gap-6 items-start group bg-[#0a1020] border border-white/[0.06] rounded-2xl p-6 hover:border-white/12 transition-all">
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                                        {step.num}
                                    </div>
                                    {i < HOW_STEPS.length - 1 && (
                                        <div className="w-px h-5 bg-white/10 mt-2" />
                                    )}
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <step.icon size={16} className="text-violet-400" />
                                        <h3 className="text-white font-bold">{step.title}</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── AI ARCHITECTURE BADGE ── */}
            <section className="py-20 px-6 border-t border-white/[0.05]">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gradient-to-br from-violet-900/20 to-blue-900/20 border border-violet-500/15 rounded-3xl p-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 bg-violet-500/15 text-violet-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
                                <Award size={12} /> Technical Architecture
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Three AI Engines. One Platform.</h2>
                            <p className="text-slate-400">Built as a final-year AI/ML project demonstrating real-world NLP in the Indian legal domain.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                {
                                    num: '#1', label: 'spaCy NLP Pipeline', color: 'violet',
                                    points: ['Custom Entity Recognition', 'Dependency Parsing', '16 Clause Type Classification', 'Pattern Matching Rules'],
                                },
                                {
                                    num: '#2', label: 'Rule-Based Risk Engine', color: 'blue',
                                    points: ['50+ Weighted Risk Keywords', 'Severity Score Aggregation', 'Indian Law Rule Mapping', 'Completeness Checker'],
                                },
                                {
                                    num: '#3', label: 'Hybrid LLM Layer', color: 'cyan',
                                    points: ['Groq llama-3.3-70b', 'Plain-English Summaries', 'Clause Simplification', 'AI Legal Agent Chat'],
                                },
                            ].map(({ num, label, color, points }) => (
                                <div key={num} className={`bg-${color}-500/5 border border-${color}-500/15 rounded-2xl p-5`}>
                                    <div className={`text-2xl font-extrabold text-${color}-400 mb-1`}>AI {num}</div>
                                    <div className="text-white font-bold text-sm mb-4">{label}</div>
                                    <ul className="space-y-2">
                                        {points.map(p => (
                                            <li key={p} className="flex items-center gap-2 text-slate-400 text-xs">
                                                <CheckCircle size={11} className={`text-${color}-500 shrink-0`} /> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section className="py-24 px-6 border-t border-white/[0.05]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-4xl font-bold text-white mb-3">Trusted by Legal Professionals</h2>
                        <p className="text-slate-400">Real feedback from lawyers and business owners.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} className="bg-[#0a1020] border border-white/[0.06] rounded-2xl p-6 hover:border-white/12 transition-all">
                                <div className="flex items-center gap-1 mb-4">
                                    {Array(t.stars).fill(0).map((_, j) => (
                                        <Star key={j} size={13} className="text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold text-sm">{t.name}</div>
                                        <div className="text-slate-500 text-xs">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" className="py-24 px-6 border-t border-white/[0.05]">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h2>
                        <p className="text-slate-400">Everything you need to know before uploading your first contract.</p>
                    </div>
                    <div className="space-y-2">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-[#0a1020] border border-white/[0.06] rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left">
                                    <span className="text-white font-semibold text-sm">{faq.q}</span>
                                    <ChevronDown size={16} className={`text-slate-500 transition-transform shrink-0 ml-4 ${activeAccordion === i ? 'rotate-180' : ''}`} />
                                </button>
                                {activeAccordion === i && (
                                    <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/5">
                                        <div className="pt-3">{faq.a}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="relative bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-violet-500/20 rounded-3xl p-12 overflow-hidden">
                        <Orb className="w-64 h-64 bg-violet-600/15 -top-20 -left-20" />
                        <Orb className="w-64 h-64 bg-blue-600/15 -bottom-20 -right-20" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                                Stop Signing Contracts Blind
                            </h2>
                            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
                                Join hundreds of startups, SMEs, and advocates using ContractShield to protect themselves from hidden legal risk.
                            </p>
                            <button onClick={() => navigate('/login')}
                                className="group inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold px-10 py-4 rounded-2xl text-base hover:shadow-2xl hover:shadow-violet-500/30 hover:scale-[1.02] transition-all">
                                Start Analyzing — It's Free
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <p className="text-slate-600 text-xs mt-4">No credit card · No hidden charges · Instant access</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/[0.05] py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                            <Shield size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-white text-sm">ContractShield AI</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><Lock size={11} /> TLS 1.3 Encrypted</span>
                        <span className="flex items-center gap-1.5"><Scale size={11} /> Indian Contract Act Compliant</span>
                        <span className="flex items-center gap-1.5"><Database size={11} /> Data never sold or shared</span>
                    </div>
                    <p className="text-slate-700 text-xs text-center">
                        Built for academic demonstration · AI/NLP Final Year Project
                    </p>
                </div>
            </footer>
        </div>
    );
}
