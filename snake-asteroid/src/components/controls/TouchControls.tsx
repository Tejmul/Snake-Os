'use client';

import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Direction } from '@/types/game';

export default function TouchControls() {
  const gameState = useGameStore((s) => s.gameState);
  const setDirection = useGameStore((s) => s.setDirection);
  const [isMobile, setIsMobile] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || gameState !== 'playing') return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const minSwipe = 30;

      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

      let dir: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        dir = dy > 0 ? 'DOWN' : 'UP';
      }
      setDirection(dir);
      touchStart.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, setDirection]);

  if (!isMobile || gameState !== 'playing') return null;

  const buttonClass =
    'w-14 h-14 rounded-xl border border-[var(--asteroid-gray)] flex items-center justify-center text-2xl text-[var(--star-white)] opacity-40 active:opacity-80 active:bg-[var(--cosmic-purple)] transition-all select-none';

  return (
    <div className="fixed bottom-6 right-6 z-30 pointer-events-auto">
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[180px] h-[180px]">
        <div />
        <button className={buttonClass} onTouchStart={() => setDirection('UP')}>
          ↑
        </button>
        <div />
        <button className={buttonClass} onTouchStart={() => setDirection('LEFT')}>
          ←
        </button>
        <div className="w-14 h-14 rounded-xl border border-[var(--asteroid-gray)] flex items-center justify-center opacity-20">
          •
        </div>
        <button className={buttonClass} onTouchStart={() => setDirection('RIGHT')}>
          →
        </button>
        <div />
        <button className={buttonClass} onTouchStart={() => setDirection('DOWN')}>
          ↓
        </button>
        <div />
      </div>
    </div>
  );
}
