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
