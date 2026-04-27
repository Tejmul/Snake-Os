'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

function NormalFood({ position, gridSize }: { position: [number, number, number]; gridSize: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.015;
    ref.current.position.y = 0.5 + 0.15 * Math.sin(t * 2);
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <icosahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial
        color="#ff6a00"
        roughness={0.8}
        metalness={0.2}
        emissive="#ff6a00"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function GoldenFood({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const orbitRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x += 0.02;
    ref.current.rotation.y += 0.025;
    ref.current.position.y = 0.5 + 0.15 * Math.sin(t * 2);

    orbitRefs.current.forEach((orb, i) => {
      if (!orb) return;
      const angle = t * 2 + (i * Math.PI * 2) / 3;
      orb.position.x = position[0] + Math.cos(angle) * 0.6;
      orb.position.y = 0.5 + Math.sin(t * 3) * 0.1;
      orb.position.z = position[2] + Math.sin(angle) * 0.6;
    });
  });

  return (
    <group>
      <mesh ref={ref} position={position} castShadow>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) orbitRefs.current[i] = el; }}
          position={position}
        >
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#ffd700"
            emissiveIntensity={1}
          />
        </mesh>
      ))}
      <pointLight
        color="#ffd700"
        intensity={0.6}
        distance={4}
        position={position}
      />
    </group>
  );
}

function SpeedFood({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y += 0.02;
    ref.current.position.y = 0.5 + 0.15 * Math.sin(t * 2);
    const s = 1 + 0.1 * Math.sin(t * 5);
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <octahedronGeometry args={[0.3]} />
      <meshStandardMaterial
        color="#00d4ff"
        emissive="#00d4ff"
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  );
}

function ShrinkFood({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.04;
    ref.current.position.y = 0.5 + 0.15 * Math.sin(clock.getElapsedTime() * 2);
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <tetrahedronGeometry args={[0.35]} />
      <meshStandardMaterial
        color="#39ff14"
        emissive="#39ff14"
        emissiveIntensity={0.4}
        metalness={0.5}
        roughness={0.3}
      />
    </mesh>
  );
}

export default function FoodItem() {
  const food = useGameStore((s) => s.food);
  const gridSize = useGameStore((s) => s.gridSize);
  const gameState = useGameStore((s) => s.gameState);
  const half = gridSize / 2;

  if (gameState !== 'playing' && gameState !== 'paused') return null;

  return (
    <group>
      {food.map((f, i) => {
        const pos: [number, number, number] = [
          f.position.x - half,
          0.5,
          f.position.y - half,
        ];

        switch (f.type) {
          case 'golden':
            return <GoldenFood key={i} position={pos} />;
          case 'speed':
            return <SpeedFood key={i} position={pos} />;
          case 'shrink':
            return <ShrinkFood key={i} position={pos} />;
          default:
            return <NormalFood key={i} position={pos} gridSize={gridSize} />;
        }
      })}
    </group>
  );
}
