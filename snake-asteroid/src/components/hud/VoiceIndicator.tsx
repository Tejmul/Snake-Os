'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function VoiceIndicator() {
  const voiceState = useGameStore((s) => s.voiceState);
  const [showCommand, setShowCommand] = useState(false);
  const [lastShown, setLastShown] = useState<string | null>(null);

  useEffect(() => {
    if (voiceState.lastCommand && voiceState.lastCommand !== lastShown) {
      setShowCommand(true);
      setLastShown(voiceState.lastCommand);
      const timer = setTimeout(() => setShowCommand(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [voiceState.lastCommand, lastShown]);

  return (
    <div
      className="px-4 py-3 rounded-lg border border-[var(--asteroid-gray)] backdrop-blur-sm text-center"
      style={{ background: 'rgba(10, 10, 15, 0.75)', minWidth: '80px' }}
    >
      <motion.div
        animate={voiceState.listening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={voiceState.listening ? { repeat: Infinity, duration: 1 } : {}}
        className="text-2xl"
      >
        🎙️
      </motion.div>

      {voiceState.listening && (
        <div className="flex justify-center gap-0.5 mt-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-[var(--plasma-blue)] rounded-full"
              animate={{ height: [4, 12, 4] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCommand && voiceState.lastCommand && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-xs text-[var(--alien-green)] font-bold uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {voiceState.lastCommand}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-1 h-1 w-full rounded-full overflow-hidden bg-[var(--asteroid-gray)]">
        <motion.div
          className="h-full bg-[var(--plasma-blue)]"
          animate={{ width: `${voiceState.confidence * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
}
