'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

function GlitchText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setOffset({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2,
        });
        setTimeout(() => setOffset({ x: 0, y: 0 }), 150);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`} style={style}>
      <span
        className="absolute text-red-500 opacity-70"
        style={{ transform: `translate(${offset.x - 2}px, ${offset.y}px)` }}
      >
        {text}
      </span>
      <span
        className="absolute text-blue-500 opacity-70"
        style={{ transform: `translate(${offset.x + 2}px, ${offset.y}px)` }}
      >
        {text}
      </span>
      <span style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, position: 'relative' }}>
        {text}
      </span>
    </div>
  );
}

export default function GameOverScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const stats = useGameStore((s) => s.stats);
  const highScore = useGameStore((s) => s.highScore);
  const startGame = useGameStore((s) => s.startGame);

  if (gameState !== 'gameover') return null;

  const goMenu = () => {
    useGameStore.setState({ gameState: 'menu' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center"
      style={{
        background: 'rgba(10, 10, 15, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-center">
        <GlitchText
          text="GAME OVER"
          className="text-[var(--danger-red)] mb-8"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 8vw, 64px)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-8"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '16px' }}
        >
          <p>
            SCORE: <span className="text-[var(--supernova-gold)] font-bold">{stats.score}</span>
            {stats.score >= highScore && stats.score > 0 && (
              <span className="text-[var(--alien-green)] ml-2">NEW HIGH!</span>
            )}
          </p>
          <p>LENGTH: <span className="text-[var(--plasma-blue)]">{stats.length}</span></p>
          <p>TIME: <span className="text-[var(--star-white)]">
            {Math.floor(stats.timeAlive / 60000)}:{String(Math.floor((stats.timeAlive % 60000) / 1000)).padStart(2, '0')}
          </span></p>
          <p>FOOD EATEN: <span className="text-[var(--solar-orange)]">{stats.foodEaten}</span></p>
          <p>MAX COMBO: <span className="text-[var(--alien-green)]">x{stats.maxCombo}</span></p>
          <p>CHALLENGES: <span className="text-[var(--cosmic-purple)]">{stats.challengesCompleted}</span></p>
          <p className="text-xs opacity-50 mt-2">HIGH SCORE: {highScore}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 0 10px var(--alien-green)',
                '0 0 20px var(--alien-green)',
                '0 0 10px var(--alien-green)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={startGame}
            className="px-8 py-3 border-2 border-[var(--alien-green)] text-[var(--alien-green)] rounded-lg cursor-pointer hover:bg-[var(--alien-green)] hover:text-[var(--void-black)] transition-colors"
            style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}
          >
            ▶ PLAY AGAIN
          </motion.button>
          <button
            onClick={goMenu}
            className="px-6 py-2 text-[var(--star-white)] opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}
          >
            MAIN MENU
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
