/**
 * Police system:
 *  - Checkpoint barriers at key road choke-points (visual + contraband detection)
 *  - Pursuit vehicles that chase the player when wantedLevel > 0
 *  - Wanted-level decay ticker (~1 s intervals)
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { CHECKPOINTS, type Checkpoint } from './police';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Contraband check at checkpoint:
 *  - Driving a stolen vehicle (world-spawn vehicle entered without ownership)
 *  - Any active wanted level (prior crime on record)
 * Weapons purchased from the shop are considered registered and do NOT
 * flag checkpoints — only stolen vehicles and prior wanted status do.
 */
function playerHasContraband(): boolean {
  const s = useGameStore.getState();
  const drivingStolenCar =
    s.inVehicle && !!s.equippedVehicleId && s.stolenVehicleIds.includes(s.equippedVehicleId);
  return drivingStolenCar || s.wantedLevel > 0;
}

// ─── Flashing siren light ─────────────────────────────────────────────────────

function FlashingLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef  = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const phase = Math.sin(clock.elapsedTime * 8);
    const blueOn = phase > 0;
    if (lightRef.current) lightRef.current.intensity = blueOn ? 10 : 6;
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).color.set(blueOn ? '#3355ff' : '#ff2222');
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial color="#3355ff" />
      </mesh>
      <pointLight ref={lightRef} color="#3355ff" distance={22} decay={2} intensity={10} />
    </group>
  );
}

// ─── Single checkpoint barrier + trigger ──────────────────────────────────────

function CheckpointZone({ cp }: { cp: Checkpoint }) {
  const wasInside = useRef(false);

  useFrame(() => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || state.indoors) return;

    const [px, , pz] = state.playerPosition;
    const inside = Math.hypot(px - cp.worldX, pz - cp.worldZ) < cp.radius;

    if (inside && !wasInside.current) {
      if (playerHasContraband()) {
        state.triggerCrime(1);
        state.setInteractionHint(`🚨 ${cp.label}: Contraband detected!`);
      } else {
        state.setInteractionHint(`✅ ${cp.label}: All clear`);
      }
      setTimeout(() => {
        const curr = useGameStore.getState().interactionHint ?? '';
        if (curr.includes(cp.label)) useGameStore.getState().setInteractionHint(null);
      }, 2800);
    }
    wasInside.current = inside;
  });

  const bw = 10; // barrier arm width

  return (
    <group position={[cp.worldX, 0, cp.worldZ]} rotation={[0, cp.rotY, 0]}>
      {/* Barrier arm — alternating red/white bands */}
      <mesh castShadow position={[0, 1.15, 0]}>
        <boxGeometry args={[bw, 0.18, 0.18]} />
        <meshStandardMaterial color="#cc1111" />
      </mesh>
      {[-3.5, -1.5, 0.5, 2.5].map((x, i) => (
        <mesh key={i} castShadow position={[x, 1.15, 0]}>
          <boxGeometry args={[1.5, 0.19, 0.19]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Support posts */}
      {([-bw / 2, bw / 2] as number[]).map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.6, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 1.2, 8]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      ))}

      {/* Traffic cones */}
      {[-3.5, -1.5, 1.5, 3.5].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.3, 2.2]}>
          <coneGeometry args={[0.28, 0.6, 8]} />
          <meshStandardMaterial color="#ff6600" />
        </mesh>
      ))}

      {/* Guard booth */}
      <mesh castShadow receiveShadow position={[-5.8, 1.3, 2.8]}>
        <boxGeometry args={[2.2, 2.6, 2.2]} />
        <meshStandardMaterial color="#334477" roughness={0.8} />
      </mesh>
      {/* Booth window */}
      <mesh position={[-5.8, 1.5, 1.68]}>
        <boxGeometry args={[1.4, 0.9, 0.08]} />
        <meshStandardMaterial color="#88ccee" transparent opacity={0.5} />
      </mesh>

      <FlashingLight position={[-5.8, 2.75, 2.8]} />

      {/* Parked police cruiser */}
      <group position={[5.5, 0, -2.8]}>
        <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[2, 0.65, 4.5]} />
          <meshStandardMaterial color="#1a3aee" roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 0.85, 0.3]}>
          <boxGeometry args={[1.7, 0.5, 2]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
        </mesh>
        <FlashingLight position={[0, 1.1, 0.3]} />
      </group>
    </group>
  );
}

// ─── Pursuit vehicle ──────────────────────────────────────────────────────────

const PURSUIT_COUNT = 3;

// Reusable vector — avoids allocating a new THREE.Vector3 inside useFrame each tick
const _pursuitFwd = new THREE.Vector3();

function PursuitCar({ index }: { index: number }) {
  const groupRef    = useRef<THREE.Group>(null);
  const active      = useRef(false);
  const spawnAngle  = useRef((index / PURSUIT_COUNT) * Math.PI * 2);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || !groupRef.current) return;

    const wanted = state.wantedLevel > 0 && state.pursuitActive;

    if (!wanted) {
      if (active.current) {
        groupRef.current.position.y = -50; // hide below ground
        active.current = false;
      }
      return;
    }

    const [px, , pz] = state.playerPosition;

    if (!active.current) {
      const a = spawnAngle.current;
      groupRef.current.position.set(px + Math.cos(a) * 35, 0.5, pz + Math.sin(a) * 35);
      active.current = true;
    }

    const pos  = groupRef.current.position;
    const dx   = px - pos.x;
    const dz   = pz - pos.z;
    const dist = Math.hypot(dx, dz);

    // Steering
    const tgtAngle = Math.atan2(-dx, -dz);
    let diff = tgtAngle - groupRef.current.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * 2.8 * delta;

    // Throttle — reuse module-level vector to avoid GC allocation per frame
    const chaseSpeed = Math.min(24, dist * 1.6) * delta;
    if (dist > 5) {
      const ry = groupRef.current.rotation.y;
      _pursuitFwd.set(-Math.sin(ry), 0, -Math.cos(ry));
      groupRef.current.position.addScaledVector(_pursuitFwd, chaseSpeed);
    }
    groupRef.current.position.y = 0.5;
  });

  return (
    <group ref={groupRef} position={[0, -50, 0]}>
      {/* Car body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.65, 4.5]} />
        <meshStandardMaterial color="#1a3aee" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Roof cab */}
      <mesh castShadow position={[0, 0.57, 0.3]}>
        <boxGeometry args={[1.7, 0.5, 2]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>
      <FlashingLight position={[0, 1.05, 0.3]} />
    </group>
  );
}

// ─── Wanted-level decay (runs every ~1 s) ─────────────────────────────────────

function WantedDecay() {
  const tickRef = useRef(0);
  useFrame((_, delta) => {
    tickRef.current += delta;
    if (tickRef.current >= 1) {
      tickRef.current = 0;
      useGameStore.getState().decayWanted();
    }
  });
  return null;
}

// ─── Public export ────────────────────────────────────────────────────────────

export function Police() {
  return (
    <>
      {CHECKPOINTS.map((cp) => <CheckpointZone key={cp.id} cp={cp} />)}
      {Array.from({ length: PURSUIT_COUNT }, (_, i) => <PursuitCar key={i} index={i} />)}
      <WantedDecay />
    </>
  );
}
