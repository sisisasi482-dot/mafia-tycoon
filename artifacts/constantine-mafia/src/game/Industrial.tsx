/**
 * Industrial — factory/warehouse clusters along the highway corridor.
 * Built from large-scaled warehouse hulls (glb2 low-detail-building-wide)
 * accented with smokestacks and storage tanks (glb chimneys / detail-tank).
 */
import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { INDUSTRIAL_PLACEMENTS } from './cityLayout';
import type { GLBPlacement } from './cityLayout';

const BASE = import.meta.env.BASE_URL;
function glbUrl(set: string, model: string): string {
  return `${BASE}${set}/${model}.glb`;
}

Array.from(new Set(INDUSTRIAL_PLACEMENTS.map((p) => glbUrl(p.set, p.model)))).forEach(
  (url) => useGLTF.preload(url),
);

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

function IndustrialLights() {
  return (
    <>
      <pointLight position={[-120, 20, 55]}  color="#ff8833" intensity={40} distance={90} decay={2} />
      <pointLight position={[ -60, 20, -60]} color="#ff8833" intensity={40} distance={90} decay={2} />
      <pointLight position={[  60, 20, 58]}  color="#ff8833" intensity={40} distance={90} decay={2} />
      <pointLight position={[ 120, 20, -55]} color="#ff8833" intensity={40} distance={90} decay={2} />
    </>
  );
}

export function Industrial() {
  return (
    <Suspense fallback={null}>
      <IndustrialLights />
      {INDUSTRIAL_PLACEMENTS.map((p, i) => (
        <GLBInstance key={`ind-${i}`} placement={p} />
      ))}
    </Suspense>
  );
}
