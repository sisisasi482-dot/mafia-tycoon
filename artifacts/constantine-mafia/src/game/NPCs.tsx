/**
 * NPC wanderers — citizens, police officers, and gang members.
 * - Seeded deterministic placement (same spawn every session)
 * - Building AABB collision avoidance (re-routes on obstruction)
 * - Type-specific colour palettes and visual accents
 * - Wander AI driven entirely via THREE refs — zero React state per frame
 */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { BUILDING_AABBS } from './buildings';
import { NPC_TALKERS } from './interiors';
import { triggerNpcInteraction } from './npcInteraction';
import { FittedGLB, glbUrl } from './glbModels';

// ─── Character models (Task 2: New Models, from /glb4) ───────────────────────
// One glb4 character file per pedestrian template + a dedicated file for
// police/gang, so every NPC on the street is a real model instead of a
// stacked-box mannequin. Type-specific accessories (badge, cap, bandana,
// hijab drape, hard hat) stay as small primitives layered on top — cheaper
// than sourcing/recoloring per-accessory models and keeps the existing
// silhouette cues players already recognise.
const CITIZEN_MODEL_FILE: Record<ModelType, string> = {
  male_casual:   'character-male-a',
  female_casual: 'character-female-a',
  male_business: 'character-male-b',
  female_hijab:  'character-female-b',
  male_worker:   'character-male-c',
  female_dress:  'character-female-c',
  male_sporty:   'character-male-d',
};
const POLICE_MODEL_FILE = 'character-male-e';
const GANG_MODEL_FILE   = 'character-male-f';

function npcModelFile(def: NpcDef): string {
  if (def.type === 'police') return POLICE_MODEL_FILE;
  if (def.type === 'gang') return GANG_MODEL_FILE;
  return CITIZEN_MODEL_FILE[def.modelType];
}

Object.values(CITIZEN_MODEL_FILE).forEach((f) => useGLTF.preload(glbUrl('glb4', f)));
useGLTF.preload(glbUrl('glb4', POLICE_MODEL_FILE));
useGLTF.preload(glbUrl('glb4', GANG_MODEL_FILE));

// ─── Click-to-interact flavor lines (wandering NPCs have no shop/dialogue) ───
// Clicking opens a short, no-cost interaction via the shared interactionHint
// toast — reuses the existing hint pipeline instead of building a new UI.

const CITIZEN_LINES = [
  "Nice day in Constantine, isn't it?",
  "Watch yourself around here at night.",
  "You look like you're up to something...",
  "Busy street today.",
  "I don't have any spare change, sorry.",
];
const POLICE_LINES = [
  "Move along, citizen.",
  "Keep your nose clean and we won't have a problem.",
  "Nothing to see here.",
];
const GANG_LINES = [
  "You lookin' for trouble?",
  "This block belongs to us.",
  "Talk to the boss if you want in.",
];

function flavorLineFor(def: NpcDef): string {
  const lines = def.type === 'police' ? POLICE_LINES : def.type === 'gang' ? GANG_LINES : CITIZEN_LINES;
  return lines[def.id % lines.length];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const SKIN_TONES   = ['#c8855a', '#a0623a', '#d4956a', '#8b5e3c', '#e0aa80'];
const HAIR_COLORS  = ['#111111', '#2c1a0e', '#1a0a00', '#3d2b1f', '#0a0a0a'];
const BODY_COLORS  = [
  '#2a3a5a', '#3a2a2a', '#2a4a3a', '#4a3a1a', '#2a2a4a',
  '#5a3a2a', '#3a4a2a', '#1a3a3a', '#4a2a3a', '#3a3a2a',
];
const LEGS_COLORS  = ['#1a1a2e', '#2e1a1a', '#1a2e1a', '#2e2a1a', '#1a1a1a'];

// ─── NPC types ────────────────────────────────────────────────────────────────

type NpcType = 'citizen' | 'police' | 'gang';

/** Seven visually distinct pedestrian character templates. */
type ModelType =
  | 'male_casual'    // t-shirt + jeans
  | 'female_casual'  // top + trousers, ponytail
  | 'male_business'  // dark suit + tie
  | 'female_hijab'   // headscarf + modest dress
  | 'male_worker'    // overalls + hard hat
  | 'female_dress'   // long dress silhouette
  | 'male_sporty';   // tracksuit + stripe

interface NpcDef {
  id:        number;
  type:      NpcType;
  modelType: ModelType;
  spawnX:    number;
  spawnZ:    number;
  radius:    number;
  speed:     number;
  bodyColor: string;
  legsColor: string;
  skinColor: string;
  hairColor: string;
  scale:     number;
}

// ─── Seeded deterministic RNG ─────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => { s = Math.sin(s) * 43758.5453; return s - Math.floor(s); };
}

// ─── Spawn clusters ───────────────────────────────────────────────────────────

const SPAWNS: Array<{ x: number; z: number; r: number; type?: NpcType }> = [
  // Ali Mendjeli — citizens
  { x: -170, z:  -20, r: 20 }, { x: -140, z:   15, r: 18 },
  { x: -110, z:  -35, r: 15 }, { x:  -90, z:   25, r: 20 },
  { x: -160, z:   50, r: 18 }, { x: -120, z:  -60, r: 15 },
  // Centre-Ville — citizens
  { x:  -20, z:  -15, r: 22 }, { x:   15, z:   30, r: 20 },
  { x:   55, z:  -20, r: 18 }, { x:   80, z:   45, r: 20 },
  { x:   30, z:  -55, r: 15 }, { x:   60, z:   70, r: 18 },
  // Old City — citizens
  { x:  130, z:  -20, r: 15 }, { x:  155, z:   25, r: 12 },
  { x:  200, z:  -30, r: 15 }, { x:  215, z:   35, r: 12 },
  // Ain M'lila — citizens + gang
  { x: -265, z:  -30, r: 18 }, { x: -240, z:   40, r: 15 },
  // Gang hideout — back alleys west of Ain M'lila. Was previously placed at
  // x:-500/-540/-460, well past the player movement clamp (±455), making the
  // whole recruitment feature unreachable; relocated to real walkable ground.
  { x: -380, z:  130, r: 20, type: 'gang' },
  { x: -410, z:  150, r: 22, type: 'gang' },
  { x: -350, z:  145, r: 18, type: 'gang' },
  // Police patrols — near station + checkpoints
  { x:   60, z:   60, r: 15, type: 'police' },
  { x:  270, z:   15, r: 12, type: 'police' },
  { x: -300, z:  135, r: 12, type: 'police' },
  { x: -460, z:  135, r: 12, type: 'police' },
  // Extra density — citizens
  { x:  100, z:  100, r: 20 }, { x:  -30, z:  120, r: 18 },
  { x:  350, z:  -50, r: 15 }, { x:  420, z:   30, r: 15 },
  { x:  -80, z:  -80, r: 18 }, { x:   40, z: -100, r: 15 },
];

// ─── Build NPC defs from spawn list ──────────────────────────────────────────

const CITIZEN_MODELS: ModelType[] = [
  'male_casual', 'female_casual', 'male_business',
  'female_hijab', 'male_worker', 'female_dress', 'male_sporty',
];

function buildDefs(): NpcDef[] {
  const rng = seededRng(99);
  return SPAWNS.map((sp, i) => {
    const type = sp.type ?? 'citizen';

    // Derive model from index — no extra rng() calls so colours stay identical
    const modelType: ModelType = type === 'citizen'
      ? CITIZEN_MODELS[i % CITIZEN_MODELS.length]
      : 'male_casual';

    let bodyColor: string;
    let legsColor: string;

    if (type === 'police') {
      bodyColor = '#1a3aee';
      legsColor = '#0a1a5a';
    } else if (type === 'gang') {
      bodyColor = ['#2a0a0a', '#1a1a1a', '#3a0a0a'][Math.floor(rng() * 3)];
      legsColor = '#0a0a0a';
    } else {
      bodyColor = BODY_COLORS[Math.floor(rng() * BODY_COLORS.length)];
      legsColor = LEGS_COLORS[Math.floor(rng() * LEGS_COLORS.length)];
    }

    return {
      id:        i,
      type,
      modelType,
      spawnX:    sp.x,
      spawnZ:    sp.z,
      radius:    sp.r,
      speed:     type === 'police' ? 1.5 + rng() * 0.5 : 1.8 + rng() * 1.4,
      bodyColor,
      legsColor,
      skinColor: SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)],
      hairColor: HAIR_COLORS[Math.floor(rng() * HAIR_COLORS.length)],
      scale:     0.88 + rng() * 0.24,
    };
  });
}

const NPC_DEFS = buildDefs();

// ─── Runtime per-NPC state ────────────────────────────────────────────────────

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

// ─── NPC mesh ─────────────────────────────────────────────────────────────────

interface NpcMeshProps {
  def:     NpcDef;
  onRef:   (el: THREE.Group | null) => void;
  onClick: (def: NpcDef) => void;
}

function NpcMesh({ def, onRef, onClick }: NpcMeshProps) {
  const isPolice = def.type === 'police';
  const isGang   = def.type === 'gang';
  const model    = def.modelType;

  const isFemale = model === 'female_casual' || model === 'female_hijab' || model === 'female_dress';
  const torsoW   = isFemale ? 0.58 : 0.65;
  const armX     = torsoW / 2 + 0.12;

  return (
    <group
      ref={onRef}
      scale={[def.scale, def.scale, def.scale]}
      onClick={(e) => { e.stopPropagation(); onClick(def); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >

      {/* ── Body (Task 2: New Models, from /glb4) ─────────────────────────
          Replaces the old stacked-box mannequin (legs/torso/arms/head) with
          a real character model fit to the same footprint the boxes used to
          occupy, so every accessory below still lines up correctly. */}
      <FittedGLB set="glb4" model={npcModelFile(def)} targetSize={[0.62, 2.05, 0.42]} />

      {/* Sporty side stripe */}
      {model === 'male_sporty' && (
        <mesh position={[torsoW / 2 - 0.05, 1.0, 0]}>
          <boxGeometry args={[0.06, 0.70, 0.36]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      )}

      {/* Business tie */}
      {model === 'male_business' && (
        <mesh position={[0, 0.92, -0.175]}>
          <boxGeometry args={[0.09, 0.46, 0.015]} />
          <meshStandardMaterial color="#880000" roughness={0.8} />
        </mesh>
      )}

      {/* Worker bib front */}
      {model === 'male_worker' && (
        <mesh position={[0, 1.12, -0.175]}>
          <boxGeometry args={[0.38, 0.34, 0.015]} />
          <meshStandardMaterial color="#1a1a6a" roughness={0.85} />
        </mesh>
      )}

      {/* Police belt + badge + epaulettes */}
      {isPolice && (
        <>
          {/* Belt */}
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[torsoW + 0.04, 0.10, 0.36]} />
            <meshStandardMaterial color="#0a0a22" roughness={0.7} />
          </mesh>
          {/* Belt buckle */}
          <mesh position={[0, 0.72, -0.175]}>
            <boxGeometry args={[0.12, 0.08, 0.02]} />
            <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Badge */}
          <mesh position={[-0.14, 1.10, -0.175]}>
            <boxGeometry args={[0.12, 0.10, 0.02]} />
            <meshStandardMaterial color="#ffd700" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Shoulder epaulettes */}
          <mesh position={[-armX, 1.14, 0]}>
            <boxGeometry args={[0.22, 0.08, 0.22]} />
            <meshStandardMaterial color="#e8e8ff" roughness={0.7} />
          </mesh>
          <mesh position={[armX, 1.14, 0]}>
            <boxGeometry args={[0.22, 0.08, 0.22]} />
            <meshStandardMaterial color="#e8e8ff" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* ── Arms ────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[-armX, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[armX, 0.95, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
      </mesh>

      {/* ── Head ────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 1.82, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshStandardMaterial color={def.skinColor} roughness={0.75} />
      </mesh>

      {/* ── Head coverings ──────────────────────────────────────────────── */}

      {/* Standard hair — all models except hijab, worker, and police */}
      {!isPolice && model !== 'female_hijab' && model !== 'male_worker' && (
        <mesh position={[0, 2.09, 0]}>
          <boxGeometry args={[0.50, 0.13, 0.50]} />
          <meshStandardMaterial color={def.hairColor} roughness={0.9} />
        </mesh>
      )}

      {/* Ponytail for female_casual and female_dress */}
      {(model === 'female_casual' || model === 'female_dress') && (
        <mesh position={[0, 2.02, 0.24]}>
          <boxGeometry args={[0.16, 0.28, 0.14]} />
          <meshStandardMaterial color={def.hairColor} roughness={0.9} />
        </mesh>
      )}

      {/* Hijab — cap + drape */}
      {model === 'female_hijab' && (
        <>
          <mesh position={[0, 2.11, 0]}>
            <boxGeometry args={[0.54, 0.16, 0.54]} />
            <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.89, 0.06]}>
            <boxGeometry args={[0.56, 0.30, 0.52]} />
            <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
          </mesh>
        </>
      )}

      {/* Hard hat (worker) */}
      {model === 'male_worker' && (
        <>
          <mesh castShadow position={[0, 2.13, 0]}>
            <boxGeometry args={[0.60, 0.18, 0.60]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.7} />
          </mesh>
          <mesh position={[0, 2.03, 0]}>
            <boxGeometry args={[0.70, 0.05, 0.70]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Police cap + gold band */}
      {isPolice && (
        <>
          <mesh castShadow position={[0, 2.12, 0]}>
            <boxGeometry args={[0.52, 0.18, 0.52]} />
            <meshStandardMaterial color="#0a1a5a" roughness={0.7} />
          </mesh>
          {/* Cap brim */}
          <mesh position={[0, 2.04, -0.30]}>
            <boxGeometry args={[0.52, 0.06, 0.14]} />
            <meshStandardMaterial color="#0a1a5a" roughness={0.7} />
          </mesh>
          {/* Gold band */}
          <mesh position={[0, 2.04, 0]}>
            <boxGeometry args={[0.54, 0.06, 0.54]} />
            <meshStandardMaterial color="#ffd700" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Gang bandana */}
      {isGang && (
        <mesh position={[0, 1.63, 0]}>
          <boxGeometry args={[0.5, 0.22, 0.36]} />
          <meshStandardMaterial color="#aa1111" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

// ─── NPCs controller ──────────────────────────────────────────────────────────

const NPC_RADIUS = 0.45; // approx half-body width for building collision

const NPC_DENSITY_FACTOR: Record<string, number> = { low: 0.33, medium: 0.66, high: 1.0 };

export function NPCs() {
  const isPaused   = useGameStore((s) => s.isPaused);
  const screen     = useGameStore((s) => s.screen);
  const npcDensity = useGameStore((s) => s.npcDensity);
  const npcCount   = useGameStore((s) => s.npcCount);

  // Density gives a proportional target; the "NPC Count" slider is a hard
  // cap on top of it, so lowering it always wins (mobile default: 10).
  const densityTarget = Math.max(1, Math.ceil(NPC_DEFS.length * (NPC_DENSITY_FACTOR[npcDensity] ?? 0.66)));
  const activeCount   = Math.max(1, Math.min(densityTarget, npcCount, NPC_DEFS.length));

  const groupRefs = useRef<(THREE.Group | null)[]>(NPC_DEFS.map(() => null));
  const npcState  = useRef<NpcState[]>(makeInitialState());
  const rngs      = useMemo(() => NPC_DEFS.map((_, i) => seededRng(i * 137.5 + 42)), []);
  const flavorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNpcClick = (def: NpcDef) => {
    if (useGameStore.getState().isPaused) return;
    useGameStore.getState().setInteractionHint(`💬 ${flavorLineFor(def)}`);
    if (flavorTimer.current) clearTimeout(flavorTimer.current);
    flavorTimer.current = setTimeout(() => {
      useGameStore.getState().setInteractionHint(null);
    }, 2500);
  };

  useFrame((_, delta) => {
    if (screen !== 'playing' || isPaused) return;

    NPC_DEFS.slice(0, activeCount).forEach((def, i) => {
      const group = groupRefs.current[i];
      const s = npcState.current[i];
      const rng = rngs[i];
      if (!group) return;

      if (s.waitTimer > 0) {
        s.waitTimer = Math.max(0, s.waitTimer - delta);
        group.position.set(s.x, 1, s.z);
        group.rotation.y = s.rotY;
        return;
      }

      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        s.waitTimer = 0.5 + rng() * 2.0;
        const angle = rng() * Math.PI * 2;
        const r = def.radius * (0.3 + rng() * 0.7);
        s.targetX = def.spawnX + Math.cos(angle) * r;
        s.targetZ = def.spawnZ + Math.sin(angle) * r;
        return;
      }

      /* ── Move toward waypoint ── */
      const ndx  = dx / dist;
      const ndz  = dz / dist;
      const step = def.speed * delta;
      const nx   = s.x + ndx * Math.min(step, dist);
      const nz   = s.z + ndz * Math.min(step, dist);

      /* ── Building AABB collision avoidance ── */
      let blocked = false;
      for (const aabb of BUILDING_AABBS) {
        const adx  = nx - aabb.cx;
        const adz  = nz - aabb.cz;
        const penX = aabb.hw + NPC_RADIUS - Math.abs(adx);
        const penZ = aabb.hd + NPC_RADIUS - Math.abs(adz);
        if (penX > 0 && penZ > 0) {
          blocked = true;
          break;
        }
      }

      if (blocked) {
        /* Re-pick a random nearby waypoint and idle briefly */
        s.waitTimer = 0.3 + rng() * 1.0;
        const angle = rng() * Math.PI * 2;
        const r     = def.radius * (0.4 + rng() * 0.6);
        s.targetX   = def.spawnX + Math.cos(angle) * r;
        s.targetZ   = def.spawnZ + Math.sin(angle) * r;
        group.position.set(s.x, 1, s.z);
        group.rotation.y = s.rotY;
        return;
      }

      s.x = nx;
      s.z = nz;

      const targetRotY = Math.atan2(-dx, -dz);
      s.rotY += (targetRotY - s.rotY) * 8 * delta;
      group.position.set(s.x, 1, s.z);
      group.rotation.y = s.rotY;
    });
  });

  if (screen !== 'playing') return null;

  return (
    <>
      {NPC_DEFS.slice(0, activeCount).map((def, i) => (
        <NpcMesh
          key={def.id}
          def={def}
          onRef={(el) => { groupRefs.current[i] = el; }}
          onClick={handleNpcClick}
        />
      ))}
    </>
  );
}

// ─── Child NPCs (playing in parks / school zones) ─────────────────────────────

// Park cluster origins: original park + two new clusters in City A & B
const CHILD_CLUSTERS: { cx: number; cz: number }[] = [
  { cx:  50, cz: 150 },  // Original park near Centre-Ville
  { cx: -250, cz: -30 }, // City A commercial playground
  { cx:  350, cz:  80 }, // City B school zone
];

const PARK_CX = 50;
const PARK_CZ = 150;

const CHILD_PLACEMENTS = [
  { x: -8, z: -4, color: '#e8532a', hair: '#111111' },
  { x:  5, z: -7, color: '#2a7acc', hair: '#2c1a0e' },
  { x:  9, z:  5, color: '#e84a8a', hair: '#3d2b1f' },
  { x: -6, z:  8, color: '#44aa44', hair: '#0a0a0a' },
  { x:  2, z: -2, color: '#cc8822', hair: '#111111' },
  { x: -3, z:  6, color: '#aa33cc', hair: '#1a0a00' },
  { x:  7, z:  3, color: '#33aacc', hair: '#2c1a0e' },
  { x: -9, z: -1, color: '#cc3333', hair: '#0a0a0a' },
];

const CHILD_SKINS = [
  '#d4956a', '#c8855a', '#a0623a', '#e0aa80',
  '#d4956a', '#c8855a', '#a0623a', '#e0aa80',
];

export function ChildNPCs() {
  const screen   = useGameStore((s) => s.screen);
  const isPaused = useGameStore((s) => s.isPaused);
  // Refs for ALL children across ALL clusters
  const totalChildren = CHILD_CLUSTERS.length * CHILD_PLACEMENTS.length;
  const refs     = useRef<(THREE.Group | null)[]>(Array.from({ length: totalChildren }, () => null));

  useFrame(({ clock }) => {
    if (screen !== 'playing' || isPaused) return;
    const t = clock.getElapsedTime();
    refs.current.forEach((g, i) => {
      if (!g) return;
      const localIdx = i % CHILD_PLACEMENTS.length;
      g.position.y = 0.58 + Math.abs(Math.sin(t * 2.6 + i * 0.9)) * 0.22;
      g.rotation.y = t * 0.6 * (localIdx % 2 === 0 ? 1 : -1) + localIdx * 0.8;
    });
  });

  if (screen !== 'playing') return null;

  return (
    <>
      {/* Render child NPC cluster at each defined CHILD_CLUSTERS origin */}
      {CHILD_CLUSTERS.flatMap((cluster, ci) =>
        CHILD_PLACEMENTS.map((cp, i) => {
          const skin = CHILD_SKINS[i];
          const globalIdx = ci * CHILD_PLACEMENTS.length + i;
          return (
          <group
            key={`child-${ci}-${i}`}
            ref={(el) => { refs.current[globalIdx] = el; }}
            position={[cluster.cx + cp.x, 0.58, cluster.cz + cp.z]}
            scale={[0.58, 0.58, 0.58]}
          >
            {/* Legs */}
            <mesh position={[-0.12, 0.30, 0]}>
              <boxGeometry args={[0.17, 0.58, 0.17]} />
              <meshStandardMaterial color="#1a1a4a" roughness={0.9} />
            </mesh>
            <mesh position={[0.12, 0.30, 0]}>
              <boxGeometry args={[0.17, 0.58, 0.17]} />
              <meshStandardMaterial color="#1a1a4a" roughness={0.9} />
            </mesh>
            {/* Torso */}
            <mesh position={[0, 0.88, 0]}>
              <boxGeometry args={[0.56, 0.58, 0.30]} />
              <meshStandardMaterial color={cp.color} roughness={0.85} />
            </mesh>
            {/* Arms */}
            <mesh position={[-0.39, 0.86, 0]}>
              <boxGeometry args={[0.17, 0.46, 0.17]} />
              <meshStandardMaterial color={cp.color} roughness={0.85} />
            </mesh>
            <mesh position={[0.39, 0.86, 0]}>
              <boxGeometry args={[0.17, 0.46, 0.17]} />
              <meshStandardMaterial color={cp.color} roughness={0.85} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.58, 0]}>
              <boxGeometry args={[0.42, 0.42, 0.42]} />
              <meshStandardMaterial color={skin} roughness={0.75} />
            </mesh>
            {/* Hair */}
            <mesh position={[0, 1.82, 0]}>
              <boxGeometry args={[0.44, 0.12, 0.44]} />
              <meshStandardMaterial color={cp.hair} roughness={0.9} />
            </mesh>
          </group>
        );
      })
      )}
    </>
  );
}

// ─── Shopkeeper NPCs ──────────────────────────────────────────────────────────
// Stationary workers rendered at every NPC_TALKER that has a shopType.

function ShopkeeperMesh({ x, z, isArms }: { x: number; z: number; isArms: boolean }) {
  // apron colour distinguishes food shops vs arms dealers
  const apronColor = isArms ? '#2a2a5a' : '#ffffff';
  const bodyColor  = isArms ? '#1a1a1a' : '#2a2a2a';
  return (
    <group position={[x, 1, z]}>
      {/* Legs */}
      <mesh position={[-0.15, -0.62, 0]}>
        <boxGeometry args={[0.2, 0.72, 0.2]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, -0.62, 0]}>
        <boxGeometry args={[0.2, 0.72, 0.2]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.65, 0.68, 0.35]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>
      {/* Apron */}
      <mesh position={[0, -0.1, -0.18]}>
        <boxGeometry args={[0.55, 0.6, 0.02]} />
        <meshStandardMaterial color={apronColor} roughness={0.9} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.44, -0.05, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.44, -0.05, 0]}>
        <boxGeometry args={[0.2, 0.55, 0.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshStandardMaterial color="#c8855a" roughness={0.75} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Cap brim for arms dealers */}
      {isArms && (
        <mesh position={[0, 1.1, -0.3]}>
          <boxGeometry args={[0.52, 0.06, 0.18]} />
          <meshStandardMaterial color="#0a0a2a" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

/** Small floating name-tag over a shopkeeper — clear signage for the relocated NPCs. */
function ShopSign({ label }: { label: string }) {
  return (
    <Html position={[0, 2.15, 0]} center distanceFactor={12} occlude={false}>
      <div
        style={{
          background: 'rgba(10,10,10,0.82)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 6,
          padding: '3px 9px',
          color: '#fff',
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          letterSpacing: 0.3,
          pointerEvents: 'none',
        }}
      >
        {label}
      </div>
    </Html>
  );
}

// ─── Dancing NPC (bar patrons) ────────────────────────────────────────────────
// Sways side-to-side with a slight bounce — purely via useFrame on a ref,
// zero React state per frame (same pattern as WandererNpc).

function DancingNpcMesh({ color = '#3a2a5a' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * Math.PI * 2); // phase offset so all dancers don't sync

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta * 2.8;
    groupRef.current.rotation.z = Math.sin(t.current) * 0.18;
    groupRef.current.position.y = Math.abs(Math.sin(t.current * 0.5)) * 0.12;
  });

  return (
    <group ref={groupRef}>
      <FittedGLB set="glb4" model="character-female-c" targetSize={[0.58, 1.9, 0.38]} />
      {/* Coloured top to distinguish dancers */}
      <mesh position={[0, 1.1, -0.19]}>
        <boxGeometry args={[0.48, 0.55, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── NPC Street Conversations ─────────────────────────────────────────────────
// Pairs of nearby NPC talkers occasionally display speech bubbles aimed at
// each other — makes the world feel inhabited without heavy pathfinding.

const STREET_LINES = [
  ['Did you hear about the checkpoint last night?', 'Yes — they stopped everyone. Even old Hadj Mustapha.'],
  ['The price of bread went up again.', 'Everything goes up except our wages.'],
  ['I heard the gang from Ali Mendjeli is expanding.', 'Let them come. This street has seen worse.'],
  ['Nice day today, mashAllah.', 'Enjoy it — rain is coming Thursday.'],
  ['Did you watch the match last night?', 'Missed it. Was working. Who won?'],
  ['My cousin found work in City B.', 'The new developments? Good for him.'],
  ['Police were asking about the warehouse fire.', 'I know nothing. I saw nothing.'],
];

function NpcConversationBubbles() {
  const [lineIdx, setLineIdx] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show a conversation every 8 seconds, visible for 4 seconds
    const cycle = () => {
      setLineIdx((i) => (i + 1) % STREET_LINES.length);
      setShow(true);
      setTimeout(() => setShow(false), 4000);
    };
    const interval = setInterval(cycle, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!show) return null;
  const [lineA, lineB] = STREET_LINES[lineIdx];

  // Render at a fixed well-populated street corner in Centre-Ville
  return (
    <group position={[25, 0, -12]}>
      {/* NPC A */}
      <group position={[-1.2, 0, 0]}>
        <FittedGLB set="glb4" model="character-male-a" targetSize={[0.6, 2.0, 0.4]} />
        <Html position={[0, 2.5, 0]} center distanceFactor={14}>
          <div style={{ background:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:8, padding:'4px 10px', color:'#fff', fontSize:11, maxWidth:180, whiteSpace:'normal', lineHeight:1.4, pointerEvents:'none' }}>
            {lineA}
          </div>
        </Html>
      </group>
      {/* NPC B */}
      <group position={[1.2, 0, 0]} rotation={[0, Math.PI, 0]}>
        <FittedGLB set="glb4" model="character-female-a" targetSize={[0.56, 1.9, 0.38]} />
        <Html position={[0, 2.5, 0]} center distanceFactor={14}>
          <div style={{ background:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:8, padding:'4px 10px', color:'#eee', fontSize:11, maxWidth:180, whiteSpace:'normal', lineHeight:1.4, pointerEvents:'none' }}>
            {lineB}
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── Park Activity Zone ───────────────────────────────────────────────────────
// Near the city park spawn cluster (x:100, z:100). Shows an E-key prompt when
// the player is within range and grants XP + passes time on interaction.

const PARK_GAMES = [
  { name: 'Chess',    xp: 30,  duration: 0.05, icon: '♟' },
  { name: 'Dominos', xp: 20,  duration: 0.03, icon: '🁣' },
  { name: 'Football',xp: 50,  duration: 0.08, icon: '⚽' },
];

export function ParkActivityZone() {
  const screen   = useGameStore((s) => s.screen);
  const indoors  = useGameStore((s) => s.indoors);
  const isPaused = useGameStore((s) => s.isPaused);
  const [hint, setHint]   = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const tickRef = useRef(0);
  const PARK_X = 100, PARK_Z = 100, PARK_R = 18;

  useFrame((_, delta) => {
    if (screen !== 'playing' || indoors || isPaused) return;
    tickRef.current += delta;
    if (tickRef.current < 0.25) return;
    tickRef.current = 0;
    const [px, , pz] = useGameStore.getState().playerPosition;
    const near = (px - PARK_X) ** 2 + (pz - PARK_Z) ** 2 < PARK_R ** 2;
    setHint(near);
  });

  useEffect(() => {
    if (!hint) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const game = PARK_GAMES[Math.floor(Math.random() * PARK_GAMES.length)];
      useGameStore.getState().addXp(game.xp);
      useGameStore.getState().sleep(game.duration);
      setResult(`${game.icon} You played ${game.name}! +${game.xp} XP`);
      setTimeout(() => setResult(null), 3000);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [hint]);

  if (!hint && !result) return null;

  return (
    <group position={[PARK_X, 0, PARK_Z]}>
      {/* Park benches */}
      <mesh position={[3, 0.35, 0]} castShadow>
        <boxGeometry args={[2.4, 0.12, 0.6]} />
        <meshStandardMaterial color="#5c3d1a" roughness={0.9} />
      </mesh>
      <mesh position={[-3, 0.35, 0]} castShadow>
        <boxGeometry args={[2.4, 0.12, 0.6]} />
        <meshStandardMaterial color="#5c3d1a" roughness={0.9} />
      </mesh>
      {/* Chess table */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.06, 8]} />
        <meshStandardMaterial color="#444444" roughness={0.7} />
      </mesh>

      {hint && (
        <Html position={[0, 3.2, 0]} center distanceFactor={16}>
          <div style={{ background:'rgba(10,10,10,0.9)', border:'1.5px solid #d4a800', borderRadius:10, padding:'7px 16px', color:'#fff', fontSize:13, fontWeight:700, whiteSpace:'nowrap', textAlign:'center', pointerEvents:'none' }}>
            <span style={{ color:'#d4a800' }}>E</span> — Play chess / dominos / football
          </div>
        </Html>
      )}
      {result && (
        <Html position={[0, 4.2, 0]} center distanceFactor={16}>
          <div style={{ background:'rgba(10,10,10,0.9)', border:'1px solid #22c55e', borderRadius:10, padding:'7px 16px', color:'#22c55e', fontSize:13, fontWeight:700, whiteSpace:'nowrap', textAlign:'center', pointerEvents:'none' }}>
            {result}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Renders stationary shopkeeper figures at all shop / dialogue NPC talker
 * positions. Indoor NPCs (relocated inside their shops) only render while the
 * player is inside the matching interior; outdoor NPCs only render outdoors.
 */
export function ShopkeeperNPCs() {
  const screen  = useGameStore((s) => s.screen);
  const indoors = useGameStore((s) => s.indoors);
  const interiorId = useGameStore((s) => s.interiorId);
  if (screen !== 'playing') return null;

  const visibleNpcs = NPC_TALKERS.filter((n) => {
    if (!(n.shopType || n.quiz || n.options)) return false;
    return n.interiorId ? (indoors && interiorId === n.interiorId) : !indoors;
  });

  const handleClick = (npc: (typeof NPC_TALKERS)[number]) => {
    if (useGameStore.getState().isPaused) return;
    const [px, , pz] = useGameStore.getState().playerPosition;
    const d = Math.hypot(px - npc.worldX, pz - npc.worldZ);
    if (d > npc.radius) {
      useGameStore.getState().setInteractionHint(`Get closer to ${npc.label}`);
      setTimeout(() => {
        if (useGameStore.getState().interactionHint?.startsWith('Get closer')) {
          useGameStore.getState().setInteractionHint(null);
        }
      }, 1500);
      return;
    }
    triggerNpcInteraction(npc);
  };

  // Dancing colour palette — cycles through club colours
  const DANCE_COLORS = ['#3a2a5a','#2a3a5a','#5a2a3a','#2a5a3a','#5a4a1a','#3a4a2a','#4a2a5a'];

  return (
    <>
      {visibleNpcs.map((npc, idx) => (
        <group
          key={npc.id}
          position={[npc.worldX, 0, npc.worldZ]}
          onClick={(e) => { e.stopPropagation(); handleClick(npc); }}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          {npc.dancing
            ? <DancingNpcMesh color={DANCE_COLORS[idx % DANCE_COLORS.length]} />
            : <ShopkeeperMesh x={0} z={0} isArms={npc.shopType === 'ammo'} />
          }
          <ShopSign label={npc.label} />
        </group>
      ))}
      {/* Ambient street conversations — outdoor only */}
      {!indoors && <NpcConversationBubbles />}
    </>
  );
}
