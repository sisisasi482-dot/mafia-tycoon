/**
 * cityLayout.ts — placement data for City A, City B, the highway, the
 * industrial corridor, the bank, and their collision AABBs.
 *
 * World overview
 * ──────────────
 *   City A      (west, older dense city)   ·  x: −435 → −185, z: −115 → 115
 *   City B      (east, modern downtown)    ·  x:  185 →  435, z: −115 → 115
 *   Highway     ·  z ≈ 0,  x: −160 → 160
 *   Industrial  ·  scattered along highway shoulders, |x| ≤ 130, |z| ≈ 45-65
 *   Bank        ·  (55, 0, −55) — Centre-Ville, standalone GLB building
 *   Spawn       ·  (0, 1, 0)  — mid-highway
 *
 * Cities are generated procedurally from a seeded RNG so the layout is
 * dense, varied, and organic (not a rigid grid) while remaining fully
 * deterministic across reloads.
 */

import type { BuildingAABB } from './buildings';

// ─── Helper types ─────────────────────────────────────────────────────────────

export interface GLBPlacement {
  model: string;
  set: 'glb' | 'glb2' | 'glb3';
  x: number;
  z: number;
  rotY?: number;
  scale: number;
}

interface PoolEntry {
  set: GLBPlacement['set'];
  model: string;
  scaleMin: number;
  scaleMax: number;
}

// ─── Seeded RNG (deterministic across reloads) ────────────────────────────────

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const ROT_CHOICES = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

/** Approximate footprint half-extent for a GLB building at a given scale
 *  (empirical — base model is ~2 units wide, so half-extent ≈ scale × 1.05). */
function footprint(scale: number): number {
  return scale * 1.05;
}

// ─── City A — west, older dense Algerian district ─────────────────────────────
// Pool: glb/ (building-o…t) — tall, dense, ornate old-town blocks.
// Filler: glb2/ low-detail buildings for outer edges/gap-fill.

const CITY_A_MAIN_POOL: PoolEntry[] = [
  { set: 'glb', model: 'building-o', scaleMin: 7,  scaleMax: 10 },
  { set: 'glb', model: 'building-p', scaleMin: 8,  scaleMax: 11 },
  { set: 'glb', model: 'building-q', scaleMin: 8,  scaleMax: 12 },
  { set: 'glb', model: 'building-r', scaleMin: 7,  scaleMax: 11 },
  { set: 'glb', model: 'building-s', scaleMin: 7,  scaleMax: 10 },
  { set: 'glb', model: 'building-t', scaleMin: 8,  scaleMax: 11 },
];

const CITY_A_FILLER_POOL: PoolEntry[] = [
  { set: 'glb2', model: 'low-detail-building-a',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-b',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-c',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-d',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-wide-a', scaleMin: 6, scaleMax: 8 },
];

const CITY_A_DETAIL_POOL: PoolEntry[] = [
  { set: 'glb', model: 'chimney-basic',  scaleMin: 4, scaleMax: 5 },
  { set: 'glb', model: 'chimney-small',  scaleMin: 4, scaleMax: 5 },
  { set: 'glb', model: 'chimney-medium', scaleMin: 4, scaleMax: 6 },
  { set: 'glb', model: 'chimney-large',  scaleMin: 5, scaleMax: 7 },
  { set: 'glb2', model: 'detail-awning',      scaleMin: 3, scaleMax: 4 },
  { set: 'glb2', model: 'detail-awning-wide', scaleMin: 3, scaleMax: 4 },
  { set: 'glb2', model: 'detail-parasol-a',   scaleMin: 3, scaleMax: 4 },
];

function buildCityA(): { placements: GLBPlacement[]; aabbs: BuildingAABB[] } {
  const rng = seededRng(0xA17E5);
  const placements: GLBPlacement[] = [];
  const aabbs: BuildingAABB[] = [];

  const xStart = -435, xCount = 7, xStep = (435 - 185) / xCount; // 250 / 7
  const zBands = [
    { start: -115, count: 3, step: 80 / 3 },  // south band: -115 → -35
    { start:  35,  count: 3, step: 80 / 3 },  // north band:   35 → 115
  ];

  for (let xi = 0; xi < xCount; xi++) {
    const cx = xStart + xi * xStep + xStep / 2;
    for (const band of zBands) {
      for (let zi = 0; zi < band.count; zi++) {
        const cz = band.start + zi * band.step + band.step / 2;

        const useFiller = rng() < 0.22;
        const pool = useFiller ? CITY_A_FILLER_POOL : CITY_A_MAIN_POOL;
        const choice = pick(rng, pool);
        const scale = choice.scaleMin + rng() * (choice.scaleMax - choice.scaleMin);
        const rotY = pick(rng, ROT_CHOICES) + (rng() - 0.5) * 0.1;
        const x = cx + (rng() - 0.5) * 5;
        const z = cz + (rng() - 0.5) * 5;

        placements.push({ set: choice.set, model: choice.model, x, z, rotY, scale });
        aabbs.push({ cx: x, cz: z, hw: footprint(scale), hd: footprint(scale) });

        // Roof/street clutter on ~25% of main-pool buildings
        if (!useFiller && rng() < 0.25) {
          const d = pick(rng, CITY_A_DETAIL_POOL);
          const dScale = d.scaleMin + rng() * (d.scaleMax - d.scaleMin);
          placements.push({
            set: d.set, model: d.model,
            x: x + (rng() - 0.5) * footprint(scale) * 0.6,
            z: z + (rng() - 0.5) * footprint(scale) * 0.6,
            rotY: rng() * Math.PI * 2,
            scale: dScale,
          });
        }
      }
    }
  }
  return { placements, aabbs };
}

const { placements: CITY_A_GEN, aabbs: CITY_A_AABBS } = buildCityA();
export const CITY_A_BUILDINGS: GLBPlacement[] = CITY_A_GEN;

// ─── City B — east, modern downtown with skyscraper core ──────────────────────
// Pool: glb2/ standard buildings (a…n); skyscraper pool used for the two
// innermost columns (closest to the highway / city centre) for a proper
// downtown skyline silhouette.

const CITY_B_MAIN_POOL: PoolEntry[] = [
  { set: 'glb2', model: 'building-a', scaleMin: 7, scaleMax: 10 },
  { set: 'glb2', model: 'building-b', scaleMin: 7, scaleMax: 10 },
  { set: 'glb2', model: 'building-c', scaleMin: 7, scaleMax: 10 },
  { set: 'glb2', model: 'building-d', scaleMin: 7, scaleMax: 10 },
  { set: 'glb2', model: 'building-e', scaleMin: 8, scaleMax: 11 },
  { set: 'glb2', model: 'building-f', scaleMin: 8, scaleMax: 11 },
  { set: 'glb2', model: 'building-g', scaleMin: 8, scaleMax: 11 },
  { set: 'glb2', model: 'building-h', scaleMin: 7, scaleMax: 10 },
  { set: 'glb2', model: 'building-i', scaleMin: 7, scaleMax: 10 },
  { set: 'glb2', model: 'building-j', scaleMin: 8, scaleMax: 11 },
  { set: 'glb2', model: 'building-k', scaleMin: 8, scaleMax: 11 },
  { set: 'glb2', model: 'building-l', scaleMin: 7, scaleMax: 10 },
  { set: 'glb2', model: 'building-m', scaleMin: 8, scaleMax: 11 },
  { set: 'glb2', model: 'building-n', scaleMin: 7, scaleMax: 10 },
];

const CITY_B_SKYSCRAPER_POOL: PoolEntry[] = [
  { set: 'glb2', model: 'building-skyscraper-a', scaleMin: 10, scaleMax: 14 },
  { set: 'glb2', model: 'building-skyscraper-b', scaleMin: 10, scaleMax: 14 },
  { set: 'glb2', model: 'building-skyscraper-c', scaleMin: 9,  scaleMax: 13 },
  { set: 'glb2', model: 'building-skyscraper-d', scaleMin: 10, scaleMax: 14 },
  { set: 'glb2', model: 'building-skyscraper-e', scaleMin: 9,  scaleMax: 13 },
];

const CITY_B_FILLER_POOL: PoolEntry[] = [
  { set: 'glb2', model: 'low-detail-building-e',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-f',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-g',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-h',      scaleMin: 6, scaleMax: 8 },
  { set: 'glb2', model: 'low-detail-building-wide-b', scaleMin: 6, scaleMax: 8 },
];

const CITY_B_DETAIL_POOL: PoolEntry[] = [
  { set: 'glb2', model: 'detail-overhang',       scaleMin: 3, scaleMax: 4 },
  { set: 'glb2', model: 'detail-overhang-wide',  scaleMin: 3, scaleMax: 4 },
  { set: 'glb2', model: 'detail-parasol-b',      scaleMin: 3, scaleMax: 4 },
];

function buildCityB(): { placements: GLBPlacement[]; aabbs: BuildingAABB[] } {
  const rng = seededRng(0xC17B5);
  const placements: GLBPlacement[] = [];
  const aabbs: BuildingAABB[] = [];

  const xStart = 185, xCount = 7, xStep = (435 - 185) / xCount;
  const zBands = [
    { start: -115, count: 3, step: 80 / 3 },
    { start:  35,  count: 3, step: 80 / 3 },
  ];

  for (let xi = 0; xi < xCount; xi++) {
    const cx = xStart + xi * xStep + xStep / 2;
    // Innermost two columns (closest to the highway) form the skyscraper core
    const isCore = xi <= 1;
    for (const band of zBands) {
      for (let zi = 0; zi < band.count; zi++) {
        const cz = band.start + zi * band.step + band.step / 2;

        const useFiller = !isCore && rng() < 0.18;
        const pool = isCore ? CITY_B_SKYSCRAPER_POOL : (useFiller ? CITY_B_FILLER_POOL : CITY_B_MAIN_POOL);
        const choice = pick(rng, pool);
        const scale = choice.scaleMin + rng() * (choice.scaleMax - choice.scaleMin);
        const rotY = pick(rng, ROT_CHOICES) + (rng() - 0.5) * 0.1;
        const x = cx + (rng() - 0.5) * 5;
        const z = cz + (rng() - 0.5) * 5;

        placements.push({ set: choice.set, model: choice.model, x, z, rotY, scale });
        aabbs.push({ cx: x, cz: z, hw: footprint(scale), hd: footprint(scale) });

        if (!isCore && !useFiller && rng() < 0.25) {
          const d = pick(rng, CITY_B_DETAIL_POOL);
          const dScale = d.scaleMin + rng() * (d.scaleMax - d.scaleMin);
          placements.push({
            set: d.set, model: d.model,
            x: x + (rng() - 0.5) * footprint(scale) * 0.6,
            z: z + (rng() - 0.5) * footprint(scale) * 0.6,
            rotY: rng() * Math.PI * 2,
            scale: dScale,
          });
        }
      }
    }
  }
  return { placements, aabbs };
}

const { placements: CITY_B_GEN, aabbs: CITY_B_AABBS } = buildCityB();
export const CITY_B_BUILDINGS: GLBPlacement[] = CITY_B_GEN;

// ─── Highway — glb3/ road tiles ────────────────────────────────────────────────
// road-straight tiles running E-W (X axis), scale=8 → 16 units/tile.

const ROAD_TILE_SCALE = 8;
const ROAD_TILE_STEP  = 16;
const HIGHWAY_START   = -160;
const HIGHWAY_END     = 160;

export const HIGHWAY_ROADS: GLBPlacement[] = (() => {
  const tiles: GLBPlacement[] = [];
  for (let x = HIGHWAY_START; x <= HIGHWAY_END; x += ROAD_TILE_STEP) {
    tiles.push({ set: 'glb3', model: 'road-straight', x, z: 0, rotY: Math.PI / 2, scale: ROAD_TILE_SCALE });
  }
  return tiles;
})();

export const HIGHWAY_CROSSROADS: GLBPlacement[] = [
  { set: 'glb3', model: 'road-crossroad', x: -176, z: 0, rotY: Math.PI / 2, scale: ROAD_TILE_SCALE },
  { set: 'glb3', model: 'road-crossroad', x:  176, z: 0, rotY: Math.PI / 2, scale: ROAD_TILE_SCALE },
];

export const HIGHWAY_SIGNS: GLBPlacement[] = [
  { set: 'glb3', model: 'sign-highway',      x: -140, z: -14, rotY: 0,       scale: 8 },
  { set: 'glb3', model: 'sign-highway-wide', x:  140, z:  14, rotY: Math.PI, scale: 8 },
];

export const HIGHWAY_LIGHTS: GLBPlacement[] = (() => {
  const lights: GLBPlacement[] = [];
  for (let x = -144; x <= 144; x += 48) {
    lights.push({ set: 'glb3', model: 'light-square-double', x, z: -14, rotY: 0,       scale: 8 });
    lights.push({ set: 'glb3', model: 'light-square-double', x, z:  14, rotY: Math.PI, scale: 8 });
  }
  return lights;
})();

export const HIGHWAY_DETAILS: GLBPlacement[] = [
  { set: 'glb3', model: 'construction-cone',    x: 155, z:  8, rotY: 0, scale: 8 },
  { set: 'glb3', model: 'construction-cone',    x: 162, z: -8, rotY: 0, scale: 8 },
  { set: 'glb3', model: 'construction-barrier', x: 158, z:  6, rotY: 0, scale: 8 },
];

// ─── Industrial corridor — factories & warehouses along the highway ───────────
// No dedicated factory GLBs exist, so large warehouse hulls are built from
// low-detail-building-wide models (scaled up) accented with smokestacks
// (chimney-*) and storage tanks (detail-tank) from glb/.

interface IndustrialCluster {
  x: number; z: number; rotY: number;
  warehouse: { set: GLBPlacement['set']; model: string; scale: number };
}

const INDUSTRIAL_CLUSTERS: IndustrialCluster[] = [
  { x: -120, z:  55, rotY: 0,             warehouse: { set: 'glb2', model: 'low-detail-building-wide-a', scale: 13 } },
  { x:  -60, z: -60, rotY: Math.PI,       warehouse: { set: 'glb2', model: 'low-detail-building-wide-b', scale: 12 } },
  { x:   60, z:  58, rotY: 0,             warehouse: { set: 'glb2', model: 'low-detail-building-wide-a', scale: 13 } },
  { x:  120, z: -55, rotY: Math.PI,       warehouse: { set: 'glb2', model: 'low-detail-building-wide-b', scale: 12 } },
];

function buildIndustrial(): { placements: GLBPlacement[]; aabbs: BuildingAABB[] } {
  const rng = seededRng(0x1D057);
  const placements: GLBPlacement[] = [];
  const aabbs: BuildingAABB[] = [];

  for (const c of INDUSTRIAL_CLUSTERS) {
    placements.push({ set: c.warehouse.set, model: c.warehouse.model, x: c.x, z: c.z, rotY: c.rotY, scale: c.warehouse.scale });
    aabbs.push({ cx: c.x, cz: c.z, hw: footprint(c.warehouse.scale) * 1.3, hd: footprint(c.warehouse.scale) * 0.7 });

    // Smokestacks
    const chimneyModels = ['chimney-basic', 'chimney-medium', 'chimney-large'];
    for (let i = 0; i < 2; i++) {
      placements.push({
        set: 'glb', model: pick(rng, chimneyModels),
        x: c.x + (i === 0 ? -1 : 1) * footprint(c.warehouse.scale) * 0.5 + (rng() - 0.5) * 4,
        z: c.z + (rng() - 0.5) * 8,
        rotY: rng() * Math.PI * 2,
        scale: 7 + rng() * 3,
      });
    }
    // Storage tanks
    for (let i = 0; i < 2; i++) {
      placements.push({
        set: 'glb', model: 'detail-tank',
        x: c.x + (rng() - 0.5) * footprint(c.warehouse.scale) * 1.4,
        z: c.z + (rng() - 0.5) * 10 + (c.z > 0 ? 10 : -10),
        rotY: rng() * Math.PI * 2,
        scale: 6 + rng() * 2,
      });
    }
  }
  return { placements, aabbs };
}

const { placements: INDUSTRIAL_GEN, aabbs: INDUSTRIAL_AABBS } = buildIndustrial();
export const INDUSTRIAL_PLACEMENTS: GLBPlacement[] = INDUSTRIAL_GEN;

// ─── Bank — standalone GLB building (logic lives in Bank.tsx) ─────────────────
// Bank.tsx owns BANK_POS / interaction logic; this mirrors it for collision +
// the GLB model choice so Player.tsx doesn't need a separate import.

export const BANK_POS: [number, number, number] = [55, 0, -55];
export const BANK_MODEL: GLBPlacement = {
  set: 'glb', model: 'building-q', x: BANK_POS[0], z: BANK_POS[2], rotY: 0, scale: 9,
};
const BANK_AABB: BuildingAABB = { cx: BANK_POS[0], cz: BANK_POS[2], hw: 10, hd: 8 };

// ─── Collision AABBs for all GLB-based structures ─────────────────────────────

export const GLB_BUILDING_AABBS: BuildingAABB[] = [
  ...CITY_A_AABBS,
  ...CITY_B_AABBS,
  ...INDUSTRIAL_AABBS,
  BANK_AABB,
];
