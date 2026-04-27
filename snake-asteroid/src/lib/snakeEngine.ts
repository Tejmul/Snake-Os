import type {
  Direction,
  Position,
  SnakeSegment,
  FoodItem,
  EngineState,
  Portal,
} from '@/types/game';
import {
  GRID_SIZE,
  INITIAL_LENGTH,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  MIN_SPEED,
  FOOD_TYPES,
  DIRECTION_VECTOR,
  OPPOSITE_DIRECTION,
  COMBO_WINDOW,
  MAX_COMBO,
} from './constants';

let rngSeed = Date.now();

function pseudoRandom(): number {
  rngSeed = (rngSeed * 16807 + 0) % 2147483647;
  return (rngSeed & 0x7fffffff) / 0x7fffffff;
}

function randomInt(min: number, max: number): number {
  return Math.floor(pseudoRandom() * (max - min + 1)) + min;
}

export function initGame(gridSize: number = GRID_SIZE): EngineState {
  rngSeed = Date.now();
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);

  const snake: SnakeSegment[] = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    snake.push({
      x: centerX - i,
      y: centerY,
      index: i,
      isHead: i === 0,
    });
  }

  const state: EngineState = {
    snake,
    food: [],
    direction: 'RIGHT',
    stats: {
      score: 0,
      length: INITIAL_LENGTH,
      speed: INITIAL_SPEED,
      timeAlive: 0,
      foodEaten: 0,
      challengesCompleted: 0,
      maxCombo: 0,
      currentCombo: 0,
    },
    gridSize,
    alive: true,
    lastFoodTime: 0,
    portals: [],
    shrunkWalls: 0,
  };

  return { ...state, food: [spawnFood(state)] };
}

export function tick(
  state: EngineState,
  direction: Direction
): { state: EngineState; ate: FoodItem | null; died: 'wall' | 'self' | null } {
  if (!state.alive) {
    return { state, ate: null, died: null };
  }

  const vec = DIRECTION_VECTOR[direction];
  const head = state.snake[0];
  const newHead: Position = {
    x: head.x + vec.x,
    y: head.y + vec.y,
  };

  const collision = checkCollision(state, newHead);
  if (collision) {
    return {
      state: { ...state, alive: false },
      ate: null,
      died: collision,
    };
  }

  let ate: FoodItem | null = null;
  const remaining: FoodItem[] = [];
  for (const food of state.food) {
    if (food.position.x === newHead.x && food.position.y === newHead.y) {
      ate = food;
    } else {
      remaining.push(food);
    }
  }

  const newSnake: SnakeSegment[] = [
    { x: newHead.x, y: newHead.y, index: 0, isHead: true },
    ...state.snake.map((seg, i) => ({
      ...seg,
      index: i + 1,
      isHead: false,
    })),
  ];

  if (!ate) {
    newSnake.pop();
  }

  const now = Date.now();
  let currentCombo = state.stats.currentCombo;
  let maxCombo = state.stats.maxCombo;
  let score = state.stats.score;
  let foodEaten = state.stats.foodEaten;
  let lastFoodTime = state.lastFoodTime;

  if (ate) {
    if (now - lastFoodTime < COMBO_WINDOW && lastFoodTime > 0) {
      currentCombo = Math.min(currentCombo + 1, MAX_COMBO);
    } else {
      currentCombo = 1;
    }
    maxCombo = Math.max(maxCombo, currentCombo);

    const points = ate.points * currentCombo;
    score += points;
    foodEaten += 1;
    lastFoodTime = now;
  } else {
    if (lastFoodTime > 0 && now - lastFoodTime > COMBO_WINDOW) {
      currentCombo = 0;
    }
  }

  const newLength = newSnake.length;
  const speed = Math.max(
    MIN_SPEED,
    INITIAL_SPEED - (foodEaten * SPEED_INCREMENT)
  );

  const newState: EngineState = {
    ...state,
    snake: newSnake,
    food: remaining,
    direction,
    stats: {
      ...state.stats,
      score,
      length: newLength,
      speed,
      foodEaten,
      currentCombo,
      maxCombo,
    },
    lastFoodTime,
  };

  if (ate && remaining.length === 0) {
    remaining.push(spawnFood(newState));
    newState.food = remaining;
  }

  return { state: newState, ate, died: null };
}

export function spawnFood(state: EngineState): FoodItem {
  const occupied = new Set<string>();
  for (const seg of state.snake) {
    occupied.add(`${seg.x},${seg.y}`);
  }
  for (const f of state.food) {
    occupied.add(`${f.position.x},${f.position.y}`);
  }

  const wallOffset = state.shrunkWalls;
  const min = 0 + wallOffset;
  const max = state.gridSize - 1 - wallOffset;

  let x: number, y: number;
  let attempts = 0;
  do {
    x = randomInt(min, max);
    y = randomInt(min, max);
    attempts++;
  } while (occupied.has(`${x},${y}`) && attempts < 1000);

  const roll = pseudoRandom();
  let type: FoodItem['type'] = 'normal';
  let cumulative = 0;
  for (const [key, val] of Object.entries(FOOD_TYPES)) {
    cumulative += val.probability;
    if (roll <= cumulative) {
      type = key as FoodItem['type'];
      break;
    }
  }

  return {
    position: { x, y },
    type,
    points: FOOD_TYPES[type].points,
    spawnTime: Date.now(),
  };
}

export function checkCollision(
  state: EngineState,
  pos: Position
): 'wall' | 'self' | null {
  const wallOffset = state.shrunkWalls;
  const min = 0 + wallOffset;
  const max = state.gridSize - 1 - wallOffset;

  if (pos.x < min || pos.x > max || pos.y < min || pos.y > max) {
    return 'wall';
  }

  for (let i = 0; i < state.snake.length; i++) {
    if (state.snake[i].x === pos.x && state.snake[i].y === pos.y) {
      return 'self';
    }
  }

  return null;
}

export function isOppositeDirection(a: Direction, b: Direction): boolean {
  return OPPOSITE_DIRECTION[a] === b;
}

export function getSpeed(foodEaten: number): number {
  return Math.max(MIN_SPEED, INITIAL_SPEED - foodEaten * SPEED_INCREMENT);
}

export function applyPortalTeleport(
  state: EngineState,
  headPos: Position
): Position | null {
  for (const portal of state.portals) {
    if (portal.entry.x === headPos.x && portal.entry.y === headPos.y) {
      return { ...portal.exit };
    }
    if (portal.exit.x === headPos.x && portal.exit.y === headPos.y) {
      return { ...portal.entry };
    }
  }
  return null;
}
