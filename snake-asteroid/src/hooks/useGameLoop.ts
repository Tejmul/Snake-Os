'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { pickRandomChallenge } from '@/lib/challenges';
import { CHALLENGE_INTERVAL, MAX_ACTIVE_CHALLENGES } from '@/lib/constants';

export function useGameLoop() {
  const gameState = useGameStore((s) => s.gameState);
  const stats = useGameStore((s) => s.stats);
  const challengeMode = useGameStore((s) => s.challengeMode);
  const activeChallenges = useGameStore((s) => s.activeChallenges);
  const challengeHistory = useGameStore((s) => s.challengeHistory);
  const tick = useGameStore((s) => s.tick);
  const activateChallenge = useGameStore((s) => s.activateChallenge);
  const deactivateChallenge = useGameStore((s) => s.deactivateChallenge);

  const lastTickTime = useRef(0);
  const lastChallengeTime = useRef(0);
  const gameStartTime = useRef(0);
  const animFrameRef = useRef<number>(0);

  const loop = useCallback(
    (now: number) => {
      const store = useGameStore.getState();
      if (store.gameState !== 'playing') {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (gameStartTime.current === 0) gameStartTime.current = now;

      const elapsed = now - lastTickTime.current;
      const speed = store.stats.speed;

      const hasSpeedSurge = store.activeChallenges.some((c) => c.type === 'speed_surge');
      const effectiveSpeed = hasSpeedSurge ? speed / 3 : speed;

      if (elapsed >= effectiveSpeed) {
        lastTickTime.current = now;

        useGameStore.setState((s) => ({
          stats: { ...s.stats, timeAlive: now - gameStartTime.current },
        }));

        tick();
      }

      if (store.challengeMode) {
        const timeSinceLastChallenge = (now - lastChallengeTime.current) / 1000;
        if (
          timeSinceLastChallenge >= CHALLENGE_INTERVAL &&
          store.activeChallenges.length < MAX_ACTIVE_CHALLENGES
        ) {
          const challenge = pickRandomChallenge(store.challengeHistory);
          activateChallenge(challenge);
          lastChallengeTime.current = now;
        }

        const updatedChallenges = store.activeChallenges
          .map((c) => ({
            ...c,
            timeRemaining: c.timeRemaining - (now - lastTickTime.current) / 1000,
          }))
          .filter((c) => {
            if (c.timeRemaining <= 0) {
              deactivateChallenge(c.type);
              return false;
            }
            return true;
          });

        if (updatedChallenges.length !== store.activeChallenges.length) {
          useGameStore.setState({ activeChallenges: updatedChallenges });
        } else {
          useGameStore.setState({ activeChallenges: updatedChallenges });
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    },
    [tick, activateChallenge, deactivateChallenge]
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [loop]);

  useEffect(() => {
    if (gameState === 'playing') {
      lastTickTime.current = performance.now();
      if (gameStartTime.current === 0) {
        gameStartTime.current = performance.now();
        lastChallengeTime.current = performance.now();
      }
    }
  }, [gameState]);
}
