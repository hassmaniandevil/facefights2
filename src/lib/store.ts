'use client';

import { create } from 'zustand';
import {
  MatchState,
  MatchPhase,
  ExpressionType,
  BotDifficulty,
  CalibrationSession,
} from '../core/types';

// ============================================
// GAME STORE
// ============================================

export type Screen =
  | 'home'
  | 'fighter_select'
  | 'calibration'
  | 'face_training'
  | 'fight'
  | 'results'
  | 'share'
  | 'store'
  | 'story_mode'
  | 'inventory'
  | 'profile'
  | 'invite_landing'
  | 'waiting_room';

interface GameState {
  // Navigation
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;

  // Fighter selection
  selectedFighterId: string | null;
  opponentFighterId: string | null;
  selectFighter: (id: string) => void;
  selectOpponent: (id: string) => void;

  // Match
  matchState: MatchState | null;
  setMatchState: (state: MatchState | null) => void;
  matchMode: 'cpu' | 'pvp_local' | 'pvp_online';
  setMatchMode: (mode: 'cpu' | 'pvp_local' | 'pvp_online') => void;
  cpuDifficulty: BotDifficulty;
  setCpuDifficulty: (difficulty: BotDifficulty) => void;

  // Calibration
  calibrationSession: CalibrationSession | null;
  setCalibrationSession: (session: CalibrationSession | null) => void;
  isCalibrated: boolean;

  // Face training
  faceTrainingComplete: boolean;
  setFaceTrainingComplete: (complete: boolean) => void;

  // Expression state (for UI display)
  holdProgress: Record<ExpressionType, number>;
  setHoldProgress: (progress: Record<ExpressionType, number>) => void;
  smoothedValues: Record<ExpressionType, number>;
  setSmoothedValues: (values: Record<ExpressionType, number>) => void;
  desperationMode: boolean;
  setDesperationMode: (active: boolean) => void;

  // Results
  lastMatchResult: MatchResult | null;
  setLastMatchResult: (result: MatchResult | null) => void;

  // Camera
  cameraPermissionGranted: boolean;
  setCameraPermission: (granted: boolean) => void;

  // Audio
  isMuted: boolean;
  toggleMute: () => void;

  // Recording
  recordingConsent: boolean;
  setRecordingConsent: (consent: boolean) => void;
}

interface MatchResult {
  winnerId: string | null;
  player1RoundsWon: number;
  player2RoundsWon: number;
  player1FighterId: string;
  player2FighterId: string;
  wasKO: boolean;
}

export const useGameStore = create<GameState>((set) => ({
  // Navigation
  currentScreen: 'home',
  setScreen: (screen) => set({ currentScreen: screen }),

  // Fighter selection
  selectedFighterId: null,
  opponentFighterId: null,
  selectFighter: (id) => set({ selectedFighterId: id }),
  selectOpponent: (id) => set({ opponentFighterId: id }),

  // Match
  matchState: null,
  setMatchState: (state) => set({ matchState: state }),
  matchMode: 'cpu',
  setMatchMode: (mode) => set({ matchMode: mode }),
  cpuDifficulty: BotDifficulty.MEDIUM,
  setCpuDifficulty: (difficulty) => set({ cpuDifficulty: difficulty }),

  // Calibration
  calibrationSession: null,
  setCalibrationSession: (session) => set({
    calibrationSession: session,
    isCalibrated: session?.completed ?? false,
  }),
  isCalibrated: false,

  // Face training
  faceTrainingComplete: typeof window !== 'undefined'
    ? localStorage.getItem('ff2_training_complete') === 'true'
    : false,
  setFaceTrainingComplete: (complete) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ff2_training_complete', String(complete));
    }
    set({ faceTrainingComplete: complete });
  },

  // Expression state
  holdProgress: {} as Record<ExpressionType, number>,
  setHoldProgress: (progress) => set({ holdProgress: progress }),
  smoothedValues: {} as Record<ExpressionType, number>,
  setSmoothedValues: (values) => set({ smoothedValues: values }),
  desperationMode: false,
  setDesperationMode: (active) => set({ desperationMode: active }),

  // Results
  lastMatchResult: null,
  setLastMatchResult: (result) => set({ lastMatchResult: result }),

  // Camera
  cameraPermissionGranted: false,
  setCameraPermission: (granted) => set({ cameraPermissionGranted: granted }),

  // Audio
  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  // Recording
  recordingConsent: false,
  setRecordingConsent: (consent) => set({ recordingConsent: consent }),
}));
