/**
 * Police checkpoint definitions.
 *
 * ── Checkpoint data cleared — ready for new map generation ──
 */

export interface Checkpoint {
  id:     string;
  label:  string;
  worldX: number;
  worldZ: number;
  radius: number;
  rotY:   number;
}

export interface RoadSegment {
  id: string;
  horizontal: boolean;
  x0: number; x1: number;
  z0: number; z1: number;
  width: number;
}

export const DYNAMIC_CHECKPOINT_ROADS: RoadSegment[] = [];

export const CHECKPOINTS: Checkpoint[] = [];
