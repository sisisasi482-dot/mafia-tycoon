import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { generateBuildingTextures, disposeBuildingTextures } from './buildingTextures';

/** Seeded pseudo-random — same output every render */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = Math.sin(s) * 43758.5453123;
    return s - Math.floor(s);
  };
}

type Building = {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  /** Base tint — set to '#ffffff' when a texture map is used so it doesn't darken the canvas texture */
  color: string;
  emissive: string;
  emissiveIntensity: number;
  /** Key into the texture pool; null = no texture (landmarks, bridge, etc.) */
  texKey: string | null;
  /** Which variant (0-3) from the district texture pool */
  texIdx: number;
};

export function City() {
  // ── Texture pool (one CanvasTexture per district × 4 colour variants) ──────
  const texPool = useMemo(() => generateBuildingTextures(), []);
  useEffect(() => () => disposeBuildingTextures(texPool), [texPool]);

  // ── Building geometry data ──────────────────────────────────────────────────
  const buildings = useMemo(() => {
    const rng = makeRng(42);
    const list: Building[] = [];

    // ── Ali Mendjeli – Soviet brutalist housing blocks ──────────────────────
    for (let i = 0; i < 80; i++) {
      const x = -195 + rng() * 140;
      const z = -95 + rng() * 190;
      const h = 10 + rng() * 20;
      const lit = rng() > 0.35;
      list.push({
        x, y: h / 2, z,
        w: 14 + rng() * 8, h, d: 14 + rng() * 8,
        color: '#ffffff',
        emissive: '#ffb347',
        emissiveIntensity: lit ? 0.04 + rng() * 0.03 : 0,
        texKey: 'ali_mendjeli',
        texIdx: Math.floor(rng() * 4),
      });
    }

    // ── Centre-Ville – French colonial, taller blocks ────────────────────────
    for (let i = 0; i < 90; i++) {
      const x = -45 + rng() * 140;
      const z = -95 + rng() * 190;
      const h = 12 + rng() * 22;
      const lit = rng() > 0.3;
      list.push({
        x, y: h / 2, z,
        w: 7 + rng() * 7, h, d: 7 + rng() * 7,
        color: '#ffffff',
        emissive: '#ffe070',
        emissiveIntensity: lit ? 0.05 + rng() * 0.03 : 0,
        texKey: 'centre_ville',
        texIdx: Math.floor(rng() * 4),
      });
    }

    // ── Old City – Dense medina, low-rise earthy ─────────────────────────────
    for (let i = 0; i < 110; i++) {
      const x = 105 + rng() * 140;
      const z = -45 + rng() * 90;
      if (x > 138 && x < 182) continue; // gorge gap
      const h = 4 + rng() * 10;
      const lit = rng() > 0.5;
      list.push({
        x, y: h / 2, z,
        w: 4 + rng() * 6, h, d: 4 + rng() * 6,
        color: '#ffffff',
        emissive: '#ff8c42',
        emissiveIntensity: lit ? 0.03 + rng() * 0.02 : 0,
        texKey: 'old_city',
        texIdx: Math.floor(rng() * 4),
      });
    }

    // ── Ain M'lila – Industrial outskirts west ───────────────────────────────
    for (let i = 0; i < 50; i++) {
      const x = -295 + rng() * 90;
      const z = -95 + rng() * 190;
      const h = 6 + rng() * 14;
      const isFactory = rng() > 0.6;
      list.push({
        x, y: h / 2, z,
        w: isFactory ? 20 + rng() * 15 : 8 + rng() * 8,
        h,
        d: isFactory ? 15 + rng() * 10 : 8 + rng() * 8,
        color: '#ffffff',
        emissive: '#ff4400',
        emissiveIntensity: rng() > 0.6 ? 0.03 : 0,
        texKey: 'ain_mlila',
        texIdx: Math.floor(rng() * 4),
      });
    }

    // ── Airport – Runways + terminal north of Ali Mendjeli ───────────────────
    list.push({ x: -150, y: 5,  z: 155, w: 80, h: 10, d: 30, color: '#d0d8e0', emissive: '#a0d0ff', emissiveIntensity: 0.3,  texKey: null, texIdx: 0 });
    list.push({ x: -150, y: 8,  z: 140, w: 30, h: 16, d: 20, color: '#c0c8d0', emissive: '#80b0ff', emissiveIntensity: 0.4,  texKey: null, texIdx: 0 });
    list.push({ x: -110, y: 15, z: 160, w: 6,  h: 30, d: 6,  color: '#888888', emissive: '#00ffff', emissiveIntensity: 0.5,  texKey: null, texIdx: 0 });
    list.push({ x: -110, y: 32, z: 160, w: 10, h: 4,  d: 10, color: '#aaaaaa', emissive: '#00ffff', emissiveIntensity: 0.6,  texKey: null, texIdx: 0 });
    for (let i = 0; i < 4; i++) {
      list.push({ x: -190 + i * 25, y: 7, z: 175, w: 20, h: 14, d: 35, color: '#606870', emissive: '#ffffff', emissiveIntensity: 0.1, texKey: null, texIdx: 0 });
    }

    // Bridge pylons
    list.push({ x: 145, y: 20, z: 0, w: 5, h: 50, d: 7, color: '#444444', emissive: '#ffffff', emissiveIntensity: 0.05, texKey: null, texIdx: 0 });
    list.push({ x: 175, y: 20, z: 0, w: 5, h: 50, d: 7, color: '#444444', emissive: '#ffffff', emissiveIntensity: 0.05, texKey: null, texIdx: 0 });

    return list;
  }, []);

  const streetLights = useMemo(() => {
    const lights: { x: number; z: number }[] = [];
    for (let x = -290; x < 240; x += 25) {
      lights.push({ x, z: -12 });
      lights.push({ x, z: 12 });
    }
    for (let z = -90; z < 90; z += 25) {
      lights.push({ x: 0, z });
      lights.push({ x: 50, z });
    }
    return lights;
  }, []);

  const roads = useMemo(() => {
    const r: { x: number; y: number; z: number; w: number; d: number }[] = [];
    r.push({ x: -30,  y: 0.02, z: 0,   w: 560, d: 24  });
    r.push({ x: 0,    y: 0.02, z: 50,  w: 24,  d: 400 });
    r.push({ x: 50,   y: 0.02, z: 0,   w: 24,  d: 200 });
    r.push({ x: -150, y: 0.02, z: 120, w: 24,  d: 240 });
    r.push({ x: -230, y: 0.02, z: 0,   w: 24,  d: 200 });
    return r;
  }, []);

  const districtMarkers = [
    { x: -125, z: 0,   label: 'Ali Mendjeli', color: '#ff8c00' },
    { x:   25, z: 0,   label: 'Centre-Ville', color: '#ffd700' },
    { x:  160, z: 0,   label: 'Old City',     color: '#dc143c' },
    { x: -250, z: 0,   label: "Ain M'lila",   color: '#808080' },
    { x: -150, z: 175, label: 'Airport',       color: '#4169e1' },
  ];

  return (
    <group>
      {/* ── Ground ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#1e1e22" roughness={0.95} />
      </mesh>

      {/* ── Roads ── */}
      {roads.map((r, i) => (
        <mesh key={`road-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[r.x, r.y, r.z]}>
          <planeGeometry args={[r.w, r.d]} />
          <meshStandardMaterial color="#111118" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Runway ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-150, 0.03, 200]}>
        <planeGeometry args={[30, 300]} />
        <meshStandardMaterial color="#0a0a10" roughness={0.8} />
      </mesh>

      {/* ── Gorge ── */}
      <mesh position={[160, -10, 0]}>
        <boxGeometry args={[44, 22, 200]} />
        <meshStandardMaterial color="#050508" />
      </mesh>

      {/* ── Sidi M'Cid Bridge deck ── */}
      <mesh castShadow receiveShadow position={[160, 5.5, 0]}>
        <boxGeometry args={[44, 1.2, 9]} />
        <meshStandardMaterial color="#555555" roughness={0.7} />
      </mesh>
      {[-12, -6, 0, 6, 12].map((zOff, i) => (
        <mesh key={`cable-${i}`} position={[160, 15, zOff]}>
          <boxGeometry args={[44, 0.3, 0.3]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      ))}

      {/* ── Buildings ── */}
      {buildings.map((b, i) => {
        const tex = b.texKey ? texPool[b.texKey]?.[b.texIdx] : undefined;
        return (
          <mesh key={`b-${i}`} castShadow receiveShadow position={[b.x, b.y, b.z]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={tex}
              color={b.color}
              emissive={b.emissive}
              emissiveIntensity={b.emissiveIntensity}
              roughness={0.82}
              metalness={0.0}
            />
          </mesh>
        );
      })}

      {/* ── District boundary markers (glowing thin walls) ── */}
      {districtMarkers.map((m, i) => (
        <mesh key={`marker-${i}`} position={[m.x, 0.1, m.z]}>
          <boxGeometry args={[2, 0.2, 2]} />
          <meshBasicMaterial color={m.color} />
        </mesh>
      ))}

      {/* ── Streetlights ── */}
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
          <pointLight position={[1, 6.5, 0]} color="#ff9240" intensity={8} distance={35} decay={2} />
        </group>
      ))}

      {/* ── Airport runway lights ── */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={`rl-${i}`} position={[-150, 0.05, 80 + i * 14]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}
