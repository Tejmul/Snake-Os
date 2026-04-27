'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import Lighting from './Lighting';
import GameBoard from './GameBoard';
import SnakeBody from './SnakeBody';
import FoodItem from './FoodItem';
import AsteroidField from './AsteroidField';
import TrailEffect from './TrailEffect';
import ChallengeEffects from './ChallengeEffects';
import ExplosionEffect from './ExplosionEffect';
import CameraController from './CameraController';
import { useGameStore } from '@/store/gameStore';

function PostProcessing() {
  const challengeMode = useGameStore((s) => s.challengeMode);
  const activeChallenges = useGameStore((s) => s.activeChallenges);
  const challengeActive = challengeMode && activeChallenges.length > 0;

  const bloomIntensity = challengeActive ? 1.2 : 0.5;
  const caOffset = challengeActive
    ? new Vector2(0.003, 0.003)
    : new Vector2(0.0005, 0.0005);

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
      />
      <ChromaticAberration
        offset={caOffset}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette darkness={0.5} offset={0.3} />
      <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

function SceneContent() {
  const gameState = useGameStore((s) => s.gameState);
  const isPlaying = gameState === 'playing' || gameState === 'paused';

  return (
    <>
      <Lighting />
      <GameBoard />
      <SnakeBody />
      <FoodItem />
      <AsteroidField />
      <TrailEffect />
      <ChallengeEffects />
      <ExplosionEffect />
      <PostProcessing />
      {isPlaying ? (
        <CameraController />
      ) : (
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.2}
        />
      )}
    </>
  );
}

export default function GameCanvas() {
  const gridSize = useGameStore((s) => s.gridSize);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, gridSize * 0.9, 12], fov: 60 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 20, 50]} />

        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
