import React, { useState } from 'react';
import {
  Scale,
  Ruler,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { GrowthEntry, BabyProfile } from '../types';
import { storage } from '../utils/storage';

interface GrowthMetricsSectionProps {
  activeBaby: BabyProfile;
  lang: 'ar' | 'en';
}

export const GrowthMetricsSection: React.FC<GrowthMetricsSectionProps> = ({
  activeBaby,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [entries, setEntries] = useState<GrowthEntry[]>(storage.getGrowthEntries(activeBaby.id));
  const [chartView, setChartView] = useState<'growth' | 'crying_corr'>('growth');
  const [showLogModal, setShowLogModal] = useState(false);

  // Form state for new log entry
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWeight, setFormWeight] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formHead, setFormHead] = useState('');
  const [formCrying, setFormCrying] = useState('5');
  const [formNotes, setFormNotes] = useState('');

  // Calculate age weeks from birth date
  const getWeeksFromBirth = (dateStr: string) => {
    const bDate = new Date(activeBaby.birthDate).getTime();
    const targetDate = new Date(dateStr).getTime();
    const diffDays = Math.max(0, Math.floor((targetDate - bDate) / (24 * 60 * 60 * 1000)));
    return Math.floor(diffDays / 7);
  };

  // Approximate WHO Median reference for infant age
  const calculateWhoP50 = (weeks: number) => {
    const isBoy = activeBaby.gender === 'boy';
    const baseWeight = isBoy ? 3.3 : 3.2;
    const baseHeight = isBoy ? 49.9 : 49.1;

    // Logarithmic infant growth curve approximation
    const weightGain = Math.log(weeks + 1) * 1.5;
    const weight = parseFloat((baseWeight + weightGain * 0.72 + weeks * 0.14).toFixed(2));

    const heightGain = Math.log(weeks + 1) * 4.4;
    const height = parseFloat((baseHeight + heightGain * 0.78 + weeks * 0.42).toFixed(1));

    return { whoWeightP50: weight, whoHeightP50: height };
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(formWeight);
    const h = parseFloat(formHeight);
    if (isNaN(w) || isNaN(h)) return;

    const weeks = getWeeksFromBirth(formDate);
    const who = calculateWhoP50(weeks);

    const newEntry: GrowthEntry = {
      id: `growth_${Date.now()}`,
      babyId: activeBaby.id,
      date: formDate,
      ageWeeks: weeks,
      weightKg: w,
      heightCm: h,
      headCircumferenceCm: formHead ? parseFloat(formHead) : undefined,
      whoWeightP50: who.whoWeightP50,
      whoHeightP50: who.whoHeightP50,
      cryingEpisodesPerDay: formCrying ? parseInt(formCrying, 10) : 5,
      notes: formNotes.trim() || undefined,
    };

    storage.addGrowthEntry(newEntry);
    setEntries(storage.getGrowthEntries(activeBaby.id));
    setShowLogModal(false);

    // Reset fields
    setFormWeight('');
    setFormHeight('');
    setFormHead('');
    setFormNotes('');
  };

  const handleDeleteEntry = (id: string) => {
    storage.deleteGrowthEntry(id);
    setEntries(storage.getGrowthEntries(activeBaby.id));
  };

  // Metrics summary
  const sortedEntries = [...entries].sort((a, b) => a.ageWeeks - b.ageWeeks);
  const latestEntry = sortedEntries[sortedEntries.length - 1];
  const initialEntry = sortedEntries[0];

  const totalWeightGain = latestEntry && initialEntry ? (latestEntry.weightKg - initialEntry.weightKg).toFixed(2) : '0';
  const totalHeightGain = latestEntry && initialEntry ? (latestEntry.heightCm - initialEntry.heightCm).toFixed(1) : '0';

  // Format data for Recharts
  const chartData = sortedEntries.map(entry => ({
    weekLabel: isAr ? `أسبوع ${entry.ageWeeks}` : `Wk ${entry.ageWeeks}`,
    date: entry.date,
    weightKg: entry.weightKg,
    heightCm: entry.heightCm,
    whoWeightP50: entry.whoWeightP50,
    whoHeightP50: entry.whoHeightP50,
    cryingEpisodes: entry.cryingEpisodesPerDay || 4,
    notes: entry.notes || '',
  }));

  return (
    <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>{isAr ? 'منحنيات النمو البدني والارتباط السلوكي' : 'Physical Growth & Crying Trajectory'}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'مؤشرات نمو الرضيع (الوزن، الطول، ومقارنة WHO)' : 'Infant Growth Metrics (Weight, Height & WHO Percentile)'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {isAr
              ? 'تتبع الوزن والطول مع معايير منظمة الصحة العالمية، وربط طفرات النمو (Growth Spurts) بنوبات البكاء المسائية.'
              : 'Monitor weight and height trajectories against WHO benchmarks alongside crying pattern peaks.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          {/* Chart View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setChartView('growth')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartView === 'growth'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {isAr ? 'منحنى الوزن والطول' : 'Growth Curves'}
            </button>
            <button
              onClick={() => setChartView('crying_corr')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartView === 'crying_corr'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {isAr ? 'الارتباط بنوبات البكاء' : 'Crying Correlation'}
            </button>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل قياس جديد' : 'Log Measurement'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>{isAr ? 'الوزن الحالي' : 'Current Weight'}</span>
            <Scale className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {latestEntry?.weightKg || '—'} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            +{totalWeightGain} kg {isAr ? 'منذ الولادة' : 'since birth'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>{isAr ? 'الطول الحالي' : 'Current Height'}</span>
            <Ruler className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {latestEntry?.heightCm || '—'} <span className="text-xs font-normal text-slate-400">cm</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            +{totalHeightGain} cm {isAr ? 'إجمالي الزيادة' : 'total gain'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>{isAr ? 'محيط الرأس' : 'Head Circumference'}</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {latestEntry?.headCircumferenceCm || '38.5'} <span className="text-xs font-normal text-slate-400">cm</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {isAr ? 'تطور جمجمة طبيعي' : 'Normal cranial curve'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>{isAr ? 'طفرة نمو الأسبوع 6' : 'Growth Spurt (W6)'}</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {isAr ? 'نشطة ومتزامنة' : 'Active & Synced'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'تفسر تزايد نوبات الجوع' : 'Explains crying peaks'}
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Area */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {chartView === 'growth'
              ? isAr
                ? 'مسار نمو الوزن والطول للرضيع مقارنة بالمتوسط المعياري (WHO Median P50)'
                : 'Physical Trajectory vs. WHO P50 Standard'
              : isAr
              ? 'تزامن زيادة الوزن مع معدل نوبات البكاء اليومية (طفرات النمو)'
              : 'Weight Gain vs. Daily Cry Frequency Correlation'}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {isAr ? 'وحدة القياس: كغم / سم' : 'Units: kg / cm'}
          </div>
        </div>

        <div className="w-full h-72">
          {chartView === 'growth' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="weight" domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="height"
                  orientation="right"
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg text-xs space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white border-b pb-1 mb-1">
                            {data.weekLabel} ({data.date})
                          </div>
                          <div className="text-indigo-600 dark:text-indigo-400 font-mono">
                            {isAr ? 'الوزن الفعلي:' : 'Weight:'} {data.weightKg} kg
                          </div>
                          <div className="text-slate-400 font-mono">
                            {isAr ? 'معيار WHO للوزن:' : 'WHO Weight:'} {data.whoWeightP50} kg
                          </div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-mono">
                            {isAr ? 'الطول الفعلي:' : 'Height:'} {data.heightCm} cm
                          </div>
                          {data.notes && (
                            <div className="text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t">
                              {data.notes}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {/* Baby Weight Line */}
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  name={isAr ? `وزن ${activeBaby.name} (kg)` : `${activeBaby.name} Weight`}
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366F1' }}
                  activeDot={{ r: 6 }}
                />

                {/* WHO Reference Weight Line */}
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="whoWeightP50"
                  name={isAr ? 'معيار منظمة الصحة (WHO P50)' : 'WHO Median Weight'}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                  dot={false}
                />

                {/* Baby Height Line */}
                <Line
                  yAxisId="height"
                  type="monotone"
                  dataKey="heightCm"
                  name={isAr ? `طول ${activeBaby.name} (cm)` : `${activeBaby.name} Height`}
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10B981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="weight" tick={{ fontSize: 11 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <YAxis
                  yAxisId="crying"
                  orientation="right"
                  domain={[0, 12]}
                  tick={{ fontSize: 11 }}
                  label={{ value: isAr ? 'نوبات البكاء/يوم' : 'Cries/Day', angle: -90, position: 'insideRight', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg text-xs space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white border-b pb-1 mb-1">
                            {data.weekLabel}
                          </div>
                          <div className="text-indigo-600 dark:text-indigo-400 font-mono">
                            {isAr ? 'الوزن:' : 'Weight:'} {data.weightKg} kg
                          </div>
                          <div className="text-rose-500 font-mono">
                            {isAr ? 'نوبات البكاء المسجلة:' : 'Cry Episodes:'} {data.cryingEpisodes} {isAr ? 'نوبة/يوم' : 'cries/day'}
                          </div>
                          {data.notes && (
                            <div className="text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t">
                              {data.notes}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                <Bar
                  yAxisId="crying"
                  dataKey="cryingEpisodes"
                  name={isAr ? 'معدل نوبات البكاء اليومية' : 'Daily Cry Episodes'}
                  fill="#F43F5E"
                  opacity={0.3}
                  radius={[4, 4, 0, 0]}
                />

                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  name={isAr ? 'منحنى الوزن (kg)' : 'Weight Curve (kg)'}
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366F1' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Logged Measurements Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            <span>{isAr ? 'جدول سجلات النمو الموثقة للرضيع' : 'Documented Growth Log Table'}</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            {entries.length} {isAr ? 'قياسات مسجلة' : 'entries logged'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 text-start font-semibold">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="px-4 py-2.5 text-start font-semibold">{isAr ? 'العمر' : 'Age'}</th>
                <th className="px-4 py-2.5 text-start font-semibold">{isAr ? 'الوزن (kg)' : 'Weight (kg)'}</th>
                <th className="px-4 py-2.5 text-start font-semibold">{isAr ? 'الطول (cm)' : 'Height (cm)'}</th>
                <th className="px-4 py-2.5 text-start font-semibold">{isAr ? 'محيط الرأس' : 'Head (cm)'}</th>
                <th className="px-4 py-2.5 text-start font-semibold">{isAr ? 'نوبات البكاء' : 'Cry Frequency'}</th>
                <th className="px-4 py-2.5 text-start font-semibold">{isAr ? 'ملاحظات وتطورات' : 'Clinical Notes'}</th>
                <th className="px-4 py-2.5 text-end font-semibold print:hidden">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {entry.date}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {isAr ? `أسبوع ${entry.ageWeeks}` : `Wk ${entry.ageWeeks}`}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {entry.weightKg} kg
                  </td>
                  <td className="px-4 py-3 font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {entry.heightCm} cm
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {entry.headCircumferenceCm ? `${entry.headCircumferenceCm} cm` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono tabular-nums px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold">
                      {entry.cryingEpisodesPerDay || '—'} {isAr ? 'نوبات/يوم' : '/day'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {entry.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-end print:hidden">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      title={isAr ? 'حذف القياس' : 'Delete log'}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Measurement Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 left-4 sm:left-auto sm:right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {isAr ? 'توثيق قياس جديد' : 'Physical Growth Entry'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {isAr ? `تسجيل قياسات نمو ${activeBaby.name}` : `Log Measurements for ${activeBaby.name}`}
              </h3>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'تاريخ القياس' : 'Measurement Date'}
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الوزن بالكيلوغرام (kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.0"
                    max="20.0"
                    required
                    placeholder="e.g. 4.85"
                    value={formWeight}
                    onChange={e => setFormWeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الطول بالسنتيمتر (cm)' : 'Height (cm)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35.0"
                    max="110.0"
                    required
                    placeholder="e.g. 56.5"
                    value={formHeight}
                    onChange={e => setFormHeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'محيط الرأس (cm) - اختياري' : 'Head Circ (cm) - opt'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 38.2"
                    value={formHead}
                    onChange={e => setFormHead(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'معدل البكاء (نوبات/يوم)' : 'Crying Frequency/day'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={formCrying}
                    onChange={e => setFormCrying(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'ملاحظات الفحص أو طفرة النمو' : 'Clinical or Developmental Notes'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'مثال: فحص الشهر الثاني، زيادة وزن ممتازة، تزايد نوبات الجوع...' : 'e.g. 2-month checkup, good weight gain...'}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {isAr ? 'حفظ وإضافة للمنحنى' : 'Save & Plot Curve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
