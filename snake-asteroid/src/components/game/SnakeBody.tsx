'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { DIRECTION_VECTOR } from '@/lib/constants';

function lerpColor(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  ca.lerp(cb, t);
  return '#' + ca.getHexString();
}

export default function SnakeBody() {
  const snake = useGameStore((s) => s.snake);
  const direction = useGameStore((s) => s.direction);
  const gameState = useGameStore((s) => s.gameState);
  const gridSize = useGameStore((s) => s.gridSize);

  const groupRef = useRef<THREE.Group>(null);
  const segmentRefs = useRef<(THREE.Mesh | null)[]>([]);
  const prevPositions = useRef<Map<number, THREE.Vector3>>(new Map());
  const deathTime = useRef<number | null>(null);

  const half = gridSize / 2;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (gameState === 'gameover') {
      if (deathTime.current === null) deathTime.current = t;
      const elapsed = t - deathTime.current;

      segmentRefs.current.forEach((mesh, i) => {
        if (!mesh) return;
        const drift = Math.min(elapsed * 0.5, 3);
        const angle = (i / Math.max(snake.length, 1)) * Math.PI * 2;
        mesh.position.x += Math.sin(angle) * drift * 0.01;
        mesh.position.z += Math.cos(angle) * drift * 0.01;
        mesh.position.y += drift * 0.005;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) mat.opacity = Math.max(0, 1 - elapsed * 0.3);
      });
      return;
    }

    deathTime.current = null;

    snake.forEach((seg, i) => {
      const mesh = segmentRefs.current[i];
      if (!mesh) return;

      const targetX = seg.x - half;
      const targetZ = seg.y - half;
      const targetY = seg.isHead
        ? 0.4 + 0.05 * Math.sin(t * 3)
        : 0.35 + 0.05 * Math.sin(t * 3 + i * 0.5);

      mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, 0.2);
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.2);
      mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, 0.2);
    });
  });

  if (gameState !== 'playing' && gameState !== 'gameover' && gameState !== 'paused') {
    return null;
  }

  const dirVec = DIRECTION_VECTOR[direction];
  const headAngle = Math.atan2(dirVec.x, -dirVec.y);

  return (
    <group ref={groupRef}>
      {snake.map((seg, i) => {
        const totalLen = snake.length;
        const ratio = totalLen > 1 ? i / (totalLen - 1) : 0;
        const isHead = i === 0;
        const isTail = i === totalLen - 1 && totalLen > 1;

        const baseScale = 1 - ratio * 0.3;
        const color = lerpColor('#39ff14', '#0d4f2a', ratio);

        return (
          <group key={i}>
            <mesh
              ref={(el) => { segmentRefs.current[i] = el; }}
              position={[seg.x - half, isHead ? 0.4 : 0.35, seg.y - half]}
              castShadow
              scale={[baseScale, baseScale, baseScale]}
              rotation={isHead ? [0, headAngle, 0] : [0, 0, 0]}
            >
              {isHead ? (
                <dodecahedronGeometry args={[0.4, 1]} />
              ) : isTail ? (
                <coneGeometry args={[0.3, 0.5, 6]} />
              ) : (
                <sphereGeometry args={[0.35, 12, 12]} />
              )}
              <meshStandardMaterial
                color={color}
                emissive={isHead ? '#39ff14' : color}
                emissiveIntensity={isHead ? 0.6 : 0.15}
                metalness={0.7}
                roughness={0.2}
                transparent={gameState === 'gameover'}
                opacity={1}
              />
            </mesh>

            {isHead && (
              <>
                <mesh
                  position={[
                    seg.x - half + dirVec.x * 0.25 + (dirVec.y === 0 ? 0 : 0.15),
                    0.55,
                    seg.y - half - dirVec.y * 0.25 + (dirVec.x === 0 ? 0 : 0.15),
                  ]}
                >
                  <sphereGeometry args={[0.06, 8, 8]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={1}
                  />
                </mesh>
                <mesh
                  position={[
                    seg.x - half + dirVec.x * 0.25 + (dirVec.y === 0 ? 0 : -0.15),
                    0.55,
                    seg.y - half - dirVec.y * 0.25 + (dirVec.x === 0 ? 0 : -0.15),
                  ]}
                >
                  <sphereGeometry args={[0.06, 8, 8]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={1}
                  />
                </mesh>

                <pointLight
                  color="#39ff14"
                  intensity={1}
                  distance={5}
                  position={[seg.x - half, 1, seg.y - half]}
                />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
