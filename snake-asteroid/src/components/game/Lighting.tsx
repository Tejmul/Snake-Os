'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

export default function Lighting() {
  const challengeMode = useGameStore((s) => s.challengeMode);
  const activeChallenges = useGameStore((s) => s.activeChallenges);
  const snake = useGameStore((s) => s.snake);
  const gameState = useGameStore((s) => s.gameState);
  const gridSize = useGameStore((s) => s.gridSize);

  const challengeLightRef = useRef<THREE.PointLight>(null);
  const headLightRef = useRef<THREE.PointLight>(null);

  const challengeActive = challengeMode && activeChallenges.length > 0;

  useFrame(({ clock }) => {
    if (challengeLightRef.current) {
      if (challengeActive) {
        challengeLightRef.current.intensity =
          1 + Math.sin(clock.getElapsedTime() * 4) * 1;
        challengeLightRef.current.visible = true;
      } else {
        challengeLightRef.current.visible = false;
      }
    }

    if (headLightRef.current && snake.length > 0 && gameState === 'playing') {
      const head = snake[0];
      headLightRef.current.position.set(head.x - gridSize / 2, 1, head.y - gridSize / 2);
    }
  });

  const center = gridSize / 2;

  return (
    <>
      <ambientLight color="#1a1a3e" intensity={0.15} />

      <directionalLight
        color="#ff8844"
        intensity={1.2}
        position={[-10, 15, -5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <directionalLight
        color="#0066ff"
        intensity={0.5}
        position={[5, -3, -10]}
      />

      <pointLight
        ref={headLightRef}
        color="#00d4ff"
        intensity={0.8}
        distance={8}
        position={[0, 1, 0]}
      />

      <pointLight
        ref={challengeLightRef}
        color="#ff1744"
        intensity={0}
        distance={20}
        position={[0, 5, 0]}
        visible={false}
      />
    </>
  );
}
