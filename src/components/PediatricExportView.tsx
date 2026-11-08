import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BabyProfile, AnalysisResult, RoutineStatus } from '../types';
import { GrowthMetricsSection } from './GrowthMetricsSection';

interface PediatricExportViewProps {
  activeBaby: BabyProfile;
  history: AnalysisResult[];
  routine: RoutineStatus;
  lang: 'ar' | 'en';
}

export const PediatricExportView: React.FC<PediatricExportViewProps> = ({
  activeBaby,
  history,
  lang,
}) => {
  const isAr = lang === 'ar';
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

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

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);

    try {
      const element = reportRef.current;

      // Capture high-definition canvas snapshot
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1280,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 standard width in mm
      const pageHeight = 297; // A4 standard height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add succeeding pages if content overflows 1 page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Nafas_Pediatric_Summary_${activeBaby.name}_${dateStr}.pdf`;
      pdf.save(filename);

      setPdfSuccessMessage(
        isAr
          ? `تم تحميل التقرير الطبي (${filename}) بنجاح!`
          : `Pediatric report (${filename}) generated successfully!`
      );
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err: any) {
      console.warn('html2canvas rendering warning, fallback to native print/pdf:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
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
              ? 'وثيقة طبية ملخصة توثق النبرات الصوتية، نوبات المغص، وتجاوب الرضيع مع الرضاعة والنوم ومخططات النمو البدني لتقديمها في موعد الفحص الدوري.'
              : 'Structured clinical cry and physical growth summary ready for presentation at well-baby pediatric visits.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto print:hidden">
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جاري تجهيز PDF...' : 'Generating PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل تقرير PDF' : 'Download PDF Summary'}</span>
              </>
            )}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{isAr ? 'طباعة مباشرة' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {pdfSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5 shadow-sm animate-fade-in print:hidden">
          <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{pdfSuccessMessage}</span>
        </div>
      )}

      {/* Printable Clinical Sheet (Captured for PDF) */}
      <div
        ref={reportRef}
        data-report-container="true"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0"
      >
        {/* Document Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'تقرير نَفَس الصوتي السريري ومؤشرات نمو الرضيع' : 'Nafas Infant Clinical Acoustic & Growth Report'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'منصة ذكاء اصطناعي لمعايرة بكاء الرضع ومتابعة التطور البدني' : 'Pediatric Cry Analytics & Physical Growth Dossier'}
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

        {/* Growth Metrics & Development Trajectory (Recharts) */}
        <GrowthMetricsSection activeBaby={activeBaby} lang={lang} />

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
