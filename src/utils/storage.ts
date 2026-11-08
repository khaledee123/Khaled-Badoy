import { BabyProfile, AnalysisResult, RoutineStatus, GrowthEntry } from '../types';

const STORAGE_KEYS = {
  ACTIVE_BABY_ID: 'nafas_active_baby_id',
  PROFILES: 'nafas_baby_profiles',
  HISTORY: 'nafas_cry_history',
  ROUTINE: 'nafas_baby_routine',
  LANG: 'nafas_language',
  THEME: 'nafas_theme',
};

const DEFAULT_PROFILES: BabyProfile[] = [
  {
    id: 'baby_1',
    name: 'زين',
    birthDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    gender: 'boy',
    baselineFreq: 425,
    totalRecordings: 18,
    accuracyScore: 89,
    adaptationWeight: 0.75,
  },
  {
    id: 'baby_2',
    name: 'سارة',
    birthDate: new Date(Date.now() - 72 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    gender: 'girl',
    baselineFreq: 445,
    totalRecordings: 24,
    accuracyScore: 92,
    adaptationWeight: 0.82,
  },
];

const DEFAULT_ROUTINE: RoutineStatus = {
  lastFeedTime: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
  lastSleepTime: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
  lastDiaperTime: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
};

export const storage = {
  getProfiles(): BabyProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
      return data ? JSON.parse(data) : DEFAULT_PROFILES;
    } catch {
      return DEFAULT_PROFILES;
    }
  },

  saveProfiles(profiles: BabyProfile[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    } catch {}
  },

  getActiveBabyId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_BABY_ID) || 'baby_1';
  },

  setActiveBabyId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BABY_ID, id);
  },

  getHistory(): AnalysisResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHistory(history: AnalysisResult[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {}
  },

  addAnalysisResult(result: AnalysisResult) {
    const history = this.getHistory();
    const updated = [result, ...history].slice(0, 50); // Keep last 50
    this.saveHistory(updated);

    // Update baby profile stats
    const profiles = this.getProfiles();
    const targetIdx = profiles.findIndex(p => p.id === result.babyId);
    if (targetIdx !== -1) {
      profiles[targetIdx].totalRecordings += 1;
      // Slightly adapt baby baseline with moving average
      profiles[targetIdx].baselineFreq = Math.round(
        profiles[targetIdx].baselineFreq * 0.95 + result.acousticMetrics.dominantFreq * 0.05
      );
      this.saveProfiles(profiles);
    }
  },

  updateResultOutcome(
    resultId: string,
    outcome: 'fed' | 'slept' | 'diaper' | 'burped' | 'cuddled' | 'unresolved',
    notes?: string
  ) {
    const history = this.getHistory();
    const idx = history.findIndex(h => h.id === resultId);
    if (idx !== -1) {
      history[idx].parentOutcome = outcome;
      history[idx].parentFeedbackTimestamp = new Date().toISOString();
      if (notes) history[idx].notes = notes;
      this.saveHistory(history);

      // Reward baby's adaptation accuracy score
      const profiles = this.getProfiles();
      const pIdx = profiles.findIndex(p => p.id === history[idx].babyId);
      if (pIdx !== -1) {
        profiles[pIdx].adaptationWeight = Math.min(0.98, profiles[pIdx].adaptationWeight + 0.02);
        profiles[pIdx].accuracyScore = Math.min(97, profiles[pIdx].accuracyScore + 1);
        this.saveProfiles(profiles);
      }
    }
  },

  getRoutine(): RoutineStatus {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINE);
      return data ? JSON.parse(data) : DEFAULT_ROUTINE;
    } catch {
      return DEFAULT_ROUTINE;
    }
  },

  saveRoutine(routine: RoutineStatus) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(routine));
    } catch {}
  },

  getLanguage(): 'ar' | 'en' {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as 'ar' | 'en') || 'ar';
  },

  setLanguage(lang: 'ar' | 'en') {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  },

  getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'light';
  },

  setTheme(theme: 'dark' | 'light') {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getGrowthEntries(babyId?: string): GrowthEntry[] {
    try {
      const data = localStorage.getItem('nafas_growth_entries');
      const all: GrowthEntry[] = data ? JSON.parse(data) : DEFAULT_GROWTH_ENTRIES;
      if (babyId) {
        return all.filter(e => e.babyId === babyId);
      }
      return all;
    } catch {
      return DEFAULT_GROWTH_ENTRIES;
    }
  },

  saveGrowthEntries(entries: GrowthEntry[]) {
    try {
      localStorage.setItem('nafas_growth_entries', JSON.stringify(entries));
    } catch {}
  },

  addGrowthEntry(entry: GrowthEntry) {
    const current = this.getGrowthEntries();
    const updated = [...current, entry].sort((a, b) => a.ageWeeks - b.ageWeeks);
    this.saveGrowthEntries(updated);
  },

  deleteGrowthEntry(id: string) {
    const current = this.getGrowthEntries();
    const updated = current.filter(e => e.id !== id);
    this.saveGrowthEntries(updated);
  },
};

const DEFAULT_GROWTH_ENTRIES: GrowthEntry[] = [
  {
    id: 'growth_0',
    babyId: 'baby_1',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ageWeeks: 0,
    weightKg: 3.35,
    heightCm: 50.2,
    headCircumferenceCm: 35.0,
    whoWeightP50: 3.3,
    whoHeightP50: 49.9,
    cryingEpisodesPerDay: 4,
    notes: 'فحص الولادة في المستشفى، القياسات ضمن الشريحة الطبيعية لمنظمة الصحة العالمية',
  },
  {
    id: 'growth_1',
    babyId: 'baby_1',
    date: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ageWeeks: 2,
    weightKg: 3.75,
    heightCm: 52.0,
    headCircumferenceCm: 36.2,
    whoWeightP50: 3.8,
    whoHeightP50: 52.1,
    cryingEpisodesPerDay: 5,
    notes: 'استعادة وزن الولادة وبدء انتظام الرضاعة الطبيعية',
  },
  {
    id: 'growth_2',
    babyId: 'baby_1',
    date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ageWeeks: 4,
    weightKg: 4.30,
    heightCm: 54.4,
    headCircumferenceCm: 37.5,
    whoWeightP50: 4.4,
    whoHeightP50: 54.7,
    cryingEpisodesPerDay: 8,
    notes: 'فحص الشهر الأول، زيادة نوبات المغص المسائي (Eairh) مع طفرة النمو',
  },
  {
    id: 'growth_3',
    babyId: 'baby_1',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ageWeeks: 6,
    weightKg: 4.85,
    heightCm: 56.6,
    headCircumferenceCm: 38.5,
    whoWeightP50: 4.9,
    whoHeightP50: 56.8,
    cryingEpisodesPerDay: 6,
    notes: 'استقرار نسبي في البكاء مع تطبيق أصوات الرحم واللف المحكم (5S)',
  },
];
