'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const directionArrows: Record<string, string> = {
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→',
  STOP: '✋',
};

export default function GestureIndicator() {
  const gestureState = useGameStore((s) => s.gestureState);
  const showOverlay = useGameStore((s) => s.showGestureOverlay);

  if (!showOverlay) return null;

  const { detected, direction, confidence } = gestureState;
  const arrow = direction ? directionArrows[direction] || '' : '';

  const getColor = () => {
    if (!detected || !direction) return 'var(--asteroid-gray)';
    if (confidence > 0.8) return 'var(--alien-green)';
    if (confidence > 0.5) return 'var(--supernova-gold)';
    return 'var(--danger-red)';
  };

  return (
    <div
      className="px-4 py-3 rounded-lg border border-[var(--asteroid-gray)] backdrop-blur-sm text-center"
      style={{ background: 'rgba(10, 10, 15, 0.75)', minWidth: '80px' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={direction || 'none'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-3xl"
          style={{ color: getColor() }}
        >
          {detected ? arrow || '...' : '—'}
        </motion.div>
      </AnimatePresence>
      <div
        className="mt-1 text-xs opacity-60"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {detected
          ? direction === 'STOP'
            ? 'STOP'
            : `${Math.round(confidence * 100)}%`
          : 'NO HAND'}
      </div>
    </div>
  );
}
