'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const showMinimap = useGameStore((s) => s.showMinimap);
  const toggleMinimap = useGameStore((s) => s.toggleMinimap);
  const showGestureOverlay = useGameStore((s) => s.showGestureOverlay);
  const toggleGestureOverlay = useGameStore((s) => s.toggleGestureOverlay);
  const gridSize = useGameStore((s) => s.gridSize);
  const setGridSize = useGameStore((s) => s.setGridSize);

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
        style={{ background: 'var(--nebula-dark)', maxWidth: '400px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-center text-[var(--plasma-blue)] mb-6"
          style={{ fontFamily: 'var(--font-display)', fontSize: '24px' }}
        >
          SETTINGS
        </h2>

        <div className="space-y-4">
          <ToggleRow label="Sound" value={soundEnabled} onToggle={toggleSound} />
          <ToggleRow label="Minimap" value={showMinimap} onToggle={toggleMinimap} />
          <ToggleRow label="Gesture Overlay" value={showGestureOverlay} onToggle={toggleGestureOverlay} />

          <div className="flex items-center justify-between">
            <span className="text-[var(--star-white)] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              Camera
            </span>
            <select
              value={cameraMode}
              onChange={(e) => setCameraMode(e.target.value as typeof cameraMode)}
              className="px-3 py-1 rounded border border-[var(--asteroid-gray)] text-[var(--star-white)] text-sm cursor-pointer"
              style={{ background: 'var(--void-black)', fontFamily: 'var(--font-mono)' }}
            >
              <option value="top-down">Top-Down</option>
              <option value="follow">Follow</option>
              <option value="cinematic">Cinematic</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--star-white)] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              Grid Size
            </span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="px-3 py-1 rounded border border-[var(--asteroid-gray)] text-[var(--star-white)] text-sm cursor-pointer"
              style={{ background: 'var(--void-black)', fontFamily: 'var(--font-mono)' }}
            >
              <option value={20}>20 x 20</option>
              <option value={25}>25 x 25</option>
              <option value={30}>30 x 30</option>
            </select>
          </div>
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

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--star-white)] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
      <button
        onClick={onToggle}
        className="w-12 h-6 rounded-full relative cursor-pointer transition-colors"
        style={{ background: value ? 'var(--alien-green)' : 'var(--asteroid-gray)' }}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white absolute top-0.5"
          animate={{ left: value ? '26px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
