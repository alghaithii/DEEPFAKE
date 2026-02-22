import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldQuestion, ArrowLeft, Download, Trash2, FileText, CheckCircle, AlertTriangle, XCircle, Fingerprint, Eye, Share2, Copy, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import AnnotatedImage from '../components/AnnotatedImage';

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const { t, lang, authHeaders, API } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/analysis/${id}`, authHeaders());
        setAnalysis(res.data);
        if (res.data.share_id) setShareLink(`${window.location.origin}/shared/${res.data.share_id}`);
      } catch (err) {
        toast.error(lang === 'ar' ? 'لم يتم العثور على التحليل' : 'Analysis not found');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const downloadReport = async () => {
    try {
      const res = await axios.get(`${API}/analysis/${id}/report`, { ...authHeaders(), responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `truthlens-report-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(lang === 'ar' ? 'تم تحميل التقرير' : 'Report downloaded');
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشل تحميل التقرير' : 'Report download failed');
    }
  };

  const shareAnalysis = async () => {
    try {
      const res = await axios.post(`${API}/analysis/${id}/share`, {}, authHeaders());
      const link = `${window.location.origin}/shared/${res.data.share_id}`;
      setShareLink(link);
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(lang === 'ar' ? 'تم نسخ رابط المشاركة' : 'Share link copied');
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشل إنشاء رابط المشاركة' : 'Failed to create share link');
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(lang === 'ar' ? 'تم النسخ' : 'Copied');
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

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-2 border-[#DADAD5] border-t-[#1A1A18] rounded-full animate-spin" /></div>;
  if (!analysis) return null;

  const details = analysis.details || {};
  const getVC = (verdict) => {
    const map = {
      authentic: { bg: 'bg-[#2F855A]', light: 'bg-[#2F855A]/10', border: 'border-[#2F855A]/30', text: 'text-[#2F855A]', ring: 'ring-[#2F855A]/20', label: t('authentic'), icon: <Shield className="w-8 h-8" /> },
      suspicious: { bg: 'bg-[#C05621]', light: 'bg-[#C05621]/10', border: 'border-[#C05621]/30', text: 'text-[#C05621]', ring: 'ring-[#C05621]/20', label: t('suspicious'), icon: <ShieldQuestion className="w-8 h-8" /> },
      likely_fake: { bg: 'bg-[#C53030]', light: 'bg-[#C53030]/10', border: 'border-[#C53030]/30', text: 'text-[#C53030]', ring: 'ring-[#C53030]/20', label: t('likely_fake'), icon: <ShieldAlert className="w-8 h-8" /> },
    };
    return map[verdict] || { bg: 'bg-[#858580]', light: 'bg-[#858580]/10', border: 'border-[#858580]/30', text: 'text-[#858580]', ring: 'ring-[#858580]/20', label: verdict, icon: <Shield className="w-8 h-8" /> };
  };
  const vc = getVC(analysis.verdict);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" data-testid="analysis-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#858580] hover:text-[#1A1A18]" data-testid="back-btn">
          <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />{t('backToDashboard')}
        </button>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={shareAnalysis} variant="outline" className="rounded-full border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5] gap-2" data-testid="share-btn">
            <Share2 className="w-4 h-4" />{lang === 'ar' ? 'مشاركة' : 'Share'}
          </Button>
          <Button onClick={downloadReport} variant="outline" className="rounded-full border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5] gap-2" data-testid="download-report-btn">
            <Download className="w-4 h-4" />{t('downloadReport')}
          </Button>
          <Button onClick={deleteAndGoBack} variant="outline" className="rounded-full border-[#C53030]/20 text-[#C53030] hover:bg-[#C53030]/10 gap-2" data-testid="delete-analysis-btn">
            <Trash2 className="w-4 h-4" />{t('deleteAnalysis')}
          </Button>
        </div>
      </div>

      {/* Share Link */}
      {shareLink && (
        <div className="bg-[#2F855A]/5 rounded-xl border border-[#2F855A]/20 p-4 flex items-center justify-between gap-3" data-testid="share-link-banner">
          <div className="flex items-center gap-2 text-sm text-[#2F855A] min-w-0">
            <Share2 className="w-4 h-4 shrink-0" />
            <span className="truncate font-mono text-xs">{shareLink}</span>
          </div>
          <Button onClick={copyLink} variant="ghost" className="shrink-0 text-[#2F855A] hover:bg-[#2F855A]/10 gap-1" data-testid="copy-link-btn">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? (lang === 'ar' ? 'تم' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}
          </Button>
        </div>
      )}

      {/* File Info */}
      <div className="bg-white rounded-xl border border-[#DADAD5] p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#575752]"><FileText className="w-6 h-6" /></div>
          <div>
            <h2 className="text-lg font-medium text-[#1A1A18]">{analysis.file_name}</h2>
            <div className="flex items-center gap-3 text-xs text-[#858580] mt-1 flex-wrap">
              <span>{analysis.file_type}</span><span>&middot;</span>
              <span>{analysis.file_size ? `${(analysis.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span><span>&middot;</span>
              <span>{new Date(analysis.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className={`${vc.light} rounded-2xl border ${vc.border} p-8 ring-4 ${vc.ring}`} data-testid="detail-verdict-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl ${vc.bg} text-white flex items-center justify-center shadow-lg`}>{vc.icon}</div>
            <div><div className="text-xs text-[#858580] uppercase tracking-widest">{t('verdict')}</div><div className={`text-3xl font-medium ${vc.text}`}>{vc.label}</div></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-16 overflow-hidden">
              <svg viewBox="0 0 120 60" className="w-full h-full">
                <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#DADAD5" strokeWidth="8" strokeLinecap="round" />
                <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={analysis.verdict === 'authentic' ? '#2F855A' : analysis.verdict === 'suspicious' ? '#C05621' : '#C53030'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(analysis.confidence / 100) * 157} 157`} />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-0"><span className="text-2xl font-light text-[#1A1A18]">{analysis.confidence}%</span></div>
            </div>
            <span className="text-xs text-[#858580] mt-1">{t('confidence')}</span>
          </div>
        </div>
      </div>

      {/* Annotated Image/Video/Audio */}
      <AnnotatedImage preview={analysis.preview} annotations={details.annotations} fileType={analysis.file_type} mimeGuess={analysis.file_name?.split('.').pop()} previewType={analysis.preview_type} mediaDuration={analysis.media_duration} />

      {/* Analysis Stages */}
      {details.analysis_stages?.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="detail-stages">
          <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">{lang === 'ar' ? 'مراحل التحليل الجنائي' : 'Forensic Analysis Pipeline'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {details.analysis_stages.map((stage, i) => {
              const sc = { pass: 'bg-[#2F855A]/10 text-[#2F855A] border-[#2F855A]/20', warning: 'bg-[#C05621]/10 text-[#C05621] border-[#C05621]/20', fail: 'bg-[#C53030]/10 text-[#C53030] border-[#C53030]/20' }[stage.status] || 'bg-[#858580]/10 text-[#858580] border-[#858580]/20';
              const icon = { pass: <CheckCircle className="w-4 h-4" />, warning: <AlertTriangle className="w-4 h-4" />, fail: <XCircle className="w-4 h-4" /> }[stage.status] || <Shield className="w-4 h-4" />;
              return <div key={i} className={`rounded-xl border p-4 ${sc}`}><div className="flex items-center gap-2 mb-1">{icon}<span className="text-sm font-medium">{stage.stage}</span></div><p className="text-xs opacity-80 mt-1">{stage.finding}</p></div>;
            })}
          </div>
        </div>
      )}

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
              const cls = { high: 'text-[#C53030] bg-[#C53030]/10 border-[#C53030]/20', medium: 'text-[#C05621] bg-[#C05621]/10 border-[#C05621]/20', low: 'text-[#2F855A] bg-[#2F855A]/10 border-[#2F855A]/20' }[ind.severity] || 'text-[#858580] bg-[#858580]/10 border-[#858580]/20';
              return <div key={i} className={`p-4 rounded-xl border ${cls}`}><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{ind.name}</span><div className="flex items-center gap-2">{ind.category && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/50">{ind.category}</span>}<span className="text-xs font-medium uppercase">{ind.severity}</span></div></div><p className="text-xs opacity-80">{ind.description}</p></div>;
            })}
          </div>
        </div>
      )}

      {/* Technical Details */}
      {details.technical_details && (
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="detail-technical">
          <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">{t('technicalDetails')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F5F0]"><div className="text-xs text-[#858580] mb-1">{t('consistencyScore')}</div><div className="text-xl font-light text-[#1A1A18]">{details.technical_details.consistency_score ?? 'N/A'}%</div><Progress value={details.technical_details.consistency_score || 0} className="h-1.5 mt-2 bg-[#DADAD5]" /></div>
            <div className="p-4 rounded-xl bg-[#F5F5F0]"><div className="text-xs text-[#858580] mb-1">{lang === 'ar' ? 'معلومات التنسيق' : 'Format Info'}</div><p className="text-sm text-[#575752]">{details.technical_details.format_info || 'N/A'}</p></div>
            <div className="p-4 rounded-xl bg-[#F5F5F0]"><div className="text-xs text-[#858580] mb-1">{lang === 'ar' ? 'تقييم الجودة' : 'Quality Assessment'}</div><p className="text-sm text-[#575752]">{details.technical_details.quality_assessment || 'N/A'}</p></div>
            <div className="p-4 rounded-xl bg-[#F5F5F0]"><div className="text-xs text-[#858580] mb-1">{t('metadataAnalysis')}</div><p className="text-sm text-[#575752]">{details.technical_details.metadata_analysis || 'N/A'}</p></div>
          </div>
          {details.technical_details.artifacts_found?.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-[#F5F5F0]"><div className="text-xs text-[#858580] mb-2">{t('artifactsFound')}</div><div className="flex flex-wrap gap-2">{details.technical_details.artifacts_found.map((a, i) => <span key={i} className="text-xs bg-white px-3 py-1 rounded-full border border-[#DADAD5] text-[#575752]">{a}</span>)}</div></div>
          )}
        </div>
      )}

      {/* Forensic Notes */}
      {details.forensic_notes && (
        <div className="bg-[#1A1A18] rounded-xl p-6 text-[#F5F5F0]" data-testid="detail-forensic-notes">
          <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-3 flex items-center gap-2"><Fingerprint className="w-4 h-4" />{lang === 'ar' ? 'ملاحظات جنائية متقدمة' : 'Advanced Forensic Notes'}</h3>
          <p className="text-sm text-[#EAEAE5] leading-relaxed font-mono">{details.forensic_notes}</p>
        </div>
      )}

      {/* Raw Observations */}
      {details.technical_details?.raw_observations?.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="detail-raw-observations">
          <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4 flex items-center gap-2"><Eye className="w-4 h-4" />{lang === 'ar' ? 'الملاحظات الأولية (المرحلة 1)' : 'Initial Observations (Pass 1)'}</h3>
          <div className="space-y-2">{details.technical_details.raw_observations.map((obs, i) => <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-[#F5F5F0]"><span className="text-xs font-mono text-[#858580] shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span><p className="text-sm text-[#575752]">{obs}</p></div>)}</div>
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
