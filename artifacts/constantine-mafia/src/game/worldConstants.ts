/** Shared world constants used by every proximity/streaming system. */

/**
 * Initial spawn point (x, z).
 * Always spawns the player inside City B ("Modern Downtown") — on the clear
 * central boulevard (z=0 gap between the north/south building bands) at the
 * heart of the skyscraper core, so there's no building collision on spawn.
 */
export const SPAWN_XZ: readonly [number, number] = [310, 0];
