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

/* ── Outfit colours per career path ──────────────────────────────────────── */
const OUTFIT: Record<string, { body: string; legs: string; hair: string }> = {
  street_thug:    { body: '#2a2a2a', legs: '#1a1a2e', hair: '#111111' },
  gangster:       { body: '#1a1a1a', legs: '#0d0d1a', hair: '#0a0a0a' },
  crime_boss:     { body: '#1c1c30', legs: '#111120', hair: '#080810' },
  business_tycoon:{ body: '#2c2040', legs: '#1a1428', hair: '#050508' },
};

export const Player = forwardRef<THREE.Group, {}>((_, ref) => {
  const innerRef  = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();
  const { playerPosition, playerRotationY, setPlayerPosition, inVehicle, careerPath, cameraMode } =
    useGameStore();

  const velocity   = useRef(new THREE.Vector3());
  const direction  = useRef(new THREE.Vector3());
  const syncTimer  = useRef(0);
  const prevInVehicle = useRef(inVehicle);

  /* ── Forwarded ref ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof ref === 'function') ref(innerRef.current);
    else if (ref) (ref as React.MutableRefObject<THREE.Group | null>).current = innerRef.current;
  }, [ref]);

  /* ── Spawn position ────────────────────────────────────────────────────── */
  useEffect(() => { innerRef.current?.position.set(...playerPosition); }, []);

  /* ── Snap position when exiting a vehicle ──────────────────────────────── */
  useEffect(() => {
    if (prevInVehicle.current && !inVehicle && innerRef.current) {
      innerRef.current.position.set(...playerPosition);
      innerRef.current.rotation.y = playerRotationY;
      velocity.current.set(0, 0, 0);
    }
    prevInVehicle.current = inVehicle;
  }, [inVehicle]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // FIX: negate both components so the body faces the direction of movement
      // (matches the vehicle convention: local -Z = world forward at rotY=0)
      const targetAngle = Math.atan2(-direction.current.x, -direction.current.z);
      let diff = targetAngle - innerRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
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

    // Sync position + rotationY to store (throttled ~10 Hz)
    syncTimer.current += delta;
    if (syncTimer.current > 0.1) {
      syncTimer.current = 0;
      setPlayerPosition(
        [innerRef.current.position.x, innerRef.current.position.y, innerRef.current.position.z],
        innerRef.current.rotation.y,
      );
    }
  });

  const outfit = OUTFIT[careerPath] ?? OUTFIT.street_thug;

  // In a vehicle or first-person: hide the body mesh
  if (inVehicle || cameraMode === 'first') {
    return <group ref={innerRef} />;
  }

  return (
    <group ref={innerRef}>
      {/* ── Legs ── */}
      <mesh castShadow receiveShadow position={[-0.18, 0.38, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <meshStandardMaterial color={outfit.legs} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.18, 0.38, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <meshStandardMaterial color={outfit.legs} roughness={0.9} />
      </mesh>

      {/* ── Torso ── */}
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.72, 0.72, 0.38]} />
        <meshStandardMaterial color={outfit.body} roughness={0.85} />
      </mesh>

      {/* ── Arms ── */}
      <mesh castShadow position={[-0.48, 0.98, 0]}>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color={outfit.body} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.48, 0.98, 0]}>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color={outfit.body} roughness={0.85} />
      </mesh>

      {/* ── Neck ── */}
      <mesh castShadow position={[0, 1.54, 0]}>
        <boxGeometry args={[0.2, 0.18, 0.2]} />
        <meshStandardMaterial color="#c8855a" roughness={0.8} />
      </mesh>

      {/* ── Head (skin) ── */}
      <mesh castShadow position={[0, 1.88, 0]}>
        <boxGeometry args={[0.52, 0.52, 0.52]} />
        <meshStandardMaterial color="#c8855a" roughness={0.75} />
      </mesh>

      {/* ── Hair ── */}
      <mesh position={[0, 2.16, 0]}>
        <boxGeometry args={[0.54, 0.14, 0.54]} />
        <meshStandardMaterial color={outfit.hair} roughness={0.9} />
      </mesh>

      {/* ── Eyes (dark spots on front face, z-offset slightly) ── */}
      <mesh position={[-0.13, 1.9, -0.27]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.13, 1.9, -0.27]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  );
});
