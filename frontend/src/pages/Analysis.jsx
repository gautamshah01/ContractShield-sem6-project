import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import {
  AlertCircle, ShieldAlert, CheckCircle, ChevronLeft,
  Info, FileText, AlertTriangle, Shield, Scale, Download,
  BookOpen, Gavel
} from 'lucide-react';

export default function Analysis() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compLoading, setCompLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await api.get(`/contracts/${id}`);
        setContract(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id]);

  // Lazy-load compliance when that tab is clicked
  useEffect(() => {
    if (activeTab === 'compliance' && !compliance && id) {
      setCompLoading(true);
      api.get(`/analysis/${id}/compliance`)
        .then(res => setCompliance(res.data))
        .catch(() => setCompliance({ error: 'Failed to load compliance data' }))
        .finally(() => setCompLoading(false));
    }
  }, [activeTab, id, compliance]);

  const handleExportReport = () => {
    const token = localStorage.getItem('token');
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    window.open(`${apiBase}/reports/${id}/export?token=${token}`, '_blank');
    // Also do proper auth-header fetch
    api.get(`/reports/${id}/export`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `contract_report_${id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => { });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Running AI analysis...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="text-red-500 mx-auto mb-3" size={40} />
        <p className="text-red-600 font-semibold">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  );

  if (!contract) return null;

  const riskScore = parseFloat(contract.risk_score || 0);
  const riskColor = riskScore >= 70 ? 'text-red-600' : riskScore >= 30 ? 'text-yellow-600' : 'text-green-600';
  const riskBgColor = riskScore >= 70 ? 'text-red-500' : riskScore >= 30 ? 'text-yellow-500' : 'text-green-500';
  const riskLabel = riskScore >= 70 ? 'High Risk' : riskScore >= 30 ? 'Medium Risk' : 'Low Risk';
  const completeness = parseFloat(contract.completeness_score || 0);

  const tabs = ['summary', 'clauses', 'risks', 'missing', 'compliance', 'text'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-9 h-9 rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={18} />
          </div>
          <span className="text-xl font-bold text-slate-900">ContractShield</span>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
        >
          <Download size={14} /> Export Report
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <Link to="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition mb-6 text-sm">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{contract.title}</h1>
            <p className="text-slate-400 flex items-center gap-2 text-sm">
              <FileText size={14} />
              {contract.file_type?.toUpperCase()} · Analyzed on {contract.created_at ? new Date(contract.created_at).toLocaleDateString('en-IN') : '—'}
            </p>
          </div>

          {/* Risk Score Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6 min-w-[300px]">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle
                  cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="10" fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - riskScore / 100)}
                  className={riskBgColor}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-slate-800">
                {riskScore.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Risk Score</div>
              <div className={`text-2xl font-bold ${riskColor}`}>{riskLabel}</div>
              <div className="mt-2 text-xs text-slate-500">
                <Scale size={12} className="inline mr-1 text-blue-500" />
                Completeness: <strong>{completeness.toFixed(0)}%</strong>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Clauses: {contract.total_clauses || 0} · Flagged: {contract.flagged_clauses || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2 text-xs text-amber-800">
          <Gavel size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <span><strong>Legal Disclaimer:</strong> This system provides AI-assisted analysis and does NOT constitute legal advice. Always consult a qualified legal professional before signing any contract.</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${activeTab === tab
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab === 'missing' ? `Missing (${contract.missing_clauses?.length || 0})` :
                tab === 'clauses' ? `Clauses (${contract.clauses?.length || 0})` :
                  tab === 'risks' ? `Risks (${contract.risks?.length || 0})` :
                    tab === 'compliance' ? '⚖️ Indian Law' : tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── SUMMARY TAB ── */}
            {activeTab === 'summary' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Info className="text-blue-600" size={20} /> Executive Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{contract.total_clauses || 0}</div>
                    <div className="text-xs text-blue-500 mt-1">Clauses Found</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">{contract.flagged_clauses || 0}</div>
                    <div className="text-xs text-red-500 mt-1">Flagged Risks</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {contract.missing_clauses?.length || contract.missing_clauses_count || 0}
                    </div>
                    <div className="text-xs text-orange-500 mt-1">Missing Clauses</div>
                  </div>
                </div>
                {contract.summary && (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 bg-slate-50 rounded-xl p-5 border border-slate-100 leading-relaxed">
                    {contract.summary}
                  </pre>
                )}
              </div>
            )}

            {/* ── CLAUSES TAB ── */}
            {activeTab === 'clauses' && (
              <div className="space-y-4">
                {(contract.clauses || []).length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">No clauses found</div>
                ) : (
                  contract.clauses.map((c, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg capitalize">
                          {c.type?.replace(/_/g, ' ')}
                        </span>
                        {c.risk_level && c.risk_level !== 'none' && (
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${c.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                            c.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                            {c.risk_level} risk
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">#{c.position || i + 1}</span>
                      </div>
                      <p className="text-slate-800 text-sm leading-relaxed mb-2">{c.text}</p>
                      {c.explanation && (
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">💬 {c.explanation}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── RISKS TAB ── */}
            {activeTab === 'risks' && (
              <div className="space-y-4">
                {(contract.risks || []).length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                    <CheckCircle className="text-green-500 mx-auto mb-3" size={32} />
                    <p className="text-slate-600 font-semibold">No significant risks detected!</p>
                  </div>
                ) : (
                  contract.risks.map((r, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                      <div className={`mt-1 shrink-0 ${r.severity === 'High' ? 'text-red-500' : 'text-yellow-500'}`}>
                        <AlertCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-slate-800">{r.type} Risk</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>{r.severity}</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-3 italic border-l-4 border-slate-200 pl-3">
                          "{r.text?.substring(0, 150)}..."
                        </p>
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-900">
                          <strong>💬 AI Explanation:</strong> {r.explanation}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── MISSING CLAUSES TAB ── */}
            {activeTab === 'missing' && (
              <div className="space-y-4">
                {(contract.missing_clauses || []).length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                    <CheckCircle className="text-green-500 mx-auto mb-3" size={32} />
                    <p className="text-slate-600 font-semibold">All expected clauses are present!</p>
                  </div>
                ) : (
                  contract.missing_clauses.map((m, i) => (
                    <div key={i} className="bg-orange-50 border border-orange-200 p-5 rounded-xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-orange-500" size={18} />
                        <span className="font-bold text-slate-800">{m.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-700 ml-auto">
                          {m.importance}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{m.recommendation}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── COMPLIANCE TAB (Indian Law) ── */}
            {activeTab === 'compliance' && (
              <div className="space-y-4">
                {compLoading ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-400">Running compliance checks...</p>
                  </div>
                ) : compliance?.error ? (
                  <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-600">{compliance.error}</div>
                ) : compliance ? (
                  <>
                    {/* Compliance Score */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <BookOpen className="text-purple-600" size={18} /> Indian Law Compliance
                        </h3>
                        <div className={`text-2xl font-bold ${compliance.compliance_score >= 80 ? 'text-green-600' :
                          compliance.compliance_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>{compliance.compliance_score}%</div>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full transition-all ${compliance.compliance_score >= 80 ? 'bg-green-500' :
                            compliance.compliance_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${compliance.compliance_score}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600 font-bold">✓ {compliance.passed} Passed</span>
                        <span className="text-red-600 font-bold">✗ {compliance.failed} Failed</span>
                        <span className="text-yellow-600 font-bold">⚠ {compliance.warnings} Warnings</span>
                      </div>
                      <div className="mt-3 text-xs text-slate-400">
                        Legal Framework: {compliance.legal_framework?.join(' · ')}
                      </div>
                    </div>

                    {/* Individual Checks */}
                    {(compliance.checks || []).map((c, i) => (
                      <div key={i} className={`p-4 rounded-xl border text-sm ${c.status === 'pass' ? 'bg-green-50 border-green-100' :
                        c.status === 'fail' ? 'bg-red-50 border-red-200' :
                          c.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-blue-50 border-blue-100'
                        }`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-800">{c.rule_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${c.status === 'pass' ? 'bg-green-100 text-green-700' :
                            c.status === 'fail' ? 'bg-red-100 text-red-700' :
                              c.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>{c.status}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{c.reference}</p>
                        <p className="text-xs text-slate-700">{c.explanation}</p>
                      </div>
                    ))}

                    {/* Disclaimer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                      <Gavel size={12} className="inline mr-1" />
                      {compliance.disclaimer}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ── TEXT TAB ── */}
            {activeTab === 'text' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-h-[600px] overflow-y-auto">
                {contract.text ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                    {contract.text}
                  </pre>
                ) : (
                  <p className="text-slate-400 text-center py-8">Contract text not available (first 10,000 chars are stored)</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clause Checklist */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400">
                <CheckCircle size={18} /> Clause Checklist
              </h3>
              <ul className="space-y-3">
                {['payment', 'termination', 'confidentiality', 'liability', 'governing_law', 'dispute_resolution'].map(item => {
                  const found = (contract.clauses || []).some(c => c.type === item);
                  return (
                    <li key={item} className="flex items-center justify-between text-sm">
                      <span className={`capitalize ${found ? 'text-slate-300' : 'text-slate-500 line-through'}`}>
                        {item.replace(/_/g, ' ')}
                      </span>
                      {found
                        ? <span className="text-green-400 text-xs font-bold">✓ Found</span>
                        : <span className="text-red-400 text-xs font-bold">✗ Missing</span>}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* AI Pipeline Info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 p-6 rounded-2xl">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <ShieldAlert size={16} className="text-purple-600" /> AI Pipeline
              </h3>
              <ul className="text-xs text-blue-700 space-y-2">
                <li>🔵 <strong>AI #1</strong> – spaCy NLP clause extraction</li>
                <li>🔴 <strong>AI #2</strong> – Rule-based weighted risk scoring</li>
                <li>💬 <strong>AI #3</strong> – Template plain-English explanation</li>
                <li>⚖️ <strong>Compliance</strong> – Indian legal rule engine</li>
              </ul>
              <Link
                to="/compare"
                className="mt-4 block text-center text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Compare with another contract →
              </Link>
            </div>

            {/* Download */}
            <button
              onClick={handleExportReport}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-700 transition text-sm"
            >
              <Download size={16} /> Download Report (.txt)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
