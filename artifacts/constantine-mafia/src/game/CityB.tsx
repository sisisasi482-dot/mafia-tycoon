/**
 * CityB — modern downtown (east, center ≈ +280,0).
 * Renders GLB buildings from /glb2/ (skyscrapers, standard, low-detail)
 * using useGLTF + scene.clone() for instancing.
 *
 * Wrapped in React.Suspense by the caller.
 */
import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_B_BUILDINGS } from './cityLayout';
import type { GLBPlacement } from './cityLayout';

// ─── Resolve a GLB placement to a public URL ──────────────────────────────────
const BASE = import.meta.env.BASE_URL;
function glbUrl(set: string, model: string): string {
  return `${BASE}${set}/${model}.glb`;
}

// ─── Preload all unique models used by City B ─────────────────────────────────
const CITY_B_UNIQUE: string[] = Array.from(
  new Set(CITY_B_BUILDINGS.map((b) => glbUrl(b.set, b.model))),
);
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

// ─── City B ambient lights ────────────────────────────────────────────────────
function CityBLights() {
  return (
    <>
      {/* Cool blue-white corporate glow */}
      <pointLight position={[ 280, 30, 0]}  color="#aaddff" intensity={100} distance={220} decay={2} />
      <pointLight position={[ 330, 20, 60]} color="#88ccff" intensity={60}  distance={150} decay={2} />
      <pointLight position={[ 240, 16, -60]} color="#ccddff" intensity={50} distance={130} decay={2} />
      {/* Skyscraper beacon */}
      <pointLight position={[ 280, 60, -18]} color="#ffffff" intensity={20} distance={80} decay={2} />
    </>
  );
}

// ─── City B ground ────────────────────────────────────────────────────────────
function CityBGround() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[310, 0.01, 0]}>
      <planeGeometry args={[280, 250]} />
      <meshStandardMaterial color="#252530" roughness={0.92} />
    </mesh>
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
