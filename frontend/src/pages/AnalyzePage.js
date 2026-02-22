import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Image, Video, AudioLines, Shield, ShieldAlert, ShieldQuestion, FileText, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';

export default function AnalyzePage() {
  const { t, lang, token, API } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      setResult(null);
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
    setProgress(0);

    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

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

      clearInterval(progressInterval);
      setProgress(100);
      setResult(res.data);
      toast.success(lang === 'ar' ? 'تم التحليل بنجاح' : 'Analysis complete');
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error(err.response?.data?.detail || (lang === 'ar' ? 'فشل التحليل' : 'Analysis failed'));
    } finally {
      setAnalyzing(false);
    }
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'authentic': return { bg: 'bg-[#2F855A]', light: 'bg-[#2F855A]/10', text: 'text-[#2F855A]', label: t('authentic'), icon: <Shield className="w-6 h-6" /> };
      case 'suspicious': return { bg: 'bg-[#C05621]', light: 'bg-[#C05621]/10', text: 'text-[#C05621]', label: t('suspicious'), icon: <ShieldQuestion className="w-6 h-6" /> };
      case 'likely_fake': return { bg: 'bg-[#C53030]', light: 'bg-[#C53030]/10', text: 'text-[#C53030]', label: t('likely_fake'), icon: <ShieldAlert className="w-6 h-6" /> };
      default: return { bg: 'bg-[#858580]', light: 'bg-[#858580]/10', text: 'text-[#858580]', label: verdict, icon: <Shield className="w-6 h-6" /> };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" data-testid="analyze-page">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-[#1A1A18]">{t('analyze')}</h1>
        <p className="text-sm text-[#858580] mt-1">{lang === 'ar' ? 'قم بتحميل ملف لتحليله' : 'Upload a file to analyze it'}</p>
      </div>

      {/* Upload Zone */}
      {!result && (
        <div
          {...getRootProps()}
          data-testid="upload-dropzone"
          className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-[#1A1A18] bg-[#EAEAE5]/50 scale-[1.02]'
              : file
                ? 'border-[#2F855A] bg-[#2F855A]/5'
                : 'border-[#DADAD5] hover:border-[#858580] hover:bg-[#EAEAE5]/30'
          }`}
        >
          <input {...getInputProps()} data-testid="file-input" />

          {file ? (
            <div className="space-y-4">
              {preview && (
                <div className="mx-auto w-48 h-48 rounded-xl overflow-hidden border border-[#DADAD5] relative">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#C05621] to-transparent animate-scan opacity-80" />
                    </div>
                  )}
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
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="inline-flex items-center gap-1 text-xs text-[#858580] hover:text-[#C53030] transition-colors"
                data-testid="remove-file-btn"
              >
                <X className="w-3 h-3" />
                {lang === 'ar' ? 'إزالة' : 'Remove'}
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

      {/* Analyze Button */}
      {file && !result && (
        <div className="flex justify-center">
          <Button
            onClick={analyzeFile}
            disabled={analyzing}
            data-testid="start-analysis-btn"
            className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-10 py-6 text-base font-medium hover:bg-[#1A1A18]/90 transition-transform active:scale-95"
          >
            {analyzing ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-[#F5F5F0]/30 border-t-[#F5F5F0] rounded-full animate-spin" />
                {t('analyzing')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {lang === 'ar' ? 'بدء التحليل' : 'Start Analysis'}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      {analyzing && (
        <div className="space-y-2" data-testid="analysis-progress">
          <Progress value={progress} className="h-2 bg-[#EAEAE5]" />
          <p className="text-xs text-center text-[#858580]">
            {lang === 'ar' ? `جاري التحليل... ${Math.round(progress)}%` : `Analyzing... ${Math.round(progress)}%`}
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in" data-testid="analysis-result">
          {/* Verdict Card */}
          {(() => {
            const vs = getVerdictStyle(result.verdict);
            return (
              <div className={`${vs.light} rounded-2xl border border-[#DADAD5] p-8`} data-testid="verdict-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${vs.bg} text-white flex items-center justify-center`}>
                      {vs.icon}
                    </div>
                    <div>
                      <div className="text-sm text-[#858580] uppercase tracking-wider">{t('verdict')}</div>
                      <div className={`text-2xl font-medium ${vs.text}`}>{vs.label}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm text-[#858580]">{t('confidence')}</div>
                    <div className="text-3xl font-light text-[#1A1A18]">{result.confidence}%</div>
                  </div>
                </div>
              </div>
            );
          })()}

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
                  const severityColor = { high: 'text-[#C53030] bg-[#C53030]/10', medium: 'text-[#C05621] bg-[#C05621]/10', low: 'text-[#2F855A] bg-[#2F855A]/10' }[ind.severity] || 'text-[#858580] bg-[#858580]/10';
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#F5F5F0]" data-testid={`indicator-${i}`}>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${severityColor} shrink-0`}>
                        {ind.severity?.toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-[#1A1A18]">{ind.name}</div>
                        <div className="text-xs text-[#858580] mt-0.5">{ind.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {result.details?.recommendation && (
            <div className="bg-white rounded-xl border border-[#DADAD5] p-6" data-testid="analysis-recommendation">
              <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider mb-3">{t('recommendation')}</h3>
              <p className="text-[#1A1A18] leading-relaxed">{result.details.recommendation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate(`/analysis/${result.id}`)}
              className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-6 hover:bg-[#1A1A18]/90"
              data-testid="view-details-btn"
            >
              {t('viewDetails')}
            </Button>
            <Button
              onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              variant="outline"
              className="rounded-full border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5]"
              data-testid="analyze-another-btn"
            >
              {lang === 'ar' ? 'تحليل ملف آخر' : 'Analyze Another'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
