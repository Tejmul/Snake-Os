import { create } from 'zustand';
import type {
  Direction,
  InputMode,
  GameState,
  GameStats,
  SnakeSegment,
  FoodItem,
  Challenge,
  ChallengeType,
  GestureState,
  VoiceState,
} from '@/types/game';
import { GRID_SIZE } from '@/lib/constants';

interface GameStore {
  gameState: GameState;
  stats: GameStats;
  snake: SnakeSegment[];
  food: FoodItem[];
  direction: Direction;
  gridSize: number;

  inputMode: InputMode;
  gestureState: GestureState;
  voiceState: VoiceState;

  challengeMode: boolean;
  activeChallenges: Challenge[];
  challengeHistory: ChallengeType[];

  soundEnabled: boolean;
  cameraMode: 'top-down' | 'follow' | 'cinematic';
  showMinimap: boolean;
  showGestureOverlay: boolean;

  lastEatenFood: FoodItem | null;
  highScore: number;

  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  setDirection: (dir: Direction) => void;
  toggleChallengeMode: () => void;
  activateChallenge: (challenge: Challenge) => void;
  deactivateChallenge: (type: ChallengeType) => void;
  setInputMode: (mode: InputMode) => void;
  updateGesture: (gesture: GestureState) => void;
  updateVoice: (voice: Partial<VoiceState>) => void;
  setCameraMode: (mode: 'top-down' | 'follow' | 'cinematic') => void;
  setGridSize: (size: number) => void;
  toggleSound: () => void;
  toggleMinimap: () => void;
  toggleGestureOverlay: () => void;
  loadHighScore: () => void;
}

const defaultStats: GameStats = {
  score: 0,
  length: 4,
  speed: 150,
  timeAlive: 0,
  foodEaten: 0,
  challengesCompleted: 0,
  maxCombo: 0,
  currentCombo: 0,
};

const defaultGesture: GestureState = {
  detected: false,
  direction: null,
  confidence: 0,
  landmarks: null,
};

const defaultVoice: VoiceState = {
  listening: false,
  lastCommand: null,
  confidence: 0,
  transcript: '',
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  stats: { ...defaultStats },
  snake: [],
  food: [],
  direction: 'RIGHT',
  gridSize: GRID_SIZE,

  inputMode: 'keyboard',
  gestureState: { ...defaultGesture },
  voiceState: { ...defaultVoice },

  challengeMode: false,
  activeChallenges: [],
  challengeHistory: [],

  soundEnabled: true,
  cameraMode: 'top-down',
  showMinimap: true,
  showGestureOverlay: true,

  lastEatenFood: null,
  highScore: 0,

  startGame: () => {
    set({
      gameState: 'playing',
      stats: { ...defaultStats },
      snake: [],
      food: [],
      direction: 'RIGHT',
      activeChallenges: [],
      challengeHistory: [],
      lastEatenFood: null,
    });
  },

  pauseGame: () => {
    if (get().gameState === 'playing') {
      set({ gameState: 'paused' });
    }
  },

  resumeGame: () => {
    if (get().gameState === 'paused') {
      set({ gameState: 'playing' });
    }
  },

  gameOver: () => {
    const { stats, highScore } = get();
    const newHigh = Math.max(stats.score, highScore);
    if (typeof window !== 'undefined') {
      localStorage.setItem('asteroid-serpent-highscore', String(newHigh));
    }
    set({
      gameState: 'gameover',
      highScore: newHigh,
    });
  },

  setDirection: (dir: Direction) => {
    set({ direction: dir });
  },

  toggleChallengeMode: () => {
    set((s) => ({ challengeMode: !s.challengeMode }));
  },

  activateChallenge: (challenge: Challenge) => {
    set((s) => ({
      activeChallenges: [...s.activeChallenges, challenge],
      challengeHistory: [...s.challengeHistory, challenge.type],
    }));
  },

  deactivateChallenge: (type: ChallengeType) => {
    set((s) => ({
      activeChallenges: s.activeChallenges.filter((c) => c.type !== type),
      stats: {
        ...s.stats,
        challengesCompleted: s.stats.challengesCompleted + 1,
        score: s.stats.score + 100,
      },
    }));
  },

  setInputMode: (mode: InputMode) => set({ inputMode: mode }),

  updateGesture: (gesture: GestureState) => set({ gestureState: gesture }),

  updateVoice: (voice: Partial<VoiceState>) =>
    set((s) => ({
      voiceState: { ...s.voiceState, ...voice },
    })),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setGridSize: (size: number) => set({ gridSize: size }),

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),

  toggleGestureOverlay: () =>
    set((s) => ({ showGestureOverlay: !s.showGestureOverlay })),

  loadHighScore: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('asteroid-serpent-highscore');
      if (saved) set({ highScore: parseInt(saved, 10) || 0 });
    }
  },
}));
