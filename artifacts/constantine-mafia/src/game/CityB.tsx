/**
 * CityB — modern downtown (east, center ≈ +310, 0).
 *
 * Ground system:
 *   - Full dark-asphalt base with subtle blue-grey tone (modern city)
 *   - Polished concrete sidewalk strips at building-zone / boulevard boundary
 *   - Road markings: yellow centre-line dashes + white edge lines
 *   - Building-zone ground: premium dark concrete
 *   - Narrow green planter strips separating sidewalk from buildings
 *
 * GLB buildings from /glb2/ (skyscrapers, standard buildings).
 * Wrapped in React.Suspense by the caller.
 */
import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_B_BUILDINGS } from './cityLayout';
import type { GLBPlacement } from './cityLayout';

// ─── URL helper ───────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;
function glbUrl(set: string, model: string): string {
  return `${BASE}${set}/${model}.glb`;
}

// ─── Preload ──────────────────────────────────────────────────────────────────
const CITY_B_UNIQUE = Array.from(new Set(CITY_B_BUILDINGS.map((b) => glbUrl(b.set, b.model))));
CITY_B_UNIQUE.forEach((url) => useGLTF.preload(url));

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

// ─── City B ambient lights ─────────────────────────────────────────────────────
function CityBLights() {
  return (
    <>
      {/* Cool blue-white corporate glow */}
      <pointLight position={[ 280, 30,  0]}   color="#aaddff" intensity={100} distance={220} decay={2} />
      <pointLight position={[ 330, 20,  60]}  color="#88ccff" intensity={60}  distance={150} decay={2} />
      <pointLight position={[ 240, 16, -60]}  color="#ccddff" intensity={50}  distance={130} decay={2} />
      {/* Skyscraper beacon */}
      <pointLight position={[ 280, 60, -18]}  color="#ffffff" intensity={20}  distance={80}  decay={2} />
      {/* Outer district fill */}
      <pointLight position={[ 400, 14,  55]}  color="#aaddff" intensity={40}  distance={120} decay={2} />
      <pointLight position={[ 200, 14, -55]}  color="#bbccff" intensity={35}  distance={110} decay={2} />
    </>
  );
}

// ─── City B ground — modern downtown asphalt + polished concrete sidewalks ───
//
//  World layout for City B:
//    x:  185 →  435   (centre 310)
//    z: −115 →  −35   south building band
//    z:  −35 →   35   boulevard / clear lane
//    z:   35 →  115   north building band
//
function CityBGround() {
  const W = 265;  // full city width (east-west)
  const cx = 310; // city centre x

  return (
    <>
      {/* ── 1. Base asphalt — modern blue-grey tone ─────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, 0]}>
        <planeGeometry args={[W, 240]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* ── 2. Central boulevard (z: −35 → 35) — lighter clean asphalt ─── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, 0]}>
        <planeGeometry args={[W, 68]} />
        <meshStandardMaterial color="#252530" roughness={0.93} />
      </mesh>

      {/* ── 3. South polished concrete sidewalk (z ≈ −38, lighter grey) ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, -38]}>
        <planeGeometry args={[W, 8]} />
        <meshStandardMaterial color="#4a4a52" roughness={0.86} metalness={0.04} />
      </mesh>

      {/* ── 4. North polished concrete sidewalk (z ≈ +38) ────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, 38]}>
        <planeGeometry args={[W, 8]} />
        <meshStandardMaterial color="#4a4a52" roughness={0.86} metalness={0.04} />
      </mesh>

      {/* ── 5. South building-zone ground (premium dark concrete) ────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, -77]}>
        <planeGeometry args={[W, 76]} />
        <meshStandardMaterial color="#1a1a20" roughness={0.97} />
      </mesh>

      {/* ── 6. North building-zone ground ────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, 77]}>
        <planeGeometry args={[W, 76]} />
        <meshStandardMaterial color="#1a1a20" roughness={0.97} />
      </mesh>

      {/* ── 7. White kerb lines — north and south of boulevard ───────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.036, -34]}>
        <planeGeometry args={[W, 0.55]} />
        <meshBasicMaterial color="#aaaacc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.036, 34]}>
        <planeGeometry args={[W, 0.55]} />
        <meshBasicMaterial color="#aaaacc" />
      </mesh>

      {/* ── 8. Yellow centre-line dashes ──────────────────────────────────── */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={`yd-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[192 + i * 18, 0.04, 0]}
        >
          <planeGeometry args={[8, 0.32]} />
          <meshBasicMaterial color="#d4b800" />
        </mesh>
      ))}

      {/* ── 9. Dual lane dividers (modern 3-lane boulevard) ──────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.038, -11]}>
        <planeGeometry args={[W, 0.22]} />
        <meshBasicMaterial color="#666688" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.038, 11]}>
        <planeGeometry args={[W, 0.22]} />
        <meshBasicMaterial color="#666688" />
      </mesh>

      {/* ── 10. Narrow green planter strips flanking building zones ────────── */}
      {/* South green strip */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, -43]}>
        <planeGeometry args={[W, 5]} />
        <meshStandardMaterial color="#182818" roughness={0.97} />
      </mesh>
      {/* North green strip */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.03, 43]}>
        <planeGeometry args={[W, 5]} />
        <meshStandardMaterial color="#182818" roughness={0.97} />
      </mesh>
    </>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
export function CityB() {
  return (
    <Suspense fallback={null}>
      <CityBGround />
      <CityBLights />
      {CITY_B_BUILDINGS.map((p, i) => (
        <GLBInstance key={`cb-${i}`} placement={p} />
      ))}
    </Suspense>
  );
}
