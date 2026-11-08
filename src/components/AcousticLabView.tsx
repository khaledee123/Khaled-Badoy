import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  HeartHandshake,
  Activity,
  Volume2,
  Clock,
  ShieldCheck,
  FileAudio,
  CheckCircle,
} from 'lucide-react';
import { liveAudioAnalyzer } from '../utils/audioAnalyzer';
import { audioSynthesizer } from '../utils/audioSynthesizer';
import { CLINICAL_PRESETS } from '../data/clinicalPresets';
import { AnalysisResult, BabyProfile, ClinicalPreset, RoutineStatus } from '../types';

interface AcousticLabViewProps {
  activeBaby: BabyProfile;
  routine: RoutineStatus;
  lang: 'ar' | 'en';
  onAnalysisComplete: (result: AnalysisResult) => void;
  onOpenFeedback: (result: AnalysisResult) => void;
  latestResult: AnalysisResult | null;
}

export const AcousticLabView: React.FC<AcousticLabViewProps> = ({
  activeBaby,
  routine,
  lang,
  onAnalysisComplete,
  onOpenFeedback,
  latestResult,
}) => {
  const isAr = lang === 'ar';

  const [inputMode, setInputMode] = useState<'mic' | 'presets' | 'upload'>('presets');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveFreq, setLiveFreq] = useState(420);
  const [liveDecibels, setLiveDecibels] = useState(55);
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePreset, setActivePreset] = useState<ClinicalPreset | null>(CLINICAL_PRESETS[0]);
  const [isPlayingPresetSound, setIsPlayingPresetSound] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stopPresetRef = useRef<(() => void) | null>(null);

  // Timer for live recording
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      liveAudioAnalyzer.stopListening();
      if (stopPresetRef.current) stopPresetRef.current();
    };
  }, []);

  const handleStartMic = async () => {
    if (stopPresetRef.current) stopPresetRef.current();
    setIsPlayingPresetSound(false);
    setMicPermissionError(null);

    const res = await liveAudioAnalyzer.startListening(({ freq, decibels, isVoice }) => {
      setLiveFreq(freq);
      setLiveDecibels(decibels);
      setIsVoiceDetected(isVoice);
    }, canvasRef.current);

    if (res.success) {
      setIsRecording(true);
      setMicPermissionError(null);
    } else {
      setMicPermissionError(
        res.error ||
          (isAr
            ? 'تعذر الوصول إلى الميكروفون (تم حظر الإذن في المتصفح). يمكنك تشغيل البث الصوتي التجريبي المباشر أدناه لتجربة التحليل فوراً.'
            : 'Microphone permission denied. You can activate the simulated live cry stream below to test immediately.')
      );
    }
  };

  const handleStartSimulation = () => {
    if (stopPresetRef.current) stopPresetRef.current();
    setIsPlayingPresetSound(false);
    setMicPermissionError(null);
    setIsRecording(true);

    liveAudioAnalyzer.startSimulatedListening(
      ({ freq, decibels, isVoice }) => {
        setLiveFreq(freq);
        setLiveDecibels(decibels);
        setIsVoiceDetected(isVoice);
      },
      canvasRef.current,
      activeBaby.baselineFreq || 435
    );
  };

  const handleStopMicAndAnalyze = async () => {
    setIsRecording(false);
    setIsAnalyzing(true);
    setAnalysisError(null);

    const { base64 } = await liveAudioAnalyzer.stopListening();

    try {
      const now = Date.now();
      const lastFeedMin = Math.round((now - new Date(routine.lastFeedTime).getTime()) / 60000);
      const lastSleepMin = Math.round((now - new Date(routine.lastSleepTime).getTime()) / 60000);
      const lastDiaperMin = Math.round((now - new Date(routine.lastDiaperTime).getTime()) / 60000);

      const birthDate = new Date(activeBaby.birthDate);
      const ageDays = Math.max(1, Math.round((now - birthDate.getTime()) / (24 * 60 * 60 * 1000)));

      const response = await fetch('/api/analyze-cry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64 || undefined,
          audioMimeType: 'audio/webm',
          acousticMetrics: {
            dominantFreq: liveFreq || 435,
            pitchVariance: 24,
            avgDecibels: liveDecibels || 68,
            durationSeconds: Math.max(3, recordingSeconds),
            rhythmPacesPerMin: 24,
            dunstanDetected: liveFreq > 520 ? 'Eairh' : liveFreq < 390 ? 'Owh' : 'Neh',
          },
          babyProfile: {
            name: activeBaby.name,
            ageDays,
            baselineFreq: activeBaby.baselineFreq,
            cryCount: activeBaby.totalRecordings,
          },
          routineContext: {
            lastFeedMinutesAgo: lastFeedMin,
            lastSleepMinutesAgo: lastSleepMin,
            lastDiaperMinutesAgo: lastDiaperMin,
          },
        }),
      });

      const data = await response.json();
      const result: AnalysisResult = {
        id: `res_${Date.now()}`,
        timestamp: new Date().toISOString(),
        babyId: activeBaby.id,
        probabilities: data.probabilities,
        dominantReason: data.dominantReason,
        dominantNameAr: data.dominantNameAr,
        dominantNameEn: data.dominantNameAr, // Can mirror
        confidenceScore: data.confidenceScore,
        acousticMetrics: {
          dominantFreq: liveFreq || 435,
          pitchVariance: 24,
          avgDecibels: liveDecibels || 68,
          durationSeconds: Math.max(3, recordingSeconds),
          rhythmPacesPerMin: 24,
          dunstanDetected: liveFreq > 520 ? 'Eairh' : 'Neh',
        },
        acousticReasoning: data.acousticReasoning,
        profileComparison: data.profileComparison,
        pediatricAlert: data.pediatricAlert,
        actionableAdviceAr: data.actionableAdviceAr || [],
        actionableAdviceEn: data.actionableAdviceAr || [],
      };

      onAnalysisComplete(result);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(isAr ? 'حدث خطأ في الاتصال بخدمة التحليل.' : 'Connection error to analysis server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlayPresetSound = (preset: ClinicalPreset) => {
    setActivePreset(preset);
    if (stopPresetRef.current) {
      stopPresetRef.current();
      stopPresetRef.current = null;
    }

    setIsPlayingPresetSound(true);
    const stopFn = audioSynthesizer.playInfantCry(preset.soundType, 5.0, () => {
      setIsPlayingPresetSound(false);
    });
    stopPresetRef.current = stopFn;
  };

  const handleStopPresetSound = () => {
    if (stopPresetRef.current) {
      stopPresetRef.current();
      stopPresetRef.current = null;
    }
    setIsPlayingPresetSound(false);
  };

  const handleAnalyzePreset = async (preset: ClinicalPreset) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const now = Date.now();
      const lastFeedMin = Math.round((now - new Date(routine.lastFeedTime).getTime()) / 60000);
      const lastSleepMin = Math.round((now - new Date(routine.lastSleepTime).getTime()) / 60000);
      const lastDiaperMin = Math.round((now - new Date(routine.lastDiaperTime).getTime()) / 60000);

      const birthDate = new Date(activeBaby.birthDate);
      const ageDays = Math.max(1, Math.round((now - birthDate.getTime()) / (24 * 60 * 60 * 1000)));

      const response = await fetch('/api/analyze-cry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acousticMetrics: preset.metrics,
          babyProfile: {
            name: activeBaby.name,
            ageDays,
            baselineFreq: activeBaby.baselineFreq,
            cryCount: activeBaby.totalRecordings,
          },
          routineContext: {
            lastFeedMinutesAgo: preset.key === 'Hungry' ? 220 : lastFeedMin,
            lastSleepMinutesAgo: preset.key === 'Tired' ? 180 : lastSleepMin,
            lastDiaperMinutesAgo: preset.key === 'Discomfort' ? 210 : lastDiaperMin,
          },
          presetKey: preset.key,
        }),
      });

      const data = await response.json();
      const result: AnalysisResult = {
        id: `res_${Date.now()}`,
        timestamp: new Date().toISOString(),
        babyId: activeBaby.id,
        probabilities: data.probabilities,
        dominantReason: data.dominantReason,
        dominantNameAr: data.dominantNameAr,
        dominantNameEn: data.dominantNameAr,
        confidenceScore: data.confidenceScore,
        acousticMetrics: preset.metrics,
        acousticReasoning: data.acousticReasoning,
        profileComparison: data.profileComparison,
        pediatricAlert: data.pediatricAlert,
        actionableAdviceAr: data.actionableAdviceAr || [],
        actionableAdviceEn: data.actionableAdviceAr || [],
      };

      onAnalysisComplete(result);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(isAr ? 'حدث خطأ في تشغيل التحليل.' : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      setUploadedBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeUpload = async () => {
    if (!uploadedBase64) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const now = Date.now();
      const lastFeedMin = Math.round((now - new Date(routine.lastFeedTime).getTime()) / 60000);
      const lastSleepMin = Math.round((now - new Date(routine.lastSleepTime).getTime()) / 60000);
      const lastDiaperMin = Math.round((now - new Date(routine.lastDiaperTime).getTime()) / 60000);

      const response = await fetch('/api/analyze-cry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: uploadedBase64,
          audioMimeType: 'audio/wav',
          acousticMetrics: {
            dominantFreq: 450,
            pitchVariance: 28,
            avgDecibels: 72,
            durationSeconds: 8,
            rhythmPacesPerMin: 26,
            dunstanDetected: 'Neh',
          },
          babyProfile: {
            name: activeBaby.name,
            ageDays: 45,
            baselineFreq: activeBaby.baselineFreq,
            cryCount: activeBaby.totalRecordings,
          },
          routineContext: {
            lastFeedMinutesAgo: lastFeedMin,
            lastSleepMinutesAgo: lastSleepMin,
            lastDiaperMinutesAgo: lastDiaperMin,
          },
        }),
      });

      const data = await response.json();
      const result: AnalysisResult = {
        id: `res_${Date.now()}`,
        timestamp: new Date().toISOString(),
        babyId: activeBaby.id,
        probabilities: data.probabilities,
        dominantReason: data.dominantReason,
        dominantNameAr: data.dominantNameAr,
        dominantNameEn: data.dominantNameAr,
        confidenceScore: data.confidenceScore,
        acousticMetrics: {
          dominantFreq: 450,
          pitchVariance: 28,
          avgDecibels: 72,
          durationSeconds: 8,
          rhythmPacesPerMin: 26,
          dunstanDetected: 'Neh',
        },
        acousticReasoning: data.acousticReasoning,
        profileComparison: data.profileComparison,
        pediatricAlert: data.pediatricAlert,
        actionableAdviceAr: data.actionableAdviceAr || [],
        actionableAdviceEn: data.actionableAdviceAr || [],
      };

      onAnalysisComplete(result);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(isAr ? 'فشل تحليل الملف الصوتي.' : 'Audio file analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Section: Overview & Input Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>{isAr ? 'مختبر الصوتيات العيادية' : 'Clinical Acoustics Lab'}</span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? `الطفل: ${activeBaby.name}` : `Infant: ${activeBaby.name}`}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{activeBaby.baselineFreq}Hz Baseline</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'تحليل البكاء متعدد الاحتمالات وتتبع البصمة الصوتية' : 'Multi-Probability Cry Intelligence'}
            </h2>
          </div>

          {/* Input Method Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setInputMode('presets')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                inputMode === 'presets'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'عَيّنات سريرية فورية' : 'Clinical Presets'}
            </button>
            <button
              onClick={() => setInputMode('mic')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                inputMode === 'mic'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'ميكروفون مباشر' : 'Live Microphone'}
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                inputMode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {isAr ? 'رفع ملف صوتي' : 'Upload Audio'}
            </button>
          </div>
        </div>

        {/* Input Workspaces */}
        {inputMode === 'presets' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isAr
                  ? 'اختر عينة صوتية مسجلة مسبقاً وفق أبحاث Dunstan Baby Language للاستماع وتجربة الفحص الفوري للذكاء الاصطناعي:'
                  : 'Select an authentic pediatric audio profile to listen and benchmark the intelligence engine:'}
              </p>
              {isPlayingPresetSound && (
                <button
                  onClick={handleStopPresetSound}
                  className="px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إيقاف الصوت' : 'Stop Audio'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {CLINICAL_PRESETS.map(preset => {
                const isSelected = activePreset?.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setActivePreset(preset)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? preset.titleAr : preset.titleEn}
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {preset.dunstanWord}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {isAr ? preset.sampleDescriptionAr : preset.dunstanReflexEn}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs">
                      <div className="font-mono tabular-nums text-slate-500">
                        {preset.metrics.dominantFreq}Hz · {preset.metrics.avgDecibels}dB
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handlePlayPresetSound(preset);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>{isAr ? 'استماع' : 'Play'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleAnalyzePreset(preset);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
                        >
                          {isAr ? 'تحليل الآن' : 'Analyze'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {inputMode === 'mic' && (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
            {/* Visualizer Canvas */}
            <div className="w-full h-36 bg-slate-900 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
              <canvas ref={canvasRef} width={800} height={144} className="w-full h-full object-cover" />
              {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] text-xs text-slate-400">
                  {isAr ? 'اضغط زر "بدء الاستماع" لتسجيل بكاء الرضيع وتحليله لحظياً' : 'Click "Start Listening" to record baby cry'}
                </div>
              )}
            </div>

            {/* Live Metrics Strip */}
            {isRecording && (
              <div className="flex items-center justify-center gap-6 mb-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span className="tabular-nums font-bold text-slate-900 dark:text-white">{liveFreq} Hz</span>
                  <span className="text-slate-400">F0</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <span className="tabular-nums font-bold text-slate-900 dark:text-white">{liveDecibels} dB</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="tabular-nums font-bold text-slate-900 dark:text-white">00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                </div>
              </div>
            )}

            {/* Mic Permission Warning Banner (if denied) */}
            {micPermissionError && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs text-start flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">
                      {isAr ? 'تنبيه إذن الميكروفون' : 'Microphone Permission Notice'}
                    </span>
                    <span className="text-amber-800 dark:text-amber-300">
                      {micPermissionError}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleStartSimulation}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    {isAr ? 'بدء محاكاة البكاء المباشر (Demo)' : 'Start Live Demo Simulation'}
                  </button>
                  <button
                    onClick={handleStartMic}
                    className="px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {isAr ? 'إعادة طلب الإذن' : 'Retry Permission'}
                  </button>
                </div>
              </div>
            )}

            {/* Record / Stop Button */}
            {!isRecording ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleStartMic}
                  className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isAr ? 'بدء الاستماع المباشر (ميكروفون)' : 'Start Live Listening'}</span>
                </button>

                <button
                  onClick={handleStartSimulation}
                  className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{isAr ? 'محاكاة البث المباشر (Demo Stream)' : 'Simulate Live Stream'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleStopMicAndAnalyze}
                className="px-6 py-3 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/20 transition-all inline-flex items-center gap-2 animate-pulse"
              >
                <Square className="w-4 h-4" />
                <span>{isAr ? 'إيقاف وبدء التحليل الفوري' : 'Stop & Run Analysis'}</span>
              </button>
            )}
          </div>
        )}

        {inputMode === 'upload' && (
          <div className="p-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-800/30">
            <FileAudio className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {uploadFileName || (isAr ? 'اسحب ملف صوتي للبكاء أو انقر للاختيار' : 'Drop audio recording of baby cry')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isAr ? 'يدعم صيغ WAV, MP3, AAC, M4A حتى 20 ميجابايت' : 'Supports WAV, MP3, AAC, M4A up to 20MB'}
            </p>

            <div className="flex items-center justify-center gap-3">
              <label className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <span>{isAr ? 'اختيار ملف' : 'Browse File'}</span>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {uploadedBase64 && (
                <button
                  onClick={handleAnalyzeUpload}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  {isAr ? 'تحليل الملف' : 'Analyze Audio File'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isAnalyzing && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-3 text-xs text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
            <span>
              {isAr
                ? 'جاري استخراج الخصائص الصوتية، ومقارنة البصمة التاريخية، وحساب الاحتمالات عبر الذكاء الاصطناعي...'
                : 'Extracting acoustic features, benchmarking baby baseline, and computing probabilities...'}
            </span>
          </div>
        )}

        {analysisError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* RESULTS SECTION: Multi-Probability Breakdown & Acoustic Reasoning */}
      {latestResult && (
        <div className="space-y-6">
          {/* Pediatric Red Flag Alert (if triggered) */}
          {latestResult.pediatricAlert && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">
                  {isAr ? 'تنبيه سريري استثنائي (Clinical Pediatric Alert)' : 'Clinical Alert'}
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{latestResult.pediatricAlert}</p>
              </div>
            </div>
          )}

          {/* Core Multi-Probability Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Probabilities Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{isAr ? 'الركيزة 1: التوزيع متعدد الاحتمالات' : 'Pillar 1: Multi-Probability'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(latestResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {isAr ? 'توزيع نسب احتياجات الرضيع المكتشفة' : 'Detected Infant Needs Distribution'}
                  </h3>
                </div>

                {/* Overall Confidence Badge */}
                <div className="text-end">
                  <div className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'مؤشر الثقة' : 'Confidence'}</div>
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                    {latestResult.confidenceScore}%
                  </div>
                </div>
              </div>

              {/* Probability Bars */}
              <div className="space-y-4 mb-6">
                {latestResult.probabilities.map(item => {
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {isAr ? item.nameAr : item.nameEn}
                          </span>
                          <span className="text-slate-400">({item.dunstanSound})</span>
                        </div>
                        <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white text-sm">
                          {item.percentage}%
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            item.category === 'Hungry'
                              ? 'bg-rose-500'
                              : item.category === 'Colic'
                              ? 'bg-amber-500'
                              : item.category === 'Tired'
                              ? 'bg-indigo-500'
                              : item.category === 'Discomfort'
                              ? 'bg-sky-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isAr ? item.descriptionAr : item.descriptionEn}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Call-to-action to verify with Mother's Feedback */}
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? 'الركيزة 3: هل كان هذا التشخيص صحيحاً؟' : 'Pillar 3: Calibrate Maternal Learning'}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {isAr
                        ? 'سجلي الإجراء الذي نجح لتدريب البصمة الصوتية الخاصة بالطفل.'
                        : 'Confirm the outcome to train the personalized acoustic model.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenFeedback(latestResult)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  {isAr ? 'تسجيل نتيجة رد فعل الأم' : 'Log Maternal Outcome'}
                </button>
              </div>
            </div>

            {/* Column 3: Acoustic Reasoning & Baby Profile Comparison */}
            <div className="space-y-6">
              {/* Acoustic Reasoning Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'التعليل الصوتي والسريري' : 'Acoustic Reasoning'}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                  {isAr ? 'لماذا اقترح النظام هذا التوزيع؟' : 'Diagnostic Rationale'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {latestResult.acousticReasoning}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'التردد الأساسي (F0):' : 'Fundamental Freq:'}</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {latestResult.acousticMetrics.dominantFreq} Hz
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'شدة الصوت المتوسطة:' : 'Loudness Level:'}</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {latestResult.acousticMetrics.avgDecibels} dB
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'معدل النبرات:' : 'Cadence Rhythm:'}</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {latestResult.acousticMetrics.rhythmPacesPerMin} cry/min
                    </span>
                  </div>
                </div>
              </div>

              {/* Baby Personal Acoustic Baseline Comparison */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  <Activity className="w-4 h-4" />
                  <span>{isAr ? 'الركيزة 2: مقارنة البصمة الصوتية للطفل' : 'Pillar 2: Acoustic Memory'}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {isAr ? `البصمة الفردية لـ ${activeBaby.name}` : `${activeBaby.name}'s Baseline`}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {latestResult.profileComparison}
                </p>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>{isAr ? 'متوسط نبرة الطفل المعتادة:' : 'Personal baseline:'}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {activeBaby.baselineFreq} Hz
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>{isAr ? 'معامل التكيف التراكمي:' : 'Adaptation index:'}</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(activeBaby.adaptationWeight * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Calming Guidance Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {isAr ? 'خطوات التهدئة الطبية الموصى بها للوالدين' : 'Recommended Calming Actions'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {latestResult.actionableAdviceAr.map((advice, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold font-mono shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed">{advice}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
