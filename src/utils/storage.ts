import { BabyProfile, AnalysisResult, RoutineStatus } from '../types';

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
};
