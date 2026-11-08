export type CryCategory = 'Hungry' | 'Colic' | 'Tired' | 'Discomfort' | 'Burp';

export interface ProbabilityItem {
  category: CryCategory;
  nameAr: string;
  nameEn: string;
  percentage: number;
  color: 'rose' | 'amber' | 'indigo' | 'sky' | 'emerald';
  dunstanSound: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface AcousticMetrics {
  dominantFreq: number; // Hz (F0)
  pitchVariance: number; // ±Hz
  avgDecibels: number; // dB
  durationSeconds: number; // s
  rhythmPacesPerMin: number; // cries/min
  dunstanDetected: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  babyId: string;
  probabilities: ProbabilityItem[];
  dominantReason: CryCategory;
  dominantNameAr: string;
  dominantNameEn: string;
  confidenceScore: number;
  acousticMetrics: AcousticMetrics;
  acousticReasoning: string;
  profileComparison: string;
  pediatricAlert: string | null;
  actionableAdviceAr: string[];
  actionableAdviceEn: string[];
  parentOutcome?: 'fed' | 'slept' | 'diaper' | 'burped' | 'cuddled' | 'unresolved';
  parentFeedbackTimestamp?: string;
  notes?: string;
}

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string; // ISO date string
  gender: 'boy' | 'girl';
  baselineFreq: number; // Hz (typically 400-480 Hz)
  totalRecordings: number;
  accuracyScore: number; // e.g. 88%
  adaptationWeight: number; // 0 to 1
}

export interface RoutineStatus {
  lastFeedTime: string; // ISO
  lastSleepTime: string; // ISO
  lastDiaperTime: string; // ISO
}

export interface ClinicalPreset {
  id: string;
  key: CryCategory;
  titleAr: string;
  titleEn: string;
  dunstanWord: string;
  dunstanReflex: string;
  dunstanReflexEn: string;
  metrics: AcousticMetrics;
  defaultProbabilities: { [key in CryCategory]: number };
  sampleDescriptionAr: string;
  soundType: 'hunger_cry' | 'colic_screech' | 'tired_whine' | 'diaper_fuss' | 'burp_grunt';
}
