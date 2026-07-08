/**
 * Single source of truth for all building data.
 * Consumed by: City.tsx (3D), MiniMap.tsx (2D SVG), Player.tsx (AABB collision).
 */

function makeRng(seed: number) {
  let s = seed;
  return () => { s = Math.sin(s) * 43758.5453123; return s - Math.floor(s); };
}

/** Minimal footprint — kept for MiniMap compatibility */
export interface BuildingFootprint {
  x: number; z: number;
  w: number; d: number;
  district: 'ali_mendjeli' | 'centre_ville' | 'old_city' | 'ain_mlila';
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

// ─── Generation ──────────────────────────────────────────────────────────────

function generate(): BuildingData[] {
  const rng = makeRng(42);
  const list: BuildingData[] = [];

  /* Each building always consumes exactly 7 rng() calls so the sequence is
     predictable regardless of gorge-gap skips. */

  // ── Ali Mendjeli – Soviet brutalist + occasional towers ────────────────
  for (let i = 0; i < 80; i++) {
    const x      = -195 + rng() * 140;
    const z      =  -95 + rng() * 190;
    const tower  = rng() > 0.88;                    // ~12% chance tall tower
    const h      = tower ? 32 + rng() * 24 : 8 + rng() * 18;
    const lit    = rng() > 0.35;
    const w      = 14 + rng() * 8;
    const d      = 14 + rng() * 8;
    const texIdx = Math.floor(rng() * 4);
    list.push({
      x, z, w, d, district: 'ali_mendjeli', h,
      color: '#ffffff', emissive: '#ffb347',
      emissiveIntensity: lit ? 0.04 + rng() * 0.03 : 0,
      texKey: 'ali_mendjeli', texIdx,
    });
  }

  // ── Centre-Ville – French colonial + downtown highrises ───────────────
  for (let i = 0; i < 90; i++) {
    const x       = -45 + rng() * 140;
    const z       = -95 + rng() * 190;
    const highrise = rng() > 0.82;                  // ~18% chance highrise
    const h       = highrise ? 40 + rng() * 30 : 12 + rng() * 20;
    const lit     = rng() > 0.3;
    const w       = 7 + rng() * 7;
    const d       = 7 + rng() * 7;
    const texIdx  = Math.floor(rng() * 4);
    list.push({
      x, z, w, d, district: 'centre_ville', h,
      color: '#ffffff', emissive: '#ffe070',
      emissiveIntensity: lit ? 0.05 + rng() * 0.03 : 0,
      texKey: 'centre_ville', texIdx,
    });
  }

  // ── Old City – Dense medina, low-rise earthy ──────────────────────────
  for (let i = 0; i < 110; i++) {
    const x      = 105 + rng() * 140;
    const z      = -45 + rng() * 90;
    const h      = 3   + rng() * 10;
    const lit    = rng() > 0.5;
    const w      = 4   + rng() * 6;
    const d      = 4   + rng() * 6;
    const texIdx = Math.floor(rng() * 4);
    if (x > 138 && x < 182) continue;               // gorge gap (rng consumed above)
    list.push({
      x, z, w, d, district: 'old_city', h,
      color: '#ffffff', emissive: '#ff8c42',
      emissiveIntensity: lit ? 0.03 + rng() * 0.02 : 0,
      texKey: 'old_city', texIdx,
    });
  }

  // ── Ain M'lila – Industrial outskirts west ────────────────────────────
  for (let i = 0; i < 50; i++) {
    const x       = -295 + rng() * 90;
    const z       =  -95 + rng() * 190;
    const h       = 5 + rng() * 18;
    const factory = rng() > 0.6;
    const lit     = rng() > 0.6;
    const w       = factory ? 20 + rng() * 15 : 8 + rng() * 8;
    const d       = factory ? 15 + rng() * 10 : 8 + rng() * 8;
    const texIdx  = Math.floor(rng() * 4);
    list.push({
      x, z, w, d, district: 'ain_mlila', h,
      color: '#ffffff', emissive: '#ff4400',
      emissiveIntensity: lit ? 0.03 : 0,
      texKey: 'ain_mlila', texIdx,
    });
  }

  return list;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

/** Full building list — used by City.tsx (render) and MiniMap.tsx (2D footprints) */
export const BUILDINGS: BuildingData[] = generate();

/** Flat AABB list for per-frame collision in Player.tsx.
 *  Each entry is derived from BUILDINGS, so indices correspond. */
export const BUILDING_AABBS: BuildingAABB[] = BUILDINGS.map((b) => ({
  cx: b.x, cz: b.z, hw: b.w / 2, hd: b.d / 2,
}));
