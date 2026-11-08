import React from 'react';
import { Baby, Moon, Sun, Globe } from 'lucide-react';
import { BabyProfile } from '../types';

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
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark (single line, no descriptor pill) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Baby className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            {isAr ? 'نَفَس للأطفال' : 'Nafas Infant AI'}
          </span>
        </div>

        {/* Zone 2: Navigation links (single line, clean typographic underline states) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'lab'
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'المختبر الصوتي' : 'Acoustic Lab'}
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'memory'
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'الذاكرة الصوتية' : 'Acoustic Memory'}
          </button>

          <button
            onClick={() => setActiveTab('routine')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'routine'
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'الروتين الحيوي' : 'Bio-Routine'}
          </button>

          <button
            onClick={() => setActiveTab('soothing')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'soothing'
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'مساعد التهدئة' : 'Soothing Suite'}
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'monitor'
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'مراقبة الغرفة' : 'Nursery Monitor'}
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'report'
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'تقرير الطبيب' : 'Clinical Report'}
          </button>
        </nav>

        {/* Zone 3: Actions (Baby selector, Lang toggle, Theme switch) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Baby selector dropdown */}
          <div className="relative">
            <select
              value={activeBaby.id}
              onChange={e => onSelectBaby(e.target.value)}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors pl-7 pr-3"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.baselineFreq}Hz)
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('lab')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'lab' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {isAr ? 'المختبر' : 'Lab'}
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'memory' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {isAr ? 'البصمة' : 'Memory'}
        </button>
        <button
          onClick={() => setActiveTab('routine')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'routine' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {isAr ? 'الروتين' : 'Routine'}
        </button>
        <button
          onClick={() => setActiveTab('soothing')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'soothing' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {isAr ? 'التهدئة' : 'Soothing'}
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'monitor' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {isAr ? 'المراقبة' : 'Monitor'}
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
            activeTab === 'report' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {isAr ? 'التقرير' : 'Report'}
        </button>
      </div>
    </header>
  );
};
