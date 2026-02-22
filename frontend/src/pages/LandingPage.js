import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Shield, Upload, FileText, Clock, ArrowRight, Scan, AudioLines, Video, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const { t, lang } = useAuth();

  const features = [
    { icon: <Scan className="w-6 h-6" />, title: t('featureAI'), desc: t('featureAIDesc') },
    { icon: <Upload className="w-6 h-6" />, title: t('featureMulti'), desc: t('featureMultiDesc') },
    { icon: <FileText className="w-6 h-6" />, title: t('featureReport'), desc: t('featureReportDesc') },
    { icon: <Clock className="w-6 h-6" />, title: t('featureHistory'), desc: t('featureHistoryDesc') },
  ];

  const steps = [
    { num: "01", text: t('step1'), icon: <Upload className="w-8 h-8" /> },
    { num: "02", text: t('step2'), icon: <Scan className="w-8 h-8" /> },
    { num: "03", text: t('step3'), icon: <FileText className="w-8 h-8" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-[#DADAD5]" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#1A1A18]" />
            <span className="text-lg font-bold text-[#1A1A18] tracking-tight">{t('appName')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" data-testid="nav-login-btn">
              <Button variant="ghost" className="text-[#575752] hover:text-[#1A1A18] hover:bg-transparent font-medium">
                {t('login')}
              </Button>
            </Link>
            <Link to="/auth?mode=register" data-testid="nav-register-btn">
              <Button className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-6 hover:bg-[#1A1A18]/90 transition-transform active:scale-95">
                {t('register')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 lg:px-24" data-testid="hero-section">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#DADAD5] text-sm text-[#575752]">
              <span className="w-2 h-2 rounded-full bg-[#2F855A] animate-pulse" />
              {t('tagline')}
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-[#1A1A18] leading-[1.1]">
              {t('heroTitle')}
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#575752] max-w-xl">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth?mode=register" data-testid="hero-get-started-btn">
                <Button className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-8 py-6 text-base font-medium hover:bg-[#1A1A18]/90 transition-transform active:scale-95">
                  {t('getStarted')}
                  <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180 me-2' : 'ms-2'}`} />
                </Button>
              </Link>
              <a href="#how-it-works" data-testid="hero-learn-more-btn">
                <Button variant="outline" className="rounded-full border-[#1A1A18]/20 bg-transparent text-[#1A1A18] px-8 py-6 text-base hover:bg-[#1A1A18]/5 transition-colors">
                  {t('learnMore')}
                </Button>
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#DADAD5] shadow-lg">
              <img
                src="https://images.pexels.com/photos/8090303/pexels-photo-8090303.jpeg"
                alt="Digital face scanning technology"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F5F5F0]/80" />
              {/* Scan line effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#C05621] to-transparent animate-scan opacity-60" />
              </div>
            </div>
            {/* Floating stats */}
            <div className="absolute -bottom-6 start-6 bg-white rounded-xl border border-[#DADAD5] p-4 shadow-md flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-10 h-10 rounded-full bg-[#2F855A]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#2F855A]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#1A1A18]">AI Forensics</div>
                <div className="text-xs text-[#858580]">Multi-modal detection</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Types */}
      <section className="py-16 px-6 md:px-12 bg-white border-y border-[#DADAD5]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-12 md:gap-24">
          {[
            { icon: <Scan className="w-8 h-8" />, label: lang === 'ar' ? 'الصور' : 'Images', formats: 'JPG, PNG, WebP' },
            { icon: <Video className="w-8 h-8" />, label: lang === 'ar' ? 'الفيديو' : 'Videos', formats: 'MP4, MOV, AVI' },
            { icon: <AudioLines className="w-8 h-8" />, label: lang === 'ar' ? 'الصوت' : 'Audio', formats: 'MP3, WAV, AAC' },
          ].map((type, i) => (
            <div key={i} className="flex items-center gap-4 text-[#575752]">
              <div className="w-14 h-14 rounded-xl bg-[#F5F5F0] flex items-center justify-center">
                {type.icon}
              </div>
              <div>
                <div className="font-medium text-[#1A1A18]">{type.label}</div>
                <div className="text-sm text-[#858580]">{type.formats}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 md:px-12 lg:px-24" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-wider uppercase text-[#858580]">{t('features')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#DADAD5] p-8 hover:shadow-md transition-shadow duration-300 group" data-testid={`feature-card-${i}`}>
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] flex items-center justify-center mb-6 group-hover:bg-[#1A1A18] group-hover:text-[#F5F5F0] transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="text-lg font-medium text-[#1A1A18] mb-3">{f.title}</h3>
                <p className="text-sm text-[#858580] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 lg:px-24 bg-white border-y border-[#DADAD5]" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium tracking-wider uppercase text-[#858580]">{t('howItWorks')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center p-8" data-testid={`step-${i}`}>
                <div className="text-6xl font-light text-[#EAEAE5] mb-6">{step.num}</div>
                <div className="w-16 h-16 rounded-2xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-6 text-[#1A1A18]">
                  {step.icon}
                </div>
                <p className="text-base text-[#575752] font-medium">{step.text}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 end-0 translate-x-1/2">
                    <ArrowRight className={`w-5 h-5 text-[#DADAD5] ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-[#1A1A18]">
            {lang === 'ar' ? 'ابدأ في حماية نفسك اليوم' : 'Start Protecting Yourself Today'}
          </h2>
          <p className="text-base md:text-lg text-[#575752]">
            {lang === 'ar' ? 'انضم إلى آلاف المستخدمين الذين يثقون في TruthLens للتحقق من صحة المحتوى الرقمي' : 'Join thousands of users who trust TruthLens to verify digital content authenticity'}
          </p>
          <Link to="/auth?mode=register" data-testid="cta-get-started-btn">
            <Button className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-10 py-6 text-base font-medium hover:bg-[#1A1A18]/90 transition-transform active:scale-95 mt-4">
              {t('getStarted')}
              <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180 me-2' : 'ms-2'}`} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DADAD5] py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-[#858580]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>TruthLens</span>
          </div>
          <span>{new Date().getFullYear()} &copy; {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</span>
        </div>
      </footer>
    </div>
  );
}
