/**
 * NPC wanderers — citizens, police officers, and gang members.
 * - Seeded deterministic placement (same spawn every session)
 * - Building AABB collision avoidance (re-routes on obstruction)
 * - Type-specific colour palettes and visual accents
 * - Wander AI driven entirely via THREE refs — zero React state per frame
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { BUILDING_AABBS } from './buildings';
import { NPC_TALKERS } from './interiors';

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

interface NpcDef {
  id:        number;
  type:      NpcType;
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
  { x: -500, z:  -60, r: 20, type: 'gang' },
  { x: -540, z:   80, r: 22, type: 'gang' },
  { x: -460, z:    0, r: 18, type: 'gang' },
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

function buildDefs(): NpcDef[] {
  const rng = seededRng(99);
  return SPAWNS.map((sp, i) => {
    const type = sp.type ?? 'citizen';

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
  def:   NpcDef;
  onRef: (el: THREE.Group | null) => void;
}

function NpcMesh({ def, onRef }: NpcMeshProps) {
  const isPolice = def.type === 'police';
  const isGang   = def.type === 'gang';

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
      {!isPolice && (
        <mesh position={[0, 2.08, 0]}>
          <boxGeometry args={[0.5, 0.12, 0.5]} />
          <meshStandardMaterial color={def.hairColor} roughness={0.9} />
        </mesh>
      )}

      {/* Police cap */}
      {isPolice && (
        <>
          <mesh castShadow position={[0, 2.12, 0]}>
            <boxGeometry args={[0.52, 0.18, 0.52]} />
            <meshStandardMaterial color="#0a1a5a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 2.04, -0.3]}>
            <boxGeometry args={[0.52, 0.06, 0.14]} />
            <meshStandardMaterial color="#0a1a5a" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Gang bandana (red cloth around neck/lower face) */}
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

export function NPCs() {
  const isPaused = useGameStore((s) => s.isPaused);
  const screen   = useGameStore((s) => s.screen);

  const groupRefs = useRef<(THREE.Group | null)[]>(NPC_DEFS.map(() => null));
  const npcState  = useRef<NpcState[]>(makeInitialState());
  const rngs      = useMemo(() => NPC_DEFS.map((_, i) => seededRng(i * 137.5 + 42)), []);

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
        group.position.set(s.x, 1, s.z);
        group.rotation.y = s.rotY;
        return;
      }

      const dx   = s.targetX - s.x;
      const dz   = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        /* Reached waypoint — idle briefly then pick next */
        s.waitTimer = 0.5 + rng() * 2.0;
        const angle = rng() * Math.PI * 2;
        const r     = def.radius * (0.3 + rng() * 0.7);
        s.targetX   = def.spawnX + Math.cos(angle) * r;
        s.targetZ   = def.spawnZ + Math.sin(angle) * r;
        group.position.set(s.x, 1, s.z);
        group.rotation.y = s.rotY;
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

      /* Face direction of movement */
      const targetRotY = Math.atan2(-ndx, -ndz);
      let diff = targetRotY - s.rotY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      s.rotY += diff * 8 * delta;

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

/** Renders stationary shopkeeper figures at all shop NPC talker positions. */
export function ShopkeeperNPCs() {
  const screen = useGameStore((s) => s.screen);
  if (screen !== 'playing') return null;

  const shopNpcs = NPC_TALKERS.filter((n) => n.shopType);
  return (
    <>
      {shopNpcs.map((npc) => (
        <ShopkeeperMesh
          key={npc.id}
          x={npc.worldX}
          z={npc.worldZ}
          isArms={npc.shopType === 'ammo'}
        />
      ))}
    </>
  );
}
