'use client';

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      onAnimationComplete={(def: { opacity?: number }) => {
        if (def.opacity === 0) {
          const el = document.getElementById('loading-screen');
          if (el) el.style.display = 'none';
        }
      }}
      id="loading-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--void-black)]"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="w-12 h-12 mb-6"
      >
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <polygon
            points="25,5 45,40 5,40"
            fill="none"
            stroke="var(--solar-orange)"
            strokeWidth="2"
          />
        </svg>
      </motion.div>

      <h2
        className="text-[var(--star-white)] tracking-[0.2em] mb-4"
        style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}
      >
        ASTEROID SERPENT
      </h2>

      <div className="w-48 h-1 rounded-full overflow-hidden bg-[var(--asteroid-gray)]">
        <motion.div
          className="h-full bg-[var(--plasma-blue)]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </div>

      <p
        className="mt-3 text-[var(--star-white)] opacity-30"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
      >
        Loading assets...
      </p>
    </motion.div>
  );
}
