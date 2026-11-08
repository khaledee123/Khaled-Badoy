/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AcousticLabView } from './components/AcousticLabView';
import { BabyProfileView } from './components/BabyProfileView';
import { BioRoutineView } from './components/BioRoutineView';
import { SoothingSuiteView } from './components/SoothingSuiteView';
import { NurseryMonitorView } from './components/NurseryMonitorView';
import { PediatricExportView } from './components/PediatricExportView';
import { ParentFeedbackModal } from './components/ParentFeedbackModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { APKInstallModal } from './components/APKInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { storage } from './utils/storage';
import { notificationEngine } from './utils/notificationEngine';
import { AnalysisResult, BabyProfile, RoutineStatus, RoutineAlert } from './types';
import { Download, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>(storage.getLanguage());
  const [theme, setTheme] = useState<'dark' | 'light'>(storage.getTheme());
  const [activeTab, setActiveTab] = useState<'lab' | 'memory' | 'routine' | 'soothing' | 'monitor' | 'report'>('lab');

  const [profiles, setProfiles] = useState<BabyProfile[]>(storage.getProfiles());
  const [activeBabyId, setActiveBabyId] = useState<string>(storage.getActiveBabyId());
  const [routine, setRoutine] = useState<RoutineStatus>(storage.getRoutine());
  const [history, setHistory] = useState<AnalysisResult[]>(storage.getHistory());
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(history[0] || null);

  const [feedbackResult, setFeedbackResult] = useState<AnalysisResult | null>(null);

  // Predictive Notification Center state
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [alerts, setAlerts] = useState<RoutineAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // APK & Native Installation Modal State
  const [showAPKModal, setShowAPKModal] = useState(false);

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  // Sync direction with language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    storage.setLanguage(lang);
  }, [lang]);

  const activeBaby = profiles.find(p => p.id === activeBabyId) || profiles[0];

  // Evaluate predictive routine alerts & missed milestones periodically
  useEffect(() => {
    const checkAlerts = () => {
      const calculated = notificationEngine.evaluateRoutineAlerts(routine, activeBaby);
      setAlerts(calculated);
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 20000); // Check every 20s
    return () => clearInterval(interval);
  }, [routine, activeBaby]);

  const handleToggleLang = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectBaby = (id: string) => {
    setActiveBabyId(id);
    storage.setActiveBabyId(id);
  };

  const handleAddBaby = (baby: BabyProfile) => {
    const updated = [...profiles, baby];
    setProfiles(updated);
    storage.saveProfiles(updated);
    setActiveBabyId(baby.id);
    storage.setActiveBabyId(baby.id);
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setLatestResult(result);
    storage.addAnalysisResult(result);
    setHistory(storage.getHistory());
    setProfiles(storage.getProfiles());
  };

  const handleOpenFeedback = (result: AnalysisResult) => {
    setFeedbackResult(result);
  };

  const handleSubmitFeedbackOutcome = (
    outcome: 'fed' | 'slept' | 'diaper' | 'burped' | 'cuddled' | 'unresolved',
    notes?: string
  ) => {
    if (feedbackResult) {
      storage.updateResultOutcome(feedbackResult.id, outcome, notes);
      setHistory(storage.getHistory());
      setProfiles(storage.getProfiles());
      if (latestResult && latestResult.id === feedbackResult.id) {
        setLatestResult({
          ...latestResult,
          parentOutcome: outcome,
          notes,
        });
      }
    }
  };

  const handleUpdateRoutine = (updated: RoutineStatus) => {
    setRoutine(updated);
    storage.saveRoutine(updated);
  };

  const handleDismissAlert = (id: string) => {
    setDismissedAlertIds(prev => new Set(prev).add(id));
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlertIds.has(a.id));
  const isAr = lang === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Offline connectivity indicator */}
      <OfflineIndicator lang={lang} />

      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        toggleLang={handleToggleLang}
        theme={theme}
        toggleTheme={handleToggleTheme}
        activeBaby={activeBaby}
        profiles={profiles}
        onSelectBaby={handleSelectBaby}
        unreadAlertsCount={visibleAlerts.length}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenAPKModal={() => setShowAPKModal(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'lab' && (
          <AcousticLabView
            activeBaby={activeBaby}
            routine={routine}
            lang={lang}
            onAnalysisComplete={handleAnalysisComplete}
            onOpenFeedback={handleOpenFeedback}
            onOpenAPKModal={() => setShowAPKModal(true)}
            latestResult={latestResult}
          />
        )}

        {activeTab === 'memory' && (
          <BabyProfileView
            activeBaby={activeBaby}
            profiles={profiles}
            history={history}
            lang={lang}
            onSelectBaby={handleSelectBaby}
            onAddBaby={handleAddBaby}
          />
        )}

        {activeTab === 'routine' && (
          <BioRoutineView
            routine={routine}
            activeBaby={activeBaby}
            alerts={visibleAlerts}
            lang={lang}
            onUpdateRoutine={handleUpdateRoutine}
            onOpenNotifications={() => setShowNotificationsModal(true)}
          />
        )}

        {activeTab === 'soothing' && <SoothingSuiteView lang={lang} />}

        {activeTab === 'monitor' && <NurseryMonitorView activeBaby={activeBaby} lang={lang} />}

        {activeTab === 'report' && (
          <PediatricExportView
            activeBaby={activeBaby}
            history={history}
            routine={routine}
            lang={lang}
          />
        )}
      </main>

      {/* Parental Micro-Feedback Calibration Modal */}
      {feedbackResult && (
        <ParentFeedbackModal
          result={feedbackResult}
          baby={activeBaby}
          lang={lang}
          onClose={() => setFeedbackResult(null)}
          onSubmitOutcome={handleSubmitFeedbackOutcome}
        />
      )}

      {/* Routine Notifications & Predictive Alerts Modal */}
      {showNotificationsModal && (
        <NotificationCenterModal
          alerts={visibleAlerts}
          routine={routine}
          lang={lang}
          onClose={() => setShowNotificationsModal(false)}
          onUpdateRoutine={handleUpdateRoutine}
          onDismissAlert={handleDismissAlert}
          onNavigateToTab={tab => setActiveTab(tab)}
        />
      )}

      {/* APK & Native Installation Modal */}
      {showAPKModal && (
        <APKInstallModal
          lang={lang}
          onClose={() => setShowAPKModal(false)}
        />
      )}

      {/* Production Clinical Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isAr ? 'نَفَس للأطفال · Nafas Infant AI' : 'Nafas Infant AI Platform'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              {isAr ? 'إصدار أندرويد المستقل WebAPK 2.0' : 'Android WebAPK Edition 2.0'}
            </span>
            <button
              onClick={() => setShowAPKModal(true)}
              className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-[10px] border border-emerald-500/20 transition cursor-pointer"
            >
              {isAr ? 'تثبيت كـ APK' : 'Install APK'}
            </button>
          </div>

          <div className="text-center sm:text-end text-[11px] max-w-md text-slate-400 dark:text-slate-500">
            {isAr
              ? 'تنبيه: منصة نَفَس أداة مساعدة رقمية للأهل ولا تعد بديلاً عن الاستشارة الطبية أو الفحص السريري العاجل في حالات الطوارئ.'
              : 'Disclaimer: Nafas is a supportive digital platform and does not substitute professional medical care or emergency diagnosis.'}
          </div>
        </div>
      </footer>
    </div>
  );
}
