import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldQuestion, Image, Video, AudioLines, GitCompare, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

export default function ComparePage() {
  const { t, lang, authHeaders, API } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/analysis/history?limit=50`, authHeaders());
        setAnalyses(res.data.analyses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    setCompareResult(null);
  };

  const handleCompare = async () => {
    if (selected.length < 2) {
      toast.error(lang === 'ar' ? 'اختر تحليلين على الأقل' : 'Select at least 2 analyses');
      return;
    }
    try {
      const res = await axios.post(`${API}/analysis/compare`, { analysis_ids: selected }, authHeaders());
      setCompareResult(res.data.analyses);
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشلت المقارنة' : 'Comparison failed');
    }
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'authentic': return { bg: 'bg-[#2F855A]', light: 'bg-[#2F855A]/10', text: 'text-[#2F855A]', icon: <Shield className="w-5 h-5" /> };
      case 'suspicious': return { bg: 'bg-[#C05621]', light: 'bg-[#C05621]/10', text: 'text-[#C05621]', icon: <ShieldQuestion className="w-5 h-5" /> };
      case 'likely_fake': return { bg: 'bg-[#C53030]', light: 'bg-[#C53030]/10', text: 'text-[#C53030]', icon: <ShieldAlert className="w-5 h-5" /> };
      default: return { bg: 'bg-[#858580]', light: 'bg-[#858580]/10', text: 'text-[#858580]', icon: <Shield className="w-5 h-5" /> };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <AudioLines className="w-4 h-4" />;
      default: return <Image className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#DADAD5] border-t-[#1A1A18] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="compare-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-[#1A1A18]">{t('compare')}</h1>
          <p className="text-sm text-[#858580] mt-1">{t('selectForCompare')}</p>
        </div>
        {selected.length >= 2 && (
          <Button
            onClick={handleCompare}
            className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-6 hover:bg-[#1A1A18]/90 gap-2"
            data-testid="compare-btn"
          >
            <GitCompare className="w-4 h-4" />
            {t('compareSelected')} ({selected.length})
          </Button>
        )}
      </div>

      {/* Selection List */}
      {!compareResult && (
        <div className="space-y-3">
          {analyses.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DADAD5] p-12 text-center" data-testid="no-analyses-compare">
              <GitCompare className="w-12 h-12 text-[#DADAD5] mx-auto mb-4" />
              <p className="text-[#858580]">{t('noAnalyses')}</p>
            </div>
          ) : (
            analyses.map(analysis => {
              const isSelected = selected.includes(analysis.id);
              const vs = getVerdictStyle(analysis.verdict);
              return (
                <div
                  key={analysis.id}
                  onClick={() => toggleSelect(analysis.id)}
                  className={`bg-white rounded-xl border p-5 cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? 'border-[#1A1A18] shadow-md' : 'border-[#DADAD5] hover:border-[#858580]'
                  }`}
                  data-testid={`compare-item-${analysis.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#1A1A18] border-[#1A1A18]' : 'border-[#DADAD5]'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#575752]">
                      {getTypeIcon(analysis.file_type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#1A1A18]">{analysis.file_name}</div>
                      <div className="text-xs text-[#858580] mt-0.5">
                        {new Date(analysis.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${vs.light} ${vs.text}`}>
                    {vs.icon}
                    {t(analysis.verdict)}
                    <span className="ms-1">{analysis.confidence}%</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Comparison Results */}
      {compareResult && (
        <div className="space-y-6" data-testid="comparison-results">
          <Button
            onClick={() => setCompareResult(null)}
            variant="outline"
            className="rounded-full border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5]"
            data-testid="back-to-select-btn"
          >
            {lang === 'ar' ? 'العودة للاختيار' : 'Back to selection'}
          </Button>

          <div className={`grid gap-6 ${compareResult.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {compareResult.map((analysis, idx) => {
              const vs = getVerdictStyle(analysis.verdict);
              const details = analysis.details || {};
              return (
                <div key={analysis.id} className="bg-white rounded-xl border border-[#DADAD5] p-6 space-y-4" data-testid={`compare-result-${idx}`}>
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#575752]">
                      {getTypeIcon(analysis.file_type)}
                    </div>
                    <div className="text-sm font-medium text-[#1A1A18] truncate">{analysis.file_name}</div>
                  </div>

                  {/* Verdict */}
                  <div className={`${vs.light} rounded-xl p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <div className={`${vs.bg} text-white p-2 rounded-lg`}>{vs.icon}</div>
                      <span className={`text-sm font-medium ${vs.text}`}>{vs.label}</span>
                    </div>
                    <span className="text-lg font-light text-[#1A1A18]">{analysis.confidence}%</span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#575752] leading-relaxed">{details.summary}</p>

                  {/* Indicators count */}
                  <div className="flex items-center justify-between text-xs text-[#858580] pt-2 border-t border-[#EAEAE5]">
                    <span>{lang === 'ar' ? 'المؤشرات' : 'Indicators'}: {details.indicators?.length || 0}</span>
                    <span>{t('consistencyScore')}: {details.technical_details?.consistency_score ?? 'N/A'}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
