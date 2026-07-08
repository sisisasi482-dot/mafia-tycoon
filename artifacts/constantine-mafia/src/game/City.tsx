/**
 * City — renders the open-world city at 2× map scale.
 *
 * Buildings from shared BUILDINGS array (aligned with collision AABBs).
 * Roads use procedural canvas-based asphalt textures with lane markings.
 * Sidewalk strips (concrete) run alongside major roads.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from './buildings';
import { DOOR_TRIGGERS } from './interiors';
import { generateBuildingTextures, disposeBuildingTextures } from './buildingTextures';

// ─── Procedural road texture ──────────────────────────────────────────────────

function makeAsphaltTexture(): THREE.CanvasTexture {
  const W = 256, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, W, H);

  // Subtle grain
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const v = 20 + Math.floor(Math.random() * 18);
    ctx.fillStyle = `rgba(${v},${v},${v},0.45)`;
    ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
  }

  // Faint horizontal asphalt seam lines
  ctx.strokeStyle = 'rgba(60,60,60,0.35)';
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

      {/* ── Buildings ────────────────────────────────────────────────── */}
      {BUILDINGS.map((b, i) => {
        const tex = b.texKey ? texPool[b.texKey]?.[b.texIdx] : undefined;
        return (
          <mesh key={`b-${i}`} castShadow receiveShadow position={[b.x, b.h / 2, b.z]}>
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
