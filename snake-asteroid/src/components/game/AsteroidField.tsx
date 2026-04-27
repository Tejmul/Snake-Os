'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const nebulaVertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  uniform float uTime;
  uniform float uChallengeIntensity;
  varying vec3 vPosition;

  // simplex-ish noise via sin combinations
  float noise3d(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise3d(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 p = vPosition * 0.02 + vec3(uTime * 0.01);
    float n = fbm(p);
    vec3 baseColor = mix(vec3(0.1, 0.0, 0.2), vec3(0.0, 0.1, 0.3), n);
    vec3 challengeTint = mix(baseColor, vec3(0.3, 0.05, 0.0), uChallengeIntensity * 0.5);
    float alpha = n * 0.08 * (1.0 + uChallengeIntensity * 0.5);
    gl_FragColor = vec4(challengeTint, alpha);
  }
`;

interface AsteroidData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  detail: number;
}

export default function AsteroidField() {
  const challengeMode = useGameStore((s) => s.challengeMode);
  const activeChallenges = useGameStore((s) => s.activeChallenges);
  const challengeActive = challengeMode && activeChallenges.length > 0;

  const nebulaRef = useRef<THREE.ShaderMaterial>(null);
  const asteroidsRef = useRef<(THREE.Mesh | null)[]>([]);

  const asteroidData = useMemo<AsteroidData[]>(() => {
    const data: AsteroidData[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 25;
      const y = (Math.random() - 0.5) * 15;
      data.push({
        position: new THREE.Vector3(
          Math.cos(angle) * dist,
          y,
          Math.sin(angle) * dist
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        scale: 0.5 + Math.random() * 2.5,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.02
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005
        ),
        detail: Math.random() > 0.5 ? 1 : 0,
      });
    }
    return data;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (nebulaRef.current) {
      nebulaRef.current.uniforms.uTime.value = t;
      nebulaRef.current.uniforms.uChallengeIntensity.value = challengeActive ? 1.0 : 0.0;
    }

    asteroidsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const data = asteroidData[i];
      data.position.add(data.velocity);

      if (data.position.length() > 50) {
        data.position.multiplyScalar(-0.8);
      }

      mesh.position.copy(data.position);
      mesh.rotation.x += data.rotSpeed.x;
      mesh.rotation.y += data.rotSpeed.y;
      mesh.rotation.z += data.rotSpeed.z;
    });
  });

  return (
    <group>
      <Stars
        radius={100}
        depth={50}
        count={challengeActive ? 8000 : 5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <mesh>
        <sphereGeometry args={[80, 32, 32]} />
        <shaderMaterial
          ref={nebulaRef}
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uChallengeIntensity: { value: 0 },
          }}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      {asteroidData.map((data, i) => (
        <mesh
          key={i}
          ref={(el) => { asteroidsRef.current[i] = el; }}
          position={data.position}
          rotation={data.rotation}
          scale={[data.scale, data.scale, data.scale]}
        >
          <icosahedronGeometry args={[1, data.detail]} />
          <meshStandardMaterial
            color={challengeActive && data.position.length() < 25 ? '#4a1010' : '#3a3a40'}
            emissive={challengeActive && data.position.length() < 25 ? '#ff1744' : '#000000'}
            emissiveIntensity={challengeActive ? 0.3 : 0}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}
