import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Player, ControlsMap } from './Player';
import { City } from './City';
import { Camera } from './Camera';
import { Vehicles } from './Vehicles';
import { NPCs } from './NPCs';
import { DayNight } from './DayNight';
import { InteriorRoom } from './InteriorRoom';
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
        const ctx = THREE.AudioContext.getContext() as unknown as AudioContext;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      } catch {
        // No audio context created yet — nothing to do.
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
  const indoors     = useGameStore((s) => s.indoors);
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
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          {/* Base background & fog — DayNight overwrites these every frame */}
          <color attach="background" args={['#050810']} />
          <fog attach="fog" args={['#080818', 60, 350]} />

          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

          {/* ── Dynamic day/night lighting ── */}
          <DayNight />

          {/* Camera anchor for the active vehicle */}
          <group ref={vehicleRef} />

          {/* ── World geometry ── */}
          {!indoors && <City />}
          {!indoors && <Vehicles activeVehicleRef={vehicleRef} />}
          {!indoors && <NPCs />}

          {/* ── Interior room (rendered when player is inside a building) ── */}
          {indoors && <InteriorRoom />}

          {/* ── Player (always present — camera follows this ref) ── */}
          <Player ref={targetRef} />

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
