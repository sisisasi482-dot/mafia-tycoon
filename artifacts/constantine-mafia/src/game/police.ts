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

// Real road segments matching the highway + city arterials, used to place
// dynamic police roadblocks. Every consumer must null-check the result of
// indexing into this array — it must never be assumed non-empty.
export const DYNAMIC_CHECKPOINT_ROADS: RoadSegment[] = [
  { id: 'highway-main',     horizontal: true,  x0: -160, x1:  160, z0:    0, z1:    0, width: 20 },
  { id: 'city-a-arterial',  horizontal: false, x0: -310, x1: -310, z0: -115, z1:  115, width: 14 },
  { id: 'city-b-arterial',  horizontal: false, x0:  310, x1:  310, z0: -115, z1:  115, width: 14 },
  { id: 'city-a-boulevard', horizontal: true,  x0: -435, x1: -185, z0:    0, z1:    0, width: 14 },
  { id: 'city-b-boulevard', horizontal: true,  x0:  185, x1:  435, z0:    0, z1:    0, width: 14 },
];

export const CHECKPOINTS: Checkpoint[] = [
  {
    id:     'cp-highway-east',
    label:  'Highway East Checkpoint',
    worldX: 155,
    worldZ: 0,
    radius: 12,
    rotY:   Math.PI / 2,
  },
  {
    id:     'cp-city-a-south',
    label:  'Ali Mendjeli Checkpoint',
    worldX: -310,
    worldZ: -80,
    radius: 10,
    rotY:   0,
  },
  {
    id:     'cp-city-b-south',
    label:  'City B Checkpoint',
    worldX: 310,
    worldZ: -80,
    radius: 10,
    rotY:   0,
  },
];
