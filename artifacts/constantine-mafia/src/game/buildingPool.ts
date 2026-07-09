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
import { BUILDINGS } from './buildings';

/** Distance (world units) within which a building is shown + collidable. */
export const BUILDING_ACTIVATION_RADIUS = 120;

/** Run the proximity scan once every N frames to save CPU. */
export const BUILDING_UPDATE_INTERVAL_FRAMES = 15;

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
