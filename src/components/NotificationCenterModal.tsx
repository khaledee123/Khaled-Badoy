import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Utensils,
  Moon,
  HeartHandshake,
  Waves,
  Volume2,
  VolumeX,
  Settings,
  Check,
  Sparkles,
} from 'lucide-react';
import { RoutineAlert, RoutineStatus, NotificationSettings } from '../types';
import { notificationEngine } from '../utils/notificationEngine';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface NotificationCenterModalProps {
  alerts: RoutineAlert[];
  routine: RoutineStatus;
  lang: 'ar' | 'en';
  onClose: () => void;
  onUpdateRoutine: (updated: RoutineStatus) => void;
  onDismissAlert: (id: string) => void;
  onNavigateToTab?: (tab: 'lab' | 'routine' | 'soothing') => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  alerts,
  routine,
  lang,
  onClose,
  onUpdateRoutine,
  onDismissAlert,
  onNavigateToTab,
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const [settings, setSettings] = useState<NotificationSettings>(notificationEngine.getSettings());
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const handleSaveSetting = (key: keyof NotificationSettings, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    notificationEngine.saveSettings(updated);
  };

  const handleRequestPermission = async () => {
    const granted = await notificationEngine.requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    if (granted) {
      handleSaveSetting('browserNotificationsEnabled', true);
    }
  };

  const handleTestChime = () => {
    audioSynthesizer.playAlertChime();
    setTestNotificationSent(true);

    if (settings.browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isAr ? 'نَفَس: فحص إشعارات الروتين الذكي' : 'Nafas: Routine Notification Test', {
          body: isAr
            ? 'نظام التنبيهات الاستباقية للرضيع يعمل بنجاح!'
            : 'Predictive routine notification system is active!',
        });
      } catch {}
    }

    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const handleQuickAction = (alert: RoutineAlert) => {
    const nowIso = new Date().toISOString();
    const updated = { ...routine };

    if (alert.actionType === 'feed') {
      updated.lastFeedTime = nowIso;
      onUpdateRoutine(updated);
    } else if (alert.actionType === 'sleep') {
      updated.lastSleepTime = nowIso;
      onUpdateRoutine(updated);
    } else if (alert.actionType === 'diaper') {
      updated.lastDiaperTime = nowIso;
      onUpdateRoutine(updated);
    } else if (alert.actionType === 'soothe') {
      if (onNavigateToTab) onNavigateToTab('soothing');
      onClose();
      return;
    }

    onDismissAlert(alert.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'مركز التنبيهات الاستباقية للروتين' : 'Predictive Routine Alert Center'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'تنبؤ نوبات البكاء ومواقيت الرضاعة والنوم' : 'Preemptive cry & milestone alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'alerts'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isAr ? `التنبيهات (${alerts.length})` : `Alerts (${alerts.length})`}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Settings className="w-3.5 h-3.5 inline mr-1" />
                {isAr ? 'الإعدادات' : 'Settings'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'alerts' ? (
            alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/80 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'الروتين الحيوي منتظم ولا توجد تنبيهات متأخرة' : 'All Routine Milestones on Track'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {isAr
                    ? 'مواعيد الرضاعة والنوم وفحص الحفاض ضمن النطاق الطبيعي الموصى به للرضيع.'
                    : 'Feeding, wake windows, and diaper checks are well within optimal thresholds.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => {
                  const isUrgent = alert.severity === 'urgent';
                  const isWarning = alert.severity === 'warning';

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isUrgent
                          ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/60 dark:bg-rose-950/30'
                          : isWarning
                          ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30'
                          : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          {isUrgent ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          ) : (
                            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              isUrgent
                                ? 'text-rose-900 dark:text-rose-200'
                                : isWarning
                                ? 'text-amber-900 dark:text-amber-200'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isAr ? alert.titleAr : alert.titleEn}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          {alert.minutesElapsed > 0 ? `${alert.minutesElapsed}m` : ''}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        {isAr ? alert.messageAr : alert.messageEn}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[11px] text-slate-400">
                          {isAr ? 'الإجراء الموصى به:' : 'Recommended action:'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onDismissAlert(alert.id)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            {isAr ? 'تجاهل' : 'Dismiss'}
                          </button>

                          <button
                            onClick={() => handleQuickAction(alert)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg text-white shadow-sm transition-all flex items-center gap-1.5 ${
                              alert.actionType === 'feed'
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : alert.actionType === 'sleep'
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : alert.actionType === 'diaper'
                                ? 'bg-sky-600 hover:bg-sky-700'
                                : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {alert.actionType === 'feed'
                                ? isAr ? 'سجل رضاعة الآن' : 'Log Feed'
                                : alert.actionType === 'sleep'
                                ? isAr ? 'سجل نوم الآن' : 'Log Sleep'
                                : alert.actionType === 'diaper'
                                ? isAr ? 'سجل حفاض الآن' : 'Log Diaper'
                                : isAr ? 'مساعد التهدئة' : 'Open Soothing'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Settings Tab */
            <div className="space-y-4 text-xs">
              {/* Sound Chime Toggle */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isAr ? 'نغمة التنبيه الهادئة للرضيع' : 'Gentle Nursery Chime'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isAr ? 'نغمة مهدئة لا تفزع الطفل الرضيع عند الاستيقاظ' : 'Soft non-startling two-tone audio chime'}
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={e => handleSaveSetting('soundEnabled', e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Browser Push Notifications */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isAr ? 'إشعارات المتصفح والنظام' : 'Browser System Notifications'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isAr ? 'إرسال إشعار حتى لو كانت الشاشة في الخلفية' : 'Push alerts even when window is backgrounded'}
                    </div>
                  </div>
                </div>

                {permissionStatus === 'granted' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    {isAr ? 'مُفعل' : 'Allowed'}
                  </span>
                ) : (
                  <button
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {isAr ? 'تفعيل الإذن' : 'Enable'}
                  </button>
                )}
              </div>

              {/* Threshold Sliders */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تخصيص عتبات الإنذار للروتين الحيوي:' : 'Milestone Alert Thresholds:'}
                </div>

                {/* Feed Threshold */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                    <span>{isAr ? 'تنبيه موعد الرضاعة بعد:' : 'Feeding alert after:'}</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {settings.feedingThresholdMinutes} {isAr ? 'دقيقة (3 ساعات)' : 'min'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="240"
                    step="15"
                    value={settings.feedingThresholdMinutes}
                    onChange={e => handleSaveSetting('feedingThresholdMinutes', parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Wake Window Threshold */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                    <span>{isAr ? 'تنبيه إرهاق نافذة اليقظة بعد:' : 'Wake-window alert after:'}</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {settings.sleepThresholdMinutes} {isAr ? 'دقيقة (1س و 45د)' : 'min'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="180"
                    step="15"
                    value={settings.sleepThresholdMinutes}
                    onChange={e => handleSaveSetting('sleepThresholdMinutes', parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Diaper Check Threshold */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                    <span>{isAr ? 'تنبيه فحص الحفاض بعد:' : 'Diaper alert after:'}</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {settings.diaperThresholdMinutes} {isAr ? 'دقيقة (ساعتين ونصف)' : 'min'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="210"
                    step="15"
                    value={settings.diaperThresholdMinutes}
                    onChange={e => handleSaveSetting('diaperThresholdMinutes', parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Test Chime Action */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTestChime}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isAr ? 'تجربة نغمة التنبيه (Test Chime)' : 'Test Alert Chime'}</span>
                </button>

                {testNotificationSent && (
                  <span className="text-emerald-600 font-semibold text-xs animate-fade-in">
                    {isAr ? 'تم تشغيل النغمة بنجاح!' : 'Chime played!'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
