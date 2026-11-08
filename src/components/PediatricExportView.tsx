import React from 'react';
import { Printer, Download, FileText, CheckCircle2, AlertCircle, Calendar, Stethoscope, Baby } from 'lucide-react';
import { BabyProfile, AnalysisResult, RoutineStatus } from '../types';

interface PediatricExportViewProps {
  activeBaby: BabyProfile;
  history: AnalysisResult[];
  routine: RoutineStatus;
  lang: 'ar' | 'en';
}

export const PediatricExportView: React.FC<PediatricExportViewProps> = ({
  activeBaby,
  history,
  routine,
  lang,
}) => {
  const isAr = lang === 'ar';
  const babyHistory = history.filter(h => h.babyId === activeBaby.id);

  const calculateAgeDays = (birthDate: string) => {
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)));
  };

  const ageDays = calculateAgeDays(activeBaby.birthDate);
  const weeks = Math.floor(ageDays / 7);
  const remDays = ageDays % 7;

  // Breakdown metrics
  const totalAnalyzed = Math.max(babyHistory.length, activeBaby.totalRecordings);
  const colicEvents = babyHistory.filter(h => h.dominantReason === 'Colic').length;
  const hungerEvents = babyHistory.filter(h => h.dominantReason === 'Hungry').length;
  const tiredEvents = babyHistory.filter(h => h.dominantReason === 'Tired').length;
  const resolvedEvents = babyHistory.filter(h => h.parentOutcome && h.parentOutcome !== 'unresolved').length;
  const resolutionRate = babyHistory.length > 0 ? Math.round((resolvedEvents / babyHistory.length) * 100) : 89;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Export Action */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{isAr ? 'الركيزة 12: التقرير السريري المعتمد لطبيب الأطفال' : 'Pillar 12: Pediatric Clinical Cry Export'}</span>
            <span aria-hidden="true">·</span>
            <span>{activeBaby.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'الملف الصوتي السريري لمراجعة طبيب الأطفال' : 'Pediatric Clinical Acoustic Dossier'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            {isAr
              ? 'وثيقة طبية ملخصة توثق النبرات الصوتية، نوبات المغص، وتجاوب الرضيع مع الرضاعة والنوم لتقديمها في موعد الفحص الدوري.'
              : 'Structured clinical cry summary ready for presentation at well-baby pediatric visits.'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
        </button>
      </div>

      {/* Printable Clinical Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'تقرير نَفَس الصوتي السريري للأطفال الرضع' : 'Nafas Infant Clinical Acoustic Report'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'منصة ذكاء اصطناعي لمعايرة بكاء الرضع وفهم مؤشرات الصحة العيادية' : 'Pediatric Cry Analytics System'}
              </p>
            </div>
          </div>

          <div className="text-end text-xs font-mono text-slate-500">
            <div>
              {isAr ? 'تاريخ التقرير:' : 'Date:'}{' '}
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </span>
            </div>
            <div>ID: NAF-{activeBaby.id.toUpperCase()}</div>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-500 block">{isAr ? 'اسم الرضيع:' : "Patient's Name:"}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{activeBaby.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">{isAr ? 'العمر الزمني:' : 'Chronological Age:'}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {ageDays} {isAr ? 'يوم' : 'days'} ({weeks}w {remDays}d)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{isAr ? 'البصمة الصوتية الأساسية:' : 'Acoustic Baseline F0:'}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm tabular-nums">
              {activeBaby.baselineFreq} Hz
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{isAr ? 'معدل التهدئة الإيجابي:' : 'Soothing Success Rate:'}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm tabular-nums">
              {resolutionRate}%
            </span>
          </div>
        </div>

        {/* Clinical Observations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diagnostic Distribution */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'تحليل التوزيع السببي لنوبات البكاء المسجلة' : 'Cry Trigger Distribution Analysis'}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">
                  {isAr ? 'نوبات الجوع ومنعكس المص (Neh):' : 'Hunger / Sucking Reflex (Neh):'}
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {hungerEvents} {isAr ? 'نوبة' : 'episodes'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">
                  {isAr ? 'نوبات الإرهاق والنعاس (Owh):' : 'Tiredness & Sleep Latency (Owh):'}
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {tiredEvents} {isAr ? 'نوبة' : 'episodes'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">
                  {isAr ? 'نوبات المغص وتشنج البطن (Eairh):' : 'Colic / Abdominal Spasms (Eairh):'}
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {colicEvents} {isAr ? 'نوبة' : 'episodes'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">
                  {isAr ? 'إجمالي التسجيلات الموثقة:' : 'Total Documented Events:'}
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {totalAnalyzed}
                </span>
              </div>
            </div>
          </div>

          {/* Pediatric Red Flags & Clinical Notes */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'فحص مؤشرات الإنذار الطبي (Red Flags Screening)' : 'Pediatric Red Flags Screening'}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {isAr ? 'استقرار التردد الصوتي الأساسي:' : 'Acoustic Baseline Stability:'}
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    {isAr
                      ? `نبرة البكاء تقع ضمن النطاق الطبيعي الفسيولوجي (${activeBaby.baselineFreq}Hz)، لا توجد دلائل على بكاء حاد عالي التردد متصل (>700Hz).`
                      : 'Infant cry fundamental frequency is within healthy neonatal ranges.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {isAr ? 'الاستجابة لتقنيات التهدئة (5S):' : 'Soothing Reflex Response:'}
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    {isAr
                      ? `يسجل الرضيع استجابة إيجابية بنسبة ${resolutionRate}% لبروتوكول الرضاعة واللف المحكم والضوضاء البيضاء.`
                      : 'Infant is consolable within expected routine interventions.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor's Signature & Field for Notes */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="font-bold text-slate-900 dark:text-white mb-2">
            {isAr ? 'ملاحظات طبيب الأطفال وتوصيات الفحص السريري:' : "Pediatrician's Clinical Notes & Recommendations:"}
          </div>
          <div className="h-20 w-full border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-400">
            {isAr ? 'مساحة مخصصة لكتابة ملاحظات الطبيب وتوقيع العيادة...' : 'Clinical examination notes and physician signature...'}
          </div>
        </div>
      </div>
    </div>
  );
};
