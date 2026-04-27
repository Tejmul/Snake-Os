'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import InputModeSelector from './InputModeSelector';
import SettingsPanel from './SettingsPanel';

function GlitchTitle() {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative select-none">
      {glitch && (
        <>
          <span
            className="absolute inset-0 text-red-500 opacity-70"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 8vw, 64px)',
              transform: 'translate(-2px, 0)',
            }}
          >
            ASTEROID SERPENT
          </span>
          <span
            className="absolute inset-0 text-blue-500 opacity-70"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 8vw, 64px)',
              transform: 'translate(2px, 0)',
            }}
          >
            ASTEROID SERPENT
          </span>
        </>
      )}
      <h1
        className="text-[var(--star-white)] font-bold tracking-[0.15em]"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 8vw, 64px)' }}
      >
        ASTEROID SERPENT
      </h1>
    </div>
  );
}

export default function MainMenu() {
  const gameState = useGameStore((s) => s.gameState);
  const startGame = useGameStore((s) => s.startGame);
  const challengeMode = useGameStore((s) => s.challengeMode);
  const toggleChallengeMode = useGameStore((s) => s.toggleChallengeMode);
  const loadHighScore = useGameStore((s) => s.loadHighScore);
  const highScore = useGameStore((s) => s.highScore);

  const [showInputMode, setShowInputMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  if (gameState !== 'menu') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      style={{ background: 'rgba(10, 10, 15, 0.5)', backdropFilter: 'blur(2px)' }}
    >
      <GlitchTitle />

      <div className="w-48 h-px bg-gradient-to-r from-transparent via-[var(--plasma-blue)] to-transparent my-4 opacity-60" />

      <p
        className="text-[var(--star-white)] opacity-50 italic mb-10"
        style={{ fontFamily: 'var(--font-body)', fontSize: '18px' }}
      >
        Navigate the void. Devour the cosmos.
      </p>

      <div className="flex flex-col items-center gap-4">
        {[
          {
            label: '▶ START GAME',
            action: startGame,
            color: 'var(--alien-green)',
            delay: 0.1,
          },
          {
            label: `⚡ CHALLENGE MODE ${challengeMode ? 'ON' : 'OFF'}`,
            action: toggleChallengeMode,
            color: challengeMode ? 'var(--challenge-glow)' : 'var(--star-white)',
            delay: 0.2,
          },
          {
            label: '🎮 INPUT MODE',
            action: () => setShowInputMode(true),
            color: 'var(--plasma-blue)',
            delay: 0.3,
          },
          {
            label: '⚙ SETTINGS',
            action: () => setShowSettings(true),
            color: 'var(--star-white)',
            delay: 0.4,
          },
        ].map((btn) => (
          <motion.button
            key={btn.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: btn.delay }}
            whileHover={{
              scale: 1.02,
              boxShadow: `0 0 15px ${btn.color}`,
            }}
            whileTap={{ scale: 0.98 }}
            onClick={btn.action}
            className="w-72 px-6 py-3 text-left border rounded-lg cursor-pointer transition-all relative overflow-hidden group"
            style={{
              borderColor: btn.color,
              color: btn.color,
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              background: 'rgba(10, 10, 15, 0.6)',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: `linear-gradient(90deg, ${btn.color}15, transparent)`,
              }}
            />
            <span className="relative z-10">{btn.label}</span>
          </motion.button>
        ))}
      </div>

      {highScore > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-[var(--supernova-gold)]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}
        >
          HIGH SCORE: {highScore}
        </motion.p>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 text-[var(--star-white)]"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
      >
        Built by Tejmul | OS Project 2026
      </motion.p>

      {showInputMode && (
        <InputModeSelector onClose={() => setShowInputMode(false)} />
      )}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </motion.div>
  );
}
