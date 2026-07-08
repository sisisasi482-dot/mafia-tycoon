import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Player, ControlsMap } from './Player';
import { City } from './City';
import { Camera } from './Camera';
import { Vehicles } from './Vehicles';
import { useGameStore } from './useGameStore';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { TouchControls } from '../ui/TouchControls';
import { RadioWidget } from '../ui/RadioWidget';

export function GameEngine() {
  const targetRef       = useRef<THREE.Group>(null);
  // Camera anchor for the active vehicle — written to every frame by Vehicles.tsx
  const vehicleRef      = useRef<THREE.Group>(null);

  // Use specific selectors — prevents re-rendering on every single store change
  const inVehicle   = useGameStore((s) => s.inVehicle);
  const screen      = useGameStore((s) => s.screen);
  const cameraMode  = useGameStore((s) => s.cameraMode);
  const togglePause = useGameStore((s) => s.togglePause);

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
          <color attach="background" args={['#050810']} />
          <fog attach="fog" args={['#080818', 60, 350]} />
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

          {/* Lighting */}
          <ambientLight intensity={0.6} color="#b0c0e0" />
          <directionalLight
            castShadow
            position={[50, 100, 50]}
            intensity={1.2}
            color="#d0e0ff"
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-200}
            shadow-camera-right={200}
            shadow-camera-top={200}
            shadow-camera-bottom={-200}
            shadow-camera-far={400}
          />
          <hemisphereLight args={['#1a2040', '#ff8c20', 0.4]} />

          {/* Invisible group that acts as the camera anchor when driving */}
          <group ref={vehicleRef} />

          <City />
          <Player ref={targetRef} />
          <Vehicles activeVehicleRef={vehicleRef} />
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
