'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { InputMode } from '@/types/game';

const modes: { id: InputMode; icon: string; label: string; desc: string; note?: string }[] = [
  { id: 'keyboard', icon: '⌨️', label: 'Keyboard', desc: 'Classic WASD/Arrow controls' },
  { id: 'gesture', icon: '🤚', label: 'Gesture', desc: 'Point your hand to steer', note: 'Requires webcam access' },
  { id: 'voice', icon: '🎙️', label: 'Voice', desc: 'Speak: Left, Right, Up, Down', note: 'Requires microphone access' },
];

export default function InputModeSelector({ onClose }: { onClose: () => void }) {
  const inputMode = useGameStore((s) => s.inputMode);
  const setInputMode = useGameStore((s) => s.setInputMode);
  const [webcamPreview, setWebcamPreview] = useState<MediaStream | null>(null);
  const [voiceTested, setVoiceTested] = useState(false);

  const handleSelect = async (mode: InputMode) => {
    if (mode === 'gesture') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setWebcamPreview(stream);
      } catch {
        // permission denied
      }
    }
    if (mode === 'voice') {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setVoiceTested(true);
      } catch {
        // permission denied
      }
    }
    setInputMode(mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ background: 'rgba(10, 10, 15, 0.85)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 rounded-xl border border-[var(--asteroid-gray)]"
        style={{ background: 'var(--nebula-dark)', maxWidth: '700px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-center text-[var(--plasma-blue)] mb-6"
          style={{ fontFamily: 'var(--font-display)', fontSize: '24px' }}
        >
          INPUT MODE
        </h2>

        <div className="flex gap-4 flex-wrap justify-center">
          {modes.map((mode) => (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(mode.id)}
              className="flex-1 min-w-[180px] p-4 rounded-lg border-2 text-left cursor-pointer transition-all"
              style={{
                borderColor: inputMode === mode.id ? 'var(--plasma-blue)' : 'var(--asteroid-gray)',
                background: inputMode === mode.id ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                boxShadow: inputMode === mode.id ? '0 0 15px rgba(0, 212, 255, 0.3)' : 'none',
              }}
            >
              <div className="text-3xl mb-2">{mode.icon}</div>
              <h3
                className="text-[var(--star-white)] mb-1"
                style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}
              >
                {mode.label}
              </h3>
              <p className="text-xs text-[var(--star-white)] opacity-60" style={{ fontFamily: 'var(--font-body)' }}>
                {mode.desc}
              </p>
              {mode.note && (
                <p className="text-xs text-[var(--solar-orange)] mt-2 opacity-80" style={{ fontFamily: 'var(--font-mono)' }}>
                  {mode.note}
                </p>
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[var(--star-white)] opacity-60 hover:opacity-100 cursor-pointer"
            style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
