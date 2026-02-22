import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Image, Video, AudioLines, Shield, ShieldAlert, ShieldQuestion, FileText, X, CheckCircle, AlertTriangle, XCircle, Fingerprint, Activity, Eye, Waves } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';

const analysisStages = {
  en: [
    { key: 'upload', label: 'Uploading File', icon: Upload },
    { key: 'observe', label: 'Pass 1: Deep Observation', icon: Eye },
    { key: 'metadata', label: 'Metadata & Texture Analysis', icon: Fingerprint },
    { key: 'structure', label: 'Structural & Geometry Check', icon: Activity },
    { key: 'ai', label: 'Pass 2: AI Forensic Detection', icon: Waves },
    { key: 'verdict', label: 'Cross-Referencing & Final Verdict', icon: Shield },
  ],
  ar: [
    { key: 'upload', label: 'رفع الملف', icon: Upload },
    { key: 'observe', label: 'المرحلة 1: الملاحظة العميقة', icon: Eye },
    { key: 'metadata', label: 'تحليل البيانات الوصفية والنسيج', icon: Fingerprint },
    { key: 'structure', label: 'فحص الهيكل والهندسة', icon: Activity },
    { key: 'ai', label: 'المرحلة 2: الكشف الجنائي بالذكاء الاصطناعي', icon: Waves },
    { key: 'verdict', label: 'المراجعة المتقاطعة والحكم النهائي', icon: Shield },
  ],
};

export default function AnalyzePage() {
  const { t, lang, token, API } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      setResult(null);
      setCurrentStage(-1);
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
      } else {
        setPreview(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const getFileIcon = () => {
    if (!file) return <Upload className="w-10 h-10" />;
    if (file.type.startsWith('image/')) return <Image className="w-10 h-10" />;
    if (file.type.startsWith('video/')) return <Video className="w-10 h-10" />;
    if (file.type.startsWith('audio/')) return <AudioLines className="w-10 h-10" />;
    return <FileText className="w-10 h-10" />;
  };

  const analyzeFile = async () => {
    if (!file) return;
    setAnalyzing(true);
    setCurrentStage(0);

    // Simulate stage progression for dual-pass analysis
    const stageTimers = [1500, 4000, 7000, 10000, 14000];
    stageTimers.forEach((time, i) => {
      setTimeout(() => setCurrentStage(i + 1), time);
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', lang);

      const res = await axios.post(`${API}/analysis/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          authorization: `Bearer ${token}`,
        },
      });

      setCurrentStage(4);
      setTimeout(() => {
        setResult(res.data);
        toast.success(lang === 'ar' ? 'تم التحليل بنجاح' : 'Analysis complete');
        setAnalyzing(false);
      }, 500);
    } catch (err) {
      setCurrentStage(-1);
      toast.error(err.response?.data?.detail || (lang === 'ar' ? 'فشل التحليل' : 'Analysis failed'));
      setAnalyzing(false);
    }
  };

  const getVerdictConfig = (verdict) => {
    switch (verdict) {
      case 'authentic': return { bg: 'bg-[#2F855A]', light: 'bg-[#2F855A]/10', border: 'border-[#2F855A]/30', text: 'text-[#2F855A]', label: t('authentic'), icon: <Shield className="w-8 h-8" />, ring: 'ring-[#2F855A]/20' };
      case 'suspicious': return { bg: 'bg-[#C05621]', light: 'bg-[#C05621]/10', border: 'border-[#C05621]/30', text: 'text-[#C05621]', label: t('suspicious'), icon: <ShieldQuestion className="w-8 h-8" />, ring: 'ring-[#C05621]/20' };
      case 'likely_fake': return { bg: 'bg-[#C53030]', light: 'bg-[#C53030]/10', border: 'border-[#C53030]/30', text: 'text-[#C53030]', label: t('likely_fake'), icon: <ShieldAlert className="w-8 h-8" />, ring: 'ring-[#C53030]/20' };
      default: return { bg: 'bg-[#858580]', light: 'bg-[#858580]/10', border: 'border-[#858580]/30', text: 'text-[#858580]', label: verdict, icon: <Shield className="w-8 h-8" />, ring: 'ring-[#858580]/20' };
    }
  };

  const stages = analysisStages[lang] || analysisStages.en;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" data-testid="analyze-page">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-[#1A1A18]">{t('analyze')}</h1>
        <p className="text-sm text-[#858580] mt-1">{lang === 'ar' ? 'قم بتحميل ملف للتحقق من مصداقيته' : 'Upload a file to verify its authenticity'}</p>
      </div>

      {/* Upload Zone */}
      {!result && !analyzing && (
        <div
          {...getRootProps()}
          data-testid="upload-dropzone"
          className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive ? 'border-[#1A1A18] bg-[#EAEAE5]/50 scale-[1.02]'
              : file ? 'border-[#2F855A] bg-[#2F855A]/5'
              : 'border-[#DADAD5] hover:border-[#858580] hover:bg-[#EAEAE5]/30'
          }`}
        >
          <input {...getInputProps()} data-testid="file-input" />
          {file ? (
            <div className="space-y-4">
              {preview && (
                <div className="mx-auto w-48 h-48 rounded-xl overflow-hidden border border-[#DADAD5]">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              {!preview && (
                <div className="mx-auto w-20 h-20 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#575752]">
                  {getFileIcon()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-[#1A1A18]">{file.name}</p>
                <p className="text-xs text-[#858580] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} className="inline-flex items-center gap-1 text-xs text-[#858580] hover:text-[#C53030] transition-colors" data-testid="remove-file-btn">
                <X className="w-3 h-3" /> {lang === 'ar' ? 'إزالة' : 'Remove'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#858580]">
                <Upload className="w-10 h-10" />
              </div>
              <div>
                <p className="text-base font-medium text-[#1A1A18]">{t('uploadTitle')}</p>
                <p className="text-sm text-[#858580] mt-1">{t('uploadSubtitle')}</p>
              </div>
              <p className="text-xs text-[#858580]">{t('orBrowse')} &middot; {t('maxFileSize')}</p>
            </div>
          )}
        </div>
      )}

      {/* Start Analysis Button */}
      {file && !result && !analyzing && (
        <div className="flex justify-center">
          <Button onClick={analyzeFile} data-testid="start-analysis-btn" className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-10 py-6 text-base font-medium hover:bg-[#1A1A18]/90 transition-transform active:scale-95">
            <Shield className="w-5 h-5 me-2" />
            {lang === 'ar' ? 'بدء التحليل الجنائي' : 'Start Forensic Analysis'}
          </Button>
        </div>
      )}

      {/* Analysis Pipeline Visualization */}
      {analyzing && (
        <div className="bg-white rounded-2xl border border-[#DADAD5] p-8 space-y-6" data-testid="analysis-pipeline">
          <div className="text-center mb-2">
            <h2 className="text-lg font-medium text-[#1A1A18]">{lang === 'ar' ? 'جاري التحليل الجنائي...' : 'Forensic Analysis in Progress...'}</h2>
            <p className="text-xs text-[#858580] mt-1">{file?.name}</p>
          </div>

          {/* Stage Pipeline */}
          <div className="space-y-3">
            {stages.map((stage, i) => {
              const StageIcon = stage.icon;
              const isActive = i === currentStage;
              const isDone = i < currentStage;
              const isPending = i > currentStage;

              return (
                <div key={stage.key} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${isActive ? 'bg-[#1A1A18] text-[#F5F5F0] scale-[1.02]' : isDone ? 'bg-[#2F855A]/10 text-[#2F855A]' : 'bg-[#F5F5F0] text-[#DADAD5]'}`} data-testid={`stage-${stage.key}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : isDone ? 'bg-[#2F855A]/20' : 'bg-[#EAEAE5]'}`}>
                    {isDone ? <CheckCircle className="w-5 h-5" /> : isActive ? <div className="w-5 h-5 border-2 border-[#F5F5F0]/40 border-t-[#F5F5F0] rounded-full animate-spin" /> : <StageIcon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isActive ? 'text-[#F5F5F0]' : isDone ? 'text-[#2F855A]' : 'text-[#858580]'}`}>{stage.label}</div>
                    {isActive && <div className="text-xs opacity-70 mt-0.5">{lang === 'ar' ? 'قيد المعالجة...' : 'Processing...'}</div>}
                    {isDone && <div className="text-xs opacity-70 mt-0.5">{lang === 'ar' ? 'مكتمل' : 'Complete'}</div>}
                  </div>
                  <div className="text-xs font-mono opacity-60">
                    {isDone ? '100%' : isActive ? '...' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in" data-testid="analysis-result">
          {/* Verdict Card with Gauge */}
          {(() => {
            const vc = getVerdictConfig(result.verdict);
            const confidenceAngle = (result.confidence / 100) * 180;
            return (
              <div className={`${vc.light} rounded-2xl border ${vc.border} p-8 ring-4 ${vc.ring}`} data-testid="verdict-card">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left: Verdict */}
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl ${vc.bg} text-white flex items-center justify-center shadow-lg`}>
                      {vc.icon}
                    </div>
                    <div>
                      <div className="text-xs text-[#858580] uppercase tracking-widest">{t('verdict')}</div>
                      <div className={`text-3xl font-medium ${vc.text}`}>{vc.label}</div>
                    </div>
                  </div>

                  {/* Right: Confidence Gauge */}
                  <div className="flex flex-col items-center" data-testid="confidence-gauge">
                    <div className="relative w-32 h-16 overflow-hidden">
                      <svg viewBox="0 0 120 60" className="w-full h-full">
                        {/* Background arc */}
                        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#DADAD5" strokeWidth="8" strokeLinecap="round" />
                        {/* Value arc */}
                        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none"
                          stroke={result.verdict === 'authentic' ? '#2F855A' : result.verdict === 'suspicious' ? '#C05621' : '#C53030'}
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${(result.confidence / 100) * 157} 157`}
                          style={{ transition: 'stroke-dasharray 1s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-end justify-center pb-0">
                        <span className="text-2xl font-light text-[#1A1A18]">{result.confidence}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#858580] mt-1">{t('confidence')}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Analysis Stages Pipeline (from AI response) */}
          {result.details?.analysis_stages?.length > 0 && (
            <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="result-stages">
              <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">
                {lang === 'ar' ? 'مراحل التحليل' : 'Analysis Pipeline'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.details.analysis_stages.map((stage, i) => {
                  const statusConfig = {
                    pass: { icon: <CheckCircle className="w-4 h-4" />, bg: 'bg-[#2F855A]/10', text: 'text-[#2F855A]', border: 'border-[#2F855A]/20' },
                    warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-[#C05621]/10', text: 'text-[#C05621]', border: 'border-[#C05621]/20' },
                    fail: { icon: <XCircle className="w-4 h-4" />, bg: 'bg-[#C53030]/10', text: 'text-[#C53030]', border: 'border-[#C53030]/20' },
                  }[stage.status] || { icon: <Shield className="w-4 h-4" />, bg: 'bg-[#858580]/10', text: 'text-[#858580]', border: 'border-[#858580]/20' };

                  return (
                    <div key={i} className={`${statusConfig.bg} ${statusConfig.text} rounded-xl border ${statusConfig.border} p-4`} data-testid={`result-stage-${i}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {statusConfig.icon}
                        <span className="text-sm font-medium">{stage.stage}</span>
                      </div>
                      <p className="text-xs opacity-80 mt-1">{stage.finding}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="analysis-summary">
            <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-3">{t('summary')}</h3>
            <p className="text-[#1A1A18] leading-relaxed">{result.details?.summary}</p>
          </div>

          {/* Indicators */}
          {result.details?.indicators?.length > 0 && (
            <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="analysis-indicators">
              <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">{t('indicators')}</h3>
              <div className="space-y-3">
                {result.details.indicators.map((ind, i) => {
                  const sev = { high: 'text-[#C53030] bg-[#C53030]/10', medium: 'text-[#C05621] bg-[#C05621]/10', low: 'text-[#2F855A] bg-[#2F855A]/10' }[ind.severity] || 'text-[#858580] bg-[#858580]/10';
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#F5F5F0]" data-testid={`indicator-${i}`}>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${sev} shrink-0`}>{ind.severity?.toUpperCase()}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1A1A18]">{ind.name}</div>
                        <div className="text-xs text-[#858580] mt-0.5">{ind.description}</div>
                        {ind.category && <span className="inline-block text-[10px] font-mono mt-1 px-2 py-0.5 rounded bg-white text-[#858580]">{ind.category}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical Details */}
          {result.details?.technical_details && (
            <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="technical-details">
              <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-4">{t('technicalDetails')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F5F5F0]">
                  <div className="text-xs text-[#858580] mb-1">{t('consistencyScore')}</div>
                  <div className="text-xl font-light text-[#1A1A18]">{result.details.technical_details.consistency_score ?? 'N/A'}%</div>
                  <Progress value={result.details.technical_details.consistency_score || 0} className="h-1.5 mt-2 bg-[#DADAD5]" />
                </div>
                <div className="p-4 rounded-xl bg-[#F5F5F0]">
                  <div className="text-xs text-[#858580] mb-1">{lang === 'ar' ? 'معلومات التنسيق' : 'Format Info'}</div>
                  <p className="text-sm text-[#575752]">{result.details.technical_details.format_info || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F5F5F0]">
                  <div className="text-xs text-[#858580] mb-1">{lang === 'ar' ? 'تقييم الجودة' : 'Quality Assessment'}</div>
                  <p className="text-sm text-[#575752]">{result.details.technical_details.quality_assessment || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#F5F5F0]">
                  <div className="text-xs text-[#858580] mb-1">{t('metadataAnalysis')}</div>
                  <p className="text-sm text-[#575752]">{result.details.technical_details.metadata_analysis || 'N/A'}</p>
                </div>
              </div>
              {result.details.technical_details.artifacts_found?.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-[#F5F5F0]">
                  <div className="text-xs text-[#858580] mb-2">{t('artifactsFound')}</div>
                  <div className="flex flex-wrap gap-2">
                    {result.details.technical_details.artifacts_found.map((a, i) => (
                      <span key={i} className="text-xs bg-white px-3 py-1 rounded-full border border-[#DADAD5] text-[#575752]">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Forensic Notes */}
          {result.details?.forensic_notes && (
            <div className="bg-[#1A1A18] rounded-xl p-6 text-[#F5F5F0]" data-testid="forensic-notes">
              <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                {lang === 'ar' ? 'ملاحظات جنائية متقدمة' : 'Advanced Forensic Notes'}
              </h3>
              <p className="text-sm text-[#EAEAE5] leading-relaxed font-mono">{result.details.forensic_notes}</p>
            </div>
          )}

          {/* Recommendation */}
          {result.details?.recommendation && (
            <div className="bg-[#2C5282]/5 rounded-xl border border-[#2C5282]/20 p-6" data-testid="analysis-recommendation">
              <h3 className="text-sm font-medium text-[#2C5282] uppercase tracking-wider mb-3">{t('recommendation')}</h3>
              <p className="text-[#1A1A18] leading-relaxed">{result.details.recommendation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/analysis/${result.id}`)} className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-6 hover:bg-[#1A1A18]/90" data-testid="view-details-btn">
              {t('viewDetails')}
            </Button>
            <Button onClick={() => { setFile(null); setPreview(null); setResult(null); setCurrentStage(-1); }} variant="outline" className="rounded-full border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5]" data-testid="analyze-another-btn">
              {lang === 'ar' ? 'تحليل ملف آخر' : 'Analyze Another'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
