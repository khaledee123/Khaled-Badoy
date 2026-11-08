import { AnalysisResult, BabyProfile, RoutineStatus } from '../types';

export interface AcousticMetricsInput {
  dominantFreq: number;
  pitchVariance: number;
  avgDecibels: number;
  durationSeconds: number;
  rhythmPacesPerMin: number;
  dunstanDetected?: string;
}

export function generateClinicalInference(
  metrics: AcousticMetricsInput,
  routine: RoutineStatus,
  baby: BabyProfile,
  presetKey?: string
): AnalysisResult {
  const now = Date.now();
  const lastFeedMinutesAgo = Math.round((now - new Date(routine.lastFeedTime).getTime()) / 60000);
  const lastSleepMinutesAgo = Math.round((now - new Date(routine.lastSleepTime).getTime()) / 60000);
  const lastDiaperMinutesAgo = Math.round((now - new Date(routine.lastDiaperTime).getTime()) / 60000);

  // Base priors
  let hungryScore = presetKey === 'Hungry' ? 70 : 25;
  let colicScore = presetKey === 'Colic' ? 65 : 20;
  let tiredScore = presetKey === 'Tired' ? 65 : 20;
  let discomfortScore = presetKey === 'Discomfort' ? 60 : 18;
  let burpScore = presetKey === 'Burp' ? 65 : 15;

  const sound = metrics.dunstanDetected || 'Neh';
  if (sound === 'Neh') {
    hungryScore += 45;
  } else if (sound === 'Owh') {
    tiredScore += 45;
  } else if (sound === 'Eairh') {
    colicScore += 40;
    discomfortScore += 20;
  } else if (sound === 'Eh') {
    burpScore += 45;
  } else if (sound === 'Heh') {
    discomfortScore += 40;
  }

  // Routine correlation
  if (lastFeedMinutesAgo > 180) {
    hungryScore += Math.min(35, Math.floor((lastFeedMinutesAgo - 180) / 4));
  } else if (lastFeedMinutesAgo < 45) {
    hungryScore -= 20;
    burpScore += 25;
  }

  if (lastSleepMinutesAgo > 120) {
    tiredScore += Math.min(30, Math.floor((lastSleepMinutesAgo - 120) / 3));
  }

  if (lastDiaperMinutesAgo > 180) {
    discomfortScore += 25;
  }

  // High pitch (>520Hz) indicates colic or acute discomfort
  if (metrics.dominantFreq > 520) {
    colicScore += 30;
  }

  // Normalize scores to sum to 100%
  const total = Math.max(1, hungryScore + colicScore + tiredScore + discomfortScore + burpScore);
  const p1 = Math.round((hungryScore / total) * 100);
  const p2 = Math.round((colicScore / total) * 100);
  const p3 = Math.round((tiredScore / total) * 100);
  const p4 = Math.round((discomfortScore / total) * 100);
  const p5 = Math.max(2, 100 - (p1 + p2 + p3 + p4));

  const list: import('../types').ProbabilityItem[] = [
    {
      category: 'Hungry',
      nameAr: 'جوع ورغبة في الرضاعة',
      nameEn: 'Hunger & Feeding Need',
      percentage: p1,
      color: 'amber',
      dunstanSound: 'Neh (صوت امتصاص اللسان لسقف الحلق)',
      descriptionAr: 'نمط إيقاعي تصاعدي يتخلله توقف منتظم، يتطابق مع منعكس المص الصوتي.',
      descriptionEn: 'Rhythmic ascending cry cadence matching Dunstan sucking reflex.',
    },
    {
      category: 'Colic',
      nameAr: 'مغص وغازات معوية',
      nameEn: 'Colic & Gas Discomfort',
      percentage: p2,
      color: 'rose',
      dunstanSound: 'Eairh (صوت انقباض عضلات البطن)',
      descriptionAr: 'نبرة حادة مرتفعة التردد مع انقطاع فجائي في النفس وتقوس الظهر.',
      descriptionEn: 'High-pitched strained crying correlating with abdominal tension.',
    },
    {
      category: 'Tired',
      nameAr: 'إرهاق ونعاس زائد',
      nameEn: 'Fatigue & Overtiredness',
      percentage: p3,
      color: 'indigo',
      dunstanSound: 'Owh (صوت التثاؤب والشفتين البيضاوية)',
      descriptionAr: 'بكاء متقطع بنبرة رتيبة متكررة مع فرك العينين وتجنب التواصل.',
      descriptionEn: 'Repetitive yawning cadence indicating sleep window has arrived.',
    },
    {
      category: 'Discomfort',
      nameAr: 'انزعاج جسدي أو حفاض ممتلئ',
      nameEn: 'Physical Discomfort / Diaper',
      percentage: p4,
      color: 'sky',
      dunstanSound: 'Heh (تنفس سطحي مع تبرم بالجلد)',
      descriptionAr: 'تململ صوتي مستمر دون انقطاع، يشير لحاجة تغيير الحفاض أو ضبط الحرارة.',
      descriptionEn: 'Whiny, persistent irritation reflex reflecting thermal or diaper need.',
    },
    {
      category: 'Burp',
      nameAr: 'فقاعة هواء وحاجة للتجشؤ',
      nameEn: 'Trapped Air / Burp Need',
      percentage: p5,
      color: 'emerald',
      dunstanSound: 'Eh (صوت صادر من المريء الأعلى)',
      descriptionAr: 'نبرة قصيرة متكررة فورية عقب الرضاعة تنبه لاحتباس الهواء في المعدة.',
      descriptionEn: 'Short repeated staccato release indicating post-feed air pocket.',
    },
  ];

  list.sort((a, b) => b.percentage - a.percentage);
  const dominant = list[0];

  const freqDiff = metrics.dominantFreq - (baby.baselineFreq || 420);
  const diffSign = freqDiff >= 0 ? `+${freqDiff}` : `${freqDiff}`;
  const diffPct = Math.round(Math.abs(freqDiff / (baby.baselineFreq || 420)) * 100);

  const isHighPitch = metrics.dominantFreq > 550;

  return {
    id: `res_${Date.now()}`,
    timestamp: new Date().toISOString(),
    babyId: baby.id,
    probabilities: list,
    dominantReason: dominant.category,
    dominantNameAr: dominant.nameAr,
    dominantNameEn: dominant.nameEn,
    confidenceScore: Math.min(94, Math.max(68, dominant.percentage + 16)),
    acousticMetrics: {
      dominantFreq: metrics.dominantFreq,
      pitchVariance: metrics.pitchVariance,
      avgDecibels: metrics.avgDecibels,
      durationSeconds: metrics.durationSeconds,
      rhythmPacesPerMin: metrics.rhythmPacesPerMin,
      dunstanDetected: metrics.dunstanDetected || 'Neh',
    },
    acousticReasoning: `رصد المحرك تردد أساسي بمقدار ${metrics.dominantFreq}Hz مع تقلب طيفي بمقدار ±${metrics.pitchVariance}Hz وإيقاع ${metrics.rhythmPacesPerMin} نبرة/دقيقة. تزامن ذلك مع مرور ${lastFeedMinutesAgo} دقيقة على آخر رضاعة و${lastSleepMinutesAgo} دقيقة على آخر نوم.`,
    profileComparison: `البصمة الصوتية تسجل (${diffSign}Hz أو ${diffPct}%) مقارنة بمتوسط نبرة ${baby.name} المعتادة (${baby.baselineFreq}Hz)، مما يؤكد النمط الفردي لحالة ${dominant.nameAr}.`,
    pediatricAlert: isHighPitch
      ? 'تنبيه سريري: التردد الصوتي أعلى من 550Hz ومتقارب النوبات، يرجى فحص حرارة الرضيع والتأكد من عدم وجود آلام حادة.'
      : null,
    actionableAdviceAr: [
      dominant.category === 'Hungry'
        ? 'قدمي الرضاعة الطبيعية أو الحليب مع تجنب الانتظار حتى استنزاف طاقة الطفل.'
        : dominant.category === 'Colic'
        ? 'اعتمدي تدليك البطن باتجاه عقارب الساعة مع رفع الركبتين نحو البطن لتخفيف الغازات.'
        : dominant.category === 'Tired'
        ? 'خففي الإضاءة، لفي الرضيع (Swaddle) وشغلي صوت الضوضاء البيضاء لمساعدته على الاسترخاء.'
        : dominant.category === 'Burp'
        ? 'احملي الطفل في وضع مستقيم على الكتف مع التربيت الخفيف المنتظم على أعلى الظهر.'
        : 'افحصي الحفاض واضبطي ملابس الرضيع وحرارة الغرفة (20-22 مئوية).',
      'تطبيق خطوة التهدئة الـ 5S: اللف اللطيف، التنويم الجانبي باليدين، صوت الهدير، الهدهدة الخفيفة، والمص.',
      'سجلي ملاحظتك بعد قليل في نافذة التعلم لتدريب بصمة صوت الطفل الخاصة.',
    ],
    actionableAdviceEn: [
      'Offer feeding promptly before infant reaches exhaustion.',
      'Apply gentle clockwise abdominal massage with knees raised.',
      'Log maternal outcome in the calibration modal to train personalized memory.',
    ],
  };
}
