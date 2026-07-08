import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

/* ── Palette constants ───────────────────────────────────────────────────── */

const SKIN_TONES  = ['#c8855a', '#a0623a', '#d4956a', '#8b5e3c', '#e0aa80'];
const HAIR_COLORS = ['#111111', '#2c1a0e', '#1a0a00', '#3d2b1f', '#0a0a0a'];
const BODY_COLORS = [
  '#2a3a5a', '#3a2a2a', '#2a4a3a', '#4a3a1a', '#2a2a4a',
  '#5a3a2a', '#3a4a2a', '#1a3a3a', '#4a2a3a', '#3a3a2a',
];
const LEGS_COLORS = [
  '#1a1a2e', '#2e1a1a', '#1a2e1a', '#2e2a1a', '#1a1a1a',
];

/* ── NPC definition ──────────────────────────────────────────────────────── */

interface NpcDef {
  id: number;
  spawnX: number;
  spawnZ: number;
  radius: number;
  speed: number;
  bodyColor: string;
  legsColor: string;
  skinColor: string;
  hairColor: string;
  scale: number;
}

/** Seeded deterministic rng */
function seededRng(seed: number) {
  let s = seed;
  return () => { s = Math.sin(s) * 43758.5453; return s - Math.floor(s); };
}

const SPAWNS: Array<{ x: number; z: number; r: number }> = [
  // Ali Mendjeli
  { x: -170, z: -20, r: 20 }, { x: -140, z:  15, r: 18 },
  { x: -110, z: -35, r: 15 }, { x:  -90, z:  25, r: 20 },
  { x: -160, z:  50, r: 18 }, { x: -120, z: -60, r: 15 },
  // Centre-Ville
  { x:  -20, z: -15, r: 22 }, { x:   15, z:  30, r: 20 },
  { x:   55, z: -20, r: 18 }, { x:   80, z:  45, r: 20 },
  { x:   30, z: -55, r: 15 }, { x:   60, z:  70, r: 18 },
  // Old City
  { x:  130, z: -20, r: 15 }, { x:  155, z:  25, r: 12 },
  { x:  200, z: -30, r: 15 }, { x:  215, z:  35, r: 12 },
  // Ain M'lila
  { x: -265, z: -30, r: 18 }, { x: -240, z:  40, r: 15 },
];

function buildDefs(): NpcDef[] {
  const rng = seededRng(99);
  return SPAWNS.map((sp, i) => ({
    id:        i,
    spawnX:    sp.x,
    spawnZ:    sp.z,
    radius:    sp.r,
    speed:     1.8 + rng() * 1.4,
    bodyColor: BODY_COLORS[Math.floor(rng() * BODY_COLORS.length)],
    legsColor: LEGS_COLORS[Math.floor(rng() * LEGS_COLORS.length)],
    skinColor: SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)],
    hairColor: HAIR_COLORS[Math.floor(rng() * HAIR_COLORS.length)],
    scale:     0.88 + rng() * 0.24,
  }));
}

const NPC_DEFS = buildDefs();

/* ── Runtime per-NPC state (never triggers React re-renders) ─────────────── */

interface NpcState {
  x: number; z: number; rotY: number;
  targetX: number; targetZ: number;
  waitTimer: number;
}

function makeInitialState(): NpcState[] {
  return NPC_DEFS.map((def) => ({
    x: def.spawnX, z: def.spawnZ,
    rotY: 0,
    targetX: def.spawnX, targetZ: def.spawnZ,
    waitTimer: 0,
  }));
}

/* ── Single NPC mesh ─────────────────────────────────────────────────────── */
// Uses a plain callback ref (onRef) — avoids the JSX cast that broke the parser.

interface NpcMeshProps {
  def: NpcDef;
  onRef: (el: THREE.Group | null) => void;
}

function NpcMesh({ def, onRef }: NpcMeshProps) {
  return (
    <group ref={onRef} scale={[def.scale, def.scale, def.scale]}>
      {/* Legs */}
      <mesh castShadow receiveShadow position={[-0.15, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.72, 0.2]} />
        <meshStandardMaterial color={def.legsColor} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.15, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.72, 0.2]} />
        <meshStandardMaterial color={def.legsColor} roughness={0.9} />
      </mesh>
      {/* Torso */}
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[0.65, 0.68, 0.35]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
      </mesh>
      {/* Arms */}
      <mesh castShadow position={[-0.44, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.44, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.82, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshStandardMaterial color={def.skinColor} roughness={0.75} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 2.08, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
        <meshStandardMaterial color={def.hairColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ── NPCs controller ─────────────────────────────────────────────────────── */

export function NPCs() {
  const isPaused = useGameStore((s) => s.isPaused);
  const screen   = useGameStore((s) => s.screen);

  // One THREE.Group ref per NPC — index matches NPC_DEFS
  const groupRefs = useRef<(THREE.Group | null)[]>(
    NPC_DEFS.map(() => null),
  );

  // Mutable runtime state — never passed to React state
  const npcState = useRef<NpcState[]>(makeInitialState());

  // Deterministic rngs (one per NPC for independent wandering)
  const rngs = useMemo(
    () => NPC_DEFS.map((_, i) => seededRng(i * 137.5 + 42)),
    [],
  );

  useFrame((_, delta) => {
    if (screen !== 'playing' || isPaused) return;

    NPC_DEFS.forEach((def, i) => {
      const group = groupRefs.current[i];
      const s     = npcState.current[i];
      const rng   = rngs[i];
      if (!group) return;

      /* ── Wait at waypoint ── */
      if (s.waitTimer > 0) {
        s.waitTimer = Math.max(0, s.waitTimer - delta);
        // Still write position so NPC is at correct spawn on first frames
        group.position.set(s.x, 1, s.z);
        group.rotation.y = s.rotY;
        return;
      }

      const dx   = s.targetX - s.x;
      const dz   = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        /* Reached waypoint — pick next or idle briefly */
        s.waitTimer = 0.5 + rng() * 2.0;
        const angle  = rng() * Math.PI * 2;
        const r      = def.radius * (0.3 + rng() * 0.7);
        s.targetX    = def.spawnX + Math.cos(angle) * r;
        s.targetZ    = def.spawnZ + Math.sin(angle) * r;
        group.position.set(s.x, 1, s.z);
        group.rotation.y = s.rotY;
        return;
      }

      /* ── Move toward waypoint ── */
      const ndx  = dx / dist;
      const ndz  = dz / dist;
      const step = def.speed * delta;
      s.x += ndx * Math.min(step, dist);
      s.z += ndz * Math.min(step, dist);

      /* Face direction of movement (same convention: local -Z = forward) */
      const targetRotY = Math.atan2(-ndx, -ndz);
      let diff = targetRotY - s.rotY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      s.rotY += diff * 8 * delta;

      /* Write directly to THREE objects — no React state involved */
      group.position.set(s.x, 1, s.z);
      group.rotation.y = s.rotY;
    });
  });

  if (screen !== 'playing') return null;

  return (
    <>
      {NPC_DEFS.map((def, i) => (
        <NpcMesh
          key={def.id}
          def={def}
          onRef={(el) => { groupRefs.current[i] = el; }}
        />
      ))}
    </>
  );
}
