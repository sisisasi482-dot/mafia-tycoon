/**
 * City — renders the open-world city at 2× map scale.
 *
 * Buildings from shared BUILDINGS array (aligned with collision AABBs).
 * Roads use procedural canvas-based asphalt textures with lane markings.
 * Sidewalk strips (concrete) run alongside major roads.
 */
import React, { useEffect, useMemo, useRef, useReducer } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDINGS } from './buildings';
import { DOOR_TRIGGERS } from './interiors';
import { generateBuildingTextures, disposeBuildingTextures } from './buildingTextures';
import { useGameStore } from './useGameStore';
import {
  activeMask,
  unlockedMask,
  resetActiveBuildings,
  seedInitialUnlock,
  scanBuildingProximity,
  countVisibleBuildingMeshes,
  checkMemorySafety,
  BUILDING_UPDATE_INTERVAL_FRAMES,
  BUILDING_TOGGLE_BATCH_SIZE,
} from './buildingPool';
import { SPAWN_XZ } from './worldConstants';

// ─── Procedural road texture ──────────────────────────────────────────────────

function makeAsphaltTexture(): THREE.CanvasTexture {
  const W = 256, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Light grey asphalt base
  ctx.fillStyle = '#9a9a9e';
  ctx.fillRect(0, 0, W, H);

  // Subtle darker grain
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const v = 80 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgba(${v},${v},${v},0.4)`;
    ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
  }

  // White lane / seam lines (visible on light grey)
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth   = 1;
  for (let y = 40; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeConcreteTexture(): THREE.CanvasTexture {
  const W = 256, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#363636';
  ctx.fillRect(0, 0, W, H);

  // Concrete slab grid
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Light speckle
  for (let i = 0; i < 400; i++) {
    const v = 55 + Math.floor(Math.random() * 20);
    ctx.fillStyle = `rgba(${v},${v},${v},0.25)`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Shop sign texture ────────────────────────────────────────────────────────

function makeSignTexture(text: string): THREE.CanvasTexture {
  const W = 256, H = 64;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0e0e0e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffcc33';
  ctx.font      = 'bold 26px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const SHOP_NAMES = [
  'SUPÉRETTE', 'PHARMACIE', 'CAFÉ', 'TABAC',
  'BOULANGERIE', 'ÉPICERIE', 'COIFFEUR', 'BOUTIQUE',
];

/** Dedicated physical stores — must line up with the NPC_TALKERS entries of the
 *  same shopType in interiors.ts (shop_weapons/shop_vehicles/shop_hospital) and
 *  the police station door trigger, so the visual kiosk sits at the same spot
 *  the player interacts with. */
const STORE_MARKERS = [
  { x: -160, z:  40, name: 'ARMURERIE',  color: '#8b1a1a' },
  { x:  140, z:  40, name: 'AUTO STORE', color: '#1a3a8b' },
  { x:  -90, z: -50, name: 'HÔPITAL',    color: '#1a8b4a' },
  { x:   60, z: 108, name: 'POLICE',     color: '#1a3aee' },
];

// ─── Road network (2× scale) ──────────────────────────────────────────────────
//   Major roads are 40 units wide; minor roads 28 units wide.

const ROADS = [
  // Main E-W highway (z ≈ 0)
  { x:  -60, z:   0, w: 1100, d: 40, repeat: [80, 3] },
  // Main N-S through city centre (x ≈ 0)
  { x:    0, z: 100, w:  40, d: 800, repeat: [3, 60] },
  // Secondary N-S east (x ≈ 100)
  { x:  100, z:   0, w:  40, d: 400, repeat: [3, 30] },
  // Ali Mendjeli N-S (x ≈ -200)
  { x: -200, z:   0, w:  40, d: 420, repeat: [3, 30] },
  // Airport access road (x ≈ -300)
  { x: -300, z: 240, w:  40, d: 480, repeat: [3, 35] },
  // Far-west industrial N-S (x ≈ -460)
  { x: -460, z:   0, w:  40, d: 400, repeat: [3, 30] },
  // E-W cross street north (z ≈ 80)
  { x: -200, z:  80, w: 640, d: 28,  repeat: [46, 2] },
  // E-W cross street south (z ≈ -80)
  { x: -200, z: -80, w: 640, d: 28,  repeat: [46, 2] },
  // Old City connector (z ≈ 0, east of gorge)
  { x:  380, z:   0, w:  40, d: 200, repeat: [3, 15] },
];

// Sidewalk strips alongside major roads (concrete, 8 units wide)
const SIDEWALKS = [
  // North and south of main E-W highway
  { x: -60,  z:  24,  w: 1100, d: 8 },
  { x: -60,  z: -24,  w: 1100, d: 8 },
  // East and west of main N-S
  { x:  24,  z: 100, w: 8, d: 800 },
  { x: -24,  z: 100, w: 8, d: 800 },
];

export function City() {
  const texPool = useMemo(() => generateBuildingTextures(), []);
  useEffect(() => () => disposeBuildingTextures(texPool), [texPool]);

  /* ── Building staged-loading pool ──────────────────────────────────────
   * Buildings are NOT all mounted at once. Only buildings within
   * BUILDING_ACTIVATION_RADIUS (30m) of the spawn point are mounted on
   * first render (`unlockedVersion` state seeds `unlockedMask`). Everything
   * else stays un-mounted — zero geometry/material cost — until the player
   * walks within range, streaming in at BUILDING_TOGGLE_BATCH_SIZE per
   * frame. Once mounted, a building is NEVER unmounted again — leaving its
   * radius only flips the existing mesh's `visible` (never scene.add/remove,
   * never dispose). */
  const buildingRefs = useRef<(THREE.Mesh | null)[]>([]);
  const frameCount = useRef(0);
  // Two independent queues so the same per-frame batch cap governs both:
  // buildings streaming in for the first time (a real mount) and buildings
  // that are already mounted and just need `visible` flipped.
  const pendingStreamIn = useRef<number[]>([]);
  const pendingToggles = useRef<number[]>([]);
  const [, bumpUnlockVersion] = useReducer((x: number) => x + 1, 0);
  // Gates the building JSX map below: false until the reset+seed effect has
  // actually run. Without this, a remount (e.g. re-entering the outdoor
  // scene after an interior) would render one frame off the *stale*
  // module-singleton unlockedMask left over from the previous mount, before
  // the effect below gets a chance to reset it — briefly showing whatever
  // was unlocked last time instead of only what's near the new spawn point.
  const [initialized, setInitialized] = React.useState(false);

  // Every mount starts fresh. Reset the shared (module-singleton) masks so
  // a re-entry — e.g. leaving an interior — can't carry stale bits, then
  // seed Stage 1: whatever is within radius of spawn unlocks synchronously
  // so the very first render already shows immediate surroundings.
  useEffect(() => {
    resetActiveBuildings();
    seedInitialUnlock(...SPAWN_XZ);
    frameCount.current = 0;
    pendingStreamIn.current = [];
    pendingToggles.current = [];
    setInitialized(true);
  }, []);

  useFrame(() => {
    frameCount.current += 1;
    if (frameCount.current >= BUILDING_UPDATE_INTERVAL_FRAMES) {
      frameCount.current = 0;

      const [px, , pz] = useGameStore.getState().playerPosition;
      const { streamIn, toggle } = scanBuildingProximity(px, pz);
      pendingStreamIn.current.push(...streamIn);
      pendingToggles.current.push(...toggle);

      // Memory Safety Monitor — threshold on the count of buildings whose
      // mesh.visible is *actually* true right now (real on-screen state),
      // never activeMask intent, since batched toggles can lag the mask by
      // a few frames.
      checkMemorySafety(
        countVisibleBuildingMeshes(buildingRefs.current),
        Date.now(),
        () => countVisibleBuildingMeshes(buildingRefs.current),
      );
    }

    // Apply at most BUILDING_TOGGLE_BATCH_SIZE mesh.visible mutations per
    // frame on already-mounted buildings — never scene.add/remove, only
    // property toggles.
    if (pendingToggles.current.length > 0) {
      const batch = pendingToggles.current.splice(0, BUILDING_TOGGLE_BATCH_SIZE);
      for (const i of batch) {
        const mesh = buildingRefs.current[i];
        if (mesh) mesh.visible = activeMask[i] === 1;
      }
    }

    // Stream in at most BUILDING_TOGGLE_BATCH_SIZE never-before-seen
    // buildings per frame — this is the actual "5 objects/frame" mount, the
    // only point where new geometry/material gets created.
    if (pendingStreamIn.current.length > 0) {
      const batch = pendingStreamIn.current.splice(0, BUILDING_TOGGLE_BATCH_SIZE);
      for (const i of batch) unlockedMask[i] = 1;
      bumpUnlockVersion();
    }
  });

  // Pre-create one texture per road/sidewalk segment (with per-segment repeat baked in).
  // Doing this in useMemo avoids allocating new THREE.Texture objects on every render.
  const roadTextures = useMemo(() =>
    ROADS.map((r) => {
      const tex = makeAsphaltTexture();
      tex.repeat.set(r.repeat[0], r.repeat[1]);
      tex.needsUpdate = true;
      return tex;
    }), []);
  useEffect(() => () => roadTextures.forEach((t) => t.dispose()), [roadTextures]);

  const sidewalkTextures = useMemo(() =>
    SIDEWALKS.map((s) => {
      const tex = makeConcreteTexture();
      tex.repeat.set(s.w / 32, s.d / 32);
      tex.needsUpdate = true;
      return tex;
    }), []);
  useEffect(() => () => sidewalkTextures.forEach((t) => t.dispose()), [sidewalkTextures]);

  // Street lights along main roads
  // Pick ground-floor buildings in Centre-Ville / Old City to receive shop signage
  const shopfronts = useMemo(() => {
    const candidates = BUILDINGS.filter(
      (b) => (b.district === 'centre_ville' || b.district === 'old_city') && b.h < 14,
    );
    const picked: typeof candidates = [];
    for (let i = 0; i < candidates.length && picked.length < 8; i += 23) {
      picked.push(candidates[i]);
    }
    return picked.map((b, idx) => ({ building: b, name: SHOP_NAMES[idx % SHOP_NAMES.length] }));
  }, []);

  const signTextures = useMemo(
    () => shopfronts.map((sf) => makeSignTexture(sf.name)),
    [shopfronts],
  );
  useEffect(() => () => signTextures.forEach((t) => t.dispose()), [signTextures]);

  const storeSignTextures = useMemo(
    () => STORE_MARKERS.map((m) => makeSignTexture(m.name)),
    [],
  );
  useEffect(() => () => storeSignTextures.forEach((t) => t.dispose()), [storeSignTextures]);

  const streetLights = useMemo(() => {
    const lights: { x: number; z: number }[] = [];
    // Along main E-W highway
    for (let x = -580; x < 440; x += 40) {
      lights.push({ x, z: -26 });
      lights.push({ x, z:  26 });
    }
    // Along main N-S road
    for (let z = -160; z < 420; z += 40) {
      lights.push({ x: -26, z });
      lights.push({ x:  26, z });
    }
    return lights;
  }, []);

  return (
    <group>
      {/* ── Ground (dark earth/dirt, 2× scale) ───────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#1e1e22" roughness={0.95} />
      </mesh>

      {/* ── Asphalt roads ────────────────────────────────────────────── */}
      {ROADS.map((r, i) => (
        <mesh key={`road-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[r.x, 0.02, r.z]}>
          <planeGeometry args={[r.w, r.d]} />
          <meshStandardMaterial map={roadTextures[i]} color="#ffffff" roughness={0.88} />
        </mesh>
      ))}

      {/* ── Concrete sidewalks ───────────────────────────────────────── */}
      {SIDEWALKS.map((s, i) => (
        <mesh key={`sw-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[s.x, 0.03, s.z]}>
          <planeGeometry args={[s.w, s.d]} />
          <meshStandardMaterial map={sidewalkTextures[i]} color="#ffffff" roughness={0.92} />
        </mesh>
      ))}

      {/* ── Runway (airport, 2× position) ────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-300, 0.03, 380]}>
        <planeGeometry args={[30, 300]} />
        <meshStandardMaterial color="#0a0a10" roughness={0.8} />
      </mesh>

      {/* ── Gorge (2× position: was 160, now 320) ────────────────────── */}
      <mesh position={[320, -10, 0]}>
        <boxGeometry args={[88, 22, 200]} />
        <meshStandardMaterial color="#050508" />
      </mesh>

      {/* ── Sidi M'Cid Bridge deck (2×) ──────────────────────────────── */}
      <mesh castShadow receiveShadow position={[320, 5.5, 0]}>
        <boxGeometry args={[88, 1.2, 12]} />
        <meshStandardMaterial color="#555555" roughness={0.7} />
      </mesh>
      {[-18, -9, 0, 9, 18].map((zOff, i) => (
        <mesh key={`cable-${i}`} position={[320, 18, zOff]}>
          <boxGeometry args={[88, 0.35, 0.35]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      ))}

      {/* Bridge pylons (2×) */}
      <mesh castShadow position={[290, 22, 0]}>
        <boxGeometry args={[6, 55, 9]} />
        <meshStandardMaterial color="#444444" emissive="#ffffff" emissiveIntensity={0.05} />
      </mesh>
      <mesh castShadow position={[350, 22, 0]}>
        <boxGeometry args={[6, 55, 9]} />
        <meshStandardMaterial color="#444444" emissive="#ffffff" emissiveIntensity={0.05} />
      </mesh>

      {/* ── Airport structures (2× position: was -150, now -300) ─────── */}
      <mesh castShadow receiveShadow position={[-300, 5, 310]}>
        <boxGeometry args={[80, 10, 30]} />
        <meshStandardMaterial color="#d0d8e0" emissive="#a0d0ff" emissiveIntensity={0.3} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[-300, 8, 290]}>
        <boxGeometry args={[30, 16, 20]} />
        <meshStandardMaterial color="#c0c8d0" emissive="#80b0ff" emissiveIntensity={0.4} roughness={0.7} />
      </mesh>
      {/* ATC Tower */}
      <mesh castShadow position={[-220, 15, 320]}>
        <boxGeometry args={[6, 30, 6]} />
        <meshStandardMaterial color="#888888" emissive="#00ffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-220, 32, 320]}>
        <boxGeometry args={[10, 4, 10]} />
        <meshStandardMaterial color="#aaaaaa" emissive="#00ffff" emissiveIntensity={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`hangar-${i}`} castShadow position={[-380 + i * 50, 7, 350]}>
          <boxGeometry args={[40, 14, 35]} />
          <meshStandardMaterial color="#606870" emissive="#ffffff" emissiveIntensity={0.1} roughness={0.8} />
        </mesh>
      ))}

      {/* ── Airport runway lights ─────────────────────────────────────── */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={`rl-${i}`} position={[-300, 0.05, 240 + i * 14]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* ── Buildings (staged loading: only unlocked buildings are mounted at
          all; everything else stays un-mounted until streamed in) ── */}
      {BUILDINGS.map((b, i) => {
        if (!initialized || unlockedMask[i] === 0) return null; // never mounted yet — zero cost
        const tex = b.texKey ? texPool[b.texKey]?.[b.texIdx] : undefined;
        return (
          <mesh
            key={`b-${i}`}
            ref={(el) => { buildingRefs.current[i] = el; if (el) el.visible = activeMask[i] === 1; }}
            visible={activeMask[i] === 1}
            castShadow
            receiveShadow
            position={[b.x, b.h / 2, b.z]}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={tex ?? null}
              color={b.color}
              emissive={b.emissive}
              emissiveIntensity={b.emissiveIntensity}
              roughness={0.82}
              metalness={0.0}
            />
          </mesh>
        );
      })}

      {/* ── Door trigger markers ─────────────────────────────────────── */}
      {DOOR_TRIGGERS.map((dt) => (
        <group key={dt.id} position={[dt.worldX, 0, dt.worldZ]}>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[1.6, 3, 0.12]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.55} />
          </mesh>
          <mesh position={[-0.85, 1.5, 0]}>
            <boxGeometry args={[0.12, 3.2, 0.12]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.85, 1.5, 0]}>
            <boxGeometry args={[0.12, 3.2, 0.12]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[dt.radius * 0.4, 16]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.18} />
          </mesh>
          <pointLight color={dt.color} intensity={6} distance={12} decay={2} position={[0, 2.5, 0]} />
        </group>
      ))}

      {/* ── Shop storefronts ─────────────────────────────────────────── */}
      {shopfronts.map((sf, i) => {
        const b = sf.building;
        const signW = Math.min(b.w - 0.5, 5.5);
        return (
          <group key={`shop-${i}`} position={[b.x, 0, b.z + b.d / 2 + 0.14]}>
            {/* Awning */}
            <mesh castShadow position={[0, 3.4, 0.5]} rotation={[-0.38, 0, 0]}>
              <boxGeometry args={[signW, 0.1, 1.3]} />
              <meshStandardMaterial color="#aa2222" roughness={0.7} />
            </mesh>
            {/* Storefront glass */}
            <mesh position={[0, 1.35, 0]}>
              <boxGeometry args={[signW, 2.3, 0.09]} />
              <meshStandardMaterial color="#88ccee" transparent opacity={0.32} metalness={0.5} roughness={0.1} />
            </mesh>
            {/* Illuminated sign board */}
            <mesh position={[0, 3.9, 0.38]}>
              <planeGeometry args={[signW, 0.88]} />
              <meshStandardMaterial
                map={signTextures[i]}
                emissive="#ffcc33"
                emissiveMap={signTextures[i]}
                emissiveIntensity={0.55}
                roughness={0.5}
              />
            </mesh>
            <pointLight position={[0, 3.8, 1.0]} color="#ffcc33" intensity={5} distance={11} decay={2} />
          </group>
        );
      })}

      {/* ── Dedicated store kiosks (Weapon Store / Car Dealership / Hospital / Police) ── */}
      {STORE_MARKERS.map((m, i) => (
        <group key={`store-${i}`} position={[m.x, 0, m.z]}>
          {/* Booth */}
          <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
            <boxGeometry args={[4.5, 3.2, 4.5]} />
            <meshStandardMaterial color={m.color} roughness={0.7} />
          </mesh>
          {/* Glass front */}
          <mesh position={[0, 1.3, 2.3]}>
            <boxGeometry args={[3.4, 2, 0.1]} />
            <meshStandardMaterial color="#88ccee" transparent opacity={0.35} metalness={0.5} />
          </mesh>
          {/* Illuminated sign */}
          <mesh position={[0, 3.6, 2.3]}>
            <planeGeometry args={[4, 0.9]} />
            <meshStandardMaterial
              map={storeSignTextures[i]}
              emissive={m.color}
              emissiveMap={storeSignTextures[i]}
              emissiveIntensity={0.6}
            />
          </mesh>
          <pointLight position={[0, 3.5, 3]} color={m.color} intensity={6} distance={14} decay={2} />
        </group>
      ))}

      {/* ── Road markings — E-W highway dashed centre line ───────────── */}
      {Array.from({ length: 50 }, (_, i) => (
        <mesh key={`cl-ew-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-604 + i * 21, 0.026, 0]}>
          <planeGeometry args={[9, 0.28]} />
          <meshBasicMaterial color="#eecc00" />
        </mesh>
      ))}
      {/* E-W highway solid white edge lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, 0.026, 17.6]}>
        <planeGeometry args={[1100, 0.28]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, 0.026, -17.6]}>
        <planeGeometry args={[1100, 0.28]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* N-S main road dashed centre line */}
      {Array.from({ length: 38 }, (_, i) => (
        <mesh key={`cl-ns-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, -300 + i * 22]}>
          <planeGeometry args={[0.28, 9]} />
          <meshBasicMaterial color="#eecc00" />
        </mesh>
      ))}

      {/* ── Speed bumps (minor roads only) ───────────────────────────── */}
      {/* Ali Mendjeli N-S road */}
      {([-55, 55] as number[]).map((z, i) => (
        <mesh key={`sb-am-${i}`} castShadow position={[-200, 0.14, z]}>
          <boxGeometry args={[40, 0.28, 1.8]} />
          <meshStandardMaterial color="#f0cc10" roughness={0.75} />
        </mesh>
      ))}
      {/* Secondary N-S road */}
      {([-42, 48] as number[]).map((z, i) => (
        <mesh key={`sb-sec-${i}`} castShadow position={[100, 0.14, z]}>
          <boxGeometry args={[40, 0.28, 1.8]} />
          <meshStandardMaterial color="#f0cc10" roughness={0.75} />
        </mesh>
      ))}

      {/* ── Traffic signs ────────────────────────────────────────────── */}
      {/* STOP signs at road intersections */}
      {([
        { x: -22, z: -30 }, { x:  22, z:  30 },
        { x: 122, z: -30 }, { x: -222, z: 30 },
      ] as { x: number; z: number }[]).map(({ x, z }, i) => (
        <group key={`stop-${i}`} position={[x, 0, z]}>
          {/* Post */}
          <mesh castShadow position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 4.0, 6]} />
            <meshStandardMaterial color="#888888" roughness={0.8} />
          </mesh>
          {/* Sign face — red octagon (approximated as rotated box) */}
          <mesh castShadow position={[0, 4.25, 0]} rotation={[0, Math.PI / 8, 0]}>
            <boxGeometry args={[0.76, 0.76, 0.08]} />
            <meshStandardMaterial color="#cc1111" roughness={0.7} />
          </mesh>
          {/* White border ring */}
          <mesh position={[0, 4.25, 0.04]} rotation={[0, Math.PI / 8, 0]}>
            <boxGeometry args={[0.82, 0.82, 0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
      {/* Speed-limit signs */}
      {([
        { x: -44, z: 27 }, { x: 44, z: -27 }, { x: 126, z: 28 },
      ] as { x: number; z: number }[]).map(({ x, z }, i) => (
        <group key={`spd-${i}`} position={[x, 0, z]}>
          <mesh castShadow position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3.6, 6]} />
            <meshStandardMaterial color="#888888" roughness={0.8} />
          </mesh>
          {/* White panel */}
          <mesh castShadow position={[0, 3.75, 0]}>
            <boxGeometry args={[0.70, 0.90, 0.08]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
          </mesh>
          {/* Red outer ring */}
          <mesh position={[0, 3.75, 0.045]}>
            <boxGeometry args={[0.74, 0.94, 0.02]} />
            <meshBasicMaterial color="#cc1111" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {/* ── Park (Centre-Ville north, between N-S roads) ──────────────── */}
      {/* Grass surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[50, 0.04, 150]}>
        <planeGeometry args={[56, 46]} />
        <meshStandardMaterial color="#2d5a1b" roughness={0.92} />
      </mesh>
      {/* E-W gravel path */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[50, 0.05, 150]}>
        <planeGeometry args={[56, 3.5]} />
        <meshStandardMaterial color="#5a5550" roughness={0.96} />
      </mesh>
      {/* N-S gravel path */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[50, 0.05, 150]}>
        <planeGeometry args={[3.5, 46]} />
        <meshStandardMaterial color="#5a5550" roughness={0.96} />
      </mesh>

      {/* Fountain basin */}
      <mesh castShadow receiveShadow position={[50, 0.9, 150]}>
        <cylinderGeometry args={[3.2, 3.6, 1.8, 16]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.7} />
      </mesh>
      {/* Fountain inner water */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[50, 1.82, 150]}>
        <circleGeometry args={[2.8, 16]} />
        <meshStandardMaterial color="#2288cc" transparent opacity={0.75} roughness={0.1} />
      </mesh>
      {/* Fountain spout column */}
      <mesh castShadow position={[50, 2.2, 150]}>
        <cylinderGeometry args={[0.22, 0.22, 2.4, 8]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.6} />
      </mesh>
      {/* Water sphere top */}
      <mesh position={[50, 3.5, 150]}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshStandardMaterial color="#55aadd" transparent opacity={0.78} roughness={0.1} />
      </mesh>
      <pointLight position={[50, 2.5, 150]} color="#88ddff" intensity={14} distance={20} decay={2} />

      {/* Trees */}
      {([
        [33, 134], [67, 134], [33, 166], [67, 166],
        [33, 150], [67, 150], [50, 134], [50, 166],
      ] as [number, number][]).map(([tx, tz], i) => (
        <group key={`ptree-${i}`} position={[tx, 0, tz]}>
          <mesh castShadow position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.28, 0.36, 4.0, 7]} />
            <meshStandardMaterial color="#5a3a1a" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 5.2, 0]}>
            <boxGeometry args={[3.6, 3.6, 3.6]} />
            <meshStandardMaterial color="#1e5e10" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Benches (4, around the fountain) */}
      {([
        [42, 150, 0], [58, 150, 0], [50, 143, Math.PI / 2], [50, 157, Math.PI / 2],
      ] as [number, number, number][]).map(([bx, bz, brot], i) => (
        <group key={`bench-${i}`} position={[bx, 0, bz]} rotation={[0, brot, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.72, 0]}>
            <boxGeometry args={[2.6, 0.14, 0.56]} />
            <meshStandardMaterial color="#7a5030" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 1.10, 0.22]}>
            <boxGeometry args={[2.6, 0.54, 0.10]} />
            <meshStandardMaterial color="#7a5030" roughness={0.9} />
          </mesh>
          <mesh position={[-1.0, 0.36, 0]}>
            <boxGeometry args={[0.10, 0.72, 0.52]} />
            <meshStandardMaterial color="#333333" roughness={0.8} />
          </mesh>
          <mesh position={[1.0, 0.36, 0]}>
            <boxGeometry args={[0.10, 0.72, 0.52]} />
            <meshStandardMaterial color="#333333" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Swing set */}
      <group position={[36, 0, 140]}>
        <mesh castShadow position={[-3.0, 2.5, 0]}>
          <boxGeometry args={[0.20, 5.0, 0.20]} />
          <meshStandardMaterial color="#cc8822" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[3.0, 2.5, 0]}>
          <boxGeometry args={[0.20, 5.0, 0.20]} />
          <meshStandardMaterial color="#cc8822" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 5.05, 0]}>
          <boxGeometry args={[6.2, 0.20, 0.20]} />
          <meshStandardMaterial color="#cc8822" roughness={0.7} />
        </mesh>
        {/* Swing 1 — chains + seat */}
        <mesh position={[-1.5, 2.7, 0]}>
          <boxGeometry args={[0.06, 4.6, 0.06]} />
          <meshStandardMaterial color="#555555" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-1.5, 0.48, 0]}>
          <boxGeometry args={[0.90, 0.12, 0.44]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
        {/* Swing 2 */}
        <mesh position={[1.5, 2.7, 0]}>
          <boxGeometry args={[0.06, 4.6, 0.06]} />
          <meshStandardMaterial color="#555555" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[1.5, 0.48, 0]}>
          <boxGeometry args={[0.90, 0.12, 0.44]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
      </group>

      {/* Slide */}
      <group position={[64, 0, 140]}>
        {/* Platform top */}
        <mesh castShadow receiveShadow position={[0, 3.05, -1.0]}>
          <boxGeometry args={[2.2, 0.18, 2.2]} />
          <meshStandardMaterial color="#cc3322" roughness={0.7} />
        </mesh>
        {/* Support legs */}
        <mesh castShadow position={[-0.85, 1.52, -1.0]}>
          <boxGeometry args={[0.16, 3.04, 0.16]} />
          <meshStandardMaterial color="#cc3322" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0.85, 1.52, -1.0]}>
          <boxGeometry args={[0.16, 3.04, 0.16]} />
          <meshStandardMaterial color="#cc3322" roughness={0.7} />
        </mesh>
        {/* Slide ramp */}
        <mesh castShadow position={[0, 1.55, 1.2]} rotation={[-0.52, 0, 0]}>
          <boxGeometry args={[1.80, 0.12, 4.4]} />
          <meshStandardMaterial color="#3388dd" roughness={0.35} />
        </mesh>
        {/* Steps */}
        {([0, 1, 2] as number[]).map((s) => (
          <mesh key={`step-${s}`} castShadow receiveShadow position={[0, 0.5 + s * 0.85, -2.6 + s * 0.55]}>
            <boxGeometry args={[1.8, 0.16, 0.52]} />
            <meshStandardMaterial color="#888888" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Park lamp posts (4) */}
      {([
        [35, 135], [65, 135], [35, 165], [65, 165],
      ] as [number, number][]).map(([lx, lz], i) => (
        <group key={`plamp-${i}`} position={[lx, 0, lz]}>
          <mesh castShadow position={[0, 3.0, 0]}>
            <cylinderGeometry args={[0.10, 0.10, 6.0, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[0, 6.2, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshBasicMaterial color="#ffe880" />
          </mesh>
          {/* Local position — group already places this at [lx, 0, lz] */}
          <pointLight position={[0, 5.8, 0]} color="#ffe880" intensity={8} distance={22} decay={2} />
        </group>
      ))}

      {/* ── District boundary markers ─────────────────────────────────── */}
      {[
        { x: -250, z: 0,   color: '#ff8c00' },
        { x:   50, z: 0,   color: '#ffd700' },
        { x:  320, z: 0,   color: '#dc143c' },
        { x: -500, z: 0,   color: '#808080' },
        { x: -300, z: 350, color: '#4169e1' },
      ].map((m, i) => (
        <mesh key={`marker-${i}`} position={[m.x, 0.1, m.z]}>
          <boxGeometry args={[3, 0.2, 3]} />
          <meshBasicMaterial color={m.color} />
        </mesh>
      ))}

      {/* ── Street lights ────────────────────────────────────────────── */}
      {streetLights.map((sl, i) => (
        <group key={`sl-${i}`} position={[sl.x, 0, sl.z]}>
          <mesh castShadow position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 7, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 7.2, 0]}>
            <boxGeometry args={[2, 0.2, 0.2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[1, 7, 0]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshBasicMaterial color="#ff9240" />
          </mesh>
          <pointLight position={[1, 6.5, 0]} color="#ff9240" intensity={10} distance={50} decay={2} />
        </group>
      ))}
    </group>
  );
}
