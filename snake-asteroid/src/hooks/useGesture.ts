'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GESTURE_THRESHOLDS } from '@/lib/constants';
import type { Direction, GestureState } from '@/types/game';

export function useGesture(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const updateGesture = useGameStore((s) => s.updateGesture);
  const setDirection = useGameStore((s) => s.setDirection);
  const gameState = useGameStore((s) => s.gameState);

  const lastDirectionTime = useRef(0);
  const fistStartTime = useRef<number | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const processResults = useCallback(
    (results: any) => {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        updateGesture({ detected: false, direction: null, confidence: 0, landmarks: null });
        fistStartTime.current = null;
        return;
      }

      const landmarks = results.multiHandLandmarks[0];
      const wrist = landmarks[0];
      const indexTip = landmarks[8];

      const fingerTips = [4, 8, 12, 16, 20];
      const fingerMCPs = [2, 5, 9, 13, 17];
      let foldedCount = 0;
      for (let i = 0; i < fingerTips.length; i++) {
        if (landmarks[fingerTips[i]].y > landmarks[fingerMCPs[i]].y) {
          foldedCount++;
        }
      }

      const isFist = foldedCount >= 4;
      const now = Date.now();

      if (isFist) {
        if (!fistStartTime.current) fistStartTime.current = now;
        if (now - fistStartTime.current >= GESTURE_THRESHOLDS.holdDuration) {
          updateGesture({ detected: true, direction: 'STOP', confidence: 0.9, landmarks });
          return;
        }
      } else {
        fistStartTime.current = null;
      }

      const dx = indexTip.x - wrist.x;
      const dy = indexTip.y - wrist.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);

      if (magnitude < GESTURE_THRESHOLDS.swipeMinDistance) {
        updateGesture({ detected: true, direction: null, confidence: magnitude / GESTURE_THRESHOLDS.swipeMinDistance, landmarks });
        return;
      }

      let direction: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'LEFT' : 'RIGHT';
      } else {
        direction = dy < 0 ? 'UP' : 'DOWN';
      }

      const confidence = Math.min(magnitude / 0.3, 1);

      if (now - lastDirectionTime.current > 150 && gameState === 'playing') {
        setDirection(direction);
        lastDirectionTime.current = now;
      }

      updateGesture({ detected: true, direction, confidence, landmarks });
    },
    [updateGesture, setDirection, gameState]
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const { Hands } = await import('@mediapipe/hands');
        const { Camera } = await import('@mediapipe/camera_utils');

        if (!active || !videoRef.current) return;

        const hands = new Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(processResults);
        handsRef.current = hands;

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 320,
          height: 240,
        });

        cameraRef.current = camera;
        await camera.start();
      } catch (err) {
        console.error('Failed to initialize gesture controls:', err);
      }
    };

    init();

    return () => {
      active = false;
      if (cameraRef.current) cameraRef.current.stop();
      if (handsRef.current) handsRef.current.close();
    };
  }, [videoRef, processResults]);
}
