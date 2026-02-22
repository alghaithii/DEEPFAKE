import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldQuestion, Image, Video, AudioLines, ArrowRight, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function HistoryPage() {
  const { t, lang, authHeaders, API } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/analysis/history?limit=100`, authHeaders());
      setAnalyses(res.data.analyses);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.delete(`${API}/analysis/${id}`, authHeaders());
      setAnalyses(prev => prev.filter(a => a.id !== id));
      setTotal(prev => prev - 1);
      toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted successfully');
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed');
    }
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case 'authentic': return { bg: 'bg-[#2F855A]/10', text: 'text-[#2F855A]', icon: <Shield className="w-3.5 h-3.5" /> };
      case 'suspicious': return { bg: 'bg-[#C05621]/10', text: 'text-[#C05621]', icon: <ShieldQuestion className="w-3.5 h-3.5" /> };
      case 'likely_fake': return { bg: 'bg-[#C53030]/10', text: 'text-[#C53030]', icon: <ShieldAlert className="w-3.5 h-3.5" /> };
      default: return { bg: 'bg-[#858580]/10', text: 'text-[#858580]', icon: <Shield className="w-3.5 h-3.5" /> };
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

  const filtered = analyses.filter(a => {
    const matchesFilter = filter === 'all' || a.file_type === filter;
    const matchesSearch = !search || a.file_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#DADAD5] border-t-[#1A1A18] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="history-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-[#1A1A18]">{t('history')}</h1>
          <p className="text-sm text-[#858580] mt-1">{total} {lang === 'ar' ? 'تحليل' : 'analyses'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858580]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="ps-10 bg-white border-[#DADAD5] rounded-xl"
            data-testid="history-search-input"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: t('filterAll') },
            { key: 'image', label: t('filterImages'), icon: <Image className="w-3.5 h-3.5" /> },
            { key: 'video', label: t('filterVideos'), icon: <Video className="w-3.5 h-3.5" /> },
            { key: 'audio', label: t('filterAudio'), icon: <AudioLines className="w-3.5 h-3.5" /> },
          ].map(f => (
            <Button
              key={f.key}
              variant="outline"
              onClick={() => setFilter(f.key)}
              data-testid={`filter-${f.key}-btn`}
              className={`rounded-full text-xs px-4 ${
                filter === f.key
                  ? 'bg-[#1A1A18] text-[#F5F5F0] border-[#1A1A18] hover:bg-[#1A1A18]/90 hover:text-[#F5F5F0]'
                  : 'bg-white border-[#DADAD5] text-[#575752] hover:bg-[#EAEAE5]'
              }`}
            >
              {f.icon && <span className="me-1.5">{f.icon}</span>}
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#DADAD5] p-12 text-center" data-testid="no-results">
          <p className="text-[#858580]">{lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(analysis => {
            const vs = getVerdictStyle(analysis.verdict);
            return (
              <Link key={analysis.id} to={`/analysis/${analysis.id}`} data-testid={`history-item-${analysis.id}`}>
                <div className="bg-white rounded-xl border border-[#DADAD5] p-5 hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#575752]">
                      {getTypeIcon(analysis.file_type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#1A1A18] group-hover:underline underline-offset-4">{analysis.file_name}</div>
                      <div className="text-xs text-[#858580] mt-0.5">
                        {new Date(analysis.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${vs.bg} ${vs.text}`}>
                      {vs.icon}
                      {t(analysis.verdict)}
                    </span>
                    <span className="text-sm text-[#858580]">{analysis.confidence}%</span>
                    <button
                      onClick={(e) => deleteAnalysis(analysis.id, e)}
                      className="p-2 rounded-lg text-[#DADAD5] hover:text-[#C53030] hover:bg-[#C53030]/10 transition-colors opacity-0 group-hover:opacity-100"
                      data-testid={`delete-${analysis.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className={`w-4 h-4 text-[#DADAD5] group-hover:text-[#1A1A18] transition-colors ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
