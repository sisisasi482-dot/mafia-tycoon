/**
 * Building object pool + staged loading.
 *
 * Buildings are NOT all mounted at once. On City mount, only buildings
 * within BUILDING_ACTIVATION_RADIUS of the spawn point are streamed in
 * (mounted, visible). Every other building stays un-mounted — no geometry,
 * no material, zero GPU/CPU cost — until the player actually walks within
 * range, at which point it streams in at a max of BUILDING_TOGGLE_BATCH_SIZE
 * per frame. Once a building has been mounted, it is NEVER unmounted again;
 * leaving its radius only flips the existing mesh's `visible` property.
 *
 * `activeMask[i]` / `unlockedMask[i]` correspond 1:1 with `BUILDINGS[i]` /
 * `BUILDING_AABBS[i]`.
 */
import { BUILDINGS } from './buildings';
import { saveGameSnapshot } from './useSaveSystem';
import { SPAWN_XZ } from './worldConstants';

/** Single shared proximity radius — buildings only render/collide within this. */
export const BUILDING_ACTIVATION_RADIUS = 30;

/** Run the proximity scan once every N frames to save CPU. */
export const BUILDING_UPDATE_INTERVAL_FRAMES = 15;

/** Max number of buildings to stream-in or toggle in a single frame. */
export const BUILDING_TOGGLE_BATCH_SIZE = 5;

/** Memory Safety Monitor thresholds. */
export const VISIBLE_BUILDING_LIMIT = 70;
export const VISIBLE_BUILDING_SUSTAIN_MS = 5000;

/** 1 = currently visible/collidable, 0 = out of range (hidden, collider disabled). */
export const activeMask: Uint8Array = new Uint8Array(BUILDINGS.length);
/** 1 = has ever been streamed in (mounted at least once) — never reverts to 0. */
export const unlockedMask: Uint8Array = new Uint8Array(BUILDINGS.length);

/**
 * Reset both masks to all-inactive/all-locked. City calls this on mount
 * (e.g. when re-entering the outdoor scene after an interior) so the
 * module-level singleton can never carry stale bits into a fresh set of
 * mesh refs.
 */
export function resetActiveBuildings(): void {
  activeMask.fill(0);
  unlockedMask.fill(0);
  memoryMonitorState.overLimitSince = null;
}

/**
 * Stage 1 of staged loading: synchronously unlock+activate whatever is
 * within radius of the spawn point, so the very first frame already shows
 * immediate surroundings without ever having mounted the rest of the map.
 * Call once, right after resetActiveBuildings().
 */
export function seedInitialUnlock(px: number = SPAWN_XZ[0], pz: number = SPAWN_XZ[1]): number[] {
  const seeded: number[] = [];
  const r2 = BUILDING_ACTIVATION_RADIUS * BUILDING_ACTIVATION_RADIUS;
  for (let i = 0; i < BUILDINGS.length; i++) {
    const b = BUILDINGS[i];
    const dx = b.x - px, dz = b.z - pz;
    if (dx * dx + dz * dz <= r2) {
      unlockedMask[i] = 1;
      activeMask[i] = 1;
      seeded.push(i);
    }
  }
  return seeded;
}

/**
 * Recompute which buildings are within range of (px, pz).
 * Returns two disjoint index lists:
 *  - streamIn: never-before-seen buildings that just entered range and must
 *    be mounted for the first time (a real React re-render).
 *  - toggle: already-mounted buildings whose `visible` needs to flip (either
 *    direction) — a cheap property mutation on the existing mesh instance.
 */
export function scanBuildingProximity(px: number, pz: number): { streamIn: number[]; toggle: number[] } {
  const streamIn: number[] = [];
  const toggle: number[] = [];
  const r2 = BUILDING_ACTIVATION_RADIUS * BUILDING_ACTIVATION_RADIUS;
  for (let i = 0; i < BUILDINGS.length; i++) {
    const b = BUILDINGS[i];
    const dx = b.x - px, dz = b.z - pz;
    const inRange = (dx * dx + dz * dz) <= r2;
    if (inRange && activeMask[i] === 0) {
      activeMask[i] = 1;
      if (unlockedMask[i] === 0) streamIn.push(i);
      else toggle.push(i);
    } else if (!inRange && activeMask[i] === 1) {
      activeMask[i] = 0;
      toggle.push(i);
    }
  }
  return { streamIn, toggle };
}

/** Count how many buildings are currently active (visible + collidable) per the mask. */
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
export function countVisibleBuildingMeshes(refs: (import('three').Mesh | null)[]): number {
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
 * Called every scan with the freshly-recomputed *actually rendered*
 * visible-mesh count and the current timestamp (caller-supplied so this
 * stays testable and doesn't reach for Date.now() internally).
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
