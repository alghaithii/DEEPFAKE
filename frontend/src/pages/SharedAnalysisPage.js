import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldQuestion, CheckCircle, AlertTriangle, XCircle, Fingerprint, Eye } from 'lucide-react';
import { Progress } from '../components/ui/progress';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function SharedAnalysisPage() {
  const { shareId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/shared/${shareId}`)
      .then(res => setAnalysis(res.data))
      .catch(() => setError('Analysis not found'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#DADAD5] border-t-[#1A1A18] rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center"><div className="text-center"><Shield className="w-12 h-12 text-[#DADAD5] mx-auto mb-4" /><p className="text-[#858580]">{error}</p></div></div>;
  if (!analysis) return null;

  const details = analysis.details || {};
  const getVC = (v) => ({
    authentic: { bg: 'bg-[#2F855A]', light: 'bg-[#2F855A]/10', border: 'border-[#2F855A]/30', text: 'text-[#2F855A]', ring: 'ring-[#2F855A]/20', label: 'Authentic', icon: <Shield className="w-8 h-8" /> },
    suspicious: { bg: 'bg-[#C05621]', light: 'bg-[#C05621]/10', border: 'border-[#C05621]/30', text: 'text-[#C05621]', ring: 'ring-[#C05621]/20', label: 'Suspicious', icon: <ShieldQuestion className="w-8 h-8" /> },
    likely_fake: { bg: 'bg-[#C53030]', light: 'bg-[#C53030]/10', border: 'border-[#C53030]/30', text: 'text-[#C53030]', ring: 'ring-[#C53030]/20', label: 'Likely Fake', icon: <ShieldAlert className="w-8 h-8" /> },
  }[v] || { bg: 'bg-[#858580]', light: 'bg-[#858580]/10', border: 'border-[#858580]/30', text: 'text-[#858580]', ring: 'ring-[#858580]/20', label: v, icon: <Shield className="w-8 h-8" /> });
  const vc = getVC(analysis.verdict);

  return (
    <div className="min-h-screen bg-[#F5F5F0]" data-testid="shared-analysis-page">
      <nav className="bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-[#DADAD5] py-4 px-6 md:px-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#1A1A18]" /><span className="font-bold text-[#1A1A18]">TruthLens</span></div>
          <span className="text-xs text-[#858580] bg-[#EAEAE5] px-3 py-1 rounded-full">Shared Analysis Report</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-8 space-y-6">
        {/* File info */}
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6">
          <h2 className="text-lg font-medium text-[#1A1A18]">{analysis.file_name}</h2>
          <div className="flex gap-3 text-xs text-[#858580] mt-1">
            <span>{analysis.file_type}</span><span>&middot;</span>
            <span>{new Date(analysis.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Verdict */}
        <div className={`${vc.light} rounded-2xl border ${vc.border} p-8 ring-4 ${vc.ring}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl ${vc.bg} text-white flex items-center justify-center shadow-lg`}>{vc.icon}</div>
              <div><div className="text-xs text-[#858580] uppercase tracking-widest">VERDICT</div><div className={`text-3xl font-medium ${vc.text}`}>{vc.label}</div></div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-[#1A1A18]">{analysis.confidence}%</div>
              <div className="text-xs text-[#858580]">Confidence</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6">
          <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-3">Summary</h3>
          <p className="text-[#1A1A18] leading-relaxed">{details.summary}</p>
        </div>

        {/* Stages */}
        {details.analysis_stages?.length > 0 && (
          <div className="bg-white rounded-xl border border-[#DADAD5] p-6">
            <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">Analysis Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {details.analysis_stages.map((s, i) => {
                const cls = { pass: 'bg-[#2F855A]/10 text-[#2F855A] border-[#2F855A]/20', warning: 'bg-[#C05621]/10 text-[#C05621] border-[#C05621]/20', fail: 'bg-[#C53030]/10 text-[#C53030] border-[#C53030]/20' }[s.status] || 'bg-[#858580]/10 text-[#858580]';
                const icon = { pass: <CheckCircle className="w-4 h-4" />, warning: <AlertTriangle className="w-4 h-4" />, fail: <XCircle className="w-4 h-4" /> }[s.status] || <Shield className="w-4 h-4" />;
                return <div key={i} className={`rounded-xl border p-4 ${cls}`}><div className="flex items-center gap-2 mb-1">{icon}<span className="text-sm font-medium">{s.stage}</span></div><p className="text-xs opacity-80">{s.finding}</p></div>;
              })}
            </div>
          </div>
        )}

        {/* Indicators */}
        {details.indicators?.length > 0 && (
          <div className="bg-white rounded-xl border border-[#DADAD5] p-6">
            <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">Indicators</h3>
            <div className="space-y-3">
              {details.indicators.map((ind, i) => {
                const cls = { high: 'text-[#C53030] bg-[#C53030]/10 border-[#C53030]/20', medium: 'text-[#C05621] bg-[#C05621]/10 border-[#C05621]/20', low: 'text-[#2F855A] bg-[#2F855A]/10 border-[#2F855A]/20' }[ind.severity] || 'text-[#858580] bg-[#858580]/10';
                return <div key={i} className={`p-4 rounded-xl border ${cls}`}><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{ind.name}</span><span className="text-xs font-medium uppercase">{ind.severity}</span></div><p className="text-xs opacity-80">{ind.description}</p></div>;
              })}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {details.recommendation && (
          <div className="bg-[#2C5282]/5 rounded-xl border border-[#2C5282]/20 p-6">
            <h3 className="text-sm font-medium text-[#2C5282] uppercase tracking-wider mb-3">Recommendation</h3>
            <p className="text-[#1A1A18] leading-relaxed">{details.recommendation}</p>
          </div>
        )}

        <div className="text-center py-8 text-xs text-[#858580]">
          <Shield className="w-4 h-4 inline-block me-1" /> Analyzed by TruthLens - AI-Powered Deepfake Detection
        </div>
      </main>
    </div>
  );
}
