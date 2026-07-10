/**
 * CityA — older Algerian district (west, center ≈ −280,0).
 * Renders GLB buildings from /glb/ (building-o…t, chimneys) and some
 * /glb2/ low-detail fill using useGLTF + scene.clone() for instancing.
 *
 * Wrapped in React.Suspense by the caller so loading never blocks the frame.
 */
import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_A_BUILDINGS } from './cityLayout';
import type { GLBPlacement } from './cityLayout';

// ─── Resolve a GLB placement to a public URL ──────────────────────────────────
const BASE = import.meta.env.BASE_URL;
function glbUrl(set: string, model: string): string {
  return `${BASE}${set}/${model}.glb`;
}

// ─── Preload all unique models used by City A ─────────────────────────────────
const CITY_A_UNIQUE: string[] = Array.from(
  new Set(CITY_A_BUILDINGS.map((b) => glbUrl(b.set, b.model))),
);
CITY_A_UNIQUE.forEach((url) => useGLTF.preload(url));

// ─── Single GLB instance ──────────────────────────────────────────────────────
function GLBInstance({ placement }: { placement: GLBPlacement }) {
  const url = glbUrl(placement.set, placement.model);
  const { scene } = useGLTF(url);
  // Clone so multiple instances of the same mesh don't share transform state
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    // Enable shadows on every child mesh
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

// ─── City A ambient lights ────────────────────────────────────────────────────
function CityALights() {
  return (
    <>
      {/* Warm sodium-vapour street glow */}
      <pointLight position={[-280, 18, 0]}  color="#ffaa44" intensity={80}  distance={200} decay={2} />
      <pointLight position={[-340, 14, 60]} color="#ff9933" intensity={50}  distance={140} decay={2} />
      <pointLight position={[-230, 12, -60]} color="#ffbb55" intensity={40} distance={120} decay={2} />
    </>
  );
}

// ─── City A ground — slightly lighter than void to distinguish the district ───
function CityAGround() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-290, 0.01, 0]}>
      <planeGeometry args={[280, 220]} />
      <meshStandardMaterial color="#28282e" roughness={0.94} />
    </mesh>
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
