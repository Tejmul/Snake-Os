'use client';

import { useVoice } from '@/hooks/useVoice';
import { useGameStore } from '@/store/gameStore';

export default function VoiceController() {
  const inputMode = useGameStore((s) => s.inputMode);
  useVoice();

  if (inputMode !== 'voice') return null;
  return null;
}
