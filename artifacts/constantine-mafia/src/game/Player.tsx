import React, { forwardRef, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

export const ControlsMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'back', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['ShiftLeft'] },
  { name: 'interact', keys: ['KeyE'] },
  { name: 'attack', keys: ['KeyF'] },
  { name: 'map', keys: ['KeyM'] },
  { name: 'escape', keys: ['Escape'] },
];

export const Player = forwardRef<THREE.Group, {}>((props, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { playerPosition, setPlayerPosition, inVehicle, careerPath } = useGameStore();

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  // Assign ref
  useEffect(() => {
    if (typeof ref === 'function') ref(innerRef.current);
    else if (ref) (ref as React.MutableRefObject<THREE.Group | null>).current = innerRef.current;
  }, [ref]);

  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.position.set(...playerPosition);
    }
  }, []);

  useFrame((state, delta) => {
    if (!innerRef.current || inVehicle || useGameStore.getState().isPaused) return;

    const keys = getKeys();
    const speed = keys.sprint ? 16 : 8;
    
    direction.current.set(0, 0, 0);

    if (keys.forward) direction.current.z -= 1;
    if (keys.back) direction.current.z += 1;
    if (keys.left) direction.current.x -= 1;
    if (keys.right) direction.current.x += 1;

    direction.current.normalize();

    if (direction.current.lengthSq() > 0) {
      const targetAngle = Math.atan2(direction.current.x, direction.current.z);
      let diff = targetAngle - innerRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      innerRef.current.rotation.y += diff * 10 * delta;
    }

    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, direction.current.x * speed, 10 * delta);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, direction.current.z * speed, 10 * delta);

    if (innerRef.current.position.y > 1) {
      velocity.current.y -= 30 * delta; // Gravity
    } else {
      velocity.current.y = 0;
      innerRef.current.position.y = 1;
      if (keys.jump) velocity.current.y = 10;
    }

    innerRef.current.position.addScaledVector(velocity.current, delta);
    
    // Bounds check
    if (innerRef.current.position.x < -300) innerRef.current.position.x = -300;
    if (innerRef.current.position.x > 250) innerRef.current.position.x = 250;
    if (innerRef.current.position.z < -150) innerRef.current.position.z = -150;
    if (innerRef.current.position.z > 250) innerRef.current.position.z = 250;

    // Sync state
    if (state.clock.elapsedTime % 0.1 < delta) {
      setPlayerPosition([innerRef.current.position.x, innerRef.current.position.y, innerRef.current.position.z]);
    }
  });

  const getPlayerColor = () => {
    switch(careerPath) {
      case 'street_thug': return '#888888';
      case 'gangster': return '#444444';
      case 'crime_boss': return '#222222';
      case 'business_tycoon': return '#1a1a3a';
      default: return '#888888';
    }
  };

  if (inVehicle) return null;

  return (
    <group ref={innerRef}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[0.8, 1.8, 0.8]} />
        <meshStandardMaterial color={getPlayerColor()} />
      </mesh>
    </group>
  );
});
