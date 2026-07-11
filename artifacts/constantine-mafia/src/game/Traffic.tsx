/**
 * Traffic — AI vehicles that patrol the main road network in continuous loops.
 * Vehicles follow simple waypoint routes, staggered so they don't cluster.
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

// ── Road waypoint routes ──────────────────────────────────────────────────────
// Each route is a closed loop of [x, z] waypoints.
// Vehicles proceed 1→2→3→…→N→1 indefinitely.
const ROUTES: [number, number][][] = [
  // Highway east↔west lane A
  [[ 155,  3.5], [-155,  3.5]],
  // Highway east↔west lane B
  [[-155, -3.5], [ 155, -3.5]],
  // City B boulevard east loop
  [[ 430,  3.5], [ 188,  3.5], [ 188, -3.5], [ 430, -3.5]],
  // City A boulevard west loop
  [[-188,  3.5], [-430,  3.5], [-430, -3.5], [-188, -3.5]],
  // City B arterial north↔south
  [[ 306, -110], [ 306,  110]],
  // City A arterial south↔north
  [[-306,  110], [-306, -110]],
  // Highway short east shuttle
  [[ 60,   3.5], [ 155,  3.5], [ 155, -3.5], [  60, -3.5]],
  // City centre cross (small loop near spawn)
  [[  40,  3.5], [ 120,  3.5], [ 120, -3.5], [  40, -3.5]],
];

const BODY_COLORS = [
  '#bb3333', '#3355bb', '#33bb44', '#bbaa22',
  '#bb7722', '#888888', '#dddddd', '#1a3aee',
];

const SPEED = 13; // world units per second

// ── Traffic vehicle (single instance) ─────────────────────────────────────────

function TrafficVehicle({ routeIdx, startFrac }: { routeIdx: number; startFrac: number }) {
  const groupRef    = useRef<THREE.Group>(null);
  const wpIdx       = useRef(0);
  const progress    = useRef(startFrac);
  const route       = ROUTES[routeIdx];
  const bodyColor   = BODY_COLORS[routeIdx % BODY_COLORS.length];

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.indoors || !groupRef.current) return;

    const curr = wpIdx.current;
    const next = (curr + 1) % route.length;
    const [cx, cz] = route[curr];
    const [nx, nz] = route[next];
    const segLen = Math.hypot(nx - cx, nz - cz) || 1;

    progress.current += (delta * SPEED) / segLen;
    if (progress.current >= 1) {
      progress.current -= 1;
      wpIdx.current = next;
    }

    const t = progress.current;
    const x = cx + (nx - cx) * t;
    const z = cz + (nz - cz) * t;

    groupRef.current.position.set(x, 0.42, z);
    // Face direction of travel
    const angle = Math.atan2(-(nx - cx), -(nz - cz));
    let diff = angle - groupRef.current.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * 8 * delta;
  });

  return (
    <group ref={groupRef} position={[0, -50, 0]}>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.65, 4.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Cab */}
      <mesh castShadow position={[0, 0.52, 0.25]}>
        <boxGeometry args={[1.5, 0.42, 1.9]} />
        <meshStandardMaterial color={bodyColor} roughness={0.45} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.52, -0.7]}>
        <boxGeometry args={[1.42, 0.38, 0.06]} />
        <meshStandardMaterial color="#88ccee" transparent opacity={0.5} roughness={0.1} />
      </mesh>
      {/* Headlights */}
      <mesh position={[ 0.56, 0, -2.14]}>
        <boxGeometry args={[0.28, 0.18, 0.04]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-0.56, 0, -2.14]}>
        <boxGeometry args={[0.28, 0.18, 0.04]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={1.2} />
      </mesh>
      {/* Tail lights */}
      <mesh position={[ 0.56, 0,  2.14]}>
        <boxGeometry args={[0.28, 0.14, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[-0.56, 0,  2.14]}>
        <boxGeometry args={[0.28, 0.14, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={0.9} />
      </mesh>
      {/* Wheels */}
      {([-1.8, 1.8] as number[]).map((wz, wi) =>
        ([-0.92, 0.92] as number[]).map((wx, wj) => (
          <mesh key={`${wi}-${wj}`} castShadow position={[wx, -0.28, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.22, 10]} />
            <meshStandardMaterial color="#111111" roughness={0.95} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function Traffic() {
  return (
    <>
      {ROUTES.map((_, i) => (
        <TrafficVehicle key={i} routeIdx={i} startFrac={i / ROUTES.length} />
      ))}
    </>
  );
}
