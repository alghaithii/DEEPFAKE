import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Globe } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function SettingsPage() {
  const { t, lang, changeLang, user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-[#1A1A18]">{t('settings')}</h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-[#DADAD5] p-6 space-y-4" data-testid="profile-card">
        <h2 className="text-sm font-medium text-[#858580] uppercase tracking-wider">
          {lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1A1A18] text-[#F5F5F0] flex items-center justify-center text-xl font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-base font-medium text-[#1A1A18]">{user?.name}</div>
            <div className="text-sm text-[#858580]">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-xl border border-[#DADAD5] p-6 space-y-4" data-testid="language-card">
        <h2 className="text-sm font-medium text-[#858580] uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('language')}
        </h2>
        <div className="flex gap-3">
          <Button
            onClick={() => changeLang('en')}
            variant="outline"
            data-testid="set-lang-en-btn"
            className={`rounded-full px-6 ${
              lang === 'en'
                ? 'bg-[#1A1A18] text-[#F5F5F0] border-[#1A1A18] hover:bg-[#1A1A18]/90 hover:text-[#F5F5F0]'
                : 'border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5]'
            }`}
          >
            English
          </Button>
          <Button
            onClick={() => changeLang('ar')}
            variant="outline"
            data-testid="set-lang-ar-btn"
            className={`rounded-full px-6 ${
              lang === 'ar'
                ? 'bg-[#1A1A18] text-[#F5F5F0] border-[#1A1A18] hover:bg-[#1A1A18]/90 hover:text-[#F5F5F0]'
                : 'border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5]'
            }`}
          >
            العربية
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-[#DADAD5] p-6 space-y-3" data-testid="about-card">
        <h2 className="text-sm font-medium text-[#858580] uppercase tracking-wider">
          {lang === 'ar' ? 'حول التطبيق' : 'About'}
        </h2>
        <p className="text-sm text-[#575752] leading-relaxed">
          {lang === 'ar'
            ? 'TruthLens هو منصة مدعومة بالذكاء الاصطناعي لكشف التزييف العميق في الصور والفيديوهات والملفات الصوتية. يستخدم تقنية Gemini AI المتقدمة لتحليل الوسائط والكشف عن علامات التلاعب.'
            : 'TruthLens is an AI-powered platform for detecting deepfakes in images, videos, and audio files. It uses advanced Gemini AI technology to analyze media and detect signs of manipulation.'}
        </p>
        <div className="text-xs text-[#858580]">v1.0.0</div>
      </div>
    </div>
  );
}
