import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldQuestion, Image, Video, AudioLines, ArrowRight, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function DashboardPage() {
  const { t, lang, authHeaders, API } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          axios.get(`${API}/analysis/stats`, authHeaders()),
          axios.get(`${API}/analysis/history?limit=5`, authHeaders()),
        ]);
        setStats(statsRes.data);
        setRecent(historyRes.data.analyses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'authentic': return { bg: 'bg-[#2F855A]/10', text: 'text-[#2F855A]', icon: <Shield className="w-4 h-4" /> };
      case 'suspicious': return { bg: 'bg-[#C05621]/10', text: 'text-[#C05621]', icon: <ShieldQuestion className="w-4 h-4" /> };
      case 'likely_fake': return { bg: 'bg-[#C53030]/10', text: 'text-[#C53030]', icon: <ShieldAlert className="w-4 h-4" /> };
      default: return { bg: 'bg-[#858580]/10', text: 'text-[#858580]', icon: <Shield className="w-4 h-4" /> };
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
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-[#1A1A18]">{t('dashboard')}</h1>
          <p className="text-sm text-[#858580] mt-1">{lang === 'ar' ? 'نظرة عامة على تحليلاتك' : 'Overview of your analyses'}</p>
        </div>
        <Link to="/analyze" data-testid="dashboard-analyze-btn">
          <Button className="rounded-full bg-[#1A1A18] text-[#F5F5F0] px-6 hover:bg-[#1A1A18]/90 transition-transform active:scale-95">
            <Upload className="w-4 h-4 me-2" />
            {t('analyze')}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="stats-grid">
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6 hover:shadow-md transition-shadow" data-testid="stat-total">
          <div className="text-sm text-[#858580] mb-2">{t('totalAnalyses')}</div>
          <div className="text-3xl font-light text-[#1A1A18]">{stats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6 hover:shadow-md transition-shadow" data-testid="stat-images">
          <div className="flex items-center gap-2 text-sm text-[#858580] mb-2">
            <Image className="w-4 h-4" />
            {t('imagesAnalyzed')}
          </div>
          <div className="text-3xl font-light text-[#1A1A18]">{stats?.by_type?.image || 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6 hover:shadow-md transition-shadow" data-testid="stat-videos">
          <div className="flex items-center gap-2 text-sm text-[#858580] mb-2">
            <Video className="w-4 h-4" />
            {t('videosAnalyzed')}
          </div>
          <div className="text-3xl font-light text-[#1A1A18]">{stats?.by_type?.video || 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#DADAD5] p-6 hover:shadow-md transition-shadow" data-testid="stat-audio">
          <div className="flex items-center gap-2 text-sm text-[#858580] mb-2">
            <AudioLines className="w-4 h-4" />
            {t('audiosAnalyzed')}
          </div>
          <div className="text-3xl font-light text-[#1A1A18]">{stats?.by_type?.audio || 0}</div>
        </div>
      </div>

      {/* Verdict Summary */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="verdict-summary">
          <div className="bg-white rounded-xl border border-[#DADAD5] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2F855A]/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#2F855A]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1A1A18]">{stats.authentic}</div>
              <div className="text-sm text-[#2F855A] font-medium">{t('authentic')}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#DADAD5] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#C05621]/10 flex items-center justify-center">
              <ShieldQuestion className="w-6 h-6 text-[#C05621]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1A1A18]">{stats.suspicious}</div>
              <div className="text-sm text-[#C05621] font-medium">{t('suspicious')}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#DADAD5] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#C53030]/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-[#C53030]" />
            </div>
            <div>
              <div className="text-2xl font-light text-[#1A1A18]">{stats.likely_fake}</div>
              <div className="text-sm text-[#C53030] font-medium">{t('likely_fake')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      <div data-testid="recent-analyses">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-[#1A1A18]">{t('recentAnalyses')}</h2>
          {recent.length > 0 && (
            <Link to="/history" className="text-sm text-[#858580] hover:text-[#1A1A18] flex items-center gap-1 transition-colors">
              {lang === 'ar' ? 'عرض الكل' : 'View all'}
              <ArrowRight className={`w-3 h-3 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DADAD5] p-12 text-center" data-testid="no-analyses">
            <Upload className="w-12 h-12 text-[#DADAD5] mx-auto mb-4" />
            <p className="text-[#858580]">{t('noAnalyses')}</p>
            <Link to="/analyze">
              <Button className="mt-4 rounded-full bg-[#1A1A18] text-[#F5F5F0]" data-testid="empty-analyze-btn">
                {t('analyze')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(analysis => {
              const vs = getVerdictStyle(analysis.verdict);
              return (
                <Link key={analysis.id} to={`/analysis/${analysis.id}`} data-testid={`analysis-item-${analysis.id}`}>
                  <div className="bg-white rounded-xl border border-[#DADAD5] p-5 hover:shadow-md transition-shadow flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#575752]">
                        {getTypeIcon(analysis.file_type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#1A1A18] group-hover:underline underline-offset-4">{analysis.file_name}</div>
                        <div className="text-xs text-[#858580] mt-0.5">
                          {new Date(analysis.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${vs.bg} ${vs.text}`}>
                        {vs.icon}
                        {t(analysis.verdict)}
                      </span>
                      <span className="text-sm text-[#858580]">{analysis.confidence}%</span>
                      <ArrowRight className={`w-4 h-4 text-[#DADAD5] group-hover:text-[#1A1A18] transition-colors ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
