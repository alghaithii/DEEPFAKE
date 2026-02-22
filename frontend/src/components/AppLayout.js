import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Upload, Clock, GitCompare, Settings, LogOut, Globe } from 'lucide-react';
import { Toaster } from '../components/ui/sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

export default function AppLayout({ children }) {
  const { user, logout, t, lang, changeLang } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/analyze', label: t('analyze'), icon: <Upload className="w-4 h-4" /> },
    { path: '/history', label: t('history'), icon: <Clock className="w-4 h-4" /> },
    { path: '/compare', label: t('compare'), icon: <GitCompare className="w-4 h-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <Toaster position={lang === 'ar' ? 'top-left' : 'top-right'} />

      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-[#DADAD5]" data-testid="app-navbar">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2" data-testid="app-logo">
              <Shield className="w-5 h-5 text-[#1A1A18]" />
              <span className="text-base font-bold text-[#1A1A18] tracking-tight">{t('appName')}</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link key={item.path} to={item.path} data-testid={`nav-${item.path.slice(1)}`}>
                  <Button
                    variant="ghost"
                    className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-[#1A1A18] text-[#F5F5F0] hover:bg-[#1A1A18]/90 hover:text-[#F5F5F0]'
                        : 'text-[#575752] hover:text-[#1A1A18] hover:bg-[#EAEAE5]'
                    }`}
                  >
                    {item.icon}
                    <span className="ms-2">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-[#575752] hover:text-[#1A1A18] gap-2" data-testid="lang-toggle-btn">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{lang === 'ar' ? 'عربي' : 'EN'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[#DADAD5]">
                <DropdownMenuItem onClick={() => changeLang('en')} data-testid="lang-en-option">
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang('ar')} data-testid="lang-ar-option">
                  العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-[#575752] hover:text-[#1A1A18] gap-2" data-testid="user-menu-btn">
                  <div className="w-7 h-7 rounded-full bg-[#1A1A18] text-[#F5F5F0] flex items-center justify-center text-xs font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:inline text-sm">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[#DADAD5] w-48">
                <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="settings-menu-item">
                  <Settings className="w-4 h-4 me-2" />
                  {t('settings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-menu-item">
                  <LogOut className="w-4 h-4 me-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 w-full z-50 bg-white border-t border-[#DADAD5] px-2 py-2" data-testid="mobile-nav">
        <div className="flex items-center justify-around">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}>
              <button className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs ${
                location.pathname === item.path ? 'text-[#1A1A18] font-medium' : 'text-[#858580]'
              }`}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="pt-20 pb-24 md:pb-8 px-6 md:px-12 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
