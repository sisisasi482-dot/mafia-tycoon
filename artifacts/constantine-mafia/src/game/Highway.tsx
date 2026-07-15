/**
 * Highway — GLB road tiles from /glb3/ connecting City A and City B.
 *
 * Ground system (added):
 *   - Wide asphalt base covering the full highway corridor + shoulders
 *   - Painted shoulder lanes on each side (z ≈ ±12)
 *   - Concrete kerb strips at the shoulder edge (z ≈ ±15)
 *   - Dirt/gravel shoulders beyond the kerb (z ≈ ±18)
 *
 * GLB tiles (unchanged):
 *   road-straight:      z = 0,  x: −160 → 160, step 16
 *   road-crossroad:     z = 0,  x ≈ ±176
 *   light-square-double: z ±14, every 48 units
 *   sign-highway:       decorative signs near each city entry
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

/**
 * The `glb3` (road kit) models ship without their `Textures/colormap.png`
 * atlas — the .glb files reference it, but the file was never included
 * under public/glb3/. Three's GLTFLoader silently fails the texture fetch
 * and falls back to the material's flat base color, which for this kit's
 * "colormap" material defaults to white — that's the literal cause of the
 * "white squares/holes" reported in the middle of the City A ↔ City B
 * highway (and on every other glb3 prop: lights, signs, barriers, the
 * bridge). Rather than guess at a substitute atlas image (risks visibly
 * wrong colours), every glb3 mesh gets a flat asphalt-grey material
 * instead of the broken white default — visually smooth, no artifacts.
 */
const MISSING_TEXTURE_SETS = new Set(['glb3']);
const FALLBACK_ROAD_COLOR = new THREE.Color('#4a4a4e');

// ─── Single GLB instance ──────────────────────────────────────────────────────
function GLBInstance({ placement }: { placement: GLBPlacement }) {
  const url = glbUrl(placement.set, placement.model);
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    const needsFallback = MISSING_TEXTURE_SETS.has(placement.set);
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow    = true;
        obj.receiveShadow = true;
        if (needsFallback) {
          const mesh = obj as THREE.Mesh;
          const applyFallback = (mat: THREE.Material): THREE.Material => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              // Clone first — `scene.clone(true)` clones objects/geometry but
              // shares material references with the cached useGLTF scene, so
              // mutating in place would affect every instance of this model.
              const clone = mat.clone();
              clone.map   = null;
              clone.color = FALLBACK_ROAD_COLOR.clone();
              return clone;
            }
            return mat;
          };
          if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(applyFallback);
          else if (mesh.material) mesh.material = applyFallback(mesh.material);
        }
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

// ─── Highway ground — wide asphalt base + shoulder lanes ─────────────────────
//
//  Road cross-section (z):
//    ±0  → ±8   main carriageway (covered by GLB tiles, scale 8 = 16 units wide)
//    ±8  → ±12  painted shoulder lane
//    ±12 → ±15  concrete kerb strip
//    ±15 → ±22  compacted gravel/dirt verge
//
function HighwayGround() {
  const L = 340; // highway ground length (x-axis), slightly wider than GLB span
  return (
    <>
      {/* ── 1. Main carriageway asphalt (covers GLB tile strip) ────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[L, 24]} />
        <meshStandardMaterial color="#1e1e22" roughness={0.97} metalness={0.01} />
      </mesh>

      {/* ── 2. Shoulder lanes — painted asphalt, slightly rougher ───────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -11]}>
        <planeGeometry args={[L, 6]} />
        <meshStandardMaterial color="#252526" roughness={0.98} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 11]}>
        <planeGeometry args={[L, 6]} />
        <meshStandardMaterial color="#252526" roughness={0.98} />
      </mesh>

      {/* ── 3. Concrete kerb strips ─────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -14]}>
        <planeGeometry args={[L, 3]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.92} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]}>
        <planeGeometry args={[L, 3]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.92} />
      </mesh>

      {/* ── 4. Gravel/dirt verge ────────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -19]}>
        <planeGeometry args={[L, 10]} />
        <meshStandardMaterial color="#1a1814" roughness={0.99} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 19]}>
        <planeGeometry args={[L, 10]} />
        <meshStandardMaterial color="#1a1814" roughness={0.99} />
      </mesh>

      {/* ── 5. Shoulder edge white lines ────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -8.3]}>
        <planeGeometry args={[L, 0.28]} />
        <meshBasicMaterial color="#dddddd" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 8.3]}>
        <planeGeometry args={[L, 0.28]} />
        <meshBasicMaterial color="#dddddd" />
      </mesh>

      {/* ── 6. Shoulder edge outer white lines ───────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -12.5]}>
        <planeGeometry args={[L, 0.22]} />
        <meshBasicMaterial color="#bbbbbb" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 12.5]}>
        <planeGeometry args={[L, 0.22]} />
        <meshBasicMaterial color="#bbbbbb" />
      </mesh>
    </>
  );
}

// ─── Highway median strip (improved) ─────────────────────────────────────────
function HighwayMedianStrip() {
  return (
    <>
      {/* Yellow dashed centre line */}
      {Array.from({ length: 25 }, (_, i) => (
        <mesh
          key={`dash-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-192 + i * 16, 0.06, 0]}
        >
          <planeGeometry args={[7, 0.30]} />
          <meshBasicMaterial color="#e8cc00" />
        </mesh>
      ))}
      {/* Edge white lines (main carriageway boundaries) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, -7.8]}>
        <planeGeometry args={[400, 0.28]} />
        <meshBasicMaterial color="#cccccc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 7.8]}>
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
      <HighwayGround />
      <HighwayMedianStrip />
      {HIGHWAY_ROADS.map((p, i)       => <GLBInstance key={`hw-rd-${i}`}  placement={p} />)}
      {HIGHWAY_CROSSROADS.map((p, i)  => <GLBInstance key={`hw-cr-${i}`}  placement={p} />)}
      {HIGHWAY_LIGHTS.map((p, i)      => <GLBInstance key={`hw-lt-${i}`}  placement={p} />)}
      {HIGHWAY_SIGNS.map((p, i)       => <GLBInstance key={`hw-sg-${i}`}  placement={p} />)}
      {HIGHWAY_DETAILS.map((p, i)     => <GLBInstance key={`hw-dt-${i}`}  placement={p} />)}
    </Suspense>
  );
}
