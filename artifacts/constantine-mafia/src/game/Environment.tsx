/**
 * Environment — trees, grass parks, park benches, and billboard advertisements.
 * All textures are canvas-generated and memoised / disposed correctly.
 */
import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

// ─── Seeded RNG (no Math.random in render paths) ─────────────────────────────

function makeRng(seed: number) {
  let s = seed;
  return () => { s = Math.sin(s) * 43758.5453123; return s - Math.floor(s); };
}

// ─── Billboard texture ────────────────────────────────────────────────────────

function makeBillboardTexture(lines: string[], accent: string): THREE.CanvasTexture {
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a14');
  grad.addColorStop(1, '#1a1a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Coloured border
  ctx.strokeStyle = accent;
  ctx.lineWidth   = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Text lines
  ctx.fillStyle    = accent;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    const isMain = i === 0;
    ctx.font      = isMain ? 'bold 56px sans-serif' : '32px sans-serif';
    ctx.fillStyle = isMain ? accent : '#cccccc';
    ctx.fillText(line, W / 2, H / 2 + (i - (lines.length - 1) / 2) * 64);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Billboard definitions ────────────────────────────────────────────────────

const BILLBOARD_ADS: { lines: string[]; accent: string }[] = [
  { lines: ['BMW 5 SERIES',    'DRIVE THE FUTURE'],         accent: '#ffd700' },
  { lines: ['VISIT THE MEDINA','OLD CITY MARKET'],           accent: '#ff8c42' },
  { lines: ['RADIO CONSTANTINE','104.5 FM'],                 accent: '#42c8ff' },
  { lines: ["SIDI M'CID BRIDGE",'CITY OF BRIDGES'],          accent: '#e0e0e0' },
  { lines: ['ALI MENDJELI',    'NEW CITY · NEW DEALS'],      accent: '#ff5566' },
  { lines: ['PHARMACIE CENTRALE','SANTÉ ET BIEN-ÊTRE'],      accent: '#44ff99' },
];

const BILLBOARD_SPOTS: { x: number; z: number; rotY: number }[] = [
  { x:  -55, z:  65,   rotY: 0 },
  { x:  -55, z:  -65,  rotY: Math.PI },
  { x:  105, z:   55,  rotY: Math.PI / 2 },
  { x: -195, z:   65,  rotY: 0 },
  { x:  150, z: -145,  rotY: Math.PI / 4 },
  { x: -300, z:  195,  rotY: Math.PI / 2 },
];

// ─── Billboard component ──────────────────────────────────────────────────────

function Billboard({ spot, ad }: {
  spot: typeof BILLBOARD_SPOTS[number];
  ad:   typeof BILLBOARD_ADS[number];
}) {
  const tex = useMemo(() => makeBillboardTexture(ad.lines, ad.accent), [ad]);
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.rotY, 0]}>
      {/* Support poles */}
      {([-3.5, 3.5] as number[]).map((x, i) => (
        <mesh key={i} castShadow position={[x, 4, 0]}>
          <cylinderGeometry args={[0.25, 0.28, 8, 8]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
      ))}
      {/* Panel */}
      <mesh castShadow position={[0, 9.2, 0]}>
        <boxGeometry args={[9, 4.5, 0.22]} />
        <meshStandardMaterial
          map={tex}
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.45}
          roughness={0.6}
        />
      </mesh>
      {/* Uplighter */}
      <pointLight position={[0, 7, 1.5]} color="#ffffff" intensity={4} distance={16} decay={2} />
    </group>
  );
}

// ─── Grass texture ────────────────────────────────────────────────────────────

function makeGrassTexture(): THREE.CanvasTexture {
  const W = 128, H = 128;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a6b2e';
  ctx.fillRect(0, 0, W, H);
  // Blade-like specks
  const rng = makeRng(42);
  for (let i = 0; i < 900; i++) {
    const v = 50 + Math.floor(rng() * 45);
    ctx.fillStyle = `rgba(${Math.floor(v * 0.5)},${v},${Math.floor(v * 0.4)},0.55)`;
    ctx.fillRect(rng() * W, rng() * H, 1, 2 + rng() * 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Park definitions ─────────────────────────────────────────────────────────

const PARKS = [
  { x:    0, z:   0,   w: 48, d: 48 },
  { x: -200, z: 105,   w: 65, d: 55 },
  { x:  150, z: -148,  w: 68, d: 65 },
  { x:  -60, z: 148,   w: 48, d: 42 },
];

// ─── Park grass ───────────────────────────────────────────────────────────────

function ParkGrass({ p }: { p: typeof PARKS[number] }) {
  const tex = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(p.w / 8, p.d / 8);
    t.needsUpdate = true;
    return t;
  }, [p]);
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.028, p.z]}>
      <planeGeometry args={[p.w, p.d]} />
      <meshStandardMaterial map={tex} roughness={0.96} />
    </mesh>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────

interface TreeSpot { x: number; z: number; scale: number }

function generateTrees(): TreeSpot[] {
  const rng = makeRng(777);
  const spots: TreeSpot[] = [];
  const zones = [
    { cx:    0, cz:    0, r: 38, count: 16 },
    { cx: -200, cz:  105, r: 48, count: 14 },
    { cx:  150, cz: -148, r: 46, count: 18 },
    { cx:  -60, cz:  148, r: 38, count: 12 },
    // roadside trees along E-W highway
    { cx:  -60, cz:   30, r: 580, count: 0 }, // unused, roadside handled below
  ];
  for (const z of zones) {
    for (let i = 0; i < z.count; i++) {
      const angle = rng() * Math.PI * 2;
      const r = rng() * z.r;
      spots.push({ x: z.cx + Math.cos(angle) * r, z: z.cz + Math.sin(angle) * r, scale: 0.82 + rng() * 0.62 });
    }
  }
  // Roadside trees along main E-W highway (both sides, sparse)
  for (let x = -560; x < 420; x += 55 + Math.floor(rng() * 30)) {
    spots.push({ x, z: -29 - rng() * 4, scale: 0.7 + rng() * 0.5 });
    spots.push({ x, z:  29 + rng() * 4, scale: 0.7 + rng() * 0.5 });
  }
  return spots;
}

const TREES = generateTrees();

function Tree({ spot }: { spot: TreeSpot }) {
  return (
    <group position={[spot.x, 0, spot.z]} scale={[spot.scale, spot.scale, spot.scale]}>
      {/* Trunk */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.19, 0.26, 2.5, 6]} />
        <meshStandardMaterial color="#5a4028" roughness={0.92} />
      </mesh>
      {/* Canopy */}
      <mesh castShadow position={[0, 3.1, 0]}>
        <sphereGeometry args={[1.45, 8, 8]} />
        <meshStandardMaterial color="#2d5a2a" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0.65, 3.5, 0.35]}>
        <sphereGeometry args={[0.92, 8, 8]} />
        <meshStandardMaterial color="#356a30" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[-0.5, 3.4, -0.4]}>
        <sphereGeometry args={[0.80, 8, 8]} />
        <meshStandardMaterial color="#2a5225" roughness={0.88} />
      </mesh>
    </group>
  );
}

// ─── Park bench ───────────────────────────────────────────────────────────────

function Bench({ x, z, rotY }: { x: number; z: number; rotY: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Seat */}
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[1.6, 0.08, 0.52]} />
        <meshStandardMaterial color="#6b4a2a" roughness={0.85} />
      </mesh>
      {/* Back rest */}
      <mesh castShadow position={[0, 0.72, -0.24]}>
        <boxGeometry args={[1.6, 0.5, 0.08]} />
        <meshStandardMaterial color="#6b4a2a" roughness={0.85} />
      </mesh>
      {/* Legs */}
      {([-0.65, 0.65] as number[]).map((lx, i) => (
        <mesh key={i} castShadow position={[lx, 0.22, 0]}>
          <boxGeometry args={[0.08, 0.44, 0.52]} />
          <meshStandardMaterial color="#333333" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function Environment() {
  return (
    <group>
      {/* Park grass tiles */}
      {PARKS.map((p, i) => <ParkGrass key={i} p={p} />)}

      {/* Trees */}
      {TREES.map((s, i) => <Tree key={i} spot={s} />)}

      {/* Billboards */}
      {BILLBOARD_SPOTS.map((spot, i) => (
        <Billboard key={i} spot={spot} ad={BILLBOARD_ADS[i % BILLBOARD_ADS.length]} />
      ))}

      {/* Park benches */}
      <Bench x={6}    z={9}    rotY={0} />
      <Bench x={-6}   z={-9}   rotY={Math.PI} />
      <Bench x={-198} z={100}  rotY={Math.PI / 2} />
      <Bench x={152}  z={-143} rotY={0} />
      <Bench x={-62}  z={145}  rotY={Math.PI / 2} />
    </group>
  );
}
