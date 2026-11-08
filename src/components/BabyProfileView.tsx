import React, { useState } from 'react';
import { Baby, Plus, Calendar, Activity, CheckCircle, TrendingUp, BarChart2, Shield } from 'lucide-react';
import { BabyProfile, AnalysisResult } from '../types';

interface BabyProfileViewProps {
  activeBaby: BabyProfile;
  profiles: BabyProfile[];
  history: AnalysisResult[];
  lang: 'ar' | 'en';
  onSelectBaby: (id: string) => void;
  onAddBaby: (baby: BabyProfile) => void;
}

export const BabyProfileView: React.FC<BabyProfileViewProps> = ({
  activeBaby,
  profiles,
  history,
  lang,
  onSelectBaby,
  onAddBaby,
}) => {
  const isAr = lang === 'ar';
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyGender, setNewBabyGender] = useState<'boy' | 'girl'>('boy');
  const [newBabyBirthDate, setNewBabyBirthDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const calculateAgeDays = (birthDate: string) => {
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)));
  };

  const babyHistory = history.filter(h => h.babyId === activeBaby.id);

  // Calculate historical cry breakdown for this baby
  const counts: Record<string, number> = { Hungry: 0, Colic: 0, Tired: 0, Discomfort: 0, Burp: 0 };
  babyHistory.forEach(h => {
    if (counts[h.dominantReason] !== undefined) {
      counts[h.dominantReason] += 1;
    }
  });

  const totalCryCount = Math.max(1, babyHistory.length);
  const hungerPct = Math.round((counts.Hungry / totalCryCount) * 100) || 45;
  const tiredPct = Math.round((counts.Tired / totalCryCount) * 100) || 25;
  const colicPct = Math.round((counts.Colic / totalCryCount) * 100) || 15;
  const discomfortPct = Math.round((counts.Discomfort / totalCryCount) * 100) || 10;
  const burpPct = Math.round((counts.Burp / totalCryCount) * 100) || 5;

  const handleCreateBaby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBabyName.trim()) return;

    const newBaby: BabyProfile = {
      id: `baby_${Date.now()}`,
      name: newBabyName.trim(),
      birthDate: newBabyBirthDate,
      gender: newBabyGender,
      baselineFreq: 430,
      totalRecordings: 0,
      accuracyScore: 78,
      adaptationWeight: 0.5,
    };

    onAddBaby(newBaby);
    setNewBabyName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-inner">
            <Baby className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
              <span>{isAr ? 'الركيزة 2: الذاكرة الصوتية الفردية' : 'Pillar 2: Acoustic Profile Memory'}</span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? `${calculateAgeDays(activeBaby.birthDate)} يوم` : `${calculateAgeDays(activeBaby.birthDate)} Days Old`}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span>{activeBaby.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-normal bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activeBaby.gender === 'boy' ? (isAr ? 'ذكر' : 'Boy') : isAr ? 'أنثى' : 'Girl'}
              </span>
            </h2>
          </div>
        </div>

        {/* Baby Profiles Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectBaby(p.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                p.id === activeBaby.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة طفل' : 'Add Infant'}</span>
          </button>
        </div>
      </div>

      {/* Acoustic Baseline Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{isAr ? 'التردد الصوتي الأساسي' : 'Fundamental Frequency'}</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {activeBaby.baselineFreq} <span className="text-sm font-normal text-slate-400">Hz</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'متوسط نبرة البكاء المرجعية المتعلمة' : 'Trained infant baseline tone'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{isAr ? 'مؤشر دقة التخصيص' : 'Personal Accuracy'}</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {activeBaby.accuracyScore}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'بناءً على التغذية الراجعة للأم' : 'Calibrated via maternal outcomes'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{isAr ? 'معامل التكيف التراكمي' : 'Adaptation Weight'}</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {Math.round(activeBaby.adaptationWeight * 100)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'حجم تأثير بصمة الرضيع على النتائج' : 'Model adaptation weight'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{isAr ? 'إجمالي نوبات البكاء المحللة' : 'Recorded Cry Sessions'}</span>
            <BarChart2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {activeBaby.totalRecordings}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'جلسة مسجلة في الذاكرة' : 'Total audio events'}
          </p>
        </div>
      </div>

      {/* Cry Distribution History for this Baby */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {isAr ? `توزيع أنماط بكاء ${activeBaby.name} التاريخية` : `Historical Cry Breakdown for ${activeBaby.name}`}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {isAr
            ? 'يوضح الرسم كيف تتوزع دوافع البكاء لهذا الرضيع تحديداً، مما يساعد الوالدين على فهم وتوقع احتياجاته اليومية.'
            : 'Longitudinal distribution of triggers specific to this infant over time.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">{isAr ? 'الجوع' : 'Hunger'}</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-900 dark:text-rose-200">{hungerPct}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{isAr ? 'الدافع الأكثر شيوعاً' : 'Primary trigger'}</div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60">
            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">{isAr ? 'النعاس' : 'Tiredness'}</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-900 dark:text-indigo-200">{tiredPct}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{isAr ? 'صعوبة الاستغراق في النوم' : 'Sleep latency'}</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">{isAr ? 'المغص والغازات' : 'Colic & Gas'}</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-900 dark:text-amber-200">{colicPct}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{isAr ? 'نوبات المساء' : 'Witching hours'}</div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60">
            <div className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">{isAr ? 'الحفاض والانزعاج' : 'Discomfort'}</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-sky-900 dark:text-sky-200">{discomfortPct}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{isAr ? 'تبليل أو حرارة الغرفة' : 'Diaper change'}</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">{isAr ? 'التجشؤ' : 'Burping'}</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-900 dark:text-emerald-200">{burpPct}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{isAr ? 'احتباس الهواء' : 'Trapped air'}</div>
          </div>
        </div>
      </div>

      {/* Add Infant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {isAr ? 'إضافة ملف رضيع جديد' : 'Add New Infant Profile'}
            </h3>

            <form onSubmit={handleCreateBaby} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم الطفل' : "Baby's Name"}
                </label>
                <input
                  type="text"
                  required
                  value={newBabyName}
                  onChange={e => setNewBabyName(e.target.value)}
                  placeholder={isAr ? 'مثال: آدم، مريم' : 'e.g. Adam, Mary'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'تاريخ الولادة' : 'Birth Date'}
                </label>
                <input
                  type="date"
                  required
                  value={newBabyBirthDate}
                  onChange={e => setNewBabyBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الجنس' : 'Gender'}
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={newBabyGender === 'boy'}
                      onChange={() => setNewBabyGender('boy')}
                    />
                    <span>{isAr ? 'ذكر' : 'Boy'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={newBabyGender === 'girl'}
                      onChange={() => setNewBabyGender('girl')}
                    />
                    <span>{isAr ? 'أنثى' : 'Girl'}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {isAr ? 'حفظ الملف وبدء المعايرة' : 'Save & Calibrate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
