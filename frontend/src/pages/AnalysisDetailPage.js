import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldQuestion, ArrowLeft, Download, Trash2, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const { t, lang, authHeaders, token, API } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(`${API}/analysis/${id}`, authHeaders());
        setAnalysis(res.data);
      } catch (err) {
        toast.error(lang === 'ar' ? 'لم يتم العثور على التحليل' : 'Analysis not found');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  const downloadReport = async () => {
    try {
      const res = await axios.get(`${API}/analysis/${id}/report`, {
        ...authHeaders(),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analysis-report-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(lang === 'ar' ? 'تم تحميل التقرير' : 'Report downloaded');
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشل تحميل التقرير' : 'Failed to download report');
    }
  };

  const deleteAndGoBack = async () => {
    try {
      await axios.delete(`${API}/analysis/${id}`, authHeaders());
      toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
      navigate('/history');
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#DADAD5] border-t-[#1A1A18] rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis) return null;

  const details = analysis.details || {};
  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'authentic': return { bg: 'bg-[#2F855A]', light: 'bg-[#2F855A]/10', text: 'text-[#2F855A]', label: t('authentic'), icon: <Shield className="w-8 h-8" /> };
      case 'suspicious': return { bg: 'bg-[#C05621]', light: 'bg-[#C05621]/10', text: 'text-[#C05621]', label: t('suspicious'), icon: <ShieldQuestion className="w-8 h-8" /> };
      case 'likely_fake': return { bg: 'bg-[#C53030]', light: 'bg-[#C53030]/10', text: 'text-[#C53030]', label: t('likely_fake'), icon: <ShieldAlert className="w-8 h-8" /> };
      default: return { bg: 'bg-[#858580]', light: 'bg-[#858580]/10', text: 'text-[#858580]', label: verdict, icon: <Shield className="w-8 h-8" /> };
    }
  };

  const vs = getVerdictStyle(analysis.verdict);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" data-testid="analysis-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#858580] hover:text-[#1A1A18] transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          {t('backToDashboard')}
        </button>
        <div className="flex gap-2">
          <Button
            onClick={downloadReport}
            variant="outline"
            className="rounded-full border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5] gap-2"
            data-testid="download-report-btn"
          >
            <Download className="w-4 h-4" />
            {t('downloadReport')}
          </Button>
          <Button
            onClick={deleteAndGoBack}
            variant="outline"
            className="rounded-full border-[#C53030]/20 text-[#C53030] hover:bg-[#C53030]/10 gap-2"
            data-testid="delete-analysis-btn"
          >
            <Trash2 className="w-4 h-4" />
            {t('deleteAnalysis')}
          </Button>
        </div>
      </div>

      {/* File Info */}
      <div className="bg-white rounded-xl border border-[#DADAD5] p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#575752]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#1A1A18]">{analysis.file_name}</h2>
            <div className="flex items-center gap-3 text-xs text-[#858580] mt-1">
              <span>{analysis.file_type}</span>
              <span>&middot;</span>
              <span>{analysis.file_size ? `${(analysis.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
              <span>&middot;</span>
              <span>{new Date(analysis.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className={`${vs.light} rounded-2xl border border-[#DADAD5] p-8`} data-testid="detail-verdict-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl ${vs.bg} text-white flex items-center justify-center`}>
              {vs.icon}
            </div>
            <div>
              <div className="text-sm text-[#858580] uppercase tracking-wider">{t('verdict')}</div>
              <div className={`text-3xl font-medium ${vs.text}`}>{vs.label}</div>
            </div>
          </div>
          <div className="text-end">
            <div className="text-sm text-[#858580]">{t('confidence')}</div>
            <div className="text-4xl font-light text-[#1A1A18]">{analysis.confidence}%</div>
            <Progress value={analysis.confidence} className="h-2 w-32 mt-2 bg-[#EAEAE5]" />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="detail-summary">
        <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-3">{t('summary')}</h3>
        <p className="text-[#1A1A18] leading-relaxed text-base">{details.summary}</p>
      </div>

      {/* Indicators */}
      {details.indicators?.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="detail-indicators">
          <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">{t('indicators')}</h3>
          <div className="space-y-3">
            {details.indicators.map((ind, i) => {
              const severityColor = { high: 'text-[#C53030] bg-[#C53030]/10 border-[#C53030]/20', medium: 'text-[#C05621] bg-[#C05621]/10 border-[#C05621]/20', low: 'text-[#2F855A] bg-[#2F855A]/10 border-[#2F855A]/20' }[ind.severity] || 'text-[#858580] bg-[#858580]/10 border-[#858580]/20';
              return (
                <div key={i} className={`p-4 rounded-xl border ${severityColor}`} data-testid={`detail-indicator-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{ind.name}</span>
                    <span className="text-xs font-medium uppercase">{ind.severity}</span>
                  </div>
                  <p className="text-xs opacity-80">{ind.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical Details */}
      {details.technical_details && (
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="detail-technical">
          <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">{t('technicalDetails')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F5F0]">
              <div className="text-xs text-[#858580] mb-1">{t('consistencyScore')}</div>
              <div className="text-xl font-light text-[#1A1A18]">{details.technical_details.consistency_score ?? 'N/A'}%</div>
              <Progress value={details.technical_details.consistency_score || 0} className="h-1.5 mt-2 bg-[#DADAD5]" />
            </div>
            <div className="p-4 rounded-xl bg-[#F5F5F0]">
              <div className="text-xs text-[#858580] mb-1">{t('artifactsFound')}</div>
              <div className="text-xl font-light text-[#1A1A18]">{details.technical_details.artifacts_found?.length || 0}</div>
              <div className="mt-2 space-y-1">
                {details.technical_details.artifacts_found?.slice(0, 3).map((a, i) => (
                  <span key={i} className="inline-block text-xs bg-white px-2 py-0.5 rounded me-1">{a}</span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F5F0]">
              <div className="text-xs text-[#858580] mb-1">{t('metadataAnalysis')}</div>
              <p className="text-xs text-[#575752] leading-relaxed">{details.technical_details.metadata_analysis || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {details.recommendation && (
        <div className="bg-[#2C5282]/5 rounded-xl border border-[#2C5282]/20 p-6" data-testid="detail-recommendation">
          <h3 className="text-sm font-medium text-[#2C5282] uppercase tracking-wider mb-3">{t('recommendation')}</h3>
          <p className="text-[#1A1A18] leading-relaxed">{details.recommendation}</p>
        </div>
      )}
    </div>
  );
}
