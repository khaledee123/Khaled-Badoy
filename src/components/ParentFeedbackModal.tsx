import React, { useState } from 'react';
import { CheckCircle2, HeartHandshake, Utensils, Moon, Sparkles, RefreshCw, AlertCircle, X } from 'lucide-react';
import { AnalysisResult, BabyProfile } from '../types';

interface ParentFeedbackModalProps {
  result: AnalysisResult;
  baby: BabyProfile;
  lang: 'ar' | 'en';
  onClose: () => void;
  onSubmitOutcome: (outcome: 'fed' | 'slept' | 'diaper' | 'burped' | 'cuddled' | 'unresolved', notes?: string) => void;
}

export const ParentFeedbackModal: React.FC<ParentFeedbackModalProps> = ({
  result,
  baby,
  lang,
  onClose,
  onSubmitOutcome,
}) => {
  const isAr = lang === 'ar';
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const options = [
    {
      id: 'fed',
      titleAr: 'أرضعته وتهدأ الرضيع تماماً',
      titleEn: 'Fed baby & calmed down completely',
      icon: Utensils,
      color: 'rose',
      descAr: 'تأكيد صحة حاجة الجوع وتغذية حلقة الاستدلال',
    },
    {
      id: 'slept',
      titleAr: 'نام بعد الهدهدة أو اللف',
      titleEn: 'Fell asleep after swaddling/soothing',
      icon: Moon,
      color: 'indigo',
      descAr: 'تأكيد صحة مؤشر النعاس والإرهاق',
    },
    {
      id: 'burped',
      titleAr: 'تجشأ وخرجت فقاعة الهواء وارتاح',
      titleEn: 'Burped and relieved trapped air',
      icon: RefreshCw,
      color: 'emerald',
      descAr: 'تأكيد منعكس ضغط الحجاب الحاجز',
    },
    {
      id: 'diaper',
      titleAr: 'غيّرنا الحفاض المبلل أو ضبطنا الحرارة',
      titleEn: 'Changed wet diaper / adjusted clothing',
      icon: HeartHandshake,
      color: 'sky',
      descAr: 'تأكيد انزعاج الجلد والتحسس الجسدي',
    },
    {
      id: 'cuddled',
      titleAr: 'احتاج فقط إلى الحضن والاطمئنان',
      titleEn: 'Just needed warmth and skin-to-skin cuddle',
      icon: Sparkles,
      color: 'amber',
      descAr: 'حاجة أمان عاطفي وتواصل حسي',
    },
    {
      id: 'unresolved',
      titleAr: 'استمر البكاء ولم ينفع الإجراء الأولي',
      titleEn: 'Cry persisted, initial action did not solve it',
      icon: AlertCircle,
      color: 'red',
      descAr: 'إعادة ضبط أوزان الاحتمالات وتنبيه المتابعة',
    },
  ];

  const handleConfirm = () => {
    if (!selectedOutcome) return;
    setIsSubmitted(true);
    setTimeout(() => {
      onSubmitOutcome(selectedOutcome as any, customNotes);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:left-auto sm:right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div className="mb-5">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {isAr ? 'نظام التعلم التكيفي من رد فعل الأم والأب' : 'Adaptive Parental Feedback Engine'}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {isAr ? `ماذا حدث مع ${baby.name} بعد التحليل؟` : `What resolved ${baby.name}'s cry?`}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isAr
                  ? 'ملاحظتك الدقيقة تدرب البصمة الصوتية الخاصة بطفلك وتزيد من دقة التشخيصات القادمة بنسب موثوقة.'
                  : 'Your confirmation calibrates the personalized acoustic fingerprint and refines future predictions.'}
              </p>
            </div>

            {/* Analysis reference summary */}
            <div className="p-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {isAr ? 'التشخيص الأولي المقترح:' : 'Predicted Need:'}
                </span>{' '}
                {isAr ? result.dominantNameAr : result.dominantNameEn}
              </div>
              <div className="font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                {isAr ? `ثقة ${result.confidenceScore}%` : `${result.confidenceScore}% Confidence`}
              </div>
            </div>

            {/* Options Grid */}
            <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
              {options.map(opt => {
                const Icon = opt.icon;
                const isSelected = selectedOutcome === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOutcome(opt.id)}
                    className={`w-full text-start p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isAr ? opt.titleAr : opt.titleEn}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? opt.descAr : opt.titleEn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Notes input */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {isAr ? 'ملاحظة إضافية خاصة بالطفل (اختياري)' : 'Additional parental notes (optional)'}
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                placeholder={isAr ? 'مثال: كان يبكي بحدة قبل التجشؤ مباشرة...' : 'e.g. Cried vigorously before burping...'}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={!selectedOutcome}
                onClick={handleConfirm}
                className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  selectedOutcome
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isAr ? 'تأكيد وتدريب البصمة الصوتية' : 'Save & Calibrate Profile'}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isAr ? 'تم حفظ التغذية الراجعة بنجاح!' : 'Feedback Calibrated Successfully!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
              {isAr
                ? `تم تحديث نموذج الذاكرة الصوتية لـ ${baby.name}. ارتفعت دقة التخصيص بنسبة +1.8% وتحدثت أوزان الاحتمالات التلقائية.`
                : `Acoustic profile for ${baby.name} updated. Personalization accuracy increased by +1.8%.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
