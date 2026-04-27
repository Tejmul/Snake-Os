export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type InputMode = 'keyboard' | 'gesture' | 'voice';
export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';
export type ChallengeType =
  | 'asteroid_rain'
  | 'gravity_shift'
  | 'speed_surge'
  | 'reverse_controls'
  | 'fog_of_war'
  | 'portal_madness'
  | 'shrink_arena'
  | 'mirror_snake';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment extends Position {
  index: number;
  isHead: boolean;
}

export interface FoodItem {
  position: Position;
  type: 'normal' | 'golden' | 'speed' | 'shrink';
  points: number;
  spawnTime: number;
}

export interface Challenge {
  type: ChallengeType;
  name: string;
  description: string;
  duration: number;
  difficulty: 1 | 2 | 3;
  active: boolean;
  timeRemaining: number;
}

export interface GameStats {
  score: number;
  length: number;
  speed: number;
  timeAlive: number;
  foodEaten: number;
  challengesCompleted: number;
  maxCombo: number;
  currentCombo: number;
}

export interface GestureState {
  detected: boolean;
  direction: Direction | 'STOP' | null;
  confidence: number;
  landmarks: unknown | null;
}

export interface VoiceState {
  listening: boolean;
  lastCommand: string | null;
  confidence: number;
  transcript: string;
}

export interface Portal {
  id: string;
  entry: Position;
  exit: Position;
  color: string;
}

export interface EngineState {
  snake: SnakeSegment[];
  food: FoodItem[];
  direction: Direction;
  stats: GameStats;
  gridSize: number;
  alive: boolean;
  lastFoodTime: number;
  portals: Portal[];
  shrunkWalls: number;
}
