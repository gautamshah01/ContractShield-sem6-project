import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import {
  ChevronLeft, ArrowLeftRight, Shield, GitCompare,
  TrendingUp, TrendingDown, Minus, AlertTriangle
} from 'lucide-react';

export default function Comparison() {
  const [contracts, setContracts] = useState([]);
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/contracts/')
      .then(res => setContracts(res.data.contracts || []))
      .catch(() => setError('Failed to load contracts'));
  }, []);

  const handleCompare = async () => {
    if (!id1 || !id2) return;
    if (id1 === id2) { setError('Select two different contracts'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/analysis/compare', {
        id1: parseInt(id1),
        id2: parseInt(id2)
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (score) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-9 h-9 rounded-lg flex items-center justify-center">
          <Shield className="text-white" size={18} />
        </div>
        <span className="text-xl font-bold text-slate-900">ContractShield</span>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        <Link to="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition mb-6 text-sm">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <GitCompare className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-slate-900">Compare Contracts</h1>
        </div>
        <p className="text-slate-500 mb-8">Select two contracts to compare them side-by-side using AI diff analysis.</p>

        {/* Selector Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contract A</label>
              <select
                value={id1}
                onChange={e => setId1(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select contract...</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} (Score: {(c.risk_score || 0).toFixed(0)})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex items-center pb-1">
              <div className="bg-slate-100 rounded-full p-2">
                <ArrowLeftRight className="text-slate-400" size={20} />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contract B</label>
              <select
                value={id2}
                onChange={e => setId2(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select contract...</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} (Score: {(c.risk_score || 0).toFixed(0)})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompare}
              disabled={!id1 || !id2 || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-2.5 rounded-xl font-bold hover:shadow-lg disabled:opacity-40 transition whitespace-nowrap"
            >
              {loading ? '⏳ Comparing...' : '🔍 Compare'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">{result.contract1?.title}</div>
                <div className={`text-4xl font-bold ${riskColor(result.c1_score)}`}>
                  {(result.c1_score || 0).toFixed(0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Risk Score</div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-center">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Difference</div>
                <div className={`text-4xl font-bold flex items-center justify-center gap-1 ${result.score_diff > 0 ? 'text-red-400' : result.score_diff < 0 ? 'text-green-400' : 'text-slate-400'
                  }`}>
                  {result.score_diff > 0 ? <TrendingUp size={28} /> : result.score_diff < 0 ? <TrendingDown size={28} /> : <Minus size={28} />}
                  {result.score_diff > 0 ? '+' : ''}{(result.score_diff || 0).toFixed(1)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Similarity: <span className="text-blue-400 font-bold">{result.similarity_pct}%</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">{result.contract2?.title}</div>
                <div className={`text-4xl font-bold ${riskColor(result.c2_score)}`}>
                  {(result.c2_score || 0).toFixed(0)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Risk Score</div>
              </div>
            </div>

            {/* Risk Verdict */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full p-2"><Shield size={16} /></div>
              <p className="text-blue-900 font-semibold text-sm">{result.risk_verdict}</p>
            </div>

            {/* Clause Comparison */}
            {result.clause_comparison && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4">Clause-Type Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs font-bold text-green-600 uppercase mb-2">Common Clauses ({result.clause_comparison.common?.length || 0})</div>
                    <div className="space-y-1">
                      {(result.clause_comparison.common || []).map(t => (
                        <div key={t} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded capitalize">{t.replace(/_/g, ' ')}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-600 uppercase mb-2">Only in A ({result.clause_comparison.only_in_contract1?.length || 0})</div>
                    <div className="space-y-1">
                      {(result.clause_comparison.only_in_contract1 || []).map(t => (
                        <div key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded capitalize">{t.replace(/_/g, ' ')}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-600 uppercase mb-2">Only in B ({result.clause_comparison.only_in_contract2?.length || 0})</div>
                    <div className="space-y-1">
                      {(result.clause_comparison.only_in_contract2 || []).map(t => (
                        <div key={t} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded capitalize">{t.replace(/_/g, ' ')}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Colored Diff */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <GitCompare size={16} className="text-blue-400" /> Text Diff Output
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">+ Added</span>
                  <span className="text-red-400">- Removed</span>
                  <span className="text-slate-400">Context</span>
                </div>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed">
                {(result.colored_diff || []).length === 0 ? (
                  <p className="text-slate-400">No textual differences found — contracts are identical.</p>
                ) : (
                  result.colored_diff.map((line, i) => (
                    <div key={i} className={
                      line.type === 'added' ? 'text-green-400 bg-green-950 bg-opacity-30' :
                        line.type === 'removed' ? 'text-red-400 bg-red-950 bg-opacity-30' :
                          line.type === 'hunk' ? 'text-blue-400 mt-2' :
                            'text-slate-500'
                    }>
                      {line.text || ' '}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
