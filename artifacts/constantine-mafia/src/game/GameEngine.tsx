import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { KeyboardControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Player, ControlsMap } from './Player';
import { City } from './City';
import { Camera } from './Camera';
import { Vehicles } from './Vehicles';
import { NPCs } from './NPCs';
import { DayNight } from './DayNight';
import { InteriorRoom } from './InteriorRoom';
import { Traffic } from './Traffic';
import { Police } from './Police';
import { Houses } from './Houses';
import { Environment } from './Environment';
import { useGameStore, FpsCap } from './useGameStore';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { TouchControls } from '../ui/TouchControls';
import { RadioWidget } from '../ui/RadioWidget';
import { DialogueUI } from '../ui/DialogueUI';
import { HomePanel } from '../ui/HomePanel';
import { TvOverlay } from '../ui/TvOverlay';
import { WardrobeOverlay } from '../ui/WardrobeOverlay';

/**
 * FPS cap controller.
 * Uses frameloop="demand" on the Canvas + calls invalidate() at the target rate.
 * When fpsCap === 0 (unlimited), drives a RAF loop for max frame rate.
 */
function FpsCapController({ fpsCap }: { fpsCap: FpsCap }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (fpsCap === 0) {
      // Unlimited: drive via RAF so the renderer keeps up with monitor refresh
      let raf: number;
      const loop = () => { invalidate(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    } else {
      // Capped: fire invalidate on a fixed interval
      const ms = 1000 / fpsCap;
      // Kick off the first frame immediately so we don't wait a full interval
      invalidate();
      const id = setInterval(invalidate, ms);
      return () => clearInterval(id);
    }
  }, [fpsCap, invalidate]);

  return null;
}

/**
 * Resume the Three.js shared AudioContext on the first user gesture.
 */
function useAudioContextResume() {
  useEffect(() => {
    const resume = () => {
      try {
        const ctx = THREE.AudioContext.getContext() as unknown as AudioContext;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      } catch { /* no audio context yet */ }
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
  const fpsCap      = useGameStore((s) => s.fpsCap);

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
        {/*
          frameloop="demand": only renders when invalidate() is called.
          FpsCapController inside the Canvas drives the invalidate() calls
          at the selected frame rate cap (or unlimited via RAF).
        */}
        <Canvas
          shadows
          frameloop="demand"
          camera={{ position: [0, 10, 10], fov: cameraMode === 'first' ? 80 : 60 }}
          gl={{ antialias: false }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          {/* Base background & fog — DayNight overwrites these every frame */}
          <color attach="background" args={['#050810']} />
          {/* Fog far distance 2× expanded for the larger map */}
          <fog attach="fog" args={['#080818', 120, 700]} />

          <Stars radius={200} depth={60} count={3000} factor={4} saturation={0} fade speed={1} />

          {/* FPS cap controller — drives the render loop */}
          <FpsCapController fpsCap={fpsCap} />

          {/* Dynamic day/night lighting */}
          <DayNight />

          {/* Camera anchor for the active vehicle */}
          <group ref={vehicleRef} />

          {/* World geometry */}
          {!indoors && <City />}
          {!indoors && <Vehicles activeVehicleRef={vehicleRef} />}
          {!indoors && <NPCs />}
          {!indoors && <Traffic />}
          {!indoors && <Police />}
          {!indoors && <Houses />}
          {!indoors && <Environment />}

          {/* Interior room (when player is inside a building) */}
          {indoors && <InteriorRoom />}

          {/* Player (camera follows this ref) */}
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
      <DialogueUI />
      <HomePanel />
      <TvOverlay />
      <WardrobeOverlay />
    </div>
  );
}
