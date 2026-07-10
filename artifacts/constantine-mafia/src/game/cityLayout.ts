/**
 * cityLayout.ts — placement data for City A, City B, the highway, and their
 * collision AABBs.  All world positions use the same coordinate system as the
 * rest of the game (Y-up, X east, Z south).
 *
 * World overview
 * ──────────────
 *   City A  (west, older dense city)   ·  center ≈ (−280, 0)
 *   City B  (east, modern downtown)    ·  center ≈ ( 280, 0)
 *   Highway                            ·  z ≈ 0,  x: −160 → 160
 *   Spawn                              ·  (0, 1, 0)  — mid-highway
 *
 * Each tile in glb3/ is 2 units at scale=1. We render at scale=8 → 16 units
 * per tile.  Buildings in glb/ and glb2/ are also roughly 2 units wide at
 * scale=1, rendered at scale 5-8 → 10-16 unit footprints.
 */

import type { BuildingAABB } from './buildings';

// ─── Helper types ─────────────────────────────────────────────────────────────

export interface GLBPlacement {
  /** filename without extension, relative to its asset folder */
  model: string;
  /** asset folder: 'glb' | 'glb2' | 'glb3' */
  set: 'glb' | 'glb2' | 'glb3';
  x: number;
  z: number;
  /** Y rotation in radians */
  rotY?: number;
  /** uniform scale */
  scale: number;
}

// ─── City A — west, older Algerian district ────────────────────────────────────
// Uses glb/ (building-o…t, chimneys, detail-tank) + a few glb2/ low-detail fill

export const CITY_A_BUILDINGS: GLBPlacement[] = [
  // ── Northern block ──────────────────────────────────────────────────────────
  { set: 'glb', model: 'building-o', x: -220, z: -75, rotY: 0,             scale: 5 },
  { set: 'glb', model: 'building-p', x: -260, z: -80, rotY: 0,             scale: 5 },
  { set: 'glb', model: 'building-q', x: -305, z: -78, rotY: Math.PI / 2,   scale: 5 },
  { set: 'glb', model: 'building-r', x: -350, z: -72, rotY: 0,             scale: 5 },
  { set: 'glb', model: 'building-s', x: -395, z: -68, rotY: Math.PI,       scale: 5 },

  // ── Mid-north block ─────────────────────────────────────────────────────────
  { set: 'glb', model: 'building-t', x: -225, z: -30, rotY: 0,             scale: 5 },
  { set: 'glb', model: 'building-o', x: -278, z: -25, rotY: Math.PI / 2,   scale: 6 },
  { set: 'glb', model: 'building-q', x: -328, z: -32, rotY: 0,             scale: 5 },
  { set: 'glb', model: 'building-r', x: -378, z: -22, rotY: Math.PI,       scale: 5 },

  // ── Mid-south block ─────────────────────────────────────────────────────────
  { set: 'glb', model: 'building-p', x: -248, z: 28,  rotY: 0,             scale: 5 },
  { set: 'glb', model: 'building-s', x: -298, z: 38,  rotY: Math.PI / 2,   scale: 5 },
  { set: 'glb', model: 'building-t', x: -358, z: 30,  rotY: 0,             scale: 5 },

  // ── Southern block ──────────────────────────────────────────────────────────
  { set: 'glb', model: 'building-o', x: -228, z: 75,  rotY: Math.PI,       scale: 5 },
  { set: 'glb', model: 'building-r', x: -288, z: 82,  rotY: 0,             scale: 5 },
  { set: 'glb', model: 'building-q', x: -348, z: 74,  rotY: Math.PI / 2,   scale: 5 },
  { set: 'glb', model: 'building-s', x: -408, z: 62,  rotY: 0,             scale: 5 },

  // ── Chimney roof details (shorter, placed above surrounding blocks) ──────────
  { set: 'glb', model: 'chimney-medium', x: -262, z: -70, rotY: 0, scale: 4 },
  { set: 'glb', model: 'chimney-small',  x: -310, z: -68, rotY: 0, scale: 4 },
  { set: 'glb', model: 'chimney-basic',  x: -352, z: -74, rotY: 0, scale: 4 },
  { set: 'glb', model: 'chimney-large',  x: -400, z: -60, rotY: 0, scale: 4 },

  // ── Low-detail filler at city edge ──────────────────────────────────────────
  { set: 'glb2', model: 'low-detail-building-a',      x: -430, z: -35, rotY: 0,           scale: 5 },
  { set: 'glb2', model: 'low-detail-building-b',      x: -440, z:  35, rotY: Math.PI / 2, scale: 5 },
  { set: 'glb2', model: 'low-detail-building-wide-a', x: -430, z:  90, rotY: 0,           scale: 5 },
  { set: 'glb2', model: 'low-detail-building-c',      x: -200, z: -80, rotY: 0,           scale: 5 },
  { set: 'glb2', model: 'low-detail-building-d',      x: -200, z:  80, rotY: 0,           scale: 5 },

  // ── Street detail (awnings/parasols at ground level) ────────────────────────
  { set: 'glb2', model: 'detail-awning',       x: -245, z: 32,  rotY: 0,           scale: 4 },
  { set: 'glb2', model: 'detail-awning-wide',  x: -305, z: 42,  rotY: Math.PI / 2, scale: 4 },
  { set: 'glb2', model: 'detail-parasol-a',    x: -260, z: -28, rotY: 0,           scale: 4 },
];

// ─── City B — east, modern downtown ───────────────────────────────────────────
// Uses glb2/ (skyscrapers + standard buildings + details)

export const CITY_B_BUILDINGS: GLBPlacement[] = [
  // ── Skyscraper core ─────────────────────────────────────────────────────────
  { set: 'glb2', model: 'building-skyscraper-a', x: 278, z: -18, rotY: 0,            scale: 8 },
  { set: 'glb2', model: 'building-skyscraper-b', x: 312, z:  12, rotY: Math.PI / 6,  scale: 7 },
  { set: 'glb2', model: 'building-skyscraper-c', x: 258, z:  22, rotY: 0,            scale: 7 },
  { set: 'glb2', model: 'building-skyscraper-d', x: 302, z: -52, rotY: 0,            scale: 8 },
  { set: 'glb2', model: 'building-skyscraper-e', x: 342, z: -18, rotY: Math.PI / 2,  scale: 7 },

  // ── Standard buildings — northern block ─────────────────────────────────────
  { set: 'glb2', model: 'building-a', x: 228, z: -72, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-b', x: 262, z: -72, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-c', x: 362, z: -62, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-d', x: 395, z: -32, rotY: Math.PI / 2,  scale: 5 },
  { set: 'glb2', model: 'building-e', x: 408, z: -70, rotY: 0,            scale: 5 },

  // ── Standard buildings — southern block ─────────────────────────────────────
  { set: 'glb2', model: 'building-f', x: 232, z:  52, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-g', x: 372, z:  52, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-h', x: 405, z:  72, rotY: Math.PI,      scale: 5 },
  { set: 'glb2', model: 'building-i', x: 242, z:  82, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-j', x: 352, z:  82, rotY: Math.PI / 2,  scale: 5 },
  { set: 'glb2', model: 'building-k', x: 218, z:  22, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-l', x: 218, z: -28, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'building-m', x: 392, z:  20, rotY: Math.PI,      scale: 5 },
  { set: 'glb2', model: 'building-n', x: 422, z:   0, rotY: 0,            scale: 5 },

  // ── Low-detail outskirt fill ─────────────────────────────────────────────────
  { set: 'glb2', model: 'low-detail-building-e',      x: 438, z: -90, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'low-detail-building-f',      x: 438, z:   0, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'low-detail-building-g',      x: 438, z:  90, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'low-detail-building-wide-b', x: 205, z: -90, rotY: 0,            scale: 5 },
  { set: 'glb2', model: 'low-detail-building-h',      x: 205, z:  85, rotY: Math.PI / 2,  scale: 5 },

  // ── Street furniture ─────────────────────────────────────────────────────────
  { set: 'glb2', model: 'detail-overhang',       x: 240, z:  55, rotY: 0,            scale: 4 },
  { set: 'glb2', model: 'detail-overhang-wide',  x: 310, z:  55, rotY: Math.PI / 2,  scale: 4 },
  { set: 'glb2', model: 'detail-parasol-b',      x: 265, z: -28, rotY: 0,            scale: 4 },
];

// ─── Highway — glb3/ road tiles ────────────────────────────────────────────────
// road-straight tiles running E-W (X axis), scale=8 → 16 units/tile
// Tile centres: x ∈ {-152, -136, ..., 136, 152} step 16 (20 tiles)

const ROAD_TILE_SCALE = 8;
const ROAD_TILE_STEP  = 16;   // tile width in world units at scale 8
const HIGHWAY_START   = -160; // first tile centre x
const HIGHWAY_END     = 160;  // last tile centre x (inclusive range)

/** All road-straight placements along the highway. */
export const HIGHWAY_ROADS: GLBPlacement[] = (() => {
  const tiles: GLBPlacement[] = [];
  for (let x = HIGHWAY_START; x <= HIGHWAY_END; x += ROAD_TILE_STEP) {
    tiles.push({
      set: 'glb3', model: 'road-straight', x, z: 0,
      rotY: Math.PI / 2,   // rotate so tile runs E-W
      scale: ROAD_TILE_SCALE,
    });
  }
  return tiles;
})();

/** Crossroad tiles at city entry points. */
export const HIGHWAY_CROSSROADS: GLBPlacement[] = [
  { set: 'glb3', model: 'road-crossroad', x: -176, z: 0, rotY: Math.PI / 2, scale: ROAD_TILE_SCALE },
  { set: 'glb3', model: 'road-crossroad', x:  176, z: 0, rotY: Math.PI / 2, scale: ROAD_TILE_SCALE },
];

/** Highway signs. */
export const HIGHWAY_SIGNS: GLBPlacement[] = [
  { set: 'glb3', model: 'sign-highway',       x: -140, z: -14, rotY: 0, scale: 8 },
  { set: 'glb3', model: 'sign-highway-wide',  x:  140, z:  14, rotY: Math.PI, scale: 8 },
];

/** Street lights along the highway — both kerbs, every 48 units. */
export const HIGHWAY_LIGHTS: GLBPlacement[] = (() => {
  const lights: GLBPlacement[] = [];
  for (let x = -144; x <= 144; x += 48) {
    lights.push({ set: 'glb3', model: 'light-square-double', x, z: -14, rotY: 0,        scale: 8 });
    lights.push({ set: 'glb3', model: 'light-square-double', x, z:  14, rotY: Math.PI,  scale: 8 });
  }
  return lights;
})();

/** Construction detail near city B entrance. */
export const HIGHWAY_DETAILS: GLBPlacement[] = [
  { set: 'glb3', model: 'construction-cone',    x: 155, z:  8, rotY: 0, scale: 8 },
  { set: 'glb3', model: 'construction-cone',    x: 162, z: -8, rotY: 0, scale: 8 },
  { set: 'glb3', model: 'construction-barrier', x: 158, z:  6, rotY: 0, scale: 8 },
];

// ─── Collision AABBs for GLB buildings ────────────────────────────────────────
// Approximate half-extents: model at scale=5 → footprint ~10 units → hw/hd = 5
//                           model at scale=6 → footprint ~12 units → hw/hd = 6
//                           skyscraper at scale=7-8 → footprint ~14-16 → hw/hd = 7

function aabb(x: number, z: number, hw: number, hd: number): BuildingAABB {
  return { cx: x, cz: z, hw, hd };
}

export const GLB_BUILDING_AABBS: BuildingAABB[] = [
  // ── City A ──────────────────────────────────────────────────────────────────
  aabb(-220, -75, 5, 5), aabb(-260, -80, 5, 5), aabb(-305, -78, 5, 5),
  aabb(-350, -72, 5, 5), aabb(-395, -68, 5, 5),
  aabb(-225, -30, 5, 5), aabb(-278, -25, 6, 6), aabb(-328, -32, 5, 5), aabb(-378, -22, 5, 5),
  aabb(-248,  28, 5, 5), aabb(-298,  38, 5, 5), aabb(-358,  30, 5, 5),
  aabb(-228,  75, 5, 5), aabb(-288,  82, 5, 5), aabb(-348,  74, 5, 5), aabb(-408,  62, 5, 5),
  aabb(-430, -35, 5, 5), aabb(-440,  35, 5, 5), aabb(-430,  90, 8, 5),
  aabb(-200, -80, 5, 5), aabb(-200,  80, 5, 5),

  // ── City B ──────────────────────────────────────────────────────────────────
  aabb( 278, -18, 8, 8), aabb( 312,  12, 7, 7), aabb( 258,  22, 7, 7),
  aabb( 302, -52, 8, 8), aabb( 342, -18, 7, 7),
  aabb( 228, -72, 5, 5), aabb( 262, -72, 5, 5), aabb( 362, -62, 5, 5),
  aabb( 395, -32, 5, 5), aabb( 408, -70, 5, 5),
  aabb( 232,  52, 5, 5), aabb( 372,  52, 5, 5), aabb( 405,  72, 5, 5),
  aabb( 242,  82, 5, 5), aabb( 352,  82, 5, 5),
  aabb( 218,  22, 5, 5), aabb( 218, -28, 5, 5),
  aabb( 392,  20, 5, 5), aabb( 422,   0, 5, 5),
  aabb( 438, -90, 5, 5), aabb( 438,   0, 5, 5), aabb( 438,  90, 5, 5),
  aabb( 205, -90, 8, 5), aabb( 205,  85, 5, 5),
];
