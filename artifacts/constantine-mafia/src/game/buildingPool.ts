/**
 * Building object pool — shared activation state.
 *
 * All building meshes/colliders are created once at load time (see City.tsx)
 * and never added to or removed from the scene again. Proximity to the
 * player only toggles `mesh.visible` and this collider-enabled mask; the
 * mesh/collider objects themselves are pooled for the lifetime of the game.
 *
 * `activeMask[i]` corresponds 1:1 with `BUILDINGS[i]` / `BUILDING_AABBS[i]`.
 */
import * as THREE from 'three';
import { BUILDINGS } from './buildings';
import { saveGameSnapshot } from './useSaveSystem';

/** Strict proximity trigger: buildings only render/collide within this radius. */
export const BUILDING_ACTIVATION_RADIUS = 15;

/** Run the proximity scan once every N frames to save CPU. */
export const BUILDING_UPDATE_INTERVAL_FRAMES = 15;

/** Max number of buildings to toggle (visible/collider) in a single frame. */
export const BUILDING_TOGGLE_BATCH_SIZE = 5;

/** Memory Safety Monitor thresholds. */
export const VISIBLE_BUILDING_LIMIT = 70;
export const VISIBLE_BUILDING_SUSTAIN_MS = 5000;

/** 1 = visible/collidable, 0 = pooled (hidden, collider disabled). Starts all-inactive. */
export const activeMask: Uint8Array = new Uint8Array(BUILDINGS.length);

/**
 * Reset the shared mask to all-inactive. City calls this on mount (e.g. when
 * re-entering the outdoor scene after an interior) so the module-level
 * singleton can never carry stale "active" bits into a fresh set of mesh
 * refs, which start every mount at visible=false.
 */
export function resetActiveBuildings(): void {
  activeMask.fill(0);
  memoryMonitorState.overLimitSince = null;
}

/**
 * Recompute which buildings are within range of (px, pz) and update the
 * shared activeMask in place. Returns the list of indices whose active
 * state changed this pass, so callers can cheaply toggle only those meshes.
 */
export function updateActiveBuildings(px: number, pz: number): number[] {
  const changed: number[] = [];
  const r2 = BUILDING_ACTIVATION_RADIUS * BUILDING_ACTIVATION_RADIUS;
  for (let i = 0; i < BUILDINGS.length; i++) {
    const b = BUILDINGS[i];
    const dx = b.x - px;
    const dz = b.z - pz;
    const inRange = (dx * dx + dz * dz) <= r2 ? 1 : 0;
    if (activeMask[i] !== inRange) {
      activeMask[i] = inRange;
      changed.push(i);
    }
  }
  return changed;
}

/** Count how many buildings are currently active (visible + collidable). */
export function countActiveBuildings(): number {
  let count = 0;
  for (let i = 0; i < activeMask.length; i++) count += activeMask[i];
  return count;
}

/**
 * Count buildings whose mesh.visible is *actually* true right now — i.e.
 * the real on-screen state, not just activeMask intent. Because visibility
 * changes are deferred/batched (max BUILDING_TOGGLE_BATCH_SIZE per frame),
 * activeMask can briefly diverge from what's rendered; the Memory Safety
 * Monitor must threshold on what's truly on screen, not on pending intent.
 */
export function countVisibleBuildingMeshes(refs: (THREE.Mesh | null)[]): number {
  let count = 0;
  for (const mesh of refs) if (mesh?.visible) count++;
  return count;
}

// ─── Memory Safety Monitor (the "70-limit") ───────────────────────────────
//
// If the number of simultaneously visible buildings stays at/above
// VISIBLE_BUILDING_LIMIT for VISIBLE_BUILDING_SUSTAIN_MS straight — a sign
// the pool/streaming logic has broken down and is no longer culling — force
// a full page reload to reclaim memory. A single-frame spike never triggers
// this: the count must be re-measured fresh and stay over the limit for the
// full sustain window, which rules out false positives from a momentary
// batch-toggle overlap between two proximity scans.

const memoryMonitorState: { overLimitSince: number | null; reloaded: boolean } = {
  overLimitSince: null,
  reloaded: false,
};

/**
 * Called every frame (City passes the *actually rendered* visible-mesh
 * count, computed via `countVisibleBuildingMeshes` — never activeMask
 * intent, since that can briefly lead the real on-screen state while
 * batched toggles are still draining) plus the current timestamp
 * (caller-supplied so this stays testable and doesn't reach for Date.now()
 * internally).
 *
 * `getConfirmedVisibleCount` is a second, independent re-read of the same
 * real mesh state used only to double-check the sustained breach right
 * before reloading — guards against a false positive caused by a stale
 * closure over `visibleCount` from several frames ago.
 */
export function checkMemorySafety(
  visibleCount: number,
  nowMs: number,
  getConfirmedVisibleCount: () => number,
): void {
  console.log('Current visible buildings:', visibleCount);

  if (memoryMonitorState.reloaded) return; // reload already in flight

  if (visibleCount < VISIBLE_BUILDING_LIMIT) {
    memoryMonitorState.overLimitSince = null;
    return;
  }

  if (memoryMonitorState.overLimitSince === null) {
    memoryMonitorState.overLimitSince = nowMs;
    return;
  }

  const sustainedMs = nowMs - memoryMonitorState.overLimitSince;
  if (sustainedMs < VISIBLE_BUILDING_SUSTAIN_MS) return;

  // Safety check: re-verify against a fresh read of real mesh visibility
  // right now, not the value sampled when the sustain window started.
  const confirmedCount = getConfirmedVisibleCount();
  if (confirmedCount < VISIBLE_BUILDING_LIMIT) {
    memoryMonitorState.overLimitSince = null;
    return;
  }

  memoryMonitorState.reloaded = true;
  console.warn(
    `Visible building count sustained >= ${VISIBLE_BUILDING_LIMIT} for ${VISIBLE_BUILDING_SUSTAIN_MS}ms ` +
      `(confirmed ${confirmedCount}). Saving and reloading to reclaim memory.`,
  );
  saveGameSnapshot();
  window.location.reload();
}
