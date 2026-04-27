'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import MainMenu from '@/components/menu/MainMenu';
import HUD from '@/components/hud/HUD';
import GameOverScreen from '@/components/hud/GameOverScreen';
import KeyboardController from '@/components/controls/KeyboardController';
import GestureController from '@/components/controls/GestureController';
import VoiceController from '@/components/controls/VoiceController';
import TouchControls from '@/components/controls/TouchControls';
import LoadingScreen from '@/components/game/LoadingScreen';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useSound } from '@/hooks/useSound';
import { useGameStore } from '@/store/gameStore';

const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), {
  ssr: false,
});

function GameManager() {
  useGameLoop();
  useSound();
  const loadHighScore = useGameStore((s) => s.loadHighScore);

  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  return null;
}

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[var(--void-black)]">
      <LoadingScreen />
      <GameCanvas />
      <MainMenu />
      <HUD />
      <GameOverScreen />
      <KeyboardController />
      <GestureController />
      <VoiceController />
      <TouchControls />
      <GameManager />
    </main>
  );
}
