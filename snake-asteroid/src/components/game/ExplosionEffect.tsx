'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

interface Explosion {
  id: number;
  position: THREE.Vector3;
  color: THREE.Color;
  particles: {
    velocity: THREE.Vector3;
    position: THREE.Vector3;
    scale: number;
    life: number;
  }[];
  startTime: number;
}

const PARTICLE_COUNT = 30;
const EXPLOSION_DURATION = 0.5;

let explosionId = 0;

export default function ExplosionEffect() {
  const lastEatenFood = useGameStore((s) => s.lastEatenFood);
  const gridSize = useGameStore((s) => s.gridSize);
  const half = gridSize / 2;

  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const maxInstances = 150;

  useEffect(() => {
    if (!lastEatenFood) return;

    const colorMap: Record<string, string> = {
      normal: '#ff6a00',
      golden: '#ffd700',
      speed: '#00d4ff',
      shrink: '#39ff14',
    };

    const color = new THREE.Color(colorMap[lastEatenFood.type] || '#ff6a00');
    const pos = new THREE.Vector3(
      lastEatenFood.position.x - half,
      0.5,
      lastEatenFood.position.y - half
    );

    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 4;
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed * 0.5 + 2,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: pos.clone(),
        scale: 0.08 + Math.random() * 0.06,
        life: 0,
      });
    }

    const newExplosion: Explosion = {
      id: ++explosionId,
      position: pos,
      color,
      particles,
      startTime: 0,
    };

    setExplosions((prev) => [...prev.slice(-4), newExplosion]);
  }, [lastEatenFood, half]);

  useFrame((_, delta) => {
    let allDead = true;

    setExplosions((prev) =>
      prev.filter((exp) => {
        exp.startTime += delta;
        if (exp.startTime > EXPLOSION_DURATION) return false;
        allDead = false;
        return true;
      })
    );

    if (!meshRef.current) return;

    let idx = 0;
    for (const exp of explosions) {
      const progress = exp.startTime / EXPLOSION_DURATION;
      for (const p of exp.particles) {
        if (idx >= maxInstances) break;
        p.position.addScaledVector(p.velocity, delta);
        p.velocity.y -= 9.8 * delta;
        const s = p.scale * (1 - progress);

        dummy.position.copy(p.position);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }

    for (let i = idx; i < maxInstances; i++) {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const latestColor = explosions.length > 0 ? explosions[explosions.length - 1].color : new THREE.Color('#ff6a00');

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxInstances]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={latestColor}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
