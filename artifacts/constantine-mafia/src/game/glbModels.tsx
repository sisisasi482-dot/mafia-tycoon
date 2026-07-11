/**
 * glbModels.tsx — shared helper for dropping Kenney-style GLB models into the
 * scene at an arbitrary target footprint, replacing hand-built primitive
 * meshes (NPCs, vehicles, furniture) with real models from /glb4 (people),
 * /glb5 (vehicles), and /glb6 (furniture) — see Task 2 of the Open World
 * overhaul spec.
 *
 * FittedGLB loads a GLB once (drei's useGLTF caches by URL), clones it per
 * instance, and uniformly scales + recenters it so it fits inside a caller
 * supplied [w, h, d] bounding box — this lets a model dropped from a totally
 * different source (varying native scale/pivot) slot into the exact spot a
 * hand-built primitive used to occupy, with zero per-model tuning.
 */
import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BASE = import.meta.env.BASE_URL;

export function glbUrl(set: string, model: string): string {
  return `${BASE}${set}/${model}.glb`;
}

// Bounding boxes are per-URL constants — cache across all instances so every
// clone of "sedan.glb" (say) doesn't recompute Box3.setFromObject.
const bboxCache = new Map<string, THREE.Box3>();

interface FittedGLBProps {
  /** Asset folder, e.g. "glb4" | "glb5" | "glb6". */
  set: string;
  /** File name without extension. */
  model: string;
  /** Target bounding box [width, height, depth] this model should fill. */
  targetSize: [number, number, number];
  /** If true (default), the model's lowest point sits at local y=0 (ground-anchored). Otherwise it's vertically centered. */
  anchorBottom?: boolean;
  /** Extra rotation (radians) applied to the model itself, independent of the wrapping group — use to fix a model's native forward axis. */
  rotationY?: number;
}

export function FittedGLB({ set, model, targetSize, anchorBottom = true, rotationY = 0 }: FittedGLBProps) {
  const url = glbUrl(set, model);
  const { scene } = useGLTF(url);

  const { cloned, scale, offset } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    let box = bboxCache.get(url);
    if (!box) {
      box = new THREE.Box3().setFromObject(c);
      bboxCache.set(url, box);
    }

    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const sx = size.x > 1e-4 ? targetSize[0] / size.x : 1;
    const sy = size.y > 1e-4 ? targetSize[1] / size.y : 1;
    const sz = size.z > 1e-4 ? targetSize[2] / size.z : 1;
    // Uniform scale (min of the three) keeps proportions correct instead of
    // stretching/squashing a model that doesn't exactly match the old box.
    const uniform = Math.min(sx, sy, sz) || 1;

    const off: [number, number, number] = [
      -center.x,
      anchorBottom ? -box.min.y : -center.y,
      -center.z,
    ];

    return { cloned: c, scale: uniform, offset: off };
  }, [scene, url, targetSize[0], targetSize[1], targetSize[2], anchorBottom]);

  return (
    <group scale={scale} rotation={[0, rotationY, 0]}>
      <primitive object={cloned} position={offset} />
    </group>
  );
}
