/**
 * CityA — older Algerian district (west, center ≈ −310, 0).
 *
 * Ground system:
 *   - Full dark-asphalt base covering the entire district footprint
 *   - Lighter concrete sidewalk strips at the building-zone / boulevard boundary
 *   - Road markings: yellow centre-line dashes + white edge lines on the boulevard
 *   - Building-zone ground: slightly different dark concrete tone
 *
 * GLB buildings from /glb/ (building-o…t) and /glb2/ low-detail fill.
 * Wrapped in React.Suspense by the caller.
 */
import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_A_BUILDINGS } from './cityLayout';
import type { GLBPlacement } from './cityLayout';

// ─── URL helper ───────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;
function glbUrl(set: string, model: string): string {
  return `${BASE}${set}/${model}.glb`;
}

// ─── Preload ──────────────────────────────────────────────────────────────────
const CITY_A_UNIQUE = Array.from(new Set(CITY_A_BUILDINGS.map((b) => glbUrl(b.set, b.model))));
CITY_A_UNIQUE.forEach((url) => useGLTF.preload(url));

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

// ─── City A ambient lights ─────────────────────────────────────────────────────
function CityALights() {
  return (
    <>
      {/* Warm sodium-vapour street glow */}
      <pointLight position={[-280, 18, 0]}   color="#ffaa44" intensity={80}  distance={200} decay={2} />
      <pointLight position={[-340, 14, 60]}  color="#ff9933" intensity={50}  distance={140} decay={2} />
      <pointLight position={[-230, 12, -60]} color="#ffbb55" intensity={40}  distance={120} decay={2} />
      {/* Additional fill for deeper district */}
      <pointLight position={[-400, 12, 55]}  color="#ffaa44" intensity={40}  distance={130} decay={2} />
      <pointLight position={[-200, 12, -55]} color="#ffbb55" intensity={35}  distance={110} decay={2} />
    </>
  );
}

// ─── City A ground — realistic asphalt + concrete sidewalks ───────────────────
//
//  World layout for City A:
//    x: −435 → −185   (centre −310)
//    z:  −115 → −35   south building band
//    z:   −35 →   35  boulevard / clear lane
//    z:    35 →  115  north building band
//
function CityAGround() {
  const W = 265;   // full city width (east-west)
  const cx = -310; // city centre x

  return (
    <>
      {/* ── 1. Base asphalt — full district footprint ─────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, 0]}>
        <planeGeometry args={[W, 240]} />
        <meshStandardMaterial color="#1c1c1f" roughness={0.97} metalness={0.01} />
      </mesh>

      {/* ── 2. Boulevard lane (z: −35 → 35) — slightly lighter asphalt ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, 0]}>
        <planeGeometry args={[W, 68]} />
        <meshStandardMaterial color="#222227" roughness={0.94} />
      </mesh>

      {/* ── 3. South sidewalk strip (edge z ≈ −35, concrete) ─────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, -38]}>
        <planeGeometry args={[W, 8]} />
        <meshStandardMaterial color="#434343" roughness={0.90} />
      </mesh>

      {/* ── 4. North sidewalk strip (edge z ≈ +35, concrete) ─────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, 38]}>
        <planeGeometry args={[W, 8]} />
        <meshStandardMaterial color="#434343" roughness={0.90} />
      </mesh>

      {/* ── 5. South building-zone ground (dark concrete, slightly different) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, -77]}>
        <planeGeometry args={[W, 76]} />
        <meshStandardMaterial color="#191919" roughness={0.98} />
      </mesh>

      {/* ── 6. North building-zone ground ─────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, 77]}>
        <planeGeometry args={[W, 76]} />
        <meshStandardMaterial color="#191919" roughness={0.98} />
      </mesh>

      {/* ── 7. Kerb/curb edge lines — north and south of boulevard ──────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.035, -34]}>
        <planeGeometry args={[W, 0.5]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.035, 34]}>
        <planeGeometry args={[W, 0.5]} />
        <meshBasicMaterial color="#888888" />
      </mesh>

      {/* ── 8. Yellow centre-line dashes along boulevard ────────────────── */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={`yd-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-424 + i * 18, 0.04, 0]}
        >
          <planeGeometry args={[8, 0.32]} />
          <meshBasicMaterial color="#d4b800" />
        </mesh>
      ))}

      {/* ── 9. Cross-street intersections — thin bright bands in x direction */}
      {[-405, -345, -285, -225].map((xCross, i) => (
        <mesh
          key={`cs-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[xCross, 0.025, 0]}
        >
          <planeGeometry args={[2, 68]} />
          <meshStandardMaterial color="#28282e" roughness={0.92} />
        </mesh>
      ))}

      {/* ── 10. Narrow green planter strips flanking the building zones ─── */}
      {/* South green border */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, -43]}>
        <planeGeometry args={[W, 5]} />
        <meshStandardMaterial color="#1e3018" roughness={0.97} />
      </mesh>
      {/* North green border */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, 43]}>
        <planeGeometry args={[W, 5]} />
        <meshStandardMaterial color="#1e3018" roughness={0.97} />
      </mesh>
    </>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export function CityA() {
  return (
    <Suspense fallback={null}>
      <CityAGround />
      <CityALights />
      {CITY_A_BUILDINGS.map((p, i) => (
        <GLBInstance key={`ca-${i}`} placement={p} />
      ))}
    </Suspense>
  );
}
