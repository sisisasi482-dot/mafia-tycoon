/**
 * Police checkpoint definitions placed at key road choke-points (2× scale).
 * Checkpoints stop players carrying contraband (stolen vehicles, weapons, wanted level).
 */

export interface Checkpoint {
  id:     string;
  label:  string;
  worldX: number;
  worldZ: number;
  radius: number;
  /** Y rotation of the barrier arm — perpendicular to traffic flow */
  rotY:   number;
}

/** Road segments eligible for a temporary, relocating dynamic checkpoint
 *  (2 cars + 8 officers blocking full road width). Mirrors ROADS in City.tsx —
 *  each entry is a straight segment the checkpoint can be placed anywhere along. */
export interface RoadSegment {
  id: string;
  /** true = runs along X (block is perpendicular, rotY = PI/2); false = runs along Z */
  horizontal: boolean;
  x0: number; x1: number;
  z0: number; z1: number;
  width: number; // road width, defines how far the barricade must span
}

export const DYNAMIC_CHECKPOINT_ROADS: RoadSegment[] = [
  { id: 'hwy_main',    horizontal: true,  x0: -580, x1: 420, z0: 0,   z1: 0,   width: 40 },
  { id: 'ns_centre',   horizontal: false, x0: 0,    x1: 0,   z0: -80, z1: 380, width: 40 },
  { id: 'ns_secondary',horizontal: false, x0: 100,  x1: 100, z0: -180,z1: 180, width: 40 },
  { id: 'ns_ali',      horizontal: false, x0: -200, x1: -200,z0: -190,z1: 190, width: 40 },
];

export const CHECKPOINTS: Checkpoint[] = [
  // Sidi M'Cid bridge — main choke point between Centre-Ville and Old City
  { id: 'cp_bridge',     label: "Sidi M'Cid Checkpoint",    worldX:  270, worldZ:   0, radius: 16, rotY: 0 },
  // Centre-Ville N-S road
  { id: 'cp_centre',     label: 'Centre-Ville Checkpoint',  worldX:    0, worldZ: 175, radius: 14, rotY: Math.PI / 2 },
  // Industrial corridor — Ain M'lila entry
  { id: 'cp_industrial', label: 'Industrial Checkpoint',    worldX: -460, worldZ: 140, radius: 14, rotY: Math.PI / 2 },
  // Airport access road
  { id: 'cp_airport',    label: 'Airport Checkpoint',       worldX: -300, worldZ: 240, radius: 14, rotY: Math.PI / 2 },
];
