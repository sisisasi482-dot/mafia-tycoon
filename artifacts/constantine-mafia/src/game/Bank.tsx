/**
 * Bank of Constantine — standalone GLB building + vault heist mission.
 *
 * Location: Centre-Ville, x=55, z=-55 (between the two N-S arterials, south of highway).
 * Completely self-contained: own door-trigger, E-key listener, heist state.
 * Does NOT touch buildings.ts, buildingPool.ts, or interiors.ts.
 *
 * The building mass is a high-quality GLB model (glb/building-q — the most
 * ornate model in the old-town set, scaled up for a grand civic presence);
 * only the entrance steps, signage and camera prop remain procedural.
 *
 * Mission flow (unchanged):
 *   1. Player walks to the bank entrance → interaction hint appears.
 *   2. Press [E] → vault robs itself: money +50 000 DA, wantedLevel → 5.
 *   3. 60-second cooldown before the next heist.
 */
import React, { useEffect, useMemo, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { BANK_POS, BANK_MODEL } from './cityLayout';

const DOOR_RADIUS   = 7.5;
const HEIST_COOLDOWN_MS = 60_000;

const BASE = import.meta.env.BASE_URL;
const BANK_GLB_URL = `${BASE}${BANK_MODEL.set}/${BANK_MODEL.model}.glb`;
useGLTF.preload(BANK_GLB_URL);

// ── GLB building mass ─────────────────────────────────────────────────────────

function BankGLB() {
  const { scene } = useGLTF(BANK_GLB_URL);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow    = true;
        obj.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={[BANK_MODEL.x, 0, BANK_MODEL.z]}
      rotation={[0, BANK_MODEL.rotY ?? 0, 0]}
      scale={BANK_MODEL.scale}
    />
  );
}

// ── Procedural entrance dressing (steps, signage, security camera) ────────────

function BankEntranceDressing() {
  const [bx, , bz] = BANK_POS;

  return (
    <group>
      {/* Entrance steps */}
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

      {/* Gold signage above entrance */}
      <mesh position={[bx, 9.5, bz - 6.4]}>
        <boxGeometry args={[9, 0.7, 0.12]} />
        <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.4} emissive="#7a5c00" emissiveIntensity={0.3} />
      </mesh>

      {/* Security camera */}
      <mesh position={[bx, 11.5, bz - 6.5]}>
        <boxGeometry args={[0.18, 0.12, 0.28]} />
        <meshStandardMaterial color="#111111" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[bx, 11.5, bz - 6.3]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#cc0000" />
      </mesh>

      {/* Warm façade uplight */}
      <pointLight position={[bx, 4, bz - 8]} color="#f0d090" intensity={22} distance={26} decay={2} />
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
      position={[BANK_POS[0], 14, BANK_POS[2]]}
      color="#ff1111"
      intensity={0}
      distance={34}
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
    <Suspense fallback={null}>
      <BankGLB />
      <BankEntranceDressing />
      {heistActive && <HeistAlarmLight />}
    </Suspense>
  );
}
