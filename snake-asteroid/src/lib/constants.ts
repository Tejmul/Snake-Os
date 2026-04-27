import type { Direction } from '@/types/game';

export const GRID_SIZE = 25;
export const CELL_SIZE = 1;
export const INITIAL_SPEED = 150;
export const MIN_SPEED = 50;
export const SPEED_INCREMENT = 5;
export const INITIAL_LENGTH = 4;

export const FOOD_TYPES = {
  normal: { points: 10, color: '#ff6a00', probability: 0.7 },
  golden: { points: 50, color: '#ffd700', probability: 0.1 },
  speed:  { points: 20, color: '#00d4ff', probability: 0.1 },
  shrink: { points: 30, color: '#39ff14', probability: 0.1 },
} as const;

export const CHALLENGE_INTERVAL = 30;
export const MAX_ACTIVE_CHALLENGES = 2;
export const COMBO_WINDOW = 3000;
export const MAX_COMBO = 5;

export const VOICE_COMMANDS: Record<string, Direction | 'STOP' | 'CHALLENGE'> = {
  'left': 'LEFT', 'go left': 'LEFT', 'turn left': 'LEFT',
  'right': 'RIGHT', 'go right': 'RIGHT', 'turn right': 'RIGHT',
  'up': 'UP', 'go up': 'UP', 'turn up': 'UP',
  'down': 'DOWN', 'go down': 'DOWN', 'turn down': 'DOWN',
  'stop': 'STOP', 'pause': 'STOP', 'wait': 'STOP',
  'challenge': 'CHALLENGE', 'challenge mode': 'CHALLENGE',
};

export const GESTURE_THRESHOLDS = {
  minConfidence: 0.7,
  swipeMinDistance: 0.15,
  holdDuration: 300,
} as const;

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export const DIRECTION_VECTOR: Record<Direction, { x: number; y: number }> = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y: 1  },
  LEFT:  { x: -1, y: 0  },
  RIGHT: { x: 1,  y: 0  },
};
