import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Video, AudioLines, Clock } from 'lucide-react';

const regionPositions = {
  'top-left': { top: '10%', left: '15%' },
  'top-center': { top: '10%', left: '50%' },
  'top-right': { top: '10%', left: '85%' },
  'center-left': { top: '50%', left: '15%' },
  'center': { top: '50%', left: '50%' },
  'center-right': { top: '50%', left: '85%' },
  'bottom-left': { top: '85%', left: '15%' },
  'bottom-center': { top: '85%', left: '50%' },
  'bottom-right': { top: '85%', left: '85%' },
};

const severityColors = {
  high: { bg: '#C53030', ring: 'rgba(197,48,48,0.3)', pulse: 'rgba(197,48,48,0.15)' },
  medium: { bg: '#C05621', ring: 'rgba(192,86,33,0.3)', pulse: 'rgba(192,86,33,0.15)' },
  low: { bg: '#2F855A', ring: 'rgba(47,133,90,0.3)', pulse: 'rgba(47,133,90,0.15)' },
};

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ImageAnnotations({ preview, annotations, mimeGuess }) {
  const [activeMarker, setActiveMarker] = useState(null);
  const imgSrc = `data:image/${mimeGuess || 'jpeg'};base64,${preview}`;

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-[#DADAD5] group">
        <img src={imgSrc} alt="Analyzed" className="w-full h-auto max-h-[500px] object-contain bg-[#1A1A18]/5" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-full h-full" style={{
            background: 'linear-gradient(rgba(26,26,24,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,24,0.05) 1px, transparent 1px)',
            backgroundSize: '33.33% 33.33%'
          }} />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity">
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[#C05621] to-transparent animate-scan" />
        </div>
        {annotations?.map((ann, i) => {
          const pos = regionPositions[ann.region] || regionPositions.center;
          const colors = severityColors[ann.severity] || severityColors.low;
          const isActive = activeMarker === i;
          return (
            <div key={i}>
              <button onClick={() => setActiveMarker(isActive ? null : i)}
                className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
                style={{ top: pos.top, left: pos.left }} data-testid={`annotation-marker-${i}`}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: colors.pulse, width: 36, height: 36, marginLeft: -6, marginTop: -6 }} />
                  <div className="relative w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg"
                    style={{ backgroundColor: colors.bg, boxShadow: `0 0 0 3px ${colors.ring}` }}>{i + 1}</div>
                </div>
              </button>
              {isActive && (
                <div className="absolute z-20 transform -translate-x-1/2 bg-[#1A1A18] text-white rounded-xl p-3 shadow-xl max-w-[250px] animate-fade-in"
                  style={{ top: `calc(${pos.top} + 20px)`, left: pos.left }} data-testid={`annotation-tooltip-${i}`}>
                  <div className="text-xs font-medium mb-1 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase" style={{ backgroundColor: colors.bg }}>{ann.severity}</span>
                    {ann.label}
                  </div>
                  <p className="text-[11px] text-[#EAEAE5] leading-relaxed">{ann.description}</p>
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1A18] rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <AnnotationLegend annotations={annotations} activeMarker={activeMarker} setActiveMarker={setActiveMarker} />
    </div>
  );
}

function VideoAnnotations({ preview, annotations, mediaDuration }) {
  const { lang } = useAuth();
  const [activeMarker, setActiveMarker] = useState(null);
  const thumbSrc = preview ? `data:image/jpeg;base64,${preview}` : null;

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-[#DADAD5] group bg-[#1A1A18]">
        {thumbSrc ? (
          <img src={thumbSrc} alt="Video thumbnail" className="w-full h-auto max-h-[400px] object-contain" />
        ) : (
          <div className="w-full h-64 flex items-center justify-center">
            <Video className="w-16 h-16 text-[#575752]" />
          </div>
        )}
        {/* Video overlay badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#1A1A18]/80 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm">
          <Video className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'إطار فيديو' : 'Video Frame'}
          {mediaDuration && <span className="flex items-center gap-1 ms-1 opacity-70"><Clock className="w-3 h-3" />{formatDuration(mediaDuration)}</span>}
        </div>
        {/* Annotation markers on video thumbnail */}
        {annotations?.map((ann, i) => {
          const pos = regionPositions[ann.region] || regionPositions.center;
          const colors = severityColors[ann.severity] || severityColors.low;
          const isActive = activeMarker === i;
          return (
            <div key={i}>
              <button onClick={() => setActiveMarker(isActive ? null : i)}
                className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
                style={{ top: pos.top, left: pos.left }} data-testid={`annotation-marker-${i}`}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: colors.pulse, width: 36, height: 36, marginLeft: -6, marginTop: -6 }} />
                  <div className="relative w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg"
                    style={{ backgroundColor: colors.bg, boxShadow: `0 0 0 3px ${colors.ring}` }}>{i + 1}</div>
                </div>
              </button>
              {isActive && (
                <div className="absolute z-20 transform -translate-x-1/2 bg-[#1A1A18] text-white rounded-xl p-3 shadow-xl max-w-[250px] animate-fade-in"
                  style={{ top: `calc(${pos.top} + 20px)`, left: pos.left }} data-testid={`annotation-tooltip-${i}`}>
                  <div className="text-xs font-medium mb-1 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase" style={{ backgroundColor: colors.bg }}>{ann.severity}</span>
                    {ann.label}
                  </div>
                  <p className="text-[11px] text-[#EAEAE5] leading-relaxed">{ann.description}</p>
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1A18] rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <AnnotationLegend annotations={annotations} activeMarker={activeMarker} setActiveMarker={setActiveMarker} />
    </div>
  );
}

function AudioAnnotations({ preview, annotations, mediaDuration }) {
  const { lang } = useAuth();
  const [activeMarker, setActiveMarker] = useState(null);
  const waveformSrc = preview ? `data:image/png;base64,${preview}` : null;

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-[#DADAD5] bg-[#F5F5F0]">
        {waveformSrc ? (
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#575752]">
                <AudioLines className="w-5 h-5" />
                <span className="text-sm font-medium">{lang === 'ar' ? 'الموجة الصوتية' : 'Audio Waveform'}</span>
              </div>
              {mediaDuration && (
                <span className="flex items-center gap-1 text-xs text-[#858580]">
                  <Clock className="w-3 h-3" />{formatDuration(mediaDuration)}
                </span>
              )}
            </div>
            <img src={waveformSrc} alt="Audio waveform" className="w-full h-auto rounded-lg" data-testid="audio-waveform-img" />
            {/* Frequency severity indicator bar */}
            <div className="flex items-center gap-3 text-[10px] text-[#858580]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#1A1A18]" />{lang === 'ar' ? 'طبيعي' : 'Normal'}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#C05621]" />{lang === 'ar' ? 'مشبوه' : 'Suspicious'}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#C53030]" />{lang === 'ar' ? 'شذوذ مرتفع' : 'High Anomaly'}</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-40 flex items-center justify-center">
            <AudioLines className="w-16 h-16 text-[#DADAD5]" />
          </div>
        )}
      </div>
      <AnnotationLegend annotations={annotations} activeMarker={activeMarker} setActiveMarker={setActiveMarker} />
    </div>
  );
}

function AnnotationLegend({ annotations, activeMarker, setActiveMarker }) {
  const { lang } = useAuth();
  if (!annotations?.length) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs text-[#858580] font-medium">{lang === 'ar' ? 'نقاط التحليل:' : 'Analysis Points:'}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {annotations.map((ann, i) => {
          const colors = severityColors[ann.severity] || severityColors.low;
          return (
            <button key={i} onClick={() => setActiveMarker(activeMarker === i ? null : i)}
              className={`flex items-start gap-2 p-2.5 rounded-lg text-start transition-all ${activeMarker === i ? 'bg-[#1A1A18] text-white' : 'bg-[#F5F5F0] hover:bg-[#EAEAE5]'}`}
              data-testid={`annotation-legend-${i}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: colors.bg }}>{i + 1}</span>
              <div>
                <div className={`text-xs font-medium ${activeMarker === i ? 'text-white' : 'text-[#1A1A18]'}`}>{ann.label}</div>
                <div className={`text-[10px] mt-0.5 ${activeMarker === i ? 'text-[#EAEAE5]' : 'text-[#858580]'}`}>{ann.description?.slice(0, 80)}{ann.description?.length > 80 ? '...' : ''}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AnnotatedImage({ preview, annotations, fileType, mimeGuess, previewType, mediaDuration }) {
  const { lang } = useAuth();

  if (!preview) return null;

  const title = fileType === 'image'
    ? (lang === 'ar' ? 'التحليل البصري مع التعليقات التوضيحية' : 'Visual Analysis with Annotations')
    : fileType === 'video'
    ? (lang === 'ar' ? 'تحليل إطار الفيديو مع التعليقات' : 'Video Frame Analysis with Annotations')
    : (lang === 'ar' ? 'تحليل الصوت مع التعليقات' : 'Audio Analysis with Annotations');

  return (
    <div className="bg-white rounded-xl border border-[#DADAD5] p-6 space-y-4" data-testid="annotated-media">
      <h3 className="text-sm font-medium text-[#858580] uppercase tracking-wider flex items-center gap-2">
        {fileType === 'video' ? <Video className="w-4 h-4" /> : fileType === 'audio' ? <AudioLines className="w-4 h-4" /> : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        )}
        {title}
      </h3>

      {fileType === 'image' && <ImageAnnotations preview={preview} annotations={annotations} mimeGuess={mimeGuess} />}
      {fileType === 'video' && <VideoAnnotations preview={preview} annotations={annotations} mediaDuration={mediaDuration} />}
      {fileType === 'audio' && <AudioAnnotations preview={preview} annotations={annotations} mediaDuration={mediaDuration} />}
    </div>
  );
}
