'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const hexGridVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const hexGridFragmentShader = `
  uniform float uTime;
  uniform float uChallengeActive;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hexDist(vec2 p) {
    p = abs(p);
    return max(dot(p, normalize(vec2(1.0, 1.732))), p.x);
  }

  vec4 hexCoords(vec2 uv) {
    vec2 r = vec2(1.0, 1.732);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) - h;
    vec2 gv;
    if (length(a) < length(b)) gv = a; else gv = b;
    float d = hexDist(gv);
    return vec4(gv, d, 0.0);
  }

  void main() {
    vec2 scaled = vWorldPos.xz * 0.8;
    vec4 hc = hexCoords(scaled);
    float edge = smoothstep(0.45, 0.5, hc.z);
    float lineAlpha = edge * 0.1;

    float pulse = 1.0 + uChallengeActive * 0.3 * sin(uTime * 3.0);
    lineAlpha *= pulse;

    vec3 baseColor = vec3(0.051, 0.067, 0.09);
    vec3 lineColor = vec3(0.424, 0.247, 0.627);

    if (uChallengeActive > 0.5) {
      lineColor = mix(lineColor, vec3(1.0, 0.0, 1.0), 0.5);
    }

    vec3 col = mix(baseColor, lineColor, lineAlpha);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function DustParticles({ gridSize }: { gridSize: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 40;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const half = gridSize / 2;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * gridSize;
      pos[i * 3 + 1] = Math.random() * 3 + 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * gridSize;
      vel[i * 3] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return { positions: pos, velocities: vel };
  }, [gridSize]);

  useFrame(() => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const half = gridSize / 2;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      if (Math.abs(arr[i * 3]) > half) velocities[i * 3] *= -1;
      if (arr[i * 3 + 1] > 4 || arr[i * 3 + 1] < 0.1) velocities[i * 3 + 1] *= -1;
      if (Math.abs(arr[i * 3 + 2]) > half) velocities[i * 3 + 2] *= -1;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#e8e8ff"
        size={0.04}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export default function GameBoard() {
  const gridSize = useGameStore((s) => s.gridSize);
  const challengeMode = useGameStore((s) => s.challengeMode);
  const activeChallenges = useGameStore((s) => s.activeChallenges);
  const shrunkWalls = useGameStore((s) => s.engineState?.shrunkWalls ?? 0);

  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const challengeActive = challengeMode && activeChallenges.length > 0;
  const effectiveSize = gridSize - shrunkWalls * 2;
  const half = gridSize / 2;
  const wallThickness = 0.3;
  const wallHeight = 1.2;

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
      shaderRef.current.uniforms.uChallengeActive.value = challengeActive ? 1.0 : 0.0;
    }
  });

  const wallSegments = useMemo(() => {
    const offset = shrunkWalls;
    const size = gridSize - offset * 2;
    const h = size / 2;
    return [
      { pos: [0, wallHeight / 2, -h] as [number, number, number], scale: [size + wallThickness * 2, wallHeight, wallThickness] as [number, number, number] },
      { pos: [0, wallHeight / 2, h] as [number, number, number], scale: [size + wallThickness * 2, wallHeight, wallThickness] as [number, number, number] },
      { pos: [-h, wallHeight / 2, 0] as [number, number, number], scale: [wallThickness, wallHeight, size] as [number, number, number] },
      { pos: [h, wallHeight / 2, 0] as [number, number, number], scale: [wallThickness, wallHeight, size] as [number, number, number] },
    ];
  }, [gridSize, shrunkWalls]);

  const cornerPositions = useMemo(() => {
    const h = (gridSize - shrunkWalls * 2) / 2;
    return [
      [-h, 0, -h],
      [h, 0, -h],
      [-h, 0, h],
      [h, 0, h],
    ] as [number, number, number][];
  }, [gridSize, shrunkWalls]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={hexGridVertexShader}
          fragmentShader={hexGridFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uChallengeActive: { value: 0 },
          }}
        />
      </mesh>

      {wallSegments.map((wall, i) => (
        <mesh key={i} position={wall.pos} scale={wall.scale} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#2d2d3a"
            metalness={0.9}
            roughness={0.3}
            emissive="#00d4ff"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {cornerPositions.map((pos, i) => (
        <mesh key={`corner-${i}`} position={[pos[0], 0.6, pos[2]]}>
          <cylinderGeometry args={[0.15, 0.15, 1.5, 8]} />
          <meshStandardMaterial
            color="#ff6a00"
            emissive="#ff6a00"
            emissiveIntensity={0.8}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}

      <DustParticles gridSize={gridSize} />
    </group>
  );
}
