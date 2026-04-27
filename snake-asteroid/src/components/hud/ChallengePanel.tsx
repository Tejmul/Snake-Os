'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function ChallengePanel() {
  const activeChallenges = useGameStore((s) => s.activeChallenges);

  if (activeChallenges.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
      {activeChallenges.map((ch) => {
        const progress = ch.duration > 0 ? ch.timeRemaining / ch.duration : 1;
        return (
          <motion.div
            key={ch.type}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="px-4 py-2 rounded-lg border border-[var(--danger-red)] pointer-events-auto"
            style={{
              background: 'rgba(255, 23, 68, 0.15)',
              backdropFilter: 'blur(8px)',
              fontFamily: 'var(--font-display)',
              minWidth: '180px',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[var(--danger-red)] text-sm font-bold">{ch.name}</span>
              <span className="text-[var(--star-white)] text-xs opacity-70" style={{ fontFamily: 'var(--font-mono)' }}>
                {Math.ceil(ch.timeRemaining)}s
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full overflow-hidden bg-[var(--asteroid-gray)]">
              <motion.div
                className="h-full bg-[var(--danger-red)]"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
