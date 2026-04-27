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
import { initGame, tick as engineTick, isOppositeDirection, spawnFood } from '@/lib/snakeEngine';
import { GRID_SIZE } from '@/lib/constants';
import type { EngineState } from '@/types/game';

interface GameStore {
  gameState: GameState;
  stats: GameStats;
  snake: SnakeSegment[];
  food: FoodItem[];
  direction: Direction;
  directionQueue: Direction[];
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

  engineState: EngineState | null;
  lastEatenFood: FoodItem | null;
  highScore: number;

  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  setDirection: (dir: Direction) => void;
  tick: () => void;
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
  directionQueue: [],
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

  engineState: null,
  lastEatenFood: null,
  highScore: 0,

  startGame: () => {
    const { gridSize } = get();
    const engine = initGame(gridSize);
    set({
      gameState: 'playing',
      engineState: engine,
      snake: engine.snake,
      food: engine.food,
      direction: engine.direction,
      directionQueue: [],
      stats: { ...engine.stats },
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
    const { direction, directionQueue } = get();
    const lastQueued = directionQueue.length > 0
      ? directionQueue[directionQueue.length - 1]
      : direction;
    if (!isOppositeDirection(lastQueued, dir) && lastQueued !== dir && directionQueue.length < 2) {
      set({ directionQueue: [...directionQueue, dir] });
    }
  },

  tick: () => {
    const { engineState, directionQueue, direction, gameState } = get();
    if (!engineState || gameState !== 'playing') return;

    let nextDir = direction;
    const newQueue = [...directionQueue];

    while (newQueue.length > 0) {
      const candidate = newQueue.shift()!;
      if (!isOppositeDirection(engineState.direction, candidate)) {
        nextDir = candidate;
        break;
      }
    }

    const result = engineTick(engineState, nextDir);

    if (result.died) {
      set({
        engineState: result.state,
        snake: result.state.snake,
        food: result.state.food,
        direction: result.state.direction,
        directionQueue: [],
        stats: { ...result.state.stats },
      });
      get().gameOver();
      return;
    }

    set({
      engineState: result.state,
      snake: result.state.snake,
      food: result.state.food,
      direction: result.state.direction,
      directionQueue: newQueue,
      stats: { ...result.state.stats },
      lastEatenFood: result.ate,
    });
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
