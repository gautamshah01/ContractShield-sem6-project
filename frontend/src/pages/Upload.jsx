import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Upload as UploadIcon, File, X, Shield, ChevronLeft, AlertCircle } from 'lucide-react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));

    try {
      setProgress(30);
      const res = await api.post('/contracts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round(30 + (e.loaded / e.total) * 40));
        }
      });
      setProgress(100);
      navigate(`/analysis/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.pdf') || dropped.name.endsWith('.txt'))) {
      setFile(dropped);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-9 h-9 rounded-lg flex items-center justify-center">
          <Shield className="text-white" size={18} />
        </div>
        <span className="text-xl font-bold text-slate-900">ContractShield</span>
      </nav>

      <div className="max-w-2xl mx-auto p-8">
        <Link to="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition mb-6 text-sm">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Analyze New Contract</h1>
        <p className="text-slate-500 mb-8">
          Upload a contract and our AI will extract clauses, detect risks, and generate plain-English explanations.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contract Title <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Employment Agreement — John Doe"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Contract File</label>
            <div
              className="relative border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-blue-400 transition cursor-pointer group bg-slate-50"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.txt"
              />
              {!file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-blue-100 rounded-2xl p-4 group-hover:bg-blue-200 transition">
                    <UploadIcon className="text-blue-600" size={36} />
                  </div>
                  <div>
                    <p className="text-slate-700 font-semibold">Click to upload or drag & drop</p>
                    <p className="text-slate-400 text-sm mt-1">PDF or TXT files, up to 16MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <File className="text-white" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-slate-800 font-semibold truncate max-w-[220px]">{file.name}</p>
                      <p className="text-slate-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="p-1.5 hover:bg-slate-200 rounded-full transition"
                  >
                    <X size={18} className="text-slate-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading && progress > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Processing with AI...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-base"
          >
            {loading ? '🤖 AI is analyzing your contract...' : '🚀 Start AI Analysis'}
          </button>

          {/* What happens info */}
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-800 font-semibold mb-2">What our AI does:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>🔍 <strong>AI #1</strong>: Extracts and classifies all clauses using spaCy NLP</li>
              <li>⚠️ <strong>AI #2</strong>: Detects risky terms using rule-based weighted scoring</li>
              <li>💬 <strong>AI #3</strong>: Generates plain-English explanations for each clause</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
