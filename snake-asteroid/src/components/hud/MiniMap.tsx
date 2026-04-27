'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snake = useGameStore((s) => s.snake);
  const food = useGameStore((s) => s.food);
  const gridSize = useGameStore((s) => s.gridSize);
  const activeChallenges = useGameStore((s) => s.activeChallenges);

  const fogActive = activeChallenges.some((c) => c.type === 'fog_of_war');
  const size = 150;
  const cellSize = size / gridSize;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#2d2d3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    if (fogActive && snake.length > 0) {
      const head = snake[0];
      const radius = 4 * cellSize;
      ctx.save();
      ctx.beginPath();
      ctx.arc(head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2, radius, 0, Math.PI * 2);
      ctx.clip();
    }

    for (const f of food) {
      const colors: Record<string, string> = {
        normal: '#ff6a00',
        golden: '#ffd700',
        speed: '#00d4ff',
        shrink: '#39ff14',
      };
      ctx.fillStyle = colors[f.type] || '#ff6a00';
      ctx.fillRect(f.position.x * cellSize, f.position.y * cellSize, cellSize, cellSize);
    }

    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      ctx.fillStyle = seg.isHead ? '#39ff14' : '#1a8a0a';
      ctx.fillRect(seg.x * cellSize, seg.y * cellSize, cellSize, cellSize);
    }

    if (fogActive) {
      ctx.restore();
    }
  }, [snake, food, gridSize, fogActive, cellSize]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg border border-[var(--asteroid-gray)] opacity-80"
      style={{ background: 'rgba(10, 10, 15, 0.8)' }}
    />
  );
}
