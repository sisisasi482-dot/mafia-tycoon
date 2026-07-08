import React, { forwardRef, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

export const ControlsMap = [
  { name: 'forward',  keys: ['ArrowUp',    'KeyW'] },
  { name: 'back',     keys: ['ArrowDown',  'KeyS'] },
  { name: 'left',     keys: ['ArrowLeft',  'KeyA'] },
  { name: 'right',    keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump',     keys: ['Space'] },
  { name: 'sprint',   keys: ['ShiftLeft'] },
  { name: 'interact', keys: ['KeyE'] },
  { name: 'attack',   keys: ['KeyF'] },
  { name: 'map',      keys: ['KeyM'] },
  { name: 'escape',   keys: ['Escape'] },
];

export const Player = forwardRef<THREE.Group, {}>((_, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();
  const { playerPosition, playerRotationY, setPlayerPosition, inVehicle, careerPath, cameraMode } = useGameStore();

  const velocity  = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const syncTimer = useRef(0);
  const prevInVehicle = useRef(inVehicle);

  // Assign forwarded ref
  useEffect(() => {
    if (typeof ref === 'function') ref(innerRef.current);
    else if (ref) (ref as React.MutableRefObject<THREE.Group | null>).current = innerRef.current;
  }, [ref]);

  // Spawn position
  useEffect(() => {
    innerRef.current?.position.set(...playerPosition);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snap position when exiting a vehicle
  useEffect(() => {
    if (prevInVehicle.current && !inVehicle && innerRef.current) {
      innerRef.current.position.set(...playerPosition);
      innerRef.current.rotation.y = playerRotationY;
      velocity.current.set(0, 0, 0);
    }
    prevInVehicle.current = inVehicle;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inVehicle]);

  useFrame((_, delta) => {
    if (!innerRef.current || inVehicle || useGameStore.getState().isPaused) return;

    const keys  = getKeys();
    const speed = keys.sprint ? 16 : 8;

    direction.current.set(0, 0, 0);
    if (keys.forward) direction.current.z -= 1;
    if (keys.back)    direction.current.z += 1;
    if (keys.left)    direction.current.x -= 1;
    if (keys.right)   direction.current.x += 1;
    direction.current.normalize();

    if (direction.current.lengthSq() > 0) {
      const targetAngle = Math.atan2(direction.current.x, direction.current.z);
      let diff = targetAngle - innerRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI)  diff -= Math.PI * 2;
      innerRef.current.rotation.y += diff * 10 * delta;
    }

    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, direction.current.x * speed, 10 * delta);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, direction.current.z * speed, 10 * delta);

    if (innerRef.current.position.y > 1) {
      velocity.current.y -= 30 * delta;
    } else {
      velocity.current.y = 0;
      innerRef.current.position.y = 1;
      if (keys.jump) velocity.current.y = 10;
    }

    innerRef.current.position.addScaledVector(velocity.current, delta);

    // World bounds
    innerRef.current.position.x = THREE.MathUtils.clamp(innerRef.current.position.x, -300, 250);
    innerRef.current.position.z = THREE.MathUtils.clamp(innerRef.current.position.z, -150, 250);

    // Sync position + rotationY to store (throttled to ~10 Hz)
    syncTimer.current += delta;
    if (syncTimer.current > 0.1) {
      syncTimer.current = 0;
      setPlayerPosition(
        [innerRef.current.position.x, innerRef.current.position.y, innerRef.current.position.z],
        innerRef.current.rotation.y,
      );
    }
  });

  const color = {
    street_thug:    '#888888',
    gangster:       '#444444',
    crime_boss:     '#222222',
    business_tycoon:'#1a1a3a',
  }[careerPath] ?? '#888888';

  // In FPV: don't render the body mesh (camera is inside it)
  if (inVehicle || cameraMode === 'first') {
    return <group ref={innerRef} />;
  }

  return (
    <group ref={innerRef}>
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[0.8, 1.8, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 2.0, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
});
