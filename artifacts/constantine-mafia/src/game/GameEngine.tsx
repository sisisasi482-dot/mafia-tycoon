import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Player, ControlsMap } from './Player';
import { City } from './City';
import { Camera } from './Camera';
import { useGameStore } from './useGameStore';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { TouchControls } from '../ui/TouchControls';

export function GameEngine() {
  const targetRef = useRef<THREE.Group>(null);
  const { inVehicle, screen, togglePause } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && screen === 'playing') {
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, togglePause]);

  if (screen !== 'playing') return null;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#050810] overflow-hidden">
      <KeyboardControls map={ControlsMap}>
        <Canvas shadows camera={{ position: [0, 10, 10], fov: 60 }} gl={{ antialias: false }}>
          {/* Night atmosphere */}
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
          {/* Warm fill light from below to simulate city glow */}
          <hemisphereLight args={['#1a2040', '#ff8c20', 0.4]} />
          
          <City />
          <Player ref={targetRef} />
          <Camera targetRef={targetRef} inVehicle={inVehicle} />
        </Canvas>
      </KeyboardControls>

      <HUD />
      <TouchControls />
      <PauseMenu />
    </div>
  );
}
