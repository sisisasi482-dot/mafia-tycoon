/**
 * Highway — GLB road tiles from /glb3/ connecting City A and City B.
 *
 * Layout:
 *   road-straight tiles: z = 0,  x: −160 → 160, step 16, rotated E-W
 *   road-crossroad:      z = 0,  x ≈ ±176  (city entry points)
 *   light-square-double: z ±14, every 48 units
 *   sign-highway:        decorative signs near each city entry
 *   construction detail: near City B entrance
 *
 * Wrapped in React.Suspense by the caller.
 */
import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  HIGHWAY_ROADS,
  HIGHWAY_CROSSROADS,
  HIGHWAY_LIGHTS,
  HIGHWAY_SIGNS,
  HIGHWAY_DETAILS,
} from './cityLayout';
import type { GLBPlacement } from './cityLayout';

// ─── URL helper ───────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;
function glbUrl(set: string, model: string): string {
  return `${BASE}${set}/${model}.glb`;
}

// ─── Preload all highway models ───────────────────────────────────────────────
const ALL_HW_PLACEMENTS = [
  ...HIGHWAY_ROADS,
  ...HIGHWAY_CROSSROADS,
  ...HIGHWAY_LIGHTS,
  ...HIGHWAY_SIGNS,
  ...HIGHWAY_DETAILS,
];
Array.from(new Set(ALL_HW_PLACEMENTS.map((p) => glbUrl(p.set, p.model)))).forEach(
  (url) => useGLTF.preload(url),
);

// ─── Single GLB instance ──────────────────────────────────────────────────────
function GLBInstance({ placement }: { placement: GLBPlacement }) {
  const url = glbUrl(placement.set, placement.model);
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow    = true;
        obj.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={[placement.x, 0, placement.z]}
      rotation={[0, placement.rotY ?? 0, 0]}
      scale={placement.scale}
    />
  );
}

// ─── Highway median lights (procedural — no GLB needed) ───────────────────────
function HighwayMedianStrip() {
  // Yellow dashed centre line
  return (
    <>
      {Array.from({ length: 25 }, (_, i) => (
        <mesh
          key={`dash-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-192 + i * 16, 0.06, 0]}
        >
          <planeGeometry args={[7, 0.3]} />
          <meshBasicMaterial color="#e8cc00" />
        </mesh>
      ))}
      {/* Edge white lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, -8]}>
        <planeGeometry args={[400, 0.28]} />
        <meshBasicMaterial color="#cccccc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 8]}>
        <planeGeometry args={[400, 0.28]} />
        <meshBasicMaterial color="#cccccc" />
      </mesh>
    </>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export function Highway() {
  return (
    <Suspense fallback={null}>
      <HighwayMedianStrip />
      {HIGHWAY_ROADS.map((p, i)       => <GLBInstance key={`hw-rd-${i}`}  placement={p} />)}
      {HIGHWAY_CROSSROADS.map((p, i)  => <GLBInstance key={`hw-cr-${i}`}  placement={p} />)}
      {HIGHWAY_LIGHTS.map((p, i)      => <GLBInstance key={`hw-lt-${i}`}  placement={p} />)}
      {HIGHWAY_SIGNS.map((p, i)       => <GLBInstance key={`hw-sg-${i}`}  placement={p} />)}
      {HIGHWAY_DETAILS.map((p, i)     => <GLBInstance key={`hw-dt-${i}`}  placement={p} />)}
    </Suspense>
  );
}
