import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Player, ControlsMap } from './Player';
import { City } from './City';
import { Camera } from './Camera';
import { Vehicles } from './Vehicles';
import { NPCs } from './NPCs';
import { useGameStore } from './useGameStore';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { TouchControls } from '../ui/TouchControls';
import { RadioWidget } from '../ui/RadioWidget';

/**
 * Resume the Three.js shared AudioContext on the first user gesture.
 * Browsers gate AudioContext.state at 'suspended' until a real user
 * interaction has occurred; this hook satisfies that requirement.
 */
function useAudioContextResume() {
  useEffect(() => {
    const resume = () => {
      try {
        // Three.js exposes its shared context via this static getter.
        // Cast to the Web Audio API type for .state / .resume().
        const ctx = THREE.AudioContext.getContext() as unknown as AudioContext;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      } catch {
        // THREE.AudioContext.getContext() throws if no context was ever created —
        // that means no audio is in use, so nothing to do.
      }
    };

    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown',     resume, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown',     resume);
    };
  }, []);
}

export function GameEngine() {
  const targetRef  = useRef<THREE.Group>(null);
  const vehicleRef = useRef<THREE.Group>(null);

  const inVehicle   = useGameStore((s) => s.inVehicle);
  const screen      = useGameStore((s) => s.screen);
  const cameraMode  = useGameStore((s) => s.cameraMode);
  const togglePause = useGameStore((s) => s.togglePause);

  useAudioContextResume();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && screen === 'playing') togglePause();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, togglePause]);

  if (screen !== 'playing') return null;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#050810] overflow-hidden">
      <KeyboardControls map={ControlsMap}>
        <Canvas
          shadows
          camera={{ position: [0, 10, 10], fov: cameraMode === 'first' ? 80 : 60 }}
          gl={{ antialias: false }}
          onCreated={({ gl }) => {
            // Explicit shadow map type — suppresses any SoftShadowMap deprecation
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <color attach="background" args={['#050810']} />
          <fog attach="fog" args={['#080818', 60, 350]} />
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

          {/* ── Lighting ── */}
          <ambientLight intensity={0.65} color="#b0c0e0" />
          <directionalLight
            castShadow
            position={[50, 100, 50]}
            intensity={1.3}
            color="#d0e0ff"
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-200}
            shadow-camera-right={200}
            shadow-camera-top={200}
            shadow-camera-bottom={-200}
            shadow-camera-far={400}
          />
          <hemisphereLight args={['#1a2040', '#ff8c20', 0.4]} />

          {/* Camera anchor group for active vehicle */}
          <group ref={vehicleRef} />

          <City />
          <Player ref={targetRef} />
          <Vehicles activeVehicleRef={vehicleRef} />
          <NPCs />
          <Camera
            targetRef={inVehicle ? vehicleRef : targetRef}
            inVehicle={inVehicle}
            cameraMode={cameraMode}
          />
        </Canvas>
      </KeyboardControls>

      <HUD />
      <TouchControls />
      <RadioWidget />
      <PauseMenu />
    </div>
  );
}
