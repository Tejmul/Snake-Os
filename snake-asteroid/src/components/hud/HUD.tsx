'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import MiniMap from './MiniMap';
import GestureIndicator from './GestureIndicator';
import VoiceIndicator from './VoiceIndicator';
import ChallengePanel from './ChallengePanel';

function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + diff * progress));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [value]);

  return <span>{display}</span>;
}

export default function HUD() {
  const stats = useGameStore((s) => s.stats);
  const gameState = useGameStore((s) => s.gameState);
  const inputMode = useGameStore((s) => s.inputMode);
  const setInputMode = useGameStore((s) => s.setInputMode);
  const showMinimap = useGameStore((s) => s.showMinimap);
  const challengeMode = useGameStore((s) => s.challengeMode);
  const activeChallenges = useGameStore((s) => s.activeChallenges);

  if (gameState !== 'playing' && gameState !== 'paused') return null;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const inputIcons: Record<string, string> = {
    keyboard: '⌨️',
    gesture: '🤚',
    voice: '🎙️',
  };

  const modes: ('keyboard' | 'gesture' | 'voice')[] = ['keyboard', 'gesture', 'voice'];
  const currentIdx = modes.indexOf(inputMode);
  const cycleInput = () => {
    setInputMode(modes[(currentIdx + 1) % modes.length]);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top-left: Score & Stats */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div
          className="px-4 py-3 rounded-lg border border-[var(--asteroid-gray)] backdrop-blur-sm"
          style={{ background: 'rgba(10, 10, 15, 0.75)' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[var(--supernova-gold)]" style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>
                ◆ <AnimatedScore value={stats.score} />
              </span>
            </div>
            <AnimatePresence>
              {stats.currentCombo > 1 && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0, x: 10 }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-[var(--alien-green)] font-bold"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}
                >
                  x{stats.currentCombo}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div
            className="flex items-center gap-4 mt-1 text-[var(--star-white)] opacity-70"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}
          >
            <span>◇ LENGTH: {stats.length}</span>
            <span>⚡ SPEED: {Math.round((1 - (stats.speed - 50) / 100) * 10)}</span>
          </div>
          <div
            className="mt-1 text-[var(--star-white)] opacity-50"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
          >
            ⏱ {formatTime(stats.timeAlive)}
          </div>
        </div>
      </div>

      {/* Top-right: Input mode */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={cycleInput}
          className="px-3 py-2 rounded-lg border border-[var(--asteroid-gray)] backdrop-blur-sm hover:border-[var(--plasma-blue)] transition-colors cursor-pointer"
          style={{ background: 'rgba(10, 10, 15, 0.75)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}
        >
          {inputIcons[inputMode]} {inputMode.toUpperCase()}
        </button>
      </div>

      {/* Bottom-center: Active challenges */}
      {challengeMode && activeChallenges.length > 0 && (
        <ChallengePanel />
      )}

      {/* Bottom-left: Minimap */}
      {showMinimap && (
        <div className="absolute bottom-4 left-4">
          <MiniMap />
        </div>
      )}

      {/* Bottom-right: Input indicators */}
      <div className="absolute bottom-4 right-4">
        {inputMode === 'gesture' && <GestureIndicator />}
        {inputMode === 'voice' && <VoiceIndicator />}
      </div>

      {/* Paused overlay */}
      <AnimatePresence>
        {gameState === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            style={{ background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(4px)' }}
          >
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[var(--plasma-blue)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '48px' }}
            >
              PAUSED
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
