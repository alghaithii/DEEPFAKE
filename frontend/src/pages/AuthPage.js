import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { login, register, t, lang } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      toast.success(isLogin ? (lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully') : (lang === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/8090295/pexels-photo-8090295.jpeg"
          alt="Deepfake detection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1A18]/40" />
        <div className="absolute bottom-12 start-12 end-12 text-white">
          <h2 className="text-3xl font-light tracking-tight mb-3">
            {lang === 'ar' ? 'حماية الحقيقة في العصر الرقمي' : 'Protecting Truth in the Digital Age'}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            {lang === 'ar' ? 'كشف متقدم للتزييف العميق مدعوم بالذكاء الاصطناعي' : 'Advanced AI-powered deepfake detection for everyone'}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12" data-testid="auth-form-container">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-[#858580] hover:text-[#1A1A18] transition-colors" data-testid="back-to-home-btn">
              <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1A1A18]" />
              <span className="font-bold text-[#1A1A18]">{t('appName')}</span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-light tracking-tight text-[#1A1A18]">
              {isLogin ? t('login') : t('register')}
            </h1>
            <p className="mt-2 text-sm text-[#858580]">
              {isLogin ? (lang === 'ar' ? 'مرحباً بعودتك' : 'Welcome back') : (lang === 'ar' ? 'أنشئ حساباً جديداً' : 'Create a new account')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-[#575752]">{t('name')}</Label>
                <Input
                  id="name"
                  data-testid="auth-name-input"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="bg-white border-[#DADAD5] focus:border-[#1A1A18] focus:ring-[#1A1A18] rounded-xl h-12"
                  placeholder={lang === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#575752]">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                data-testid="auth-email-input"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="bg-white border-[#DADAD5] focus:border-[#1A1A18] focus:ring-[#1A1A18] rounded-xl h-12"
                placeholder={lang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#575752]">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="auth-password-input"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="bg-white border-[#DADAD5] focus:border-[#1A1A18] focus:ring-[#1A1A18] rounded-xl h-12 pe-12"
                  placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-[#858580] hover:text-[#1A1A18]"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-btn"
              className="w-full rounded-full bg-[#1A1A18] text-[#F5F5F0] h-12 font-medium hover:bg-[#1A1A18]/90 transition-transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#F5F5F0]/30 border-t-[#F5F5F0] rounded-full animate-spin" />
                  {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </span>
              ) : (
                isLogin ? t('login') : t('register')
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#858580] hover:text-[#1A1A18] transition-colors"
              data-testid="auth-toggle-btn"
            >
              {isLogin ? t('noAccount') : t('hasAccount')}{' '}
              <span className="font-medium text-[#1A1A18] underline underline-offset-4">
                {isLogin ? t('register') : t('login')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
