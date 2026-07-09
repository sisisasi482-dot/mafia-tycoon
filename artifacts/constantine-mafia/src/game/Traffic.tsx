/**
 * Traffic — AI vehicles that follow predefined road waypoints in loops.
 * Pure decoration: not enterable, not collidable with the player.
 * Routes match the 2× scaled city road network.
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

// ─── Route definitions ────────────────────────────────────────────────────────

type Waypoint = [number, number]; // [x, z]

interface TrafficRoute {
  waypoints: Waypoint[];
}

/** Road waypoints match the 2× scaled road layout in City.tsx */
const ROUTES: TrafficRoute[] = [
  // Route A — Main E-W highway (z ≈ 0), east loop
  {
    waypoints: [
      [-560, 8], [-400, 8], [-200, 8], [-80, 8],
      [0, 8], [80, 8], [200, 8], [350, 8],
      [200, -8], [80, -8], [0, -8], [-80, -8],
      [-200, -8], [-400, -8], [-560, -8],
    ],
  },
  // Route B — Main N-S road (x ≈ 10), full run
  {
    waypoints: [
      [15, -170], [15, -80], [15, 0], [15, 80],
      [15, 160], [15, 260], [15, 370],
      [-15, 370], [-15, 260], [-15, 160],
      [-15, 80], [-15, 0], [-15, -80], [-15, -170],
    ],
  },
  // Route C — Ali Mendjeli inner loop
  {
    waypoints: [
      [-250, -80], [-350, -80], [-450, -80],
      [-450, 0], [-450, 80],
      [-350, 80], [-250, 80],
      [-250, 0], [-250, -80],
    ],
  },
  // Route D — Centre-Ville circuit
  {
    waypoints: [
      [0, -100], [80, -100], [160, -100],
      [160, 0], [160, 100],
      [80, 100], [0, 100],
      [0, 0], [0, -100],
    ],
  },
];

// ─── Vehicle type definitions ─────────────────────────────────────────────────

interface TrafficVehicleDef {
  routeIdx:  number;     // which ROUTES[] entry to follow
  startWp:   number;     // initial waypoint index
  speed:     number;     // units / second
  bodyColor: string;
  roofColor: string;
  type: 'sedan' | 'taxi' | 'truck' | 'suv';
}

const TRAFFIC_VEHICLES: TrafficVehicleDef[] = [
  { routeIdx: 0, startWp: 0,  speed: 22, bodyColor: '#c8c8c8', roofColor: '#909090', type: 'sedan' },
  { routeIdx: 0, startWp: 4,  speed: 18, bodyColor: '#e8c830', roofColor: '#111111', type: 'taxi'  },
  { routeIdx: 0, startWp: 8,  speed: 20, bodyColor: '#3a6a3a', roofColor: '#2a4a2a', type: 'suv'   },
  { routeIdx: 1, startWp: 0,  speed: 20, bodyColor: '#a03030', roofColor: '#601818', type: 'sedan' },
  { routeIdx: 1, startWp: 5,  speed: 16, bodyColor: '#707070', roofColor: '#404040', type: 'truck' },
  { routeIdx: 2, startWp: 0,  speed: 19, bodyColor: '#4070c0', roofColor: '#2050a0', type: 'sedan' },
  { routeIdx: 2, startWp: 4,  speed: 17, bodyColor: '#e8c830', roofColor: '#111111', type: 'taxi'  },
  { routeIdx: 3, startWp: 0,  speed: 21, bodyColor: '#d0d0d0', roofColor: '#a0a0a0', type: 'suv'   },
  { routeIdx: 3, startWp: 3,  speed: 18, bodyColor: '#805020', roofColor: '#503010', type: 'sedan' },
  { routeIdx: 0, startWp: 11, speed: 23, bodyColor: '#606060', roofColor: '#303030', type: 'truck' },
];

// ─── Single traffic vehicle ───────────────────────────────────────────────────

function TrafficVehicle({ def }: { def: TrafficVehicleDef }) {
  const groupRef  = useRef<THREE.Group>(null);
  const wpIdxRef  = useRef(def.startWp);
  const posRef    = useRef(new THREE.Vector3());
  const rotRef    = useRef(0);

  const route = ROUTES[def.routeIdx];
  const wp0   = route.waypoints[def.startWp % route.waypoints.length];

  // Place at starting waypoint immediately via a ref init trick
  const initialized = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (useGameStore.getState().isPaused) return;

    // One-time initialise position to avoid flicker
    if (!initialized.current) {
      initialized.current = true;
      posRef.current.set(wp0[0], 1, wp0[1]);
      groupRef.current.position.copy(posRef.current);
    }

    const waypoints = route.waypoints;
    const target    = waypoints[wpIdxRef.current % waypoints.length];
    const tx = target[0];
    const tz = target[1];

    const dx = tx - posRef.current.x;
    const dz = tz - posRef.current.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Advance to next waypoint when close
    if (dist < 2.5) {
      wpIdxRef.current = (wpIdxRef.current + 1) % waypoints.length;
      return;
    }

    // Desired heading
    const desiredRot = Math.atan2(-dx, -dz);
    // Smooth turn
    let diffRot = desiredRot - rotRef.current;
    while (diffRot < -Math.PI) diffRot += Math.PI * 2;
    while (diffRot >  Math.PI) diffRot -= Math.PI * 2;
    rotRef.current += diffRot * Math.min(1, 4 * delta);

    // Move forward
    const moveX = -Math.sin(rotRef.current) * def.speed * delta;
    const moveZ = -Math.cos(rotRef.current) * def.speed * delta;
    posRef.current.x += moveX;
    posRef.current.z += moveZ;

    groupRef.current.position.copy(posRef.current);
    groupRef.current.rotation.y = rotRef.current;
  });

  const isTruck = def.type === 'truck';
  const isSUV   = def.type === 'suv';
  const bodyW   = isTruck ? 2.6 : isSUV ? 2.2 : 2.0;
  const bodyL   = isTruck ? 6.0 : isSUV ? 4.8 : 4.5;
  const cabW    = bodyW - 0.35;
  const cabL    = isTruck ? 2.2 : 2.1;
  const cabH    = isTruck ? 0.85 : 0.72;
  const cabZ    = isTruck ? bodyL / 2 - 1.5 : 0;
  const bodyTopY = 0.65;

  return (
    <group ref={groupRef} position={[wp0[0], 1, wp0[1]]}>
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, bodyTopY / 2 + 0.08, 0]}>
        <boxGeometry args={[bodyW, bodyTopY, bodyL]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.4} metalness={0.35} />
      </mesh>

      {/* Cabin */}
      <mesh castShadow position={[0, bodyTopY + cabH / 2 + 0.08, cabZ]}>
        <boxGeometry args={[cabW, cabH, cabL]} />
        <meshStandardMaterial color={def.roofColor} roughness={0.55} metalness={0.1} />
      </mesh>

      {/* Wheels */}
      {([
        [-bodyW / 2 - 0.06, 0.38, -bodyL / 2 + 1.05],
        [ bodyW / 2 + 0.06, 0.38, -bodyL / 2 + 1.05],
        [-bodyW / 2 - 0.06, 0.38,  bodyL / 2 - 1.05],
        [ bodyW / 2 + 0.06, 0.38,  bodyL / 2 - 1.05],
      ] as [number, number, number][]).map((wp, i) => (
        <mesh key={i} position={wp} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.26, 10]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.95} />
        </mesh>
      ))}

      {/* Headlights */}
      {([-0.58, 0.58] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.44, -bodyL / 2 - 0.05]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshStandardMaterial color="#ffffee" emissive="#ffff99" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* Taxi sign */}
      {def.type === 'taxi' && (
        <mesh position={[0, bodyTopY + cabH + 0.17, 0]}>
          <boxGeometry args={[0.75, 0.22, 0.28]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={1.5} />
        </mesh>
      )}
    </group>
  );
}

// ─── Public export ─────────────────────────────────────────────────────────────

export function Traffic() {
  return (
    <>
      {TRAFFIC_VEHICLES.map((def, i) => (
        <TrafficVehicle key={i} def={def} />
      ))}
    </>
  );
}
