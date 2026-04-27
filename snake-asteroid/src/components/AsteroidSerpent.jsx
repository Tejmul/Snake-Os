import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import {
  Stars,
  OrbitControls,
  Text,
  Billboard,
  Sphere,
  Box,
  Dodecahedron,
  Icosahedron,
  Octahedron,
  Cone,
  Torus,
  shaderMaterial,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  Scanline,
} from "@react-three/postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   SECTION 0 — CSS VARIABLES & GLOBAL STYLES (injected on mount)
   ═══════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

:root {
  --void-black: #05050a;
  --nebula-dark: #0a0d14;
  --asteroid-gray: #1a1a2e;
  --cosmic-purple: #6c3fa0;
  --plasma-blue: #00d4ff;
  --solar-orange: #ff6a00;
  --supernova-gold: #ffd700;
  --alien-green: #39ff14;
  --danger-red: #ff1744;
  --star-white: #e0e0ff;
  --challenge-glow: #ff00ff;
  --challenge-chaos: #ff3366;
  --neon-pink: #ff2d95;
  --deep-cyan: #00fff7;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--void-black);
  color: var(--star-white);
  font-family: 'Rajdhani', sans-serif;
  overflow: hidden;
}

.game-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: var(--void-black);
}

.gridscan-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.35;
}

.canvas-layer {
  position: fixed;
  inset: 0;
  z-index: 1;
}

.hud-layer {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}
.hud-layer > * { pointer-events: auto; }

.hud-stats {
  position: absolute;
  top: 24px;
  left: 24px;
  background: rgba(5,5,10,0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0,212,255,0.2);
  border-radius: 12px;
  padding: 16px 24px;
  min-width: 260px;
}
.hud-stats .score-line {
  font-family: 'Orbitron', monospace;
  font-size: 28px;
  font-weight: 800;
  color: var(--supernova-gold);
  text-shadow: 0 0 20px rgba(255,215,0,0.5);
  display: flex;
  align-items: center;
  gap: 12px;
}
.hud-stats .combo {
  font-size: 16px;
  color: var(--neon-pink);
  animation: combo-pulse 0.6s ease-in-out infinite alternate;
}
@keyframes combo-pulse {
  from { transform: scale(1); opacity: 0.8; }
  to { transform: scale(1.15); opacity: 1; }
}
.hud-stats .meta-line {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: rgba(224,224,255,0.6);
  margin-top: 6px;
  display: flex;
  gap: 16px;
}
.hud-stats .meta-line span { display: flex; align-items: center; gap: 4px; }

.hud-input-mode {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(5,5,10,0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0,212,255,0.15);
  border-radius: 10px;
  padding: 10px 18px;
  font-family: 'Orbitron', monospace;
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--plasma-blue);
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
}
.hud-input-mode:hover {
  border-color: var(--plasma-blue);
  box-shadow: 0 0 20px rgba(0,212,255,0.3);
}

.hud-challenge-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
}
.challenge-card {
  background: rgba(255,23,68,0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,23,68,0.4);
  border-radius: 10px;
  padding: 10px 20px;
  min-width: 180px;
}
.challenge-card .ch-name {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--danger-red);
  text-shadow: 0 0 10px rgba(255,23,68,0.5);
}
.challenge-card .ch-timer {
  margin-top: 6px;
  height: 3px;
  background: rgba(255,23,68,0.2);
  border-radius: 2px;
  overflow: hidden;
}
.challenge-card .ch-timer-fill {
  height: 100%;
  background: var(--danger-red);
  box-shadow: 0 0 8px var(--danger-red);
  transition: width 1s linear;
}

.hud-voice {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.voice-mic {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(5,5,10,0.8);
  border: 2px solid var(--alien-green);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 0 20px rgba(57,255,20,0.3);
  animation: mic-ring 2s ease-in-out infinite;
}
@keyframes mic-ring {
  0%, 100% { box-shadow: 0 0 10px rgba(57,255,20,0.2); }
  50% { box-shadow: 0 0 30px rgba(57,255,20,0.5), 0 0 60px rgba(57,255,20,0.2); }
}
.voice-cmd {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--alien-green);
  text-shadow: 0 0 10px rgba(57,255,20,0.5);
  opacity: 0;
  transition: opacity 0.3s;
}
.voice-cmd.active { opacity: 1; }

.hud-gesture {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.gesture-arrow {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(5,5,10,0.8);
  border: 2px solid var(--plasma-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--plasma-blue);
  text-shadow: 0 0 15px rgba(0,212,255,0.6);
  box-shadow: 0 0 20px rgba(0,212,255,0.2);
  transition: all 0.15s;
}
.gesture-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: rgba(0,212,255,0.7);
  letter-spacing: 2px;
}

.minimap {
  position: absolute;
  bottom: 24px;
  left: 24px;
  width: 140px;
  height: 140px;
  background: rgba(5,5,10,0.8);
  border: 1px solid rgba(0,212,255,0.2);
  border-radius: 8px;
  overflow: hidden;
}
.minimap canvas {
  width: 100%;
  height: 100%;
}

.menu-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(5,5,10,0.85);
  backdrop-filter: blur(8px);
}
.menu-title {
  font-family: 'Orbitron', monospace;
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 900;
  letter-spacing: 6px;
  background: linear-gradient(135deg, var(--plasma-blue), var(--neon-pink), var(--supernova-gold));
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: title-shimmer 4s ease-in-out infinite;
  text-align: center;
  position: relative;
}
@keyframes title-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.menu-title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--plasma-blue), var(--neon-pink), var(--supernova-gold));
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: title-shimmer 4s ease-in-out infinite;
  filter: blur(20px);
  opacity: 0.5;
  z-index: -1;
}
.menu-tagline {
  font-family: 'Rajdhani', sans-serif;
  font-size: 16px;
  font-style: italic;
  color: rgba(224,224,255,0.4);
  margin-top: 8px;
  letter-spacing: 4px;
}
.menu-divider {
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--plasma-blue), transparent);
  margin: 32px 0;
  box-shadow: 0 0 10px var(--plasma-blue);
}
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}
.menu-btn {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 3px;
  padding: 14px 48px;
  min-width: 300px;
  text-align: center;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  text-transform: uppercase;
}
.menu-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  transition: transform 0.4s;
}
.menu-btn:hover::before { transform: translateX(0); }

.menu-btn.primary {
  color: var(--alien-green);
  border-color: var(--alien-green);
  text-shadow: 0 0 10px rgba(57,255,20,0.5);
}
.menu-btn.primary::before { background: rgba(57,255,20,0.1); }
.menu-btn.primary:hover {
  box-shadow: 0 0 30px rgba(57,255,20,0.3), inset 0 0 30px rgba(57,255,20,0.05);
}

.menu-btn.challenge-btn {
  color: var(--challenge-glow);
  border-color: var(--challenge-glow);
}
.menu-btn.challenge-btn::before { background: rgba(255,0,255,0.1); }
.menu-btn.challenge-btn:hover {
  box-shadow: 0 0 30px rgba(255,0,255,0.3);
}
.menu-btn.challenge-btn.active {
  background: rgba(255,0,255,0.15);
  box-shadow: 0 0 40px rgba(255,0,255,0.4);
}

.menu-btn.secondary {
  color: var(--plasma-blue);
  border-color: rgba(0,212,255,0.4);
}
.menu-btn.secondary::before { background: rgba(0,212,255,0.08); }
.menu-btn.secondary:hover {
  box-shadow: 0 0 20px rgba(0,212,255,0.2);
}

.menu-input-cards {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}
.input-card {
  width: 160px;
  padding: 20px 16px;
  background: rgba(5,5,10,0.8);
  border: 1px solid rgba(0,212,255,0.15);
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}
.input-card:hover {
  border-color: rgba(0,212,255,0.4);
  transform: translateY(-2px);
}
.input-card.selected {
  border-color: var(--plasma-blue);
  box-shadow: 0 0 25px rgba(0,212,255,0.25);
  background: rgba(0,212,255,0.08);
}
.input-card .ic-icon { font-size: 32px; margin-bottom: 8px; }
.input-card .ic-label {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--plasma-blue);
}
.input-card .ic-desc {
  font-size: 11px;
  color: rgba(224,224,255,0.4);
  margin-top: 4px;
}

.menu-footer {
  position: absolute;
  bottom: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: rgba(224,224,255,0.2);
  letter-spacing: 2px;
}

.gameover-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(5,5,10,0.9);
  backdrop-filter: blur(12px);
  animation: fade-in 0.5s ease;
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.gameover-title {
  font-family: 'Orbitron', monospace;
  font-size: clamp(40px, 7vw, 80px);
  font-weight: 900;
  color: var(--danger-red);
  text-shadow: 0 0 40px rgba(255,23,68,0.6), 0 0 80px rgba(255,23,68,0.3);
  animation: glitch 0.15s infinite;
  letter-spacing: 8px;
}
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, -2px); }
  80% { transform: translate(1px, 2px); }
  100% { transform: translate(0); }
}
.gameover-stats {
  margin-top: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 40px;
}
.gameover-stat {
  text-align: center;
}
.gameover-stat .gs-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(224,224,255,0.4);
  text-transform: uppercase;
}
.gameover-stat .gs-value {
  font-family: 'Orbitron', monospace;
  font-size: 24px;
  font-weight: 700;
  color: var(--supernova-gold);
  text-shadow: 0 0 15px rgba(255,215,0,0.4);
}
.gameover-buttons {
  margin-top: 40px;
  display: flex;
  gap: 16px;
}

.scanline-overlay {
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.08) 2px,
    rgba(0,0,0,0.08) 4px
  );
  opacity: 0;
  transition: opacity 0.5s;
}
.scanline-overlay.active { opacity: 1; }

.challenge-announce {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  font-family: 'Orbitron', monospace;
  font-size: clamp(24px, 4vw, 48px);
  font-weight: 900;
  letter-spacing: 6px;
  color: var(--danger-red);
  text-shadow: 0 0 30px rgba(255,23,68,0.8), 0 0 60px rgba(255,23,68,0.4);
  animation: announce-in 0.3s ease, glitch 0.1s 0.3s infinite;
  pointer-events: none;
}
@keyframes announce-in {
  from { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.dpad {
  position: absolute;
  bottom: 100px;
  right: 24px;
  display: grid;
  grid-template-areas:
    ". up ."
    "left . right"
    ". down .";
  gap: 4px;
  z-index: 20;
}
.dpad-btn {
  width: 56px;
  height: 56px;
  background: rgba(5,5,10,0.7);
  border: 1px solid rgba(0,212,255,0.25);
  border-radius: 8px;
  color: var(--plasma-blue);
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.dpad-btn:active {
  background: rgba(0,212,255,0.15);
  box-shadow: 0 0 15px rgba(0,212,255,0.3);
}
.dpad-btn.up { grid-area: up; }
.dpad-btn.down { grid-area: down; }
.dpad-btn.left { grid-area: left; }
.dpad-btn.right { grid-area: right; }
`;

/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — CONSTANTS & TYPES
   ═══════════════════════════════════════════════════════════════ */
const GRID = 25;
const CELL = 1;
const INITIAL_SPEED = 160;
const MIN_SPEED = 55;
const SPEED_INC = 4;

const DIRS = {
  UP: { x: 0, y: 1 },
  DOWN: { x: 0, y: -1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITE = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };

const FOOD_DEFS = {
  normal: { pts: 10, color: "#ff6a00", prob: 0.65 },
  golden: { pts: 50, color: "#ffd700", prob: 0.1 },
  speed: { pts: 20, color: "#00d4ff", prob: 0.13 },
  shrink: { pts: 30, color: "#39ff14", prob: 0.12 },
};

const CHALLENGE_DEFS = [
  { type: "asteroid_rain", name: "ASTEROID RAIN", dur: 18, diff: 2 },
  { type: "speed_surge", name: "SPEED SURGE", dur: 10, diff: 2 },
  { type: "reverse_controls", name: "REVERSE", dur: 14, diff: 3 },
  { type: "fog_of_war", name: "FOG OF WAR", dur: 18, diff: 2 },
  { type: "shrink_arena", name: "CLOSING IN", dur: 25, diff: 3 },
  { type: "mirror_snake", name: "DOPPELGANGER", dur: 18, diff: 3 },
];

const VOICE_MAP = {
  left: "LEFT", "go left": "LEFT", "turn left": "LEFT",
  right: "RIGHT", "go right": "RIGHT", "turn right": "RIGHT",
  up: "UP", "go up": "UP", "turn up": "UP",
  down: "DOWN", "go down": "DOWN", "turn down": "DOWN",
  stop: "PAUSE", pause: "PAUSE", resume: "RESUME",
  challenge: "CHALLENGE", "challenge mode": "CHALLENGE",
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — PURE GAME ENGINE
   ═══════════════════════════════════════════════════════════════ */
function createInitialState() {
  const mid = Math.floor(GRID / 2);
  const snake = [];
  for (let i = 0; i < 4; i++) {
    snake.push({ x: mid - i, y: mid, idx: i });
  }
  return {
    snake,
    dir: "RIGHT",
    food: spawnFood(snake),
    score: 0,
    length: 4,
    speed: INITIAL_SPEED,
    alive: true,
    combo: 0,
    maxCombo: 0,
    lastEatTime: 0,
    foodEaten: 0,
    arenaSize: GRID,
  };
}

function spawnFood(snake, arenaSize = GRID) {
  const occ = new Set(snake.map((s) => `${s.x},${s.y}`));
  let pos;
  let tries = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * arenaSize),
      y: Math.floor(Math.random() * arenaSize),
    };
    tries++;
  } while (occ.has(`${pos.x},${pos.y}`) && tries < 500);

  const r = Math.random();
  let cum = 0;
  let type = "normal";
  for (const [k, v] of Object.entries(FOOD_DEFS)) {
    cum += v.prob;
    if (r < cum) { type = k; break; }
  }
  return { ...pos, type, pts: FOOD_DEFS[type].pts };
}

function gameTick(state, inputDir, now, reverseControls = false) {
  if (!state.alive) return state;

  let dir = inputDir || state.dir;

  if (reverseControls) {
    const REV = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    dir = REV[dir] || dir;
  }

  if (OPPOSITE[dir] === state.dir) dir = state.dir;

  const head = state.snake[0];
  const d = DIRS[dir];
  const nx = head.x + d.x;
  const ny = head.y + d.y;

  const sz = state.arenaSize || GRID;
  if (nx < 0 || nx >= sz || ny < 0 || ny >= sz) {
    return { ...state, alive: false, dir };
  }

  for (let i = 0; i < state.snake.length - 1; i++) {
    if (state.snake[i].x === nx && state.snake[i].y === ny) {
      return { ...state, alive: false, dir };
    }
  }

  const newSnake = [{ x: nx, y: ny, idx: 0 }, ...state.snake.map((s, i) => ({ ...s, idx: i + 1 }))];

  let ate = false;
  let newFood = state.food;
  let newScore = state.score;
  let newLen = state.length;
  let newSpeed = state.speed;
  let combo = state.combo;
  let maxCombo = state.maxCombo;
  let foodEaten = state.foodEaten;

  if (nx === state.food.x && ny === state.food.y) {
    ate = true;
    const timeSince = now - state.lastEatTime;
    combo = timeSince < 3000 ? Math.min(combo + 1, 5) : 1;
    maxCombo = Math.max(maxCombo, combo);
    const pts = state.food.pts * combo;
    newScore += pts;
    newLen += 1;
    newSpeed = Math.max(MIN_SPEED, newSpeed - SPEED_INC);
    foodEaten += 1;
    newFood = spawnFood(newSnake, sz);
  }

  if (!ate) newSnake.pop();

  return {
    ...state,
    snake: newSnake,
    dir,
    food: newFood,
    score: newScore,
    length: newLen,
    speed: newSpeed,
    combo: ate ? combo : state.combo,
    maxCombo,
    lastEatTime: ate ? now : state.lastEatTime,
    foodEaten,
    alive: true,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3 — SOUND SYNTH (Web Audio API, zero audio files)
   ═══════════════════════════════════════════════════════════════ */
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  _osc(freq, dur, type = "sine", vol = 0.15) {
    if (!this.enabled || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }
  eat() {
    this._osc(400, 0.08, "square", 0.1);
    setTimeout(() => this._osc(800, 0.06, "square", 0.08), 30);
  }
  eatGolden() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this._osc(f, 0.12, "sine", 0.1), i * 50)
    );
  }
  eatSpeed() {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(200, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    o.connect(g).connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.2);
  }
  death() {
    this._osc(80, 0.6, "sawtooth", 0.2);
    this._osc(60, 0.8, "sine", 0.15);
    setTimeout(() => {
      if (!this.ctx || !this.enabled) return;
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      s.buffer = buf;
      g.gain.setValueAtTime(0.12, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      s.connect(g).connect(this.ctx.destination);
      s.start();
    }, 100);
  }
  challengeStart() {
    [800, 1200, 800, 1200, 800, 1200].forEach((f, i) =>
      setTimeout(() => this._osc(f, 0.08, "square", 0.12), i * 80)
    );
  }
  challengeDone() {
    [523, 659, 784].forEach((f, i) =>
      setTimeout(() => this._osc(f, 0.2, "sine", 0.12), i * 80)
    );
  }
  tick() { this._osc(1000, 0.015, "sine", 0.03); }
  combo() { this._osc(1200, 0.1, "sine", 0.08); }
  menuHover() { this._osc(600, 0.03, "sine", 0.04); }
  menuSelect() { this._osc(800, 0.06, "square", 0.06); }
}

const synth = new SoundSynth();

/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — GRIDSCAN SHADER BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
const GridScanBG = memo(({ challengeActive }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const gl = cvs.getContext("webgl2") || cvs.getContext("webgl");
    if (!gl) return;

    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      gl.viewport(0, 0, cvs.width, cvs.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const vsrc = `
      attribute vec2 a_pos;
      varying vec2 vUv;
      void main() {
        vUv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;
    const fsrc = `
      precision highp float;
      uniform vec3 iRes;
      uniform float iTime;
      uniform float uChallenge;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = (uv * 2.0 - 1.0) * vec2(iRes.x / iRes.y, 1.0);

        float scale = 0.12;
        vec2 g = p / scale;
        vec2 s = vec2(1.0, 1.7320508);
        vec2 a = mod(g, s) - s * 0.5;
        vec2 b = mod(g + s * 0.5, s) - s * 0.5;
        float d = min(dot(a, a), dot(b, b));
        float hex = smoothstep(0.38, 0.42, sqrt(d));

        float gx = abs(fract(g.x) - 0.5);
        float gy = abs(fract(g.y) - 0.5);
        float line = 1.0 - smoothstep(0.0, 0.04, min(gx, gy));
        line *= 0.15;

        float scanSpeed = 0.4;
        float scanZ = mod(iTime * scanSpeed, 3.0) - 0.5;
        float scanD = abs(p.y - scanZ);
        float scan = exp(-scanD * scanD * 20.0) * 0.6;

        vec3 lineCol = mix(
          vec3(0.18, 0.1, 0.28),
          vec3(0.4, 0.05, 0.15),
          uChallenge
        );
        vec3 scanCol = mix(
          vec3(1.0, 0.62, 0.99),
          vec3(1.0, 0.1, 0.3),
          uChallenge
        );

        vec3 col = lineCol * line * (1.0 - hex * 0.5);
        col += scanCol * scan;

        float vig = 1.0 - length(p) * 0.4;
        col *= vig;

        float n = hash(gl_FragCoord.xy + vec2(iTime * 37.0));
        col += (n - 0.5) * 0.015;

        float alpha = clamp(line + scan * 0.8, 0.0, 0.5);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "iRes");
    const uTime = gl.getUniformLocation(prog, "iTime");
    const uCh = gl.getUniformLocation(prog, "uChallenge");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let challengeVal = 0;
    rendererRef.current = { uRes, uTime, uCh, gl, prog, challengeVal };

    const render = (t) => {
      const time = t / 1000;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform3f(uRes, cvs.width, cvs.height, 1);
      gl.uniform1f(uTime, time);

      const r = rendererRef.current;
      r.challengeVal += (challengeActive ? 1 : 0 - r.challengeVal) * 0.02;
      gl.uniform1f(uCh, Math.min(1, Math.max(0, r.challengeVal)));

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.challengeVal = challengeActive ? 1 : 0;
    }
  }, [challengeActive]);

  return <canvas ref={canvasRef} className="gridscan-bg" />;
});

/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — THREE.JS SCENE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function Lighting({ challengeMode }) {
  const pointRef = useRef();
  useFrame(({ clock }) => {
    if (challengeMode && pointRef.current) {
      pointRef.current.intensity = 1 + Math.sin(clock.elapsedTime * 4) * 1.5;
    }
  });
  return (
    <>
      <ambientLight intensity={0.12} color="#1a1a3e" />
      <directionalLight
        position={[10, 15, -5]}
        intensity={0.9}
        color="#ff8844"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-8, 10, 8]} intensity={0.35} color="#0066ff" />
      {challengeMode && (
        <pointLight ref={pointRef} position={[GRID/2, 2, GRID/2]} color="#ff1744" intensity={0} distance={30} />
      )}
    </>
  );
}

const HexGridMaterial = shaderMaterial(
  { uTime: 0, uChallenge: 0, uSize: GRID },
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `precision highp float;
   uniform float uTime;
   uniform float uChallenge;
   uniform float uSize;
   varying vec2 vUv;

   void main() {
     vec2 p = vUv * uSize;
     
     vec2 s = vec2(1.0, 1.732);
     vec2 a = mod(p, s) - s * 0.5;
     vec2 b = mod(p + s * 0.5, s) - s * 0.5;
     float d = min(dot(a,a), dot(b,b));
     float hex = smoothstep(0.22, 0.26, sqrt(d));
     
     float pulse = 1.0 + sin(uTime * 3.0) * 0.15 * uChallenge;
     
     vec3 baseCol = mix(
       vec3(0.04, 0.04, 0.08),
       vec3(0.08, 0.02, 0.04),
       uChallenge
     );
     vec3 lineCol = mix(
       vec3(0.12, 0.06, 0.22),
       vec3(0.3, 0.04, 0.1),
       uChallenge
     ) * pulse;
     
     vec3 col = mix(lineCol, baseCol, hex);
     
     float scan = exp(-pow(fract(p.y * 0.05 - uTime * 0.1) - 0.5, 2.0) * 80.0) * 0.15;
     col += vec3(0.3, 0.1, 0.5) * scan;
     
     gl_FragColor = vec4(col, 0.95);
   }`
);
extend({ HexGridMaterial });

function GameBoard({ arenaSize, challengeMode }) {
  const matRef = useRef();
  const sz = arenaSize || GRID;
  const half = sz / 2;
  const wallH = 0.6;
  const wallThick = 0.15;

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uTime = clock.elapsedTime;
      matRef.current.uChallenge = THREE.MathUtils.lerp(
        matRef.current.uChallenge, challengeMode ? 1 : 0, 0.03
      );
      matRef.current.uSize = sz;
    }
  });

  const wallMat = useMemo(() => (
    <meshStandardMaterial
      color="#0a0a1a"
      metalness={0.95}
      roughness={0.15}
      emissive={challengeMode ? "#330011" : "#000833"}
      emissiveIntensity={challengeMode ? 0.6 : 0.3}
    />
  ), [challengeMode]);

  const edgeGlow = useMemo(() => (
    <meshStandardMaterial
      color="#000000"
      emissive={challengeMode ? "#ff1744" : "#00d4ff"}
      emissiveIntensity={0.8}
      transparent
      opacity={0.6}
    />
  ), [challengeMode]);

  return (
    <group position={[half, 0, half]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[sz, sz]} />
        <hexGridMaterial ref={matRef} transparent />
      </mesh>

      {[
        { p: [0, wallH/2, -half - wallThick/2], s: [sz + wallThick*2, wallH, wallThick] },
        { p: [0, wallH/2, half + wallThick/2], s: [sz + wallThick*2, wallH, wallThick] },
        { p: [-half - wallThick/2, wallH/2, 0], s: [wallThick, wallH, sz] },
        { p: [half + wallThick/2, wallH/2, 0], s: [wallThick, wallH, sz] },
      ].map((w, i) => (
        <group key={i}>
          <mesh position={w.p} castShadow>
            <boxGeometry args={w.s} />
            {wallMat}
          </mesh>
          <mesh position={[w.p[0], wallH + 0.02, w.p[2]]}>
            <boxGeometry args={[w.s[0], 0.04, w.s[2]]} />
            {edgeGlow}
          </mesh>
        </group>
      ))}

      {[[-half, half], [half, half], [-half, -half], [half, -half]].map(([x, z], i) => (
        <group key={`beacon-${i}`} position={[x, 0, z]}>
          <mesh>
            <cylinderGeometry args={[0.12, 0.15, wallH + 0.3, 6]} />
            <meshStandardMaterial color="#1a1a2e" emissive="#ff6a00" emissiveIntensity={0.8} metalness={0.8} />
          </mesh>
          <pointLight position={[0, wallH, 0]} color="#ff6a00" intensity={0.4} distance={4} />
        </group>
      ))}
    </group>
  );
}

function SnakeBody({ snake, direction, alive, challengeMode }) {
  const groupRef = useRef();
  const prevPositions = useRef([]);
  const currentPositions = useRef([]);
  const lerpProgress = useRef(1);

  useEffect(() => {
    prevPositions.current = currentPositions.current.length
      ? [...currentPositions.current]
      : snake.map(s => [s.x, s.y]);
    currentPositions.current = snake.map(s => [s.x, s.y]);
    lerpProgress.current = 0;
  }, [snake]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    lerpProgress.current = Math.min(1, lerpProgress.current + delta * 12);
    const t = lerpProgress.current;
    const smooth = t * t * (3 - 2 * t);

    groupRef.current.children.forEach((child, i) => {
      if (i >= currentPositions.current.length) return;
      const prev = prevPositions.current[i] || currentPositions.current[i];
      const curr = currentPositions.current[i];
      if (!prev || !curr) return;

      const x = THREE.MathUtils.lerp(prev[0], curr[0], smooth);
      const z = THREE.MathUtils.lerp(prev[1], curr[1], smooth);
      const bob = Math.sin(clock.elapsedTime * 3 + i * 0.5) * 0.04;

      child.position.x = x + 0.5;
      child.position.y = 0.35 + bob;
      child.position.z = z + 0.5;

      if (i === 0) {
        child.position.y = 0.4 + Math.sin(clock.elapsedTime * 4) * 0.03;
      }
    });
  });

  const headColor = alive ? "#39ff14" : "#ff1744";
  const totalLen = snake.length;

  return (
    <group ref={groupRef}>
      {snake.map((seg, i) => {
        const isHead = i === 0;
        const isTail = i === totalLen - 1;
        const ratio = totalLen > 1 ? i / (totalLen - 1) : 0;
        const scale = 1 - ratio * 0.35;

        const r = Math.round(0x39 + (0x0d - 0x39) * ratio);
        const g = Math.round(0xff + (0x4f - 0xff) * ratio);
        const b = Math.round(0x14 + (0x2a - 0x14) * ratio);
        const segColor = `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;

        if (isHead) {
          return (
            <group key="head" position={[seg.x + 0.5, 0.4, seg.y + 0.5]}>
              <mesh castShadow>
                <dodecahedronGeometry args={[0.38, 1]} />
                <meshStandardMaterial
                  color={headColor}
                  emissive={headColor}
                  emissiveIntensity={0.7}
                  metalness={0.6}
                  roughness={0.2}
                />
              </mesh>
              {(() => {
                const d = DIRS[direction] || DIRS.RIGHT;
                const ex = d.x * 0.25;
                const ez = -d.y * 0.25;
                const perp = { x: -d.y, y: d.x };
                return [-1, 1].map(side => (
                  <mesh key={side} position={[ex + perp.x * 0.12 * side, 0.1, ez + (-perp.y) * 0.12 * side]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
                  </mesh>
                ));
              })()}
              <pointLight color={headColor} intensity={1.2} distance={6} />
            </group>
          );
        }

        if (isTail) {
          return (
            <group key={`tail-${i}`} position={[seg.x + 0.5, 0.35, seg.y + 0.5]}>
              <mesh scale={[scale, scale, scale]} castShadow>
                <coneGeometry args={[0.25, 0.5, 6]} />
                <meshStandardMaterial
                  color={segColor}
                  emissive={segColor}
                  emissiveIntensity={0.3}
                  metalness={0.5}
                  roughness={0.3}
                />
              </mesh>
            </group>
          );
        }

        return (
          <mesh key={`seg-${i}`} position={[seg.x + 0.5, 0.35, seg.y + 0.5]} scale={[scale, scale, scale]} castShadow>
            <sphereGeometry args={[0.32, 12, 12]} />
            <meshStandardMaterial
              color={segColor}
              emissive={segColor}
              emissiveIntensity={0.25}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function FoodMesh({ food }) {
  const ref = useRef();
  const spawnTime = useRef(Date.now());

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.x += 0.012;
    ref.current.rotation.y += 0.018;
    ref.current.position.y = 0.5 + Math.sin(t * 2) * 0.15;

    const age = (Date.now() - spawnTime.current) / 300;
    if (age < 1) {
      const s = age < 0.7 ? age / 0.7 * 1.2 : 1.2 - (age - 0.7) / 0.3 * 0.2;
      ref.current.scale.setScalar(s);
    }
  });

  const color = FOOD_DEFS[food.type]?.color || "#ff6a00";
  const emissiveI = food.type === "golden" ? 0.9 : 0.4;

  const Geom = {
    normal: () => <icosahedronGeometry args={[0.32, 0]} />,
    golden: () => <icosahedronGeometry args={[0.4, 1]} />,
    speed: () => <octahedronGeometry args={[0.28]} />,
    shrink: () => <tetrahedronGeometry args={[0.32]} />,
  };

  return (
    <group position={[food.x + 0.5, 0.5, food.y + 0.5]}>
      <mesh ref={ref} castShadow>
        {(Geom[food.type] || Geom.normal)()}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveI}
          roughness={food.type === "speed" ? 0.1 : 0.7}
          metalness={0.3}
          transparent={food.type === "speed"}
          opacity={food.type === "speed" ? 0.85 : 1}
        />
      </mesh>
      <pointLight color={color} intensity={0.6} distance={4} />
      {food.type === "golden" && (
        <>
          {[0, 1, 2].map(i => (
            <mesh key={i} position={[
              Math.cos(Date.now() * 0.002 + i * 2.09) * 0.55,
              0,
              Math.sin(Date.now() * 0.002 + i * 2.09) * 0.55
            ]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function AsteroidField({ challengeMode }) {
  const asteroids = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 25;
      arr.push({
        pos: [
          GRID/2 + Math.cos(angle) * dist,
          Math.random() * 15 - 3,
          GRID/2 + Math.sin(angle) * dist,
        ],
        scale: 0.5 + Math.random() * 2.5,
        rotSpeed: [
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.008,
        ],
        drift: [(Math.random() - 0.5) * 0.008, 0, (Math.random() - 0.5) * 0.008],
        detail: Math.random() > 0.5 ? 0 : 1,
      });
    }
    return arr;
  }, []);

  const refs = useRef([]);

  useFrame(() => {
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const a = asteroids[i];
      mesh.rotation.x += a.rotSpeed[0];
      mesh.rotation.y += a.rotSpeed[1];
      mesh.rotation.z += a.rotSpeed[2];
      mesh.position.x += a.drift[0];
      mesh.position.z += a.drift[2];

      const d = Math.hypot(mesh.position.x - GRID/2, mesh.position.z - GRID/2);
      if (d > 50) {
        const ang = Math.random() * Math.PI * 2;
        mesh.position.x = GRID/2 + Math.cos(ang) * 20;
        mesh.position.z = GRID/2 + Math.sin(ang) * 20;
      }
    });
  });

  return (
    <>
      <Stars radius={120} depth={60} count={6000} factor={3} saturation={0.1} fade speed={0.3} />
      {asteroids.map((a, i) => (
        <mesh
          key={i}
          ref={el => refs.current[i] = el}
          position={a.pos}
          scale={a.scale}
          castShadow
        >
          <icosahedronGeometry args={[1, a.detail]} />
          <meshStandardMaterial
            color={challengeMode ? "#2a0a0a" : "#1a1520"}
            roughness={0.85}
            metalness={0.15}
            emissive={challengeMode ? "#330000" : "#050008"}
            emissiveIntensity={challengeMode ? 0.4 : 0.1}
          />
        </mesh>
      ))}
    </>
  );
}

function Explosions({ explosions }) {
  return explosions.map((exp) => (
    <ExplosionInstance key={exp.id} {...exp} />
  ));
}

function ExplosionInstance({ position, color, startTime }) {
  const groupRef = useRef();
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        dir: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ).normalize(),
        speed: 2 + Math.random() * 4,
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > 0.6) {
      groupRef.current.visible = false;
      return;
    }
    const t = elapsed / 0.6;
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      if (!p) return;
      const dist = p.speed * elapsed * (1 - t * 0.5);
      child.position.set(
        p.dir.x * dist,
        p.dir.y * dist,
        p.dir.z * dist
      );
      const s = (1 - t) * 0.15;
      child.scale.setScalar(Math.max(0.01, s));
      child.material.opacity = 1 - t;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial color={color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

function MirrorSnake({ snake, arenaSize }) {
  const sz = arenaSize || GRID;
  return (
    <group>
      {snake.map((seg, i) => {
        const mx = sz - 1 - seg.x;
        const my = sz - 1 - seg.y;
        const ratio = snake.length > 1 ? i / (snake.length - 1) : 0;
        const scale = (1 - ratio * 0.3) * 0.9;
        return (
          <mesh key={i} position={[mx + 0.5, 0.35, my + 0.5]} scale={[scale, scale, scale]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial
              color="#6c3fa0"
              emissive="#6c3fa0"
              emissiveIntensity={0.6}
              transparent
              opacity={0.55}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function FallingAsteroids({ active, onHitPositions }) {
  const asteroidsRef = useRef([]);
  const groupRef = useRef();

  useEffect(() => {
    if (active) {
      asteroidsRef.current = [];
      for (let i = 0; i < 12; i++) {
        asteroidsRef.current.push({
          x: Math.random() * GRID,
          y: 12 + Math.random() * 8,
          z: Math.random() * GRID,
          speed: 3 + Math.random() * 5,
          landed: false,
        });
      }
    } else {
      asteroidsRef.current = [];
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!active || !groupRef.current) return;
    const hits = [];
    asteroidsRef.current.forEach((a, i) => {
      if (a.landed) return;
      a.y -= a.speed * delta;
      if (a.y <= 0.3) {
        a.landed = true;
        a.y = 0.3;
        hits.push({ x: Math.floor(a.x), y: Math.floor(a.z) });
      }
      const child = groupRef.current.children[i];
      if (child) {
        child.position.set(a.x + 0.5, a.y, a.z + 0.5);
        child.rotation.x += 0.05;
        child.rotation.z += 0.03;
        child.visible = !a.landed;
      }
    });
    if (hits.length > 0 && onHitPositions) onHitPositions(hits);
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {asteroidsRef.current.map((_, i) => (
        <mesh key={i} castShadow>
          <icosahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial
            color="#3a0a0a"
            emissive="#ff1744"
            emissiveIntensity={0.8}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraController({ snake, direction, cameraMode }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(GRID/2, 22, GRID/2 + 10));
  const targetLook = useRef(new THREE.Vector3(GRID/2, 0, GRID/2));

  useFrame(() => {
    if (!snake || snake.length === 0) return;
    const head = snake[0];
    const hx = head.x + 0.5;
    const hz = head.y + 0.5;

    if (cameraMode === "top-down") {
      targetPos.current.set(GRID/2, GRID * 0.85, GRID/2 + GRID * 0.35);
      targetLook.current.set(GRID/2, 0, GRID/2);
    } else if (cameraMode === "follow") {
      const d = DIRS[direction] || DIRS.RIGHT;
      targetPos.current.set(hx - d.x * 8, 7, hz + d.y * 8);
      targetLook.current.set(hx + d.x * 3, 0, hz - d.y * 3);
    } else {
      const t = Date.now() / 1000;
      const phase = Math.floor(t / 6) % 4;
      switch (phase) {
        case 0: targetPos.current.set(hx + 10, 4, hz + 10); break;
        case 1: targetPos.current.set(GRID/2, 28, GRID/2); break;
        case 2: targetPos.current.set(hx - 5, 3, hz); break;
        case 3: targetPos.current.set(hx, 5, hz + 12); break;
      }
      targetLook.current.set(hx, 0, hz);
    }

    camera.position.lerp(targetPos.current, 0.03);
    camera.lookAt(targetLook.current.x, targetLook.current.y, targetLook.current.z);
  });

  return null;
}

function PostFX({ challengeMode }) {
  return (
    <EffectComposer>
      <Bloom
        intensity={challengeMode ? 1.5 : 0.6}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        offset={challengeMode
          ? new THREE.Vector2(0.004, 0.004)
          : new THREE.Vector2(0.0008, 0.0008)
        }
      />
      <Vignette darkness={0.55} offset={0.3} />
      <Noise opacity={0.04} />
    </EffectComposer>
  );
}

function DustParticles() {
  const ref = useRef();
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: Math.random() * GRID,
        y: Math.random() * 3,
        z: Math.random() * GRID,
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.002,
        vz: (Math.random() - 0.5) * 0.003,
      });
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position.array;
    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      if (p.x < 0 || p.x > GRID) p.vx *= -1;
      if (p.y < 0 || p.y > 3) p.vy *= -1;
      if (p.z < 0 || p.z > GRID) p.vz *= -1;
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(particles.length * 3);
    particles.forEach((p, i) => {
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#4a3a6a" size={0.06} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — HUD COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function HUD({ stats, inputMode, onCycleInput, voiceState, gestureDir, challenges, challengeMode }) {
  const time = Math.floor(stats.timeAlive || 0);
  const mins = String(Math.floor(time / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");

  return (
    <div className="hud-layer">
      <div className="hud-stats">
        <div className="score-line">
          <span>◆ {stats.score}</span>
          {stats.combo > 1 && <span className="combo">x{stats.combo} COMBO</span>}
        </div>
        <div className="meta-line">
          <span>◇ LENGTH: {stats.length}</span>
          <span>⚡ SPEED: {Math.round((INITIAL_SPEED - stats.speed) / SPEED_INC)}</span>
        </div>
        <div className="meta-line">
          <span>⏱ {mins}:{secs}</span>
          {challengeMode && <span style={{color: "var(--challenge-glow)"}}>⚠ CHALLENGE</span>}
        </div>
      </div>

      <div className="hud-input-mode" onClick={onCycleInput}>
        {inputMode === "keyboard" ? "⌨ KEYBOARD" :
         inputMode === "gesture" ? "🤚 GESTURE" :
         "🎙 VOICE"}
      </div>

      {inputMode === "voice" && (
        <div className="hud-voice">
          <div className="voice-mic">🎙</div>
          <div className={`voice-cmd ${voiceState?.lastCommand ? "active" : ""}`}>
            {voiceState?.lastCommand || "listening..."}
          </div>
        </div>
      )}

      {inputMode === "gesture" && (
        <div className="hud-gesture">
          <div className="gesture-arrow">
            {gestureDir === "UP" ? "↑" :
             gestureDir === "DOWN" ? "↓" :
             gestureDir === "LEFT" ? "←" :
             gestureDir === "RIGHT" ? "→" : "✋"}
          </div>
          <div className="gesture-label">GESTURE</div>
        </div>
      )}

      {challenges.length > 0 && (
        <div className="hud-challenge-bar">
          {challenges.map((ch, i) => (
            <div key={i} className="challenge-card">
              <div className="ch-name">⚠ {ch.name}</div>
              <div className="ch-timer">
                <div className="ch-timer-fill" style={{
                  width: `${(ch.remaining / ch.dur) * 100}%`
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Minimap stats={stats} />
    </div>
  );
}

function Minimap({ stats }) {
  const canvasRef = useRef();

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    cvs.width = 140;
    cvs.height = 140;
    const scale = 140 / GRID;

    ctx.fillStyle = "rgba(5,5,10,0.9)";
    ctx.fillRect(0, 0, 140, 140);

    ctx.strokeStyle = "rgba(0,212,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 140, 140);

    if (stats.snake) {
      stats.snake.forEach((seg, i) => {
        const ratio = stats.snake.length > 1 ? i / (stats.snake.length - 1) : 0;
        const g = Math.round(255 - ratio * 180);
        ctx.fillStyle = i === 0 ? "#39ff14" : `rgb(20,${g},20)`;
        ctx.fillRect(seg.x * scale, (GRID - 1 - seg.y) * scale, scale, scale);
      });
    }

    if (stats.food) {
      ctx.fillStyle = FOOD_DEFS[stats.food.type]?.color || "#ff6a00";
      ctx.fillRect(stats.food.x * scale, (GRID - 1 - stats.food.y) * scale, scale + 1, scale + 1);
    }
  }, [stats]);

  return (
    <div className="minimap">
      <canvas ref={canvasRef} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — MENU & GAME OVER SCREENS
   ═══════════════════════════════════════════════════════════════ */
function MainMenu({ onStart, challengeMode, onToggleChallenge, inputMode, onSetInput }) {
  const [showInputSelect, setShowInputSelect] = useState(false);

  return (
    <div className="menu-screen">
      <div className="menu-title" data-text="ASTEROID SERPENT">ASTEROID SERPENT</div>
      <div className="menu-tagline">NAVIGATE THE VOID. DEVOUR THE COSMOS.</div>
      <div className="menu-divider" />

      <div className="menu-buttons">
        <button
          className="menu-btn primary"
          onClick={() => { synth.menuSelect(); onStart(); }}
          onMouseEnter={() => synth.menuHover()}
        >
          ▶ START GAME
        </button>
        <button
          className={`menu-btn challenge-btn ${challengeMode ? "active" : ""}`}
          onClick={() => { synth.menuSelect(); onToggleChallenge(); }}
          onMouseEnter={() => synth.menuHover()}
        >
          ⚡ CHALLENGE MODE {challengeMode ? "ON" : "OFF"}
        </button>
        <button
          className="menu-btn secondary"
          onClick={() => { synth.menuSelect(); setShowInputSelect(!showInputSelect); }}
          onMouseEnter={() => synth.menuHover()}
        >
          🎮 INPUT: {inputMode.toUpperCase()}
        </button>
      </div>

      {showInputSelect && (
        <div className="menu-input-cards">
          {[
            { mode: "keyboard", icon: "⌨️", label: "KEYBOARD", desc: "WASD / Arrow keys" },
            { mode: "gesture", icon: "🤚", label: "GESTURE", desc: "Point to steer" },
            { mode: "voice", icon: "🎙️", label: "VOICE", desc: "Speak directions" },
          ].map(({ mode, icon, label, desc }) => (
            <div
              key={mode}
              className={`input-card ${inputMode === mode ? "selected" : ""}`}
              onClick={() => { synth.menuSelect(); onSetInput(mode); }}
              onMouseEnter={() => synth.menuHover()}
            >
              <div className="ic-icon">{icon}</div>
              <div className="ic-label">{label}</div>
              <div className="ic-desc">{desc}</div>
            </div>
          ))}
        </div>
      )}

      <div className="menu-footer">BUILT BY TEJMUL • OS PROJECT 2026</div>
    </div>
  );
}

function GameOverScreen({ stats, onRestart, onMenu }) {
  return (
    <div className="gameover-screen">
      <div className="gameover-title">GAME OVER</div>
      <div className="gameover-stats">
        <div className="gameover-stat">
          <div className="gs-label">SCORE</div>
          <div className="gs-value">{stats.score}</div>
        </div>
        <div className="gameover-stat">
          <div className="gs-label">LENGTH</div>
          <div className="gs-value">{stats.length}</div>
        </div>
        <div className="gameover-stat">
          <div className="gs-label">TIME</div>
          <div className="gs-value">{Math.floor(stats.timeAlive || 0)}s</div>
        </div>
        <div className="gameover-stat">
          <div className="gs-label">MAX COMBO</div>
          <div className="gs-value">x{stats.maxCombo}</div>
        </div>
        <div className="gameover-stat">
          <div className="gs-label">FOOD EATEN</div>
          <div className="gs-value">{stats.foodEaten}</div>
        </div>
        <div className="gameover-stat">
          <div className="gs-label">CHALLENGES</div>
          <div className="gs-value">{stats.challengesDone || 0}</div>
        </div>
      </div>
      <div className="gameover-buttons">
        <button className="menu-btn primary" onClick={onRestart}>▶ PLAY AGAIN</button>
        <button className="menu-btn secondary" onClick={onMenu}>◀ MENU</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — VOICE CONTROLS HOOK (Web Speech API)
   ═══════════════════════════════════════════════════════════════ */
function useVoice(active, onCommand) {
  const [voiceState, setVoiceState] = useState({ listening: false, lastCommand: null, confidence: 0 });
  const recognitionRef = useRef(null);
  const cmdTimeoutRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim().toLowerCase();
        const confidence = event.results[i][0].confidence;

        for (const [phrase, cmd] of Object.entries(VOICE_MAP)) {
          if (transcript.includes(phrase)) {
            onCommand(cmd);
            setVoiceState({ listening: true, lastCommand: cmd, confidence });
            if (cmdTimeoutRef.current) clearTimeout(cmdTimeoutRef.current);
            cmdTimeoutRef.current = setTimeout(() => {
              setVoiceState(s => ({ ...s, lastCommand: null }));
            }, 1500);
            break;
          }
        }
      }
    };

    rec.onerror = () => {
      setTimeout(() => {
        try { rec.start(); } catch {}
      }, 500);
    };

    rec.onend = () => {
      if (active) {
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 100);
      }
    };

    try { rec.start(); } catch {}
    setVoiceState({ listening: true, lastCommand: null, confidence: 0 });

    return () => {
      try { rec.stop(); } catch {}
      if (cmdTimeoutRef.current) clearTimeout(cmdTimeoutRef.current);
    };
  }, [active]);

  return voiceState;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 9 — GESTURE CONTROLS HOOK (MediaPipe Hands)
   ═══════════════════════════════════════════════════════════════ */
function useGestureControls(active, onDirection) {
  const [gestureDir, setGestureDir] = useState(null);
  const lastDirTime = useRef(0);
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        if (!window.Hands) {
          const script1 = document.createElement("script");
          script1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.min.js";
          document.head.appendChild(script1);
          await new Promise(r => script1.onload = r);
        }

        const video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.muted = true;
        videoRef.current = video;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 320, height: 240, frameRate: 30 }
        });
        video.srcObject = stream;
        await video.play();

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
        handsRef.current = hands;

        hands.onResults((results) => {
          if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;
          const now = Date.now();
          if (now - lastDirTime.current < 150) return;

          const lm = results.multiHandLandmarks[0];
          const wrist = lm[0];
          const indexTip = lm[8];

          const dx = indexTip.x - wrist.x;
          const dy = indexTip.y - wrist.y;
          const mag = Math.hypot(dx, dy);

          if (mag < 0.12) {
            const tips = [4,8,12,16,20];
            const mcps = [2,5,9,13,17];
            const isFist = tips.every((t,i) => lm[t].y > lm[mcps[i]].y);
            if (isFist) {
              setGestureDir("STOP");
              return;
            }
            return;
          }

          let dir;
          if (Math.abs(dx) > Math.abs(dy)) {
            dir = dx > 0 ? "LEFT" : "RIGHT";
          } else {
            dir = dy < 0 ? "UP" : "DOWN";
          }

          lastDirTime.current = now;
          setGestureDir(dir);
          onDirection(dir);
        });

        const detect = async () => {
          if (cancelled) return;
          try {
            await hands.send({ image: video });
          } catch {}
          animRef.current = requestAnimationFrame(detect);
        };
        detect();
      } catch (err) {
        console.warn("Gesture init failed:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [active]);

  return gestureDir;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 10 — CHALLENGE MODE ENGINE
   ═══════════════════════════════════════════════════════════════ */
function useChallenges(active, gameRunning) {
  const [challenges, setChallenges] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const lastSpawn = useRef(0);
  const history = useRef([]);
  const intervalRef = useRef(null);
  const challengesDone = useRef(0);

  useEffect(() => {
    if (!active || !gameRunning) {
      setChallenges([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    lastSpawn.current = Date.now();
    intervalRef.current = setInterval(() => {
      setChallenges(prev => {
        const updated = prev
          .map(c => ({ ...c, remaining: c.remaining - 1 }))
          .filter(c => {
            if (c.remaining <= 0) {
              challengesDone.current++;
              synth.challengeDone();
              return false;
            }
            return true;
          });

        if (updated.length < 2 && Date.now() - lastSpawn.current > 25000) {
          const recent = history.current.slice(-3);
          const available = CHALLENGE_DEFS.filter(d => !recent.includes(d.type));
          if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            history.current.push(pick.type);
            lastSpawn.current = Date.now();
            synth.challengeStart();
            setAnnouncement(pick.name);
            setTimeout(() => setAnnouncement(null), 2000);
            return [...updated, { ...pick, remaining: pick.dur }];
          }
        }

        return updated;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, gameRunning]);

  const activeTypes = useMemo(() =>
    new Set(challenges.map(c => c.type))
  , [challenges]);

  return { challenges, announcement, activeTypes, challengesDone: challengesDone.current };
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 11 — THE MAIN GAME COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AsteroidSerpent() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const [screen, setScreen] = useState("menu");
  const [gameState, setGameState] = useState(createInitialState);
  const [paused, setPaused] = useState(false);
  const [challengeMode, setChallengeMode] = useState(false);
  const [inputMode, setInputMode] = useState("keyboard");
  const [cameraMode, setCameraMode] = useState("top-down");
  const [explosions, setExplosions] = useState([]);

  const nextDirRef = useRef("RIGHT");
  const tickTimerRef = useRef(null);
  const startTimeRef = useRef(0);
  const gameRunning = screen === "playing" && !paused;

  const { challenges, announcement, activeTypes, challengesDone } = useChallenges(
    challengeMode, gameRunning
  );

  const voiceState = useVoice(
    inputMode === "voice" && gameRunning,
    useCallback((cmd) => {
      if (cmd === "PAUSE") setPaused(true);
      else if (cmd === "RESUME") setPaused(false);
      else if (cmd === "CHALLENGE") setChallengeMode(c => !c);
      else if (["UP","DOWN","LEFT","RIGHT"].includes(cmd)) {
        if (OPPOSITE[cmd] !== nextDirRef.current) nextDirRef.current = cmd;
      }
    }, [])
  );

  const gestureDir = useGestureControls(
    inputMode === "gesture" && gameRunning,
    useCallback((dir) => {
      if (OPPOSITE[dir] !== nextDirRef.current) nextDirRef.current = dir;
    }, [])
  );

  useEffect(() => {
    const handler = (e) => {
      const keyMap = {
        ArrowUp: "UP", w: "UP", W: "UP",
        ArrowDown: "DOWN", s: "DOWN", S: "DOWN",
        ArrowLeft: "LEFT", a: "LEFT", A: "LEFT",
        ArrowRight: "RIGHT", d: "RIGHT", D: "RIGHT",
      };
      const dir = keyMap[e.key];
      if (dir && screen === "playing") {
        e.preventDefault();
        if (OPPOSITE[dir] !== nextDirRef.current) nextDirRef.current = dir;
      }
      if (e.key === " " && screen === "playing") {
        e.preventDefault();
        setPaused(p => !p);
      }
      if (e.key === "c" || e.key === "C") setChallengeMode(c => !c);
      if (e.key === "m" || e.key === "M") {
        setCameraMode(c =>
          c === "top-down" ? "follow" : c === "follow" ? "cinematic" : "top-down"
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing" || paused) {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      return;
    }

    const tick = () => {
      setGameState(prev => {
        if (!prev.alive) return prev;

        const now = Date.now();
        const reverse = activeTypes.has("reverse_controls");

        const prevFood = prev.food;
        let next = gameTick(prev, nextDirRef.current, now, reverse);

        if (activeTypes.has("shrink_arena") && next.arenaSize > 12) {
          const elapsed = (now - startTimeRef.current) / 1000;
          const newSz = Math.max(12, GRID - Math.floor(elapsed / 8));
          if (newSz !== next.arenaSize) {
            next = { ...next, arenaSize: newSz };
          }
        }

        if (activeTypes.has("mirror_snake") && next.alive) {
          const head = next.snake[0];
          const sz = next.arenaSize || GRID;
          for (const seg of next.snake) {
            const mx = sz - 1 - seg.x;
            const my = sz - 1 - seg.y;
            if (head.x === mx && head.y === my) {
              next = { ...next, alive: false };
              break;
            }
          }
        }

        if (next.food !== prevFood) {
          const ePos = [prevFood.x + 0.5, 0.5, prevFood.y + 0.5];
          const eColor = FOOD_DEFS[prevFood.type]?.color || "#ff6a00";
          setExplosions(e => [...e.slice(-5), { id: Date.now(), position: ePos, color: eColor, startTime: Date.now() }]);

          if (prevFood.type === "golden") synth.eatGolden();
          else if (prevFood.type === "speed") synth.eatSpeed();
          else synth.eat();

          if (next.combo > 1) synth.combo();
        }

        if (!next.alive) {
          synth.death();
          const elapsed = (now - startTimeRef.current) / 1000;
          setTimeout(() => {
            setScreen("gameover");
          }, 800);
          return { ...next, timeAlive: elapsed, challengesDone };
        }

        return {
          ...next,
          timeAlive: (now - startTimeRef.current) / 1000,
        };
      });
    };

    const speed = gameState.speed * (activeTypes.has("speed_surge") ? 0.35 : 1);
    tickTimerRef.current = setInterval(tick, speed);

    return () => { if (tickTimerRef.current) clearInterval(tickTimerRef.current); };
  }, [screen, paused, gameState.speed, activeTypes]);

  const startGame = useCallback(() => {
    synth.init();
    const state = createInitialState();
    setGameState(state);
    nextDirRef.current = "RIGHT";
    startTimeRef.current = Date.now();
    setExplosions([]);
    setPaused(false);
    setScreen("playing");
  }, []);

  const hudStats = useMemo(() => ({
    score: gameState.score,
    length: gameState.length,
    speed: gameState.speed,
    combo: gameState.combo,
    maxCombo: gameState.maxCombo,
    foodEaten: gameState.foodEaten,
    timeAlive: gameState.timeAlive || 0,
    snake: gameState.snake,
    food: gameState.food,
    challengesDone,
  }), [gameState, challengesDone]);

  const fogActive = activeTypes.has("fog_of_war");

  return (
    <div className="game-root">
      <GridScanBG challengeActive={challengeMode && gameRunning} />

      <div className={`scanline-overlay ${challengeMode && gameRunning ? "active" : ""}`} />

      <div className="canvas-layer">
        <Canvas
          camera={{ position: [GRID/2, GRID * 0.85, GRID/2 + GRID * 0.35], fov: 55 }}
          shadows
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.9,
          }}
          dpr={[1, 1.5]}
          style={{ background: "transparent" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <color attach="background" args={["#05050a"]} />
          <fog attach="fog" args={["#05050a", 25, fogActive ? 10 : 55]} />

          <Lighting challengeMode={challengeMode && gameRunning} />
          <GameBoard arenaSize={gameState.arenaSize} challengeMode={challengeMode && gameRunning} />

          {screen === "playing" && (
            <>
              <SnakeBody
                snake={gameState.snake}
                direction={gameState.dir}
                alive={gameState.alive}
                challengeMode={challengeMode}
              />
              <FoodMesh food={gameState.food} />
              <Explosions explosions={explosions} />
              <DustParticles />

              {activeTypes.has("mirror_snake") && (
                <MirrorSnake snake={gameState.snake} arenaSize={gameState.arenaSize} />
              )}

              <FallingAsteroids
                active={activeTypes.has("asteroid_rain")}
                onHitPositions={() => {}}
              />

              <CameraController
                snake={gameState.snake}
                direction={gameState.dir}
                cameraMode={cameraMode}
              />
            </>
          )}

          <AsteroidField challengeMode={challengeMode && gameRunning} />
          <PostFX challengeMode={challengeMode && gameRunning} />
        </Canvas>
      </div>

      {screen === "playing" && (
        <HUD
          stats={hudStats}
          inputMode={inputMode}
          onCycleInput={() => {
            const modes = ["keyboard", "gesture", "voice"];
            const idx = modes.indexOf(inputMode);
            setInputMode(modes[(idx + 1) % modes.length]);
          }}
          voiceState={voiceState}
          gestureDir={gestureDir}
          challenges={challenges}
          challengeMode={challengeMode}
        />
      )}

      {announcement && (
        <div className="challenge-announce">⚠ {announcement}</div>
      )}

      {screen === "playing" && paused && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(5,5,10,0.7)", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "48px",
            fontWeight: 900,
            color: "var(--plasma-blue)",
            textShadow: "0 0 30px rgba(0,212,255,0.5)",
            letterSpacing: "8px",
          }}>
            PAUSED
          </div>
        </div>
      )}

      {screen === "menu" && (
        <MainMenu
          onStart={startGame}
          challengeMode={challengeMode}
          onToggleChallenge={() => setChallengeMode(c => !c)}
          inputMode={inputMode}
          onSetInput={setInputMode}
        />
      )}

      {screen === "gameover" && (
        <GameOverScreen
          stats={{ ...gameState, challengesDone }}
          onRestart={startGame}
          onMenu={() => setScreen("menu")}
        />
      )}

      {"ontouchstart" in window && screen === "playing" && (
        <div className="dpad">
          <div className="dpad-btn up" onTouchStart={() => { nextDirRef.current = "UP"; }}>↑</div>
          <div className="dpad-btn left" onTouchStart={() => { nextDirRef.current = "LEFT"; }}>←</div>
          <div className="dpad-btn right" onTouchStart={() => { nextDirRef.current = "RIGHT"; }}>→</div>
          <div className="dpad-btn down" onTouchStart={() => { nextDirRef.current = "DOWN"; }}>↓</div>
        </div>
      )}
    </div>
  );
}
