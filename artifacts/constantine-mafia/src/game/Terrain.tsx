/**
 * Terrain — procedural ground features: grass patches, lakes, gardens,
 * park zones, and farmland.
 *
 * The base ground plane (dark asphalt/dirt, City.tsx) already excludes any
 * grass tone, and every feature below is placed strictly on vacant land —
 * never on the highway corridor (|z| < ~20 near z=0, |x| < 160), never on
 * the city block grid (|x| ≥ 185 within the north/south building bands),
 * and never overlapping the industrial clusters. Vegetation and farmland
 * live exclusively in the leftover voids: the highway shoulders, the gaps
 * between the highway and each city, and the open flanks north/south of
 * the whole corridor.
 */
import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed;
  return () => { s = Math.sin(s) * 43758.5453123; return s - Math.floor(s); };
}

// ─── Grass texture ────────────────────────────────────────────────────────────
function makeGrassTexture(): THREE.CanvasTexture {
  const W = 256, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2e5c24';
  ctx.fillRect(0, 0, W, H);
  const rng = makeRng(7);
  for (let i = 0; i < 1400; i++) {
    const v = 40 + Math.floor(rng() * 50);
    ctx.fillStyle = `rgba(${Math.floor(v * 0.45)},${v},${Math.floor(v * 0.38)},0.6)`;
    ctx.fillRect(rng() * W, rng() * H, 1, 2 + rng() * 3);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ─── Garden/park texture (slightly lighter, more flowers) ────────────────────
function makeGardenTexture(): THREE.CanvasTexture {
  const W = 128, H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a7030';
  ctx.fillRect(0, 0, W, H);
  const rng = makeRng(13);
  for (let i = 0; i < 600; i++) {
    const v = 50 + Math.floor(rng() * 40);
    ctx.fillStyle = `rgba(${Math.floor(v * 0.5)},${v},${Math.floor(v * 0.4)},0.55)`;
    ctx.fillRect(rng() * W, rng() * H, 1, 2 + rng() * 2);
  }
  const flowerColors = ['#ff6699', '#ffcc00', '#ff9933', '#cc66ff', '#ffffff'];
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = flowerColors[Math.floor(rng() * flowerColors.length)];
    ctx.beginPath();
    ctx.arc(rng() * W, rng() * H, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ─── Farmland texture (plowed crop rows) ──────────────────────────────────────
function makeFarmTexture(rowColor: string): THREE.CanvasTexture {
  const W = 128, H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#5a4526';
  ctx.fillRect(0, 0, W, H);
  // Crop rows
  ctx.fillStyle = rowColor;
  const rowW = 10;
  for (let x = 0; x < W; x += rowW) {
    ctx.fillRect(x, 0, rowW * 0.6, H);
  }
  // Speckle for texture
  const rng = makeRng(31);
  for (let i = 0; i < 500; i++) {
    const v = 30 + Math.floor(rng() * 30);
    ctx.fillStyle = `rgba(${v},${Math.floor(v * 0.8)},20,0.4)`;
    ctx.fillRect(rng() * W, rng() * H, 1, 1);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ─── Grass patches — vacant flanks only, never on roads/sidewalks ────────────
const GRASS_PATCHES = [
  { x:   0,   z:  160, w:  90, d: 60 },
  { x:   0,   z: -160, w:  90, d: 60 },
  { x:  80,   z:  140, w:  70, d: 50 },
  { x: -80,   z: -140, w:  70, d: 50 },
  { x: -140,  z:   80, w:  60, d: 80 },
  { x:  140,  z:  -80, w:  60, d: 80 },
  { x: -60,   z:  170, w:  80, d: 40 },
  { x:  60,   z: -170, w:  80, d: 40 },
];

function GrassPatch({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const tex = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(w / 12, d / 12);
    t.needsUpdate = true;
    return t;
  }, [w, d]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, z]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
}

// ─── Lakes ────────────────────────────────────────────────────────────────────
const LAKES = [
  { x: -80,  z:  160, rx: 28, rz: 18 },
  { x:  90,  z: -158, rx: 22, rz: 16 },
  { x:  30,  z:  175, rx: 18, rz: 14 },
];

function Lake({ x, z, rx, rz }: { x: number; z: number; rx: number; rz: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[rx + 2.5, rz + 2.5, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#243a30" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} scale={[rx, rz, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial
          color="#1a6080"
          transparent opacity={0.82}
          roughness={0.05}
          metalness={0.35}
        />
      </mesh>
      <pointLight position={[0, 2, 0]} color="#44bbdd" intensity={6} distance={rx * 2} decay={2} />
    </group>
  );
}

// ─── Tree (full canopy, taller than garden shrubs) ────────────────────────────
function Tree({ x, z, r }: { x: number; z: number; r: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, r * 1.1, 0]}>
        <cylinderGeometry args={[0.16, 0.24, r * 2.2, 6]} />
        <meshStandardMaterial color="#4a3020" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, r * 2.4, 0]}>
        <sphereGeometry args={[r * 1.3, 8, 8]} />
        <meshStandardMaterial color="#276b1c" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, r * 3.1, 0]}>
        <sphereGeometry args={[r * 0.9, 8, 8]} />
        <meshStandardMaterial color="#317f22" roughness={0.88} />
      </mesh>
    </group>
  );
}

// ─── Gardens — small plaza gardens in the city centres ────────────────────────
const GARDENS = [
  { x: -280, z: -130, w: 50, d: 30 },
  { x:  280, z:  130, w: 50, d: 30 },
  { x:    0, z:  104, w: 35, d: 25 },
];

function Garden({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const tex = useMemo(() => {
    const t = makeGardenTexture();
    t.repeat.set(w / 8, d / 8);
    t.needsUpdate = true;
    return t;
  }, [w, d]);
  useEffect(() => () => tex.dispose(), [tex]);

  const rng = makeRng(x + z);
  const shrubs: { sx: number; sz: number; r: number }[] = [];
  const count = Math.floor(w * d / 100);
  for (let i = 0; i < count; i++) {
    shrubs.push({
      sx: x - w / 2 + rng() * w,
      sz: z - d / 2 + rng() * d,
      r:  0.8 + rng() * 1.0,
    });
  }

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tex} roughness={0.94} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, z]}>
        <planeGeometry args={[w, 1.5]} />
        <meshStandardMaterial color="#5a5548" roughness={0.96} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, z]}>
        <planeGeometry args={[1.5, d]} />
        <meshStandardMaterial color="#5a5548" roughness={0.96} />
      </mesh>
      {shrubs.map((s, i) => (
        <group key={i} position={[s.sx, 0, s.sz]}>
          <mesh castShadow position={[0, s.r * 0.6, 0]}>
            <cylinderGeometry args={[0.12, 0.18, s.r * 1.2, 6]} />
            <meshStandardMaterial color="#4a3020" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, s.r * 1.4, 0]}>
            <sphereGeometry args={[s.r, 7, 7]} />
            <meshStandardMaterial color="#245c1a" roughness={0.88} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Park zones — the highway↔city gap strips ─────────────────────────────────
// Fill the void between the highway shoulder (|x| ≤ 160) and each city's edge
// (|x| ≥ 185) with a proper tree-lined park, split around z=0 so nothing
// overlaps the highway crossroad tile footprint.

interface ParkPlot { x: number; z: number; w: number; d: number; seed: number }

const PARK_PLOTS: ParkPlot[] = [
  { x: -172, z:  52, w: 22, d: 76, seed: 101 },
  { x: -172, z: -52, w: 22, d: 76, seed: 102 },
  { x:  172, z:  52, w: 22, d: 76, seed: 103 },
  { x:  172, z: -52, w: 22, d: 76, seed: 104 },
];

function ParkZone({ x, z, w, d, seed }: ParkPlot) {
  const tex = useMemo(() => {
    const t = makeGardenTexture();
    t.repeat.set(w / 8, d / 8);
    t.needsUpdate = true;
    return t;
  }, [w, d]);
  useEffect(() => () => tex.dispose(), [tex]);

  const rng = makeRng(seed);
  const trees: { tx: number; tz: number; r: number }[] = [];
  const treeCount = Math.floor((w * d) / 55);
  for (let i = 0; i < treeCount; i++) {
    trees.push({
      tx: x - w / 2 + 1.5 + rng() * (w - 3),
      tz: z - d / 2 + 1.5 + rng() * (d - 3),
      r:  0.9 + rng() * 0.7,
    });
  }

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tex} roughness={0.94} />
      </mesh>
      {/* Path down the centre of the park */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, z]}>
        <planeGeometry args={[Math.min(2.5, w * 0.3), d]} />
        <meshStandardMaterial color="#5a5548" roughness={0.96} />
      </mesh>
      {trees.map((t, i) => <Tree key={i} x={t.tx} z={t.tz} r={t.r} />)}
    </group>
  );
}

// ─── Farmland — large agricultural plots north/south of the highway ─────────
// Placed beyond the industrial clusters (|z| ≥ 75) and clear of the grass/
// lake belt further out (|z| ≥ 130), i.e. the wide open flanks that would
// otherwise be empty void.

interface FarmPlot { x: number; z: number; w: number; d: number; rowColor: string; rotated?: boolean }

const FARM_PLOTS: FarmPlot[] = [
  { x: -100, z:  90, w: 70, d: 28, rowColor: '#7a9a3a' },
  { x:   60, z:  90, w: 70, d: 28, rowColor: '#c2a63a', rotated: true },
  { x: -100, z: -90, w: 70, d: 28, rowColor: '#c2a63a', rotated: true },
  { x:   60, z: -90, w: 70, d: 28, rowColor: '#7a9a3a' },
];

function FarmField({ x, z, w, d, rowColor, rotated }: FarmPlot) {
  const tex = useMemo(() => {
    const t = makeFarmTexture(rowColor);
    t.repeat.set(rotated ? d / 6 : w / 6, rotated ? w / 6 : d / 6);
    t.rotation = rotated ? Math.PI / 2 : 0;
    t.center.set(0.5, 0.5);
    t.needsUpdate = true;
    return t;
  }, [w, d, rowColor, rotated]);
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tex} roughness={0.97} />
      </mesh>
      {/* Wooden fence posts around the perimeter */}
      {[-w / 2, w / 2].map((fx, i) => (
        <group key={`fx-${i}`}>
          {[-1, -0.5, 0, 0.5, 1].map((t2, j) => (
            <mesh key={j} castShadow position={[x + fx, 0.5, z + t2 * d]}>
              <boxGeometry args={[0.15, 1, 0.15]} />
              <meshStandardMaterial color="#3a2c18" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export function Terrain() {
  return (
    <group>
      {GRASS_PATCHES.map((p, i) => <GrassPatch key={`gp-${i}`} {...p} />)}
      {LAKES.map((l, i)        => <Lake        key={`lk-${i}`} {...l} />)}
      {GARDENS.map((g, i)      => <Garden      key={`gd-${i}`} {...g} />)}
      {PARK_PLOTS.map((p, i)   => <ParkZone    key={`pk-${i}`} {...p} />)}
      {FARM_PLOTS.map((f, i)   => <FarmField   key={`fm-${i}`} {...f} />)}
    </group>
  );
}
