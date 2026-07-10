/**
 * Shared "Staged Loading" proximity-streaming hook.
 *
 * Used by every static world-prop system (buildings, trees, billboards/signs,
 * benches, houses, garages) so they all obey the same rules:
 *
 *  - Exactly one shared radius (30m) — objects farther than this are hidden.
 *  - The map is never loaded all at once. On mount, only objects within the
 *    radius of the *initial spawn point* are unlocked (mounted). Everything
 *    else stays un-mounted (no geometry/material created, zero GPU cost)
 *    until the player actually walks within range.
 *  - New objects stream in — get mounted for the first time — at a hard cap
 *    of STREAM_BATCH_SIZE per frame, so walking into a dense district never
 *    causes a multi-object mount spike / frame freeze.
 *  - Once an object has been mounted, it is NEVER unmounted/disposed again —
 *    leaving its radius only flips `object.visible = false` on the existing
 *    instance. This guarantees no black-screen / re-create flicker and no
 *    scene.add/remove churn, matching the "toggle only, never dispose" rule.
 */
import { useRef, useReducer } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

/** Single shared proximity radius for every streamed world-prop system. */
export const PROXIMITY_RADIUS = 30;
/** Re-scan distances every N frames (cheap; avoids per-frame O(n) every tick). */
export const SCAN_INTERVAL_FRAMES = 15;
/** Max mount/visibility mutations applied per frame — the anti-freeze cap. */
export const STREAM_BATCH_SIZE = 5;

interface QueueItem { i: number; show: boolean; }

export interface ProximityStream {
  /** True once index i has been mounted at least once (stream-in complete). */
  isUnlocked: (i: number) => boolean;
  /** Ref callback for index i's THREE.Object3D — wires visibility toggling. */
  refFor: (i: number) => (obj: THREE.Object3D | null) => void;
}

/**
 * @param count       total number of items in the pool (fixed for the pool's lifetime)
 * @param getItemXZ   returns the world (x, z) of item i — called only during scans
 * @param getPlayerXZ returns the player's current (x, z) — called only during scans
 * @param spawnXZ     initial spawn position, used to seed the very first unlocked set
 */
export function useProximityStream(
  count: number,
  getItemXZ: (i: number) => readonly [number, number],
  getPlayerXZ: () => readonly [number, number],
  spawnXZ: readonly [number, number],
): ProximityStream {
  const unlocked = useRef<Uint8Array | undefined>(undefined);
  const visible  = useRef<Uint8Array | undefined>(undefined);
  const objRefs  = useRef<(THREE.Object3D | null)[] | undefined>(undefined);
  const queue    = useRef<QueueItem[]>([]);
  const frameCount = useRef(0);
  const [, forceRerender] = useReducer((x: number) => x + 1, 0);

  if (!unlocked.current || unlocked.current.length !== count) {
    unlocked.current = new Uint8Array(count);
    visible.current  = new Uint8Array(count);
    objRefs.current   = new Array(count).fill(null);
    queue.current      = [];

    // Stage 1: seed with only what's within radius of the spawn point, so the
    // very first render already shows immediate surroundings without ever
    // having mounted the rest of the map.
    const r2 = PROXIMITY_RADIUS * PROXIMITY_RADIUS;
    const [sx, sz] = spawnXZ;
    for (let i = 0; i < count; i++) {
      const [x, z] = getItemXZ(i);
      const dx = x - sx, dz = z - sz;
      if (dx * dx + dz * dz <= r2) {
        unlocked.current[i] = 1;
        visible.current[i] = 1;
      }
    }
  }

  useFrame(() => {
    frameCount.current += 1;
    if (frameCount.current >= SCAN_INTERVAL_FRAMES) {
      frameCount.current = 0;
      const [px, pz] = getPlayerXZ();
      const r2 = PROXIMITY_RADIUS * PROXIMITY_RADIUS;
      for (let i = 0; i < count; i++) {
        const [x, z] = getItemXZ(i);
        const dx = x - px, dz = z - pz;
        const inRange = (dx * dx + dz * dz) <= r2;
        if (inRange && !visible.current![i]) {
          queue.current.push({ i, show: true });
        } else if (!inRange && visible.current![i]) {
          queue.current.push({ i, show: false });
        }
      }
    }

    if (queue.current.length === 0) return;

    const batch = queue.current.splice(0, STREAM_BATCH_SIZE);
    let mountedNew = false;
    for (const { i, show } of batch) {
      if (show) {
        visible.current![i] = 1;
        if (!unlocked.current![i]) {
          // First time this object has ever entered range — stream it in.
          // Setting the mask flags here and forcing one re-render mounts
          // the JSX; from then on this index is handled purely via the ref.
          unlocked.current![i] = 1;
          mountedNew = true;
        } else {
          const obj = objRefs.current![i];
          if (obj) obj.visible = true;
        }
      } else {
        visible.current![i] = 0;
        const obj = objRefs.current![i];
        if (obj) obj.visible = false;
      }
    }
    if (mountedNew) forceRerender();
  });

  return {
    isUnlocked: (i: number) => unlocked.current![i] === 1,
    refFor: (i: number) => (obj: THREE.Object3D | null) => {
      objRefs.current![i] = obj;
      if (obj) obj.visible = visible.current![i] === 1;
    },
  };
}
