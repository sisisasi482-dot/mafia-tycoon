/**
 * Single source of truth for all building data.
 * Consumed by: City.tsx (3D), MiniMap.tsx (2D SVG), Player.tsx (AABB collision).
 *
 * ── Map data cleared — ready for new map generation ──
 */

/** Minimal footprint — kept for MiniMap compatibility */
export interface BuildingFootprint {
  x: number; z: number;
  w: number; d: number;
  district: string;
}

/** Full data used by City.tsx and the collision system */
export interface BuildingData extends BuildingFootprint {
  h: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  texKey: string | null;
  texIdx: number;
}

/** 2-D AABB for player collision (no height needed — player walks on flat plane) */
export interface BuildingAABB {
  cx: number; cz: number;   // center
  hw: number; hd: number;   // half-extents
}

/** Full building list — empty until new map data is added. */
export const BUILDINGS: BuildingData[] = [];

/** Flat AABB list derived from the BUILDINGS array. */
export const BUILDING_AABBS: BuildingAABB[] = [];
