/**
 * Bank of Constantine — standalone 3D building + vault heist mission.
 *
 * Location: Centre-Ville, x=55, z=-55 (between the two N-S arterials, south of highway).
 * Completely self-contained: own door-trigger, E-key listener, heist state.
 * Does NOT touch buildings.ts, buildingPool.ts, or interiors.ts.
 *
 * Mission flow:
 *   1. Player walks to the bank entrance → interaction hint appears.
 *   2. Press [E] → vault robs itself: money +50 000 DA, wantedLevel → 5.
 *   3. 60-second cooldown before the next heist.
 */
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

export const BANK_POS: [number, number, number] = [55, 0, -55];
const DOOR_RADIUS   = 7.5;
const HEIST_COOLDOWN_MS = 60_000;

// ── Building geometry helpers ─────────────────────────────────────────────────

function Column({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[BANK_POS[0] + x, 3.5, BANK_POS[2] + z]} castShadow receiveShadow>
      <cylinderGeometry args={[0.35, 0.4, 7, 8]} />
      <meshStandardMaterial color="#d4c9a8" roughness={0.85} />
    </mesh>
  );
}

// ── Main bank building ────────────────────────────────────────────────────────

function BankBuilding() {
  const [bx, by, bz] = BANK_POS;

  return (
    <group>
      {/* ─ Foundation plinth ─────────────────────────────────────── */}
      <mesh position={[bx, 0.35, bz]} receiveShadow castShadow>
        <boxGeometry args={[20, 0.7, 14]} />
        <meshStandardMaterial color="#c8bfa0" roughness={0.9} />
      </mesh>

      {/* ─ Main body ─────────────────────────────────────────────── */}
      <mesh position={[bx, 4.5, bz]} receiveShadow castShadow>
        <boxGeometry args={[18, 8, 12]} />
        <meshStandardMaterial color="#d8ccb0" roughness={0.8} />
      </mesh>

      {/* ─ Rooftop cornice ───────────────────────────────────────── */}
      <mesh position={[bx, 8.9, bz]} receiveShadow castShadow>
        <boxGeometry args={[19.5, 0.6, 13.5]} />
        <meshStandardMaterial color="#c0b49a" roughness={0.7} />
      </mesh>

      {/* ─ Pediment (triangular front gable) ─────────────────────── */}
      <mesh position={[bx, 10.2, bz - 6.3]} castShadow>
        <coneGeometry args={[9.6, 2.8, 4]} />
        <meshStandardMaterial color="#cdc1a2" roughness={0.75} />
      </mesh>

      {/* ─ Entrance columns (front face, z-offset = -6) ──────────── */}
      <Column x={-5.5} z={-6.2} />
      <Column x={-2.5} z={-6.2} />
      <Column x={ 0.5} z={-6.2} />
      <Column x={ 3.5} z={-6.2} />
      <Column x={ 6.5} z={-6.2} />

      {/* ─ Entrance steps ────────────────────────────────────────── */}
      <mesh position={[bx, 0.12, bz - 7.2]} receiveShadow>
        <boxGeometry args={[10, 0.24, 1.5]} />
        <meshStandardMaterial color="#b8af96" roughness={0.9} />
      </mesh>
      <mesh position={[bx, 0.36, bz - 6.6]} receiveShadow>
        <boxGeometry args={[10, 0.24, 1.5]} />
        <meshStandardMaterial color="#b8af96" roughness={0.9} />
      </mesh>
      <mesh position={[bx, 0.6, bz - 6.0]} receiveShadow>
        <boxGeometry args={[10, 0.24, 1.5]} />
        <meshStandardMaterial color="#b8af96" roughness={0.9} />
      </mesh>

      {/* ─ Entrance door (dark arch) ─────────────────────────────── */}
      <mesh position={[bx, 2.0, bz - 6.1]} castShadow>
        <boxGeometry args={[2.4, 3.8, 0.25]} />
        <meshStandardMaterial color="#2a1f0e" roughness={0.95} />
      </mesh>

      {/* ─ Gold signage letters above door ──────────────────────── */}
      <mesh position={[bx, 5.5, bz - 6.12]}>
        <boxGeometry args={[7, 0.6, 0.1]} />
        <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.4} emissive="#7a5c00" emissiveIntensity={0.3} />
      </mesh>

      {/* ─ Side windows (left & right) ───────────────────────────── */}
      {[-6, -2, 2, 6].map((wx) => (
        <React.Fragment key={wx}>
          {/* front windows */}
          <mesh position={[bx + wx, 4.2, bz - 6.1]}>
            <boxGeometry args={[1.4, 2.2, 0.15]} />
            <meshStandardMaterial color="#4a8cc2" transparent opacity={0.55} metalness={0.1} roughness={0.1} />
          </mesh>
          {/* back windows */}
          <mesh position={[bx + wx, 4.2, bz + 6.1]}>
            <boxGeometry args={[1.4, 2.2, 0.15]} />
            <meshStandardMaterial color="#4a8cc2" transparent opacity={0.55} metalness={0.1} roughness={0.1} />
          </mesh>
        </React.Fragment>
      ))}

      {/* ─ Security camera (small mesh above door) ───────────────── */}
      <mesh position={[bx, 7.2, bz - 6.2]}>
        <boxGeometry args={[0.18, 0.12, 0.28]} />
        <meshStandardMaterial color="#111111" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[bx, 7.2, bz - 6.0]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#cc0000" />
      </mesh>
    </group>
  );
}

// ── Heist active FX (flashing red light) ─────────────────────────────────────

function HeistAlarmLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const t        = useRef(0);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta * 4;
    lightRef.current.intensity = (Math.sin(t.current) > 0 ? 1 : 0) * 18;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[BANK_POS[0], 12, BANK_POS[2]]}
      color="#ff1111"
      intensity={0}
      distance={30}
      decay={2}
    />
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function Bank() {
  const heistActive = useGameStore((s) => s.heistActive);
  const wasNear     = useRef(false);
  const clearHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Door proximity → interaction hint
  useFrame(() => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || state.indoors) return;

    const [px, , pz] = state.playerPosition;
    const dist = Math.hypot(px - BANK_POS[0], pz - BANK_POS[2]);
    const near = dist < DOOR_RADIUS;

    if (near && !wasNear.current) {
      if (clearHintTimer.current) clearTimeout(clearHintTimer.current);
      const sinceHeist = Date.now() - state.heistCompletedAt;
      const cooldownOk = sinceHeist > HEIST_COOLDOWN_MS || state.heistCompletedAt === 0;
      if (cooldownOk) {
        state.setInteractionHint('[E] 🏦 Bank of Constantine — Rob the Vault  (+50 000 DA)');
      } else {
        const secs = Math.ceil((HEIST_COOLDOWN_MS - sinceHeist) / 1000);
        state.setInteractionHint(`🏦 Bank — Security on alert (${secs}s cooldown)`);
      }
    }

    if (!near && wasNear.current) {
      const hint = useGameStore.getState().interactionHint;
      if (hint?.includes('Bank')) {
        clearHintTimer.current = setTimeout(() => {
          if (useGameStore.getState().interactionHint?.includes('Bank'))
            useGameStore.getState().setInteractionHint(null);
        }, 600);
      }
    }

    wasNear.current = near;
  });

  // [E] key → trigger heist
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      const state = useGameStore.getState();
      if (state.screen !== 'playing' || state.isPaused || state.indoors) return;

      const [px, , pz] = state.playerPosition;
      const dist = Math.hypot(px - BANK_POS[0], pz - BANK_POS[2]);
      if (dist > DOOR_RADIUS) return;

      const cooldownOk =
        Date.now() - state.heistCompletedAt > HEIST_COOLDOWN_MS ||
        state.heistCompletedAt === 0;

      if (cooldownOk && !state.heistActive) {
        state.startHeist();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <BankBuilding />
      {heistActive && <HeistAlarmLight />}
    </>
  );
}
