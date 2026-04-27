'use client';

import { useRef } from 'react';
import { useGesture } from '@/hooks/useGesture';
import { useGameStore } from '@/store/gameStore';

export default function GestureController() {
  const inputMode = useGameStore((s) => s.inputMode);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGesture(inputMode === 'gesture' ? videoRef : { current: null });

  if (inputMode !== 'gesture') return null;

  return (
    <video
      ref={videoRef}
      className="fixed bottom-20 right-4 w-[120px] h-[90px] rounded-lg border-2 border-[var(--plasma-blue)] object-cover z-30 opacity-80"
      autoPlay
      playsInline
      muted
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}
