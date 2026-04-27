'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

class SoundSynth {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTone(freq: number, duration: number, vol: number = 0.3, type: OscillatorType = 'sine') {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  eatNormal() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  eatGolden() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 0.25), i * 50);
    });
  }

  eatSpeed() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = 200;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.2);
    filter.Q.value = 5;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  directionChange() {
    this.playTone(1000, 0.02, 0.1, 'square');
  }

  death() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const noise = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 80;
    gain1.gain.setValueAtTime(0.5, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain1).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);

    noise.type = 'sawtooth';
    noise.frequency.value = 50;
    gain2.gain.setValueAtTime(0.3, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noise.connect(gain2).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.4);
  }

  challengeStart() {
    [800, 1200, 800, 1200, 800, 1200].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 0.3, 'square'), i * 120);
    });
  }

  challengeDone() {
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 0.25), i * 30);
    });
  }

  comboUp(level: number) {
    this.playTone(400 + level * 200, 0.15, 0.25);
  }

  comboBreak() {
    this.playTone(200, 0.2, 0.15, 'sawtooth');
  }

  menuHover() {
    this.playTone(600, 0.05, 0.08);
  }

  menuSelect() {
    this.playTone(800, 0.1, 0.15);
  }

  portal() {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }
}

const synth = new SoundSynth();

let droneOsc1: OscillatorNode | null = null;
let droneOsc2: OscillatorNode | null = null;
let droneGain: GainNode | null = null;

function startDrone() {
  try {
    const ctx = new AudioContext();
    droneGain = ctx.createGain();
    droneGain.gain.value = 0.03;
    droneGain.connect(ctx.destination);

    droneOsc1 = ctx.createOscillator();
    droneOsc1.type = 'sine';
    droneOsc1.frequency.value = 55;
    droneOsc1.connect(droneGain);
    droneOsc1.start();

    droneOsc2 = ctx.createOscillator();
    droneOsc2.type = 'sine';
    droneOsc2.frequency.value = 110;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.02;
    droneOsc2.connect(gain2).connect(ctx.destination);
    droneOsc2.start();

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.125;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(droneGain.gain);
    lfo.start();
  } catch {}
}

function stopDrone() {
  try {
    droneOsc1?.stop();
    droneOsc2?.stop();
  } catch {}
  droneOsc1 = null;
  droneOsc2 = null;
  droneGain = null;
}

export function useSound() {
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const gameState = useGameStore((s) => s.gameState);
  const lastEatenFood = useGameStore((s) => s.lastEatenFood);
  const stats = useGameStore((s) => s.stats);
  const prevCombo = useRef(0);

  useEffect(() => {
    if (soundEnabled && gameState === 'playing') {
      startDrone();
    } else {
      stopDrone();
    }
    return () => stopDrone();
  }, [soundEnabled, gameState]);

  useEffect(() => {
    if (!soundEnabled || !lastEatenFood) return;
    switch (lastEatenFood.type) {
      case 'golden':
        synth.eatGolden();
        break;
      case 'speed':
        synth.eatSpeed();
        break;
      default:
        synth.eatNormal();
    }
  }, [lastEatenFood, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;
    if (stats.currentCombo > prevCombo.current && stats.currentCombo > 1) {
      synth.comboUp(stats.currentCombo);
    } else if (stats.currentCombo === 0 && prevCombo.current > 1) {
      synth.comboBreak();
    }
    prevCombo.current = stats.currentCombo;
  }, [stats.currentCombo, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;
    if (gameState === 'gameover') {
      synth.death();
    }
  }, [gameState, soundEnabled]);

  return synth;
}
