'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useCEngine } from '@/hooks/useCEngine';

export default function KeyboardController() {
  const gameState = useGameStore((s) => s.gameState);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const toggleChallengeMode = useGameStore((s) => s.toggleChallengeMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const setInputMode = useGameStore((s) => s.setInputMode);

  const { sendDirection } = useCEngine();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' && gameState !== 'paused') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          sendDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          sendDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          sendDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          sendDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (gameState === 'playing') pauseGame();
          else if (gameState === 'paused') resumeGame();
          break;
        case 'c':
        case 'C':
          toggleChallengeMode();
          break;
        case 'm':
        case 'M': {
          const modes: ('top-down' | 'follow' | 'cinematic')[] = ['top-down', 'follow', 'cinematic'];
          const idx = modes.indexOf(cameraMode);
          setCameraMode(modes[(idx + 1) % modes.length]);
          break;
        }
        case '1':
          setInputMode('keyboard');
          break;
        case '2':
          setInputMode('gesture');
          break;
        case '3':
          setInputMode('voice');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, cameraMode, sendDirection, pauseGame, resumeGame, toggleChallengeMode, setCameraMode, setInputMode]);

  return null;
}
