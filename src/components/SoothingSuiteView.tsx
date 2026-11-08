import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, Timer, Waves, Heart, CloudRain, Wind, Music, Sparkles } from 'lucide-react';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface SoothingSuiteViewProps {
  lang: 'ar' | 'en';
}

export const SoothingSuiteView: React.FC<SoothingSuiteViewProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.6);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number | null>(null);

  const tracks = [
    {
      id: 'white_noise',
      titleAr: 'الضوضاء البيضاء النقية (Calibrated White Noise)',
      titleEn: 'Calibrated Pure White Noise',
      icon: Waves,
      descAr: 'ترددات محجوبة النبرات الحادة تحاكي صوت تدفق الدم داخل رحم الأم.',
      descEn: 'Acoustically smoothed low-pass spectrum replicating intrauterine hiss.',
    },
    {
      id: 'womb_heartbeat',
      titleAr: 'نبضات قلب الرحم الحية (72 BPM)',
      titleEn: 'Maternal Heartbeat (72 BPM)',
      icon: Heart,
      descAr: 'إيقاع نبضي دافئ يمنح الرضيع شعوراً فورياً بالأمان والألفة.',
      descEn: 'Rhythmic dual-thump pulse triggering the calming reflex.',
    },
    {
      id: 'shushing',
      titleAr: 'هدير التهدئة الإيقاعي (Rhythmic Shush)',
      titleEn: 'Rhythmic Shushing Breath',
      icon: Wind,
      descAr: 'صوت "ششش" البشري بتردد 2500Hz المتطابق مع بروتوكول الـ 5S الطبي.',
      descEn: 'Natural breath cadence designed to interrupt persistent crying.',
    },
    {
      id: 'gentle_rain',
      titleAr: 'صوت المطر الهادئ (Gentle Rain)',
      titleEn: 'Gentle Nursery Rain',
      icon: CloudRain,
      descAr: 'ضوضاء وردية ناعمة تحجب الأصوات المفاجئة في المنزل وتساعد على النوم العميق.',
      descEn: 'Pink noise spectrum masking sudden household noise bursts.',
    },
    {
      id: 'lullaby',
      titleAr: 'صندوق الموسيقى والتهويدات (Lullaby Chimes)',
      titleEn: 'Music Box Lullaby Chimes',
      icon: Music,
      descAr: 'نغمات رنانة رخيمة مهدئة للجهاز العصبي للرضيع.',
      descEn: 'Soft resonant bell tones playing classic soothing infant intervals.',
    },
  ];

  // Timer countdown handler
  useEffect(() => {
    let interval: any = null;
    if (activeTrack && timerSecondsRemaining !== null && timerSecondsRemaining > 0) {
      interval = setInterval(() => {
        setTimerSecondsRemaining(prev => {
          if (prev === null || prev <= 1) {
            audioSynthesizer.stopAllSoothing();
            setActiveTrack(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTrack, timerSecondsRemaining]);

  const handleToggleTrack = (trackId: string) => {
    if (activeTrack === trackId) {
      audioSynthesizer.stopSoothingTrack(trackId);
      setActiveTrack(null);
      setTimerSecondsRemaining(null);
    } else {
      audioSynthesizer.stopAllSoothing();
      audioSynthesizer.playSoothingTrack(trackId as any, volume);
      setActiveTrack(trackId);
      if (timerMinutes > 0) {
        setTimerSecondsRemaining(timerMinutes * 60);
      } else {
        setTimerSecondsRemaining(null);
      }
    }
  };

  const handleStopAll = () => {
    audioSynthesizer.stopAllSoothing();
    setActiveTrack(null);
    setTimerSecondsRemaining(null);
  };

  const formatTimerDisplay = (sec: number | null) => {
    if (sec === null) return isAr ? 'مستمر دون توقف' : 'Continuous';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{isAr ? 'الركيزة 6: مساعد التهدئة الذكي والمؤثرات الصوتية' : 'Pillar 6: Calming & Soothing Suite'}</span>
            <span aria-hidden="true">·</span>
            <span>{isAr ? 'توليد صوتي مباشر عبر Web Audio' : 'Real-time synthesizer'}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'مساعد التهدئة الذكي ومولد الأصوات الرحمية' : 'Smart Nursery Soothing Suite'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            {isAr
              ? 'أصوات مهدئة تمت معايرتها ترددياً لتهدئة الجهاز العصبي للرضيع وتنشيط المنعكس المهدئ (Calming Reflex).'
              : 'Medically tuned acoustic frequencies that activate the infant calming reflex within minutes.'}
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={volume}
              onChange={e => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (activeTrack) {
                  audioSynthesizer.playSoothingTrack(activeTrack as any, v);
                }
              }}
              className="w-20 accent-indigo-600"
            />
          </div>

          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">|</span>

          {/* Timer Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Timer className="w-4 h-4 text-indigo-500" />
            <select
              value={timerMinutes}
              onChange={e => {
                const m = parseInt(e.target.value, 10);
                setTimerMinutes(m);
                if (activeTrack) {
                  setTimerSecondsRemaining(m > 0 ? m * 60 : null);
                }
              }}
              className="bg-transparent font-mono text-xs font-semibold cursor-pointer focus:outline-none"
            >
              <option value={15}>15 {isAr ? 'دقيقة' : 'min'}</option>
              <option value={30}>30 {isAr ? 'دقيقة' : 'min'}</option>
              <option value={60}>60 {isAr ? 'دقيقة' : 'min'}</option>
              <option value={0}>{isAr ? 'مستمر' : 'Continuous'}</option>
            </select>
          </div>

          {activeTrack && (
            <button
              onClick={handleStopAll}
              className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 transition-colors"
            >
              {isAr ? 'إيقاف' : 'Stop'}
            </button>
          )}
        </div>
      </div>

      {/* Active Sound Indicator (if playing) */}
      {activeTrack && (
        <div className="p-4 rounded-xl bg-indigo-600 text-white flex items-center justify-between shadow-lg shadow-indigo-600/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center animate-spin">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-indigo-200">{isAr ? 'قيد التشغيل الآن في الغرفة:' : 'Now Playing:'}</div>
              <div className="text-sm font-bold">
                {tracks.find(t => t.id === activeTrack)?.[isAr ? 'titleAr' : 'titleEn']}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="bg-indigo-700/80 px-3 py-1.5 rounded-lg tabular-nums">
              {formatTimerDisplay(timerSecondsRemaining)}
            </div>
            <button
              onClick={handleStopAll}
              className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map(track => {
          const Icon = track.icon;
          const isPlaying = activeTrack === track.id;

          return (
            <div
              key={track.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isPlaying
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isPlaying
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isPlaying && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isAr ? track.titleAr : track.titleEn}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {isAr ? track.descAr : track.descEn}
                </p>
              </div>

              <button
                onClick={() => handleToggleTrack(track.id)}
                className={`w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  isPlaying
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إيقاف التشغيل' : 'Pause'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تشغيل الصوت الآن' : 'Play Sound'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* The 5S's Medical Protocol Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'بروتوكول التهدئة السريري المعتمد' : 'Clinical Calming Protocol'}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {isAr ? 'طريقة الـ 5S الطبية لتهدئة الرضيع في أقل من 5 دقائق' : "The Pediatric 5S's Calming Reflex"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-2xl">
          {isAr
            ? 'طريقة د. هارف كارف المعتمدة عالمياً التي تعيد خلق بيئة الرحم المألوفة وتهدئ نوبات البكاء المستعصية.'
            : 'Evidence-based sensory recreation of the womb environment to switch on the calming reflex.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-1">01. Swaddle (القميط)</div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">{isAr ? 'اللف المحكم اللطيف' : 'Tight Swaddling'}</div>
            <p className="text-slate-500 leading-relaxed">
              {isAr ? 'تثبيت اليدين على جانبي الجسم يمنع ارتعاش منعكس مورو الذي يوقظ الرضيع مذعوراً.' : 'Prevents Moro startle reflex.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-1">02. Side (الجانب)</div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">{isAr ? 'الوضع الجانبي المحمول' : 'Side/Stomach Hold'}</div>
            <p className="text-slate-500 leading-relaxed">
              {isAr ? 'حمل الطفل مائلاً على ذراع الوالد (للتهدئة فقط وليس للنوم في السرير دون رقابة).' : 'Hold baby inclined in arms.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-1">03. Shush (الهدير)</div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">{isAr ? 'صوت ششش الإيقاعي' : 'White Noise Shush'}</div>
            <p className="text-slate-500 leading-relaxed">
              {isAr ? 'إصدار صوت هادئ بجانب أذن الرضيع بنفس مستوى ارتفاع بكائه ثم خفضه تدريجياً.' : 'Match sound level then fade.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-1">04. Swing (الهدهدة)</div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">{isAr ? 'الحركة الإيقاعية الدقيقة' : 'Micro-Swinging'}</div>
            <p className="text-slate-500 leading-relaxed">
              {isAr ? 'اهتزاز خفيف سريع ومستقر للرأس والجذع مع دعم كامل للعنق.' : 'Gentle rhythmic oscillations.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-1">05. Suck (المص)</div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">{isAr ? 'المص المهدئ' : 'Non-nutritive Sucking'}</div>
            <p className="text-slate-500 leading-relaxed">
              {isAr ? 'تقديم اللهاية أو الثدي لتفعيل هرمون الأوكسيتوسين المهدئ للأعصاب.' : 'Releases calming endorphins.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
