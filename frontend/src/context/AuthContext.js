import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

const translations = {
  en: {
    appName: "TruthLens",
    tagline: "AI-Powered Media Authenticity Detection",
    heroTitle: "Detect Deepfakes Before They Deceive",
    heroSubtitle: "Upload any image, video, or audio file and let our AI forensic engine analyze it for signs of manipulation or AI generation.",
    getStarted: "Get Started",
    learnMore: "Learn More",
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    name: "Full Name",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    dashboard: "Dashboard",
    analyze: "Analyze",
    history: "History",
    compare: "Compare",
    settings: "Settings",
    logout: "Logout",
    uploadTitle: "Drop your file here",
    uploadSubtitle: "Supports images, videos, and audio files",
    analyzing: "Analyzing...",
    authentic: "Authentic",
    suspicious: "Suspicious",
    likely_fake: "Likely Fake",
    confidence: "Confidence",
    verdict: "Verdict",
    details: "Details",
    indicators: "Indicators",
    recommendation: "Recommendation",
    downloadReport: "Download PDF Report",
    deleteAnalysis: "Delete",
    totalAnalyses: "Total Analyses",
    imagesAnalyzed: "Images",
    videosAnalyzed: "Videos",
    audiosAnalyzed: "Audio",
    recentAnalyses: "Recent Analyses",
    noAnalyses: "No analyses yet. Start by uploading a file!",
    selectForCompare: "Select analyses to compare",
    compareSelected: "Compare Selected",
    features: "Features",
    howItWorks: "How It Works",
    featureAI: "AI-Powered Detection",
    featureAIDesc: "Advanced Gemini AI analyzes multiple aspects of your media files",
    featureMulti: "Multi-Format Support",
    featureMultiDesc: "Analyze images, videos, and audio files in one platform",
    featureReport: "Detailed Reports",
    featureReportDesc: "Get comprehensive PDF reports with technical findings",
    featureHistory: "Analysis History",
    featureHistoryDesc: "Track all your past analyses with full details",
    step1: "Upload your media file",
    step2: "AI analyzes for manipulation signs",
    step3: "Get detailed authenticity report",
    language: "Language",
    viewDetails: "View Details",
    backToDashboard: "Back to Dashboard",
    summary: "Summary",
    technicalDetails: "Technical Details",
    artifactsFound: "Artifacts Found",
    consistencyScore: "Consistency Score",
    metadataAnalysis: "Metadata Analysis",
    filterAll: "All",
    filterImages: "Images",
    filterVideos: "Videos",
    filterAudio: "Audio",
    orBrowse: "or browse files",
    maxFileSize: "Max file size: 50MB",
    searchPlaceholder: "Search analyses...",
  },
  ar: {
    appName: "TruthLens",
    tagline: "كشف مصداقية الوسائط بالذكاء الاصطناعي",
    heroTitle: "اكتشف التزييف العميق قبل أن يخدعك",
    heroSubtitle: "قم بتحميل أي صورة أو فيديو أو ملف صوتي ودع محرك التحليل الجنائي بالذكاء الاصطناعي يفحصه بحثاً عن علامات التلاعب أو التوليد بالذكاء الاصطناعي.",
    getStarted: "ابدأ الآن",
    learnMore: "اعرف المزيد",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    name: "الاسم الكامل",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    dashboard: "لوحة التحكم",
    analyze: "تحليل",
    history: "السجل",
    compare: "مقارنة",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    uploadTitle: "أسقط ملفك هنا",
    uploadSubtitle: "يدعم الصور ومقاطع الفيديو والملفات الصوتية",
    analyzing: "جاري التحليل...",
    authentic: "أصلي",
    suspicious: "مشبوه",
    likely_fake: "مزيف على الأرجح",
    confidence: "مستوى الثقة",
    verdict: "الحكم",
    details: "التفاصيل",
    indicators: "المؤشرات",
    recommendation: "التوصية",
    downloadReport: "تحميل تقرير PDF",
    deleteAnalysis: "حذف",
    totalAnalyses: "إجمالي التحليلات",
    imagesAnalyzed: "الصور",
    videosAnalyzed: "الفيديوهات",
    audiosAnalyzed: "الصوتيات",
    recentAnalyses: "التحليلات الأخيرة",
    noAnalyses: "لا توجد تحليلات بعد. ابدأ بتحميل ملف!",
    selectForCompare: "اختر التحليلات للمقارنة",
    compareSelected: "قارن المحدد",
    features: "المميزات",
    howItWorks: "كيف يعمل",
    featureAI: "كشف بالذكاء الاصطناعي",
    featureAIDesc: "تحليل متقدم بالذكاء الاصطناعي يفحص جوانب متعددة من ملفات الوسائط",
    featureMulti: "دعم تنسيقات متعددة",
    featureMultiDesc: "تحليل الصور والفيديوهات والملفات الصوتية في منصة واحدة",
    featureReport: "تقارير مفصلة",
    featureReportDesc: "احصل على تقارير PDF شاملة مع النتائج التقنية",
    featureHistory: "سجل التحليلات",
    featureHistoryDesc: "تتبع جميع تحليلاتك السابقة بكامل التفاصيل",
    step1: "قم بتحميل ملف الوسائط",
    step2: "الذكاء الاصطناعي يحلل علامات التلاعب",
    step3: "احصل على تقرير مفصل عن المصداقية",
    language: "اللغة",
    viewDetails: "عرض التفاصيل",
    backToDashboard: "العودة للوحة التحكم",
    summary: "الملخص",
    technicalDetails: "التفاصيل التقنية",
    artifactsFound: "الآثار المكتشفة",
    consistencyScore: "درجة الاتساق",
    metadataAnalysis: "تحليل البيانات الوصفية",
    filterAll: "الكل",
    filterImages: "الصور",
    filterVideos: "الفيديو",
    filterAudio: "الصوت",
    orBrowse: "أو تصفح الملفات",
    maxFileSize: "الحد الأقصى: 50 ميجابايت",
    searchPlaceholder: "بحث في التحليلات...",
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const t = useCallback((key) => translations[lang]?.[key] || translations['en']?.[key] || key, [lang]);

  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { authorization: `Bearer ${token}` } })
        .then(res => {
          setUser(res.data);
          if (res.data.language) changeLang(res.data.language);
        })
        .catch(() => { setToken(null); localStorage.removeItem('token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, changeLang]);

  const loginFn = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    return res.data;
  };

  const registerFn = async (name, email, password) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    return res.data;
  };

  const logoutFn = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const authHeaders = () => ({ headers: { authorization: `Bearer ${token}` } });

  return (
    <AuthContext.Provider value={{ user, token, loading, login: loginFn, register: registerFn, logout: logoutFn, authHeaders, lang, t, changeLang, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
