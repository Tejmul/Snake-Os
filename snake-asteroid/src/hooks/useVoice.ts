'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { VOICE_COMMANDS } from '@/lib/constants';

export function useVoice() {
  const updateVoice = useGameStore((s) => s.updateVoice);
  const setDirection = useGameStore((s) => s.setDirection);
  const toggleChallengeMode = useGameStore((s) => s.toggleChallengeMode);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const gameState = useGameStore((s) => s.gameState);
  const inputMode = useGameStore((s) => s.inputMode);

  const recognitionRef = useRef<any>(null);
  const restartTimeout = useRef<NodeJS.Timeout | null>(null);

  const processTranscript = useCallback(
    (transcript: string, confidence: number, isFinal: boolean) => {
      const lower = transcript.toLowerCase().trim();

      for (const [phrase, action] of Object.entries(VOICE_COMMANDS)) {
        const matched = isFinal ? lower === phrase : lower.startsWith(phrase);
        if (!matched) continue;

        updateVoice({ lastCommand: phrase, confidence, transcript: lower });

        if (action === 'CHALLENGE') {
          toggleChallengeMode();
          return;
        }

        if (action === 'STOP') {
          if (gameState === 'playing') pauseGame();
          else if (gameState === 'paused') resumeGame();
          return;
        }

        if (gameState === 'playing') {
          setDirection(action);
        }
        return;
      }

      updateVoice({ transcript: lower, confidence });
    },
    [gameState, setDirection, updateVoice, toggleChallengeMode, pauseGame, resumeGame]
  );

  useEffect(() => {
    if (inputMode !== 'voice') {
      updateVoice({ listening: false });
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      updateVoice({ listening: true });
    };

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript;
      const confidence = last[0].confidence || 0.8;
      processTranscript(transcript, confidence, last.isFinal);
    };

    recognition.onerror = () => {
      restartTimeout.current = setTimeout(() => {
        try { recognition.start(); } catch {}
      }, 500);
    };

    recognition.onend = () => {
      if (inputMode === 'voice') {
        restartTimeout.current = setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 100);
      }
    };

    try {
      recognition.start();
    } catch {}

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeout.current) clearTimeout(restartTimeout.current);
      try { recognition.stop(); } catch {}
      recognitionRef.current = null;
      updateVoice({ listening: false });
    };
  }, [inputMode, processTranscript, updateVoice]);
}
