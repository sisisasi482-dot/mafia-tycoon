/**
 * Terrain — procedural ground features: grass patches, lakes, gardens.
 * The base ground plane lives in City.tsx; this layer adds natural detail on top.
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

// ─── Garden texture (slightly lighter, more flowers) ─────────────────────────
function makeGardenTexture(): THREE.CanvasTexture {
  const W = 128, H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a7030';
  ctx.fillRect(0, 0, W, H);
  const rng = makeRng(13);
  // Grass blades
  for (let i = 0; i < 600; i++) {
    const v = 50 + Math.floor(rng() * 40);
    ctx.fillStyle = `rgba(${Math.floor(v * 0.5)},${v},${Math.floor(v * 0.4)},0.55)`;
    ctx.fillRect(rng() * W, rng() * H, 1, 2 + rng() * 2);
  }
  // Flower dots
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

// ─── Grass patches ────────────────────────────────────────────────────────────
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
      {/* Shore ring — use circleGeometry + non-uniform scale for ellipse shape */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[rx + 2.5, rz + 2.5, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#243a30" roughness={0.9} />
      </mesh>
      {/* Water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} scale={[rx, rz, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial
          color="#1a6080"
          transparent opacity={0.82}
          roughness={0.05}
          metalness={0.35}
        />
      </mesh>
      {/* Subtle water shimmer light */}
      <pointLight position={[0, 2, 0]} color="#44bbdd" intensity={6} distance={rx * 2} decay={2} />
    </group>
  );
}

// ─── Gardens ─────────────────────────────────────────────────────────────────
const GARDENS = [
  // City A central garden
  { x: -280, z: -130, w: 50, d: 30 },
  // City B plaza garden
  { x:  280, z:  130, w: 50, d: 30 },
  // Mid-highway rest garden
  { x:    0, z:  120, w: 35, d: 25 },
];

function Garden({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const tex = useMemo(() => {
    const t = makeGardenTexture();
    t.repeat.set(w / 8, d / 8);
    t.needsUpdate = true;
    return t;
  }, [w, d]);
  useEffect(() => () => tex.dispose(), [tex]);

  // Scatter a few simple trees/shrubs
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
      {/* Grass surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tex} roughness={0.94} />
      </mesh>
      {/* Simple path cross */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, z]}>
        <planeGeometry args={[w, 1.5]} />
        <meshStandardMaterial color="#5a5548" roughness={0.96} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, z]}>
        <planeGeometry args={[1.5, d]} />
        <meshStandardMaterial color="#5a5548" roughness={0.96} />
      </mesh>
      {/* Shrubs */}
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

// ─── Public export ────────────────────────────────────────────────────────────
export function Terrain() {
  return (
    <group>
      {GRASS_PATCHES.map((p, i) => <GrassPatch key={`gp-${i}`} {...p} />)}
      {LAKES.map((l, i)        => <Lake        key={`lk-${i}`} {...l} />)}
      {GARDENS.map((g, i)      => <Garden      key={`gd-${i}`} {...g} />)}
    </group>
  );
}
