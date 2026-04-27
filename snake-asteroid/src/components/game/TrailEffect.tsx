'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const MAX_PARTICLES = 60;

interface TrailParticle {
  position: THREE.Vector3;
  opacity: number;
  scale: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export default function TrailEffect() {
  const snake = useGameStore((s) => s.snake);
  const gameState = useGameStore((s) => s.gameState);
  const gridSize = useGameStore((s) => s.gridSize);
  const activeChallenges = useGameStore((s) => s.activeChallenges);

  const half = gridSize / 2;
  const isSpeedSurge = activeChallenges.some((c) => c.type === 'speed_surge');

  const particles = useRef<TrailParticle[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArr = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);

  useFrame((_, delta) => {
    if (gameState !== 'playing' || snake.length < 2) return;

    const tail = snake[snake.length - 1];
    const tailPos = new THREE.Vector3(tail.x - half, 0.2, tail.y - half);

    particles.current.push({
      position: tailPos.clone(),
      opacity: 1,
      scale: 0.2,
      life: 0,
      maxLife: isSpeedSurge ? 1.5 : 1.0,
      color: new THREE.Color(isSpeedSurge ? '#00d4ff' : '#39ff14'),
    });

    if (particles.current.length > MAX_PARTICLES) {
      particles.current.splice(0, particles.current.length - MAX_PARTICLES);
    }

    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.life += delta;
      const progress = p.life / p.maxLife;
      p.opacity = 1 - progress;
      p.scale = 0.2 * (1 - progress * 0.7);

      if (p.life >= p.maxLife) {
        particles.current.splice(i, 1);
      }
    }

    if (!meshRef.current) return;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < particles.current.length) {
        const p = particles.current[i];
        dummy.position.copy(p.position);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        colorArr[i * 3] = p.color.r * p.opacity;
        colorArr[i * 3 + 1] = p.color.g * p.opacity;
        colorArr[i * 3 + 2] = p.color.b * p.opacity;
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (gameState !== 'playing') return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#39ff14"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
