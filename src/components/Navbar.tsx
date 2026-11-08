import React from 'react';
import {
  Baby,
  Moon,
  Sun,
  Globe,
  Bell,
  Download,
  Smartphone,
  Activity,
  AudioWaveform,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText,
  Volume2,
} from 'lucide-react';
import { BabyProfile } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  activeTab: 'lab' | 'memory' | 'routine' | 'soothing' | 'monitor' | 'report';
  setActiveTab: (tab: 'lab' | 'memory' | 'routine' | 'soothing' | 'monitor' | 'report') => void;
  lang: 'ar' | 'en';
  toggleLang: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeBaby: BabyProfile;
  profiles: BabyProfile[];
  onSelectBaby: (id: string) => void;
  unreadAlertsCount: number;
  onOpenNotifications: () => void;
  onOpenAPKModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  toggleLang,
  theme,
  toggleTheme,
  activeBaby,
  profiles,
  onSelectBaby,
  unreadAlertsCount,
  onOpenNotifications,
  onOpenAPKModal,
}) => {
  const isAr = lang === 'ar';
  const { isInstalled } = usePWAInstall();

  // Calculate age string
  const getAgeString = (birthDate: string) => {
    const diffDays = Math.max(1, Math.round((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays < 30) return isAr ? `${diffDays} يوم` : `${diffDays}d`;
    const months = Math.floor(diffDays / 30);
    return isAr ? `${months} شهر` : `${months}mo`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-17 flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark & Clinical Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('lab')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <Baby className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                {isAr ? 'نَفَس للأطفال' : 'Nafas Infant AI'}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {isAr ? 'منصة سريرية معتمدة' : 'Clinical Platform'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
              {isAr ? 'الذكاء الاصطناعي لفهم احتياجات وبكاء الرضيع' : 'Infant Acoustic Intelligence System'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation tabs with glowing active indicator */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3.5 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isAr ? 'المختبر الصوتي' : 'Acoustic Lab'}</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3.5 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'memory'
                ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'الذاكرة والبصمة' : 'Acoustic Memory'}</span>
          </button>

          <button
            onClick={() => setActiveTab('routine')}
            className={`px-3.5 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'routine'
                ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isAr ? 'الروتين الحيوي' : 'Bio-Routine'}</span>
          </button>

          <button
            onClick={() => setActiveTab('soothing')}
            className={`px-3.5 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'soothing'
                ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'أصوات التهدئة' : 'Soothing Suite'}</span>
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-3.5 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'monitor'
                ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'مراقبة الغرفة' : 'Nursery Monitor'}</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'تقرير الطبيب والنمو' : 'Clinical Report'}</span>
          </button>
        </nav>

        {/* Zone 3: APK Download Action, Baby Selector & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Prominent APK Download Button */}
          <button
            onClick={onOpenAPKModal}
            title={isAr ? 'تثبيت وتحميل التطبيق كـ APK على أندرويد و iOS' : 'Install or Download as Native APK'}
            className="relative px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline">
              {isInstalled
                ? isAr ? 'تطبيق مثبت' : 'Installed'
                : isAr ? 'تحميل كـ APK / تثبيت' : 'Download APK'}
            </span>
            <span className="sm:hidden font-mono text-[11px]">APK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping hidden sm:inline-block" />
          </button>

          {/* Baby Selector Pill */}
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-2.5 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 ml-1 shrink-0" />
            <select
              value={activeBaby.id}
              onChange={e => onSelectBaby(e.target.value)}
              className="appearance-none bg-transparent text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer focus:outline-none pr-4 pl-1"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({getAgeString(p.birthDate)})
                </option>
              ))}
            </select>
          </div>

          {/* Predictive Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            title={isAr ? 'مركز التنبيهات الاستباقية للروتين' : 'Predictive Routine Alerts'}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-sm animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation Bar */}
      <div className="lg:hidden border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar bg-slate-50/80 dark:bg-slate-950/80">
        <button
          onClick={() => setActiveTab('lab')}
          className={`px-3 py-1 text-xs font-bold whitespace-nowrap rounded-lg flex items-center gap-1 ${
            activeTab === 'lab' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>{isAr ? 'المختبر' : 'Lab'}</span>
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`px-3 py-1 text-xs font-bold whitespace-nowrap rounded-lg flex items-center gap-1 ${
            activeTab === 'memory' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isAr ? 'البصمة' : 'Memory'}</span>
        </button>
        <button
          onClick={() => setActiveTab('routine')}
          className={`px-3 py-1 text-xs font-bold whitespace-nowrap rounded-lg flex items-center gap-1 ${
            activeTab === 'routine' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>{isAr ? 'الروتين' : 'Routine'}</span>
        </button>
        <button
          onClick={() => setActiveTab('soothing')}
          className={`px-3 py-1 text-xs font-bold whitespace-nowrap rounded-lg flex items-center gap-1 ${
            activeTab === 'soothing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Volume2 className="w-3 h-3" />
          <span>{isAr ? 'التهدئة' : 'Soothing'}</span>
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-3 py-1 text-xs font-bold whitespace-nowrap rounded-lg flex items-center gap-1 ${
            activeTab === 'monitor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>{isAr ? 'المراقبة' : 'Monitor'}</span>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-3 py-1 text-xs font-bold whitespace-nowrap rounded-lg flex items-center gap-1 ${
            activeTab === 'report' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>{isAr ? 'التقرير' : 'Report'}</span>
        </button>
      </div>
    </header>
  );
};
