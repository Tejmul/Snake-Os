'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

function FallingAsteroids({ gridSize }: { gridSize: number }) {
  const meshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const count = 20;
  const half = gridSize / 2;

  const asteroidData = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * gridSize,
        z: (Math.random() - 0.5) * gridSize,
        y: 10 + Math.random() * 5,
        speed: 0.05 + Math.random() * 0.1,
        rotSpeed: Math.random() * 0.05,
      })),
    [gridSize]
  );

  useFrame(() => {
    meshesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const data = asteroidData[i];
      data.y -= data.speed;
      mesh.position.y = data.y;
      mesh.rotation.x += data.rotSpeed;
      mesh.rotation.z += data.rotSpeed;

      if (data.y < 0) {
        data.y = 10 + Math.random() * 5;
        data.x = (Math.random() - 0.5) * gridSize;
        data.z = (Math.random() - 0.5) * gridSize;
        mesh.position.x = data.x;
        mesh.position.z = data.z;
      }
    });
  });

  return (
    <>
      {asteroidData.map((data, i) => (
        <mesh
          key={i}
          ref={(el) => { meshesRef.current[i] = el; }}
          position={[data.x, data.y, data.z]}
          castShadow
        >
          <icosahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial
            color="#ff1744"
            emissive="#ff1744"
            emissiveIntensity={0.6}
            roughness={0.7}
          />
        </mesh>
      ))}
    </>
  );
}

function SpeedLines() {
  const ref = useRef<THREE.Points>(null);
  const count = 100;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += 0.5;
      if (arr[i * 3 + 2] > 20) arr[i * 3 + 2] = -20;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function MirrorSnake({ gridSize }: { gridSize: number }) {
  const snake = useGameStore((s) => s.snake);
  const half = gridSize / 2;

  return (
    <group>
      {snake.map((seg, i) => {
        const mirX = (gridSize - 1 - seg.x) - half;
        const mirZ = (gridSize - 1 - seg.y) - half;
        const ratio = snake.length > 1 ? i / (snake.length - 1) : 0;
        const scale = 1 - ratio * 0.3;

        return (
          <mesh key={i} position={[mirX, 0.35, mirZ]} scale={[scale, scale, scale]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial
              color="#6c3fa0"
              emissive="#6c3fa0"
              emissiveIntensity={0.5}
              transparent
              opacity={0.6}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function FogSphere({ gridSize }: { gridSize: number }) {
  const snake = useGameStore((s) => s.snake);
  const ref = useRef<THREE.Mesh>(null);
  const half = gridSize / 2;

  useFrame(() => {
    if (!ref.current || snake.length === 0) return;
    const head = snake[0];
    ref.current.position.set(head.x - half, 0, head.y - half);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[gridSize * 0.6, 32, 32]} />
      <meshBasicMaterial color="#0a0a0f" side={THREE.BackSide} transparent opacity={0.9} />
    </mesh>
  );
}

function PortalRings({ gridSize }: { gridSize: number }) {
  const engineState = useGameStore((s) => s.engineState);
  const half = gridSize / 2;

  if (!engineState?.portals.length) return null;

  const colors = ['#6c3fa0', '#00d4ff', '#ff6a00', '#39ff14'];

  return (
    <group>
      {engineState.portals.map((portal, i) => (
        <group key={portal.id}>
          <mesh
            position={[portal.entry.x - half, 0.1, portal.entry.y - half]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.3, 0.5, 16]} />
            <meshStandardMaterial
              color={colors[i % colors.length]}
              emissive={colors[i % colors.length]}
              emissiveIntensity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            position={[portal.exit.x - half, 0.1, portal.exit.y - half]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.3, 0.5, 16]} />
            <meshStandardMaterial
              color={colors[i % colors.length]}
              emissive={colors[i % colors.length]}
              emissiveIntensity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function ChallengeEffects() {
  const activeChallenges = useGameStore((s) => s.activeChallenges);
  const gridSize = useGameStore((s) => s.gridSize);
  const gameState = useGameStore((s) => s.gameState);

  if (gameState !== 'playing') return null;

  const types = new Set(activeChallenges.map((c) => c.type));

  return (
    <group>
      {types.has('asteroid_rain') && <FallingAsteroids gridSize={gridSize} />}
      {types.has('speed_surge') && <SpeedLines />}
      {types.has('mirror_snake') && <MirrorSnake gridSize={gridSize} />}
      {types.has('fog_of_war') && <FogSphere gridSize={gridSize} />}
      {types.has('portal_madness') && <PortalRings gridSize={gridSize} />}
    </group>
  );
}
