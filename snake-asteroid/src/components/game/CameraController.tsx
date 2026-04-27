'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { DIRECTION_VECTOR } from '@/lib/constants';

const CINEMATIC_ANGLES = [
  { offset: [10, 8, 0], lookAhead: 0 },
  { offset: [0, 2, 12], lookAhead: 3 },
  { offset: [0, 25, 0.5], lookAhead: 0 },
  { offset: [-3, 4, 4], lookAhead: 2 },
] as const;

export default function CameraController() {
  const cameraMode = useGameStore((s) => s.cameraMode);
  const snake = useGameStore((s) => s.snake);
  const direction = useGameStore((s) => s.direction);
  const gridSize = useGameStore((s) => s.gridSize);
  const gameState = useGameStore((s) => s.gameState);

  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const cinematicIdx = useRef(0);
  const lastCinematicSwitch = useRef(0);
  const half = gridSize / 2;

  useFrame(({ clock }) => {
    if (gameState !== 'playing' && gameState !== 'paused') return;
    if (snake.length === 0) return;

    const head = snake[0];
    const headWorld = new THREE.Vector3(head.x - half, 0, head.y - half);
    const dirVec = DIRECTION_VECTOR[direction];
    const t = clock.getElapsedTime();

    switch (cameraMode) {
      case 'top-down': {
        targetPos.current.set(
          headWorld.x * 0.3,
          gridSize * 0.9,
          headWorld.z * 0.3 + 2
        );
        targetLook.current.copy(headWorld);
        targetLook.current.y = 0;
        break;
      }
      case 'follow': {
        const behind = new THREE.Vector3(-dirVec.x * 8, 6, -dirVec.y * 8);
        targetPos.current.copy(headWorld).add(behind);
        const ahead = new THREE.Vector3(dirVec.x * 3, 0, dirVec.y * 3);
        targetLook.current.copy(headWorld).add(ahead);
        break;
      }
      case 'cinematic': {
        const interval = useGameStore.getState().activeChallenges.length > 0 ? 4 : 6;
        if (t - lastCinematicSwitch.current > interval) {
          cinematicIdx.current = (cinematicIdx.current + 1) % CINEMATIC_ANGLES.length;
          lastCinematicSwitch.current = t;
        }
        const angle = CINEMATIC_ANGLES[cinematicIdx.current];
        targetPos.current.set(
          headWorld.x + angle.offset[0],
          angle.offset[1],
          headWorld.z + angle.offset[2]
        );
        const lookAhead = new THREE.Vector3(
          dirVec.x * angle.lookAhead,
          0,
          dirVec.y * angle.lookAhead
        );
        targetLook.current.copy(headWorld).add(lookAhead);
        break;
      }
    }

    camera.position.lerp(targetPos.current, 0.04);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const currentTarget = new THREE.Vector3()
      .copy(camera.position)
      .add(currentLook.multiplyScalar(10));
    currentTarget.lerp(targetLook.current, 0.06);
    camera.lookAt(targetLook.current);
  });

  return null;
}
