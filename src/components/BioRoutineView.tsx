import React, { useState, useEffect } from 'react';
import {
  Clock,
  Utensils,
  Moon,
  HeartHandshake,
  Check,
  RefreshCw,
  Zap,
  Bell,
  BellRing,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { RoutineStatus, RoutineAlert, BabyProfile } from '../types';

interface BioRoutineViewProps {
  routine: RoutineStatus;
  activeBaby: BabyProfile;
  alerts: RoutineAlert[];
  lang: 'ar' | 'en';
  onUpdateRoutine: (updated: RoutineStatus) => void;
  onOpenNotifications: () => void;
}

export const BioRoutineView: React.FC<BioRoutineViewProps> = ({
  routine,
  activeBaby,
  alerts,
  lang,
  onUpdateRoutine,
  onOpenNotifications,
}) => {
  const isAr = lang === 'ar';
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (isoTime: string) => {
    const elapsedMs = Math.max(0, now - new Date(isoTime).getTime());
    const totalMinutes = Math.floor(elapsedMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return isAr ? `${hours} س و ${minutes} د` : `${hours}h ${minutes}m`;
    }
    return isAr ? `${minutes} دقيقة` : `${minutes} min`;
  };

  const getMinutesAgo = (isoTime: string) => {
    return Math.floor(Math.max(0, now - new Date(isoTime).getTime()) / 60000);
  };

  const feedMin = getMinutesAgo(routine.lastFeedTime);
  const sleepMin = getMinutesAgo(routine.lastSleepTime);
  const diaperMin = getMinutesAgo(routine.lastDiaperTime);

  const handleLogNow = (type: 'feed' | 'sleep' | 'diaper') => {
    const updated = { ...routine };
    const currentIso = new Date().toISOString();
    if (type === 'feed') updated.lastFeedTime = currentIso;
    if (type === 'sleep') updated.lastSleepTime = currentIso;
    if (type === 'diaper') updated.lastDiaperTime = currentIso;
    onUpdateRoutine(updated);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>{isAr ? 'الركيزة 5: سياق الروتين الحيوي المتزامن' : 'Pillar 5: Circadian & Routine Correlation'}</span>
          <span aria-hidden="true">·</span>
          <span>{isAr ? 'تحديث لحظي' : 'Real-time clock'}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {isAr ? 'مزامنة الروتين الحيوي مع محرك الاحتمالات' : 'Bio-Routine & Cry Correlation Engine'}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          {isAr
            ? 'البكاء لا يحدث في فراغ صوتي؛ دمج الفترات الزمنية المنقضية منذ آخر رضاعة وغفوة وحفاض يرفع دقة الذكاء الاصطناعي بنسبة تفوق 30% ويمنع التخمين العشوائي.'
            : 'Integrating elapsed intervals since the last feeding, nap, and diaper change dynamically weights probabilistic accuracy.'}
        </p>
      </div>

      {/* Predictive Routine Alerts & Missed Milestones Banner */}
      {alerts && alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-indigo-100 dark:border-indigo-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr
                    ? `تنبيهات استباقية لنوبات البكاء المحتملة لـ ${activeBaby.name}`
                    : `Predictive Cry & Milestone Alerts for ${activeBaby.name}`}
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  {isAr
                    ? 'اكتشف النظام مواقيت متأخرة قد تؤدي لبكاء حاد في حال عدم التدخل المبكر.'
                    : 'System detected overdue intervals likely to trigger crying without proactive intervention.'}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenNotifications}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              {isAr ? 'فتح مركز الإشعارات الكامل' : 'Open Notification Center'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {alerts.slice(0, 2).map(alert => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs"
              >
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    alert.severity === 'urgent' ? 'text-rose-600' : 'text-amber-500'
                  }`}
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isAr ? alert.titleAr : alert.titleEn}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                    {isAr ? alert.messageAr : alert.messageEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Routine Trackers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feeding Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  feedMin > 180
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {feedMin > 180 ? (isAr ? 'حاجة وشيكة للرضاعة' : 'Due for feed') : isAr ? 'طبيعي' : 'Nominal'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {isAr ? 'آخر وجبة رضاعة' : 'Last Feeding Session'}
            </h3>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mb-2">
              {formatElapsed(routine.lastFeedTime)}
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {isAr
                ? feedMin > 180
                  ? 'مضى أكثر من 3 ساعات؛ تكتسب نبرة البكاء وزناً ترجيحياً للجوع بنسبة +40%.'
                  : 'مستوى الشبع كافٍ؛ إذا بكى الرضيع فاحتمالية المغص أو التجشؤ تكون أعلى.'
                : 'Correlates hunger probability if elapsed interval > 3 hours.'}
            </p>
          </div>

          <button
            onClick={() => handleLogNow('feed')}
            className="w-full py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'سجل رضاعة الآن (Reset)' : 'Log Feed Now'}</span>
          </button>
        </div>

        {/* Sleep Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  sleepMin > 120
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {sleepMin > 120 ? (isAr ? 'نافذة يقظة طويلة' : 'Wake window open') : isAr ? 'طبيعي' : 'Nominal'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {isAr ? 'آخر غفوة / نوم' : 'Last Sleep / Nap'}
            </h3>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mb-2">
              {formatElapsed(routine.lastSleepTime)}
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {isAr
                ? sleepMin > 120
                  ? 'تجاوز الطفل نافذة الاستيقاظ الموصى بها؛ تزداد احتمالية فرط الإرهاق (Overtired).'
                  : 'الرضيع في نافذة اليقظة النشطة واللعب التفاعلي.'
                : 'Correlates overtired probability if wake window is exceeded.'}
            </p>
          </div>

          <button
            onClick={() => handleLogNow('sleep')}
            className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'سجل نوم / استيقاظ الآن' : 'Log Sleep Now'}</span>
          </button>
        </div>

        {/* Diaper Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  diaperMin > 150
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {diaperMin > 150 ? (isAr ? 'فحص مستحق' : 'Due for check') : isAr ? 'طبيعي' : 'Nominal'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {isAr ? 'آخر تغيير حفاض' : 'Last Diaper Change'}
            </h3>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mb-2">
              {formatElapsed(routine.lastDiaperTime)}
            </div>
            <p className="text-xs text-slate-500 mb-6">
              {isAr
                ? diaperMin > 150
                  ? 'مضى أكثر من ساعتين ونصف؛ التحليل الصوتي يرفع ترجيح انزعاج البلل بنسبة +25%.'
                  : 'حالة الحفاض جيدة ونظيفة.'
                : 'Correlates skin discomfort if elapsed interval > 2.5 hours.'}
            </p>
          </div>

          <button
            onClick={() => handleLogNow('diaper')}
            className="w-full py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'سجل تغيير حفاض الآن' : 'Log Diaper Now'}</span>
          </button>
        </div>
      </div>

      {/* Circadian Logic Rules Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>{isAr ? 'مصفوفة الترجيح الخوارزمي التلقائي للروتين' : 'Circadian Weighting Heuristics Matrix'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              {isAr ? 'قاعدة الرضاعة المباشرة' : 'Post-Feeding Rule'}
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'إذا حدث البكاء خلال 30 دقيقة من الرضاعة، تُخفض احتمالية الجوع بنسبة 80%، وترتفع احتمالية الحاجة للتجشؤ أو المغص فوراً.'
                : 'Crying within 30m of feeding deprioritizes hunger and elevates burp/gas probabilities.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              {isAr ? 'قاعدة نافذة اليقظة' : 'Wake-Window Rule'}
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'الرضيع في الشهر الثاني لا يتحمل البقاء مستيقظاً أكثر من 60-90 دقيقة؛ بعد ذلك يتحول البكاء إلى نبرة فرط الإرهاق التململية.'
                : 'Infants under 2 months struggle staying awake > 90m; overtiredness is boosted.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              {isAr ? 'ساعات المغص المسائية (Witching Hours)' : 'Evening Witching Hours'}
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'بين 5 مساءً و 10 ليلاً، يرتفع هرمون الكورتيزول وتتزايد الغازات، مما يعطي أولوية لخوارزميات كشف المغص المعوي.'
                : '5pm-10pm triggers heightened colic priors due to circadian gut motility rhythms.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
