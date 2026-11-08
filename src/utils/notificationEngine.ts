import { RoutineAlert, RoutineStatus, NotificationSettings, BabyProfile } from '../types';
import { audioSynthesizer } from './audioSynthesizer';

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  browserNotificationsEnabled: true,
  feedingThresholdMinutes: 180, // 3 hours
  sleepThresholdMinutes: 105, // 1h 45m wake window for infants
  diaperThresholdMinutes: 150, // 2.5 hours
  witchingHourEnabled: true,
};

const SETTINGS_KEY = 'nafas_notification_settings';
const ALERTS_KEY = 'nafas_routine_alerts';

export const notificationEngine = {
  getSettings(): NotificationSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: NotificationSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  },

  getStoredAlerts(): RoutineAlert[] {
    try {
      const data = localStorage.getItem(ALERTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveStoredAlerts(alerts: RoutineAlert[]) {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 30)));
    } catch {}
  },

  // Compute active predictive alerts based on current routine milestones
  evaluateRoutineAlerts(
    routine: RoutineStatus,
    activeBaby: BabyProfile,
    currentTimeMs = Date.now()
  ): RoutineAlert[] {
    const settings = this.getSettings();
    const alerts: RoutineAlert[] = [];

    const feedElapsed = Math.floor(Math.max(0, currentTimeMs - new Date(routine.lastFeedTime).getTime()) / 60000);
    const sleepElapsed = Math.floor(Math.max(0, currentTimeMs - new Date(routine.lastSleepTime).getTime()) / 60000);
    const diaperElapsed = Math.floor(Math.max(0, currentTimeMs - new Date(routine.lastDiaperTime).getTime()) / 60000);

    // 1. Feeding Milestone Alert
    if (feedElapsed >= settings.feedingThresholdMinutes) {
      const isUrgent = feedElapsed >= settings.feedingThresholdMinutes + 30;
      alerts.push({
        id: `feed_${Math.floor(currentTimeMs / 300000)}`,
        type: 'feeding_due',
        severity: isUrgent ? 'urgent' : 'warning',
        titleAr: isUrgent ? `تنبيه جوع وشيك: مضى ${feedElapsed} دقيقة` : `موعد الرضاعة المقترح لـ ${activeBaby.name}`,
        titleEn: isUrgent ? `Urgent Hunger Due: ${feedElapsed}m elapsed` : `Feeding Due for ${activeBaby.name}`,
        messageAr: `مضى أكثر من 3 ساعات على آخر وجبة؛ يُنصح ببدء تحضير الرضاعة لتفادي نوبة بكاء الجوع الحادة ونبرة "Neh".`,
        messageEn: `Over 3 hours since last feed. Offer feeding before hungry crying intensifies.`,
        minutesElapsed: feedElapsed,
        timestamp: new Date().toISOString(),
        actionType: 'feed',
        isRead: false,
        isDismissed: false,
      });
    }

    // 2. Sleep / Wake Window Alert
    if (sleepElapsed >= settings.sleepThresholdMinutes) {
      const isUrgent = sleepElapsed >= settings.sleepThresholdMinutes + 45;
      alerts.push({
        id: `sleep_${Math.floor(currentTimeMs / 300000)}`,
        type: 'wake_window_exceeded',
        severity: isUrgent ? 'urgent' : 'warning',
        titleAr: `نافذة يقظة طويلة: مضى ${sleepElapsed} دقيقة دون نوم`,
        titleEn: `Extended Wake Window: ${sleepElapsed}m awake`,
        messageAr: `تجاوز ${activeBaby.name} نافذة الاستيقاظ الموصى بها؛ البدء بتهيئة بيئة النوم باللف المحكم والضوضاء البيضاء يمنع فرط الإرهاق.`,
        messageEn: `Wake window threshold exceeded. Prepare sleep environment with swaddle and white noise.`,
        minutesElapsed: sleepElapsed,
        timestamp: new Date().toISOString(),
        actionType: 'sleep',
        isRead: false,
        isDismissed: false,
      });
    }

    // 3. Diaper Milestone Alert
    if (diaperElapsed >= settings.diaperThresholdMinutes) {
      alerts.push({
        id: `diaper_${Math.floor(currentTimeMs / 300000)}`,
        type: 'diaper_due',
        severity: 'info',
        titleAr: `فحص الحفاض مستحق (مضى ${diaperElapsed} دقيقة)`,
        titleEn: `Diaper Check Due (${diaperElapsed}m elapsed)`,
        messageAr: `مضى أكثر من ساعتين ونصف على آخر فحص؛ تغيير الحفاض يمنع تحسس الجلد ونوبات انزعاج "Heh".`,
        messageEn: `Over 2.5 hours since diaper check. Check diaper to prevent skin discomfort.`,
        minutesElapsed: diaperElapsed,
        timestamp: new Date().toISOString(),
        actionType: 'diaper',
        isRead: false,
        isDismissed: false,
      });
    }

    // 4. Evening Witching Hour Predictive Alert
    if (settings.witchingHourEnabled) {
      const currentHour = new Date(currentTimeMs).getHours();
      if (currentHour >= 17 && currentHour <= 21) {
        alerts.push({
          id: `witching_${new Date(currentTimeMs).toDateString()}`,
          type: 'witching_hour',
          severity: 'info',
          titleAr: `فترة المغص المسائية النشطة (Witching Hours)`,
          titleEn: `Evening Witching Hours Active (5-10 PM)`,
          messageAr: `هذا التوقيت يشهد ارتفاعاً فسيولوجياً في اضطراب الأمعاء؛ يُنصح بتدليك البطن الخفيف وتشغيل صوت نبضات الرحم مسبقاً.`,
          messageEn: `Peak colic window active. Proactive abdominal massage and womb heartbeat sounds recommended.`,
          minutesElapsed: 0,
          timestamp: new Date().toISOString(),
          actionType: 'soothe',
          isRead: false,
          isDismissed: false,
        });
      }
    }

    return alerts;
  },

  // Request browser permission for system notifications
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  },

  // Dispatch a notification (Browser notification + gentle sound chime)
  dispatchAlert(alert: RoutineAlert, lang: 'ar' | 'en' = 'ar') {
    const settings = this.getSettings();

    // 1. Play gentle nursery chime if sound enabled
    if (settings.soundEnabled) {
      audioSynthesizer.playAlertChime();
    }

    // 2. Trigger native Web Notification if allowed
    if (settings.browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = lang === 'ar' ? alert.titleAr : alert.titleEn;
        const body = lang === 'ar' ? alert.messageAr : alert.messageEn;
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: alert.id,
        });
      } catch (e) {
        // Safe ignore
      }
    }
  },
};
