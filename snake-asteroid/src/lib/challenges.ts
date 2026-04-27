import type { Challenge, ChallengeType } from '@/types/game';

export const CHALLENGE_DEFINITIONS: Record<
  ChallengeType,
  Omit<Challenge, 'active' | 'timeRemaining'>
> = {
  asteroid_rain: {
    type: 'asteroid_rain',
    name: 'ASTEROID RAIN',
    description: 'Dodge falling asteroids!',
    duration: 20,
    difficulty: 2,
  },
  gravity_shift: {
    type: 'gravity_shift',
    name: 'GRAVITY SHIFT',
    description: 'Controls are rotated 90°!',
    duration: 15,
    difficulty: 1,
  },
  speed_surge: {
    type: 'speed_surge',
    name: 'SPEED SURGE',
    description: '3x speed for 10 seconds!',
    duration: 10,
    difficulty: 2,
  },
  reverse_controls: {
    type: 'reverse_controls',
    name: 'REVERSE',
    description: 'All controls are inverted!',
    duration: 15,
    difficulty: 3,
  },
  fog_of_war: {
    type: 'fog_of_war',
    name: 'FOG OF WAR',
    description: 'Limited visibility!',
    duration: 20,
    difficulty: 2,
  },
  portal_madness: {
    type: 'portal_madness',
    name: 'PORTALS',
    description: 'Teleport portals appear!',
    duration: 25,
    difficulty: 2,
  },
  shrink_arena: {
    type: 'shrink_arena',
    name: 'CLOSING IN',
    description: 'The arena shrinks!',
    duration: 30,
    difficulty: 3,
  },
  mirror_snake: {
    type: 'mirror_snake',
    name: 'DOPPELGANGER',
    description: 'A ghost snake mirrors you!',
    duration: 20,
    difficulty: 3,
  },
};

const ALL_TYPES: ChallengeType[] = Object.keys(CHALLENGE_DEFINITIONS) as ChallengeType[];

export function pickRandomChallenge(history: ChallengeType[]): Challenge {
  const recent = history.slice(-3);
  const available = ALL_TYPES.filter((t) => !recent.includes(t));
  const pool = available.length > 0 ? available : ALL_TYPES;
  const type = pool[Math.floor(Math.random() * pool.length)];
  const def = CHALLENGE_DEFINITIONS[type];

  return {
    ...def,
    active: true,
    timeRemaining: def.duration,
  };
}

export function createChallenge(type: ChallengeType): Challenge {
  const def = CHALLENGE_DEFINITIONS[type];
  return {
    ...def,
    active: true,
    timeRemaining: def.duration,
  };
}
