/**
 * Gang Follower system.
 *
 * - Press [E] near a gang NPC (type === 'gang', spawn indices 18–20) to recruit them (max 3).
 * - Recruited members trail the player in a staggered formation.
 * - When pursuitActive they provide suppressive cover fire (muzzle flash + passive armor regen).
 * - Press [E] near an already-recruited follower to dismiss them.
 *
 * IMPORTANT: Does NOT modify buildingPool, buildings, NPCs, or Player — fully self-contained.
 */
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { audioManager } from './audio/AudioManager';

// ── Gang spawn positions (mirrors NPCs.tsx SPAWNS indices 18–20) ──────────────
// Kept in sync with the hideout cluster in NPCs.tsx — real walkable ground
// west of Ain M'lila, inside the player movement clamp (±455/±205).
const GANG_SPAWNS = [
  { id: 18, x: -380, z: 130 },
  { id: 19, x: -410, z: 150 },
  { id: 20, x: -350, z: 145 },
];

const RECRUIT_RADIUS   = 6;    // units — how close to press [E]
const FOLLOW_DISTANCE  = 3.5;  // gap between player and follower
const FIRE_INTERVAL    = 2.5;  // seconds between cover-fire bursts
const COVER_HEAL_TICK  = 12;   // seconds between passive armor ticks
const FLASH_DURATION   = 0.12; // seconds muzzle flash stays visible

// Formation offsets (local to player rotation — left, right, behind)
const FORMATION_OFFSETS: [number, number][] = [
  [-2.2,  2.8],
  [ 2.2,  2.8],
  [ 0.0,  4.2],
];

// ── Muzzle flash ─────────────────────────────────────────────────────────────

function MuzzleFlash({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[0, 1.05, -0.4]}>
      <mesh>
        <sphereGeometry args={[0.18, 6, 6]} />
        <meshBasicMaterial color="#ffcc44" transparent opacity={0.9} />
      </mesh>
      <pointLight color="#ff8800" intensity={12} distance={6} decay={2} />
    </group>
  );
}

// ── Single follower mesh (gang colours + bandana) ─────────────────────────────

function FollowerMesh({ flashVisible }: { flashVisible: boolean }) {
  return (
    <group>
      {/* Legs */}
      <mesh castShadow position={[-0.15, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.72, 0.2]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.15, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.72, 0.2]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      {/* Torso */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.65, 0.68, 0.35]} />
        <meshStandardMaterial color="#2a0a0a" roughness={0.85} />
      </mesh>
      {/* Arms */}
      <mesh castShadow position={[-0.44, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color="#2a0a0a" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.44, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color="#2a0a0a" roughness={0.85} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.82, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshStandardMaterial color="#c8855a" roughness={0.75} />
      </mesh>
      {/* Bandana */}
      <mesh position={[0, 1.63, 0]}>
        <boxGeometry args={[0.5, 0.22, 0.36]} />
        <meshStandardMaterial color="#aa1111" roughness={0.9} />
      </mesh>
      {/* Pistol held in right hand */}
      <group position={[0.52, 0.88, -0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.14, 0.22]} />
          <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.6} />
        </mesh>
        <MuzzleFlash visible={flashVisible} />
      </group>
      {/* Name tag above head */}
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.02]} />
        <meshBasicMaterial color="#aa1111" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ── Follower controller ───────────────────────────────────────────────────────

function Follower({
  slotIndex,
  memberId,
}: {
  slotIndex: number;
  memberId: number;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const flashTimer  = useRef(0);
  const fireTimer   = useRef(slotIndex * (FIRE_INTERVAL / 3)); // stagger fire
  const healTimer   = useRef(0);
  const [flashVis, setFlashVis] = React.useState(false);

  const [ox, oz] = FORMATION_OFFSETS[slotIndex] ?? [0, 4];

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (!groupRef.current || state.screen !== 'playing' || state.isPaused) return;

    const [px, , pz] = state.playerPosition;
    const ry         = state.playerRotationY;

    // Formation target in world space (rotate offset by player's yaw)
    const cosR = Math.cos(ry);
    const sinR = Math.sin(ry);
    const wx   = px + cosR * ox - sinR * oz;
    const wz   = pz + sinR * ox + cosR * oz;

    // Smooth follow
    const p = groupRef.current.position;
    p.x = THREE.MathUtils.lerp(p.x, wx, 5 * delta);
    p.z = THREE.MathUtils.lerp(p.z, wz, 5 * delta);
    p.y = 1;

    // Face player
    const dx = px - p.x, dz = pz - p.z;
    if (Math.abs(dx) + Math.abs(dz) > 0.1) {
      const target = Math.atan2(-dx, -dz);
      let diff = target - groupRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * 6 * delta;
    }

    // Cover fire when wanted
    if (state.pursuitActive && state.wantedLevel > 0) {
      fireTimer.current  -= delta;
      flashTimer.current -= delta;
      healTimer.current  -= delta;

      if (fireTimer.current <= 0) {
        fireTimer.current = FIRE_INTERVAL;
        setFlashVis(true);
        flashTimer.current = FLASH_DURATION;
        if (groupRef.current) {
          const p = groupRef.current.position;
          audioManager.playOneShot('combat', 'gunshot_pistol', [p.x, p.y + 1, p.z], 0.7);
        }
        // Real combat assistance: cover fire suppresses pursuing police for a
        // short window, pausing their arrest-hold timer (see Police.tsx).
        state.setPlayerState({ gangSuppressionUntil: Date.now() + 1400 });
      }
      if (flashTimer.current <= 0 && flashVis) {
        setFlashVis(false);
      }

      // Passive armor regen — gang covers the player
      if (healTimer.current <= 0) {
        healTimer.current = COVER_HEAL_TICK;
        const s = useGameStore.getState();
        if (s.armor < 50) {
          s.setPlayerState({ armor: Math.min(50, s.armor + 5) });
        }
      }
    } else {
      if (flashVis) setFlashVis(false);
      fireTimer.current = FIRE_INTERVAL * (0.5 + slotIndex * 0.2);
    }
  });

  return (
    <group ref={groupRef} position={[0, -50, 0]}>
      <FollowerMesh flashVisible={flashVis} />
    </group>
  );
}

// ── Proximity recruit watcher (non-3D logic, mounts once) ────────────────────

function RecruitWatcher() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      const state = useGameStore.getState();
      if (state.screen !== 'playing' || state.isPaused || state.indoors) return;

      const [px, , pz] = state.playerPosition;

      // Check dismiss first (near an already-recruited member's current position)
      // then check recruit from spawn
      for (const sp of GANG_SPAWNS) {
        const dist = Math.hypot(px - sp.x, pz - sp.z);
        if (dist > RECRUIT_RADIUS * 3) continue; // quick cull

        if (state.gangMemberIds.includes(sp.id)) {
          // Dismiss if very close to spawn area
          if (dist < RECRUIT_RADIUS) {
            state.dismissGangMember(sp.id);
            audioManager.playOneShot('npc', 'dismiss', [sp.x, 1, sp.z]);
            state.setInteractionHint('👋 Gang member dismissed');
            setTimeout(() => {
              if (useGameStore.getState().interactionHint?.includes('dismissed'))
                useGameStore.getState().setInteractionHint(null);
            }, 2000);
            return;
          }
        } else if (state.gangMemberIds.length < 3 && dist < RECRUIT_RADIUS) {
          state.recruitGangMember(sp.id);
          audioManager.playOneShot('npc', 'recruit', [sp.x, 1, sp.z]);
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Proximity hint in useFrame equivalent (we use a regular interval instead
  // to avoid adding a useFrame here that runs every frame)
  useEffect(() => {
    const id = setInterval(() => {
      const state = useGameStore.getState();
      if (state.screen !== 'playing' || state.isPaused || state.indoors) return;
      const [px, , pz] = state.playerPosition;

      for (const sp of GANG_SPAWNS) {
        const dist = Math.hypot(px - sp.x, pz - sp.z);
        if (dist < RECRUIT_RADIUS) {
          const already = state.gangMemberIds.includes(sp.id);
          const full    = state.gangMemberIds.length >= 3;
          if (!already && !full) {
            if (!state.interactionHint?.includes('Gang'))
              state.setInteractionHint('[E] 👥 Recruit Gang Member');
          } else if (already) {
            if (!state.interactionHint?.includes('Gang'))
              state.setInteractionHint('[E] 👋 Dismiss Gang Member');
          }
          return;
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  return null;
}

// ── Public export ─────────────────────────────────────────────────────────────

export function GangFollowers() {
  const gangMemberIds = useGameStore((s) => s.gangMemberIds);
  const screen        = useGameStore((s) => s.screen);

  if (screen !== 'playing') return null;

  return (
    <>
      <RecruitWatcher />
      {gangMemberIds.slice(0, 3).map((memberId: number, i: number) => (
        <Follower key={memberId} slotIndex={i} memberId={memberId} />
      ))}
    </>
  );
}
