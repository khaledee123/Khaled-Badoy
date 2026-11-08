import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, BellRing, Volume2, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { liveAudioAnalyzer } from '../utils/audioAnalyzer';
import { BabyProfile } from '../types';

interface NurseryMonitorViewProps {
  activeBaby: BabyProfile;
  lang: 'ar' | 'en';
}

export const NurseryMonitorView: React.FC<NurseryMonitorViewProps> = ({ activeBaby, lang }) => {
  const isAr = lang === 'ar';

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentDecibels, setCurrentDecibels] = useState(42);
  const [currentFreq, setCurrentFreq] = useState(0);
  const [thresholdDecibels, setThresholdDecibels] = useState(65);
  const [cryEventTriggered, setCryEventTriggered] = useState(false);
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; db: number; freq: number }>>([]);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      liveAudioAnalyzer.stopListening();
    };
  }, []);

  const handleToggleMonitoring = async () => {
    setMicPermissionError(null);
    if (isMonitoring) {
      await liveAudioAnalyzer.stopListening();
      setIsMonitoring(false);
      setCryEventTriggered(false);
    } else {
      const res = await liveAudioAnalyzer.startListening(({ freq, decibels, isVoice }) => {
        setCurrentDecibels(decibels);
        setCurrentFreq(freq);

        // Cry detection condition: loudness exceeds threshold and acoustic pitch matches infant cry range
        if (decibels >= thresholdDecibels && isVoice && freq >= 300 && freq <= 850) {
          setCryEventTriggered(true);
          setEventLogs(prev => [
            {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              db: decibels,
              freq,
            },
            ...prev.slice(0, 10),
          ]);
        }
      }, canvasRef.current);

      if (res.success) {
        setIsMonitoring(true);
        setMicPermissionError(null);
      } else {
        setMicPermissionError(
          res.error ||
            (isAr
              ? 'تعذر الوصول إلى الميكروفون (تم رفض الإذن). يمكنك تفعيل محاكاة مراقبة الغرفة التجريبية أدناه.'
              : 'Microphone permission denied. You can activate the simulated nursery monitor stream.')
        );
      }
    }
  };

  const handleStartSimulatedMonitoring = () => {
    setMicPermissionError(null);
    setIsMonitoring(true);

    liveAudioAnalyzer.startSimulatedListening(
      ({ freq, decibels, isVoice }) => {
        setCurrentDecibels(decibels);
        setCurrentFreq(freq);

        if (decibels >= thresholdDecibels && isVoice && freq >= 300 && freq <= 850) {
          setCryEventTriggered(true);
          setEventLogs(prev => [
            {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              db: decibels,
              freq,
            },
            ...prev.slice(0, 10),
          ]);
        }
      },
      canvasRef.current,
      activeBaby.baselineFreq || 430
    );
  };

  const handleDismissAlert = () => {
    setCryEventTriggered(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{isAr ? 'الركيزة 11: مراقبة الغرفة الهادئة والإنذار الذكي' : 'Pillar 11: Smart Nursery Monitor'}</span>
            <span aria-hidden="true">·</span>
            <span>{activeBaby.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'نظام الاستماع الهادئ وكشف استيقاظ الرضيع' : 'Acoustic Nursery Vigilance System'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            {isAr
              ? 'اترك الهاتف أو الحاسوب في الغرفة؛ يرصد النظام ارتفاع مستوى الصوت إلى نبرات بكاء الأطفال وينبهك فوراً.'
              : 'Continuous low-power threshold listening; alerts you immediately when an infant cry signature is detected.'}
          </p>
        </div>

        {/* Start / Stop Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleToggleMonitoring}
            className={`px-6 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              isMonitoring
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20 animate-pulse'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {isMonitoring ? (
              <>
                <Radio className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'إيقاف المراقبة' : 'Stop Monitor'}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{isAr ? 'تفعيل وضع مراقبة الغرفة' : 'Activate Nursery Monitor'}</span>
              </>
            )}
          </button>

          {!isMonitoring && (
            <button
              onClick={handleStartSimulatedMonitoring}
              className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'محاكاة مراقبة تجريبية' : 'Demo Stream'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mic Permission Warning Banner */}
      {micPermissionError && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">
                {isAr ? 'تنبيه إذن الميكروفون' : 'Microphone Permission'}
              </span>
              <span>{micPermissionError}</span>
            </div>
          </div>

          <button
            onClick={handleStartSimulatedMonitoring}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            {isAr ? 'تشغيل المراقبة بالمحاكاة الحية' : 'Start Simulated Monitor'}
          </button>
        </div>
      )}

      {/* Cry Alert Banner */}
      {cryEventTriggered && (
        <div className="p-5 rounded-2xl bg-rose-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-rose-600/30 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isAr ? `تنبيه: تم رصد بكاء ${activeBaby.name} في الغرفة!` : `Alert: ${activeBaby.name} is crying!`}
              </h3>
              <p className="text-xs text-rose-100">
                {isAr
                  ? `تجاوز الصوت عتبة ${thresholdDecibels}dB مسجلاً ${currentDecibels}dB بتردد ${currentFreq}Hz.`
                  : `Detected cry signature exceeding ${thresholdDecibels}dB threshold.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismissAlert}
            className="px-4 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            {isAr ? 'إسكات التنبيه والمتابعة' : 'Dismiss Alert'}
          </button>
        </div>
      )}

      {/* Monitor Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas & Threshold Config */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isMonitoring
                  ? isAr
                    ? 'المراقبة الصوتية نشطة ومستمرة'
                    : 'Acoustic stream active'
                  : isAr
                  ? 'المراقبة غير مفعلة'
                  : 'Monitor idle'}
              </span>
            </div>

            <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{currentDecibels}</span> dB /
              عتبة الإنذار: <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{thresholdDecibels} dB</span>
            </div>
          </div>

          {/* Canvas Waveform */}
          <div className="w-full h-44 bg-slate-950 rounded-xl overflow-hidden mb-6 relative">
            <canvas ref={canvasRef} width={800} height={176} className="w-full h-full object-cover" />
            {!isMonitoring && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-xs text-slate-400">
                {isAr ? 'انقر على "تفعيل وضع مراقبة الغرفة" لبدء الاستماع الحي' : 'Activate monitor to start listening'}
              </div>
            )}
          </div>

          {/* Threshold Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{isAr ? 'حساسية عتبة التقاط البكاء (Decibel Sensitivity)' : 'Cry Detection Threshold'}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {thresholdDecibels} dB
              </span>
            </div>
            <input
              type="range"
              min="45"
              max="85"
              value={thresholdDecibels}
              onChange={e => setThresholdDecibels(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{isAr ? 'حساس جداً (45dB - همس)' : 'High sensitivity'}</span>
              <span>{isAr ? 'نبرة عادية (65dB)' : 'Normal cry (65dB)'}</span>
              <span>{isAr ? 'صراخ حاد فقط (85dB)' : 'Intense cry only (85dB)'}</span>
            </div>
          </div>
        </div>

        {/* Log History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {isAr ? 'سجل نوبات الاستيقاظ والبكاء المرصودة' : 'Detected Wake & Cry Events'}
            </h3>

            {eventLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p>{isAr ? 'الغرفة هادئة تماماً، لم يتم رصد بكاء حتى الآن' : 'Nursery is quiet, no cries detected'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {eventLogs.map((log, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-500">{log.time}</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">{log.db} dB</span>
                    <span className="text-slate-400 tabular-nums">{log.freq} Hz</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            {isAr
              ? 'تعتمد الخوارزمية على عزل ترددات صوت الطفل التوافقية لمنع التنبيهات الكاذبة الصادرة عن أصوات الأبواب أو الأجهزة المنزلية.'
              : 'Harmonic spectral filters isolate infant vocalizations from ambient household noise.'}
          </div>
        </div>
      </div>
    </div>
  );
};
