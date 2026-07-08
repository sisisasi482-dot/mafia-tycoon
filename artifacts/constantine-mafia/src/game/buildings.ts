/** Shared building footprint data used by both City (3D) and MiniMap (2D). */

function makeRng(seed: number) {
  let s = seed;
  return () => { s = Math.sin(s) * 43758.5453123; return s - Math.floor(s); };
}

export interface BuildingFootprint {
  x: number; z: number;
  w: number; d: number;
  district: 'ali_mendjeli' | 'centre_ville' | 'old_city' | 'ain_mlila';
}

function generate(): BuildingFootprint[] {
  const rng = makeRng(42);
  const list: BuildingFootprint[] = [];

  for (let i = 0; i < 80; i++) {
    list.push({ x: -195 + rng() * 140, z: -95 + rng() * 190, w: 14 + rng() * 8, d: 14 + rng() * 8, district: 'ali_mendjeli' });
  }
  for (let i = 0; i < 90; i++) {
    list.push({ x: -45 + rng() * 140,  z: -95 + rng() * 190, w: 7 + rng() * 7,  d: 7 + rng() * 7,  district: 'centre_ville' });
  }
  for (let i = 0; i < 110; i++) {
    const x = 105 + rng() * 140;
    if (x > 138 && x < 182) { rng(); rng(); continue; }
    list.push({ x, z: -45 + rng() * 90, w: 4 + rng() * 6, d: 4 + rng() * 6, district: 'old_city' });
  }
  for (let i = 0; i < 50; i++) {
    list.push({ x: -295 + rng() * 90, z: -95 + rng() * 190, w: 10 + rng() * 15, d: 10 + rng() * 10, district: 'ain_mlila' });
  }

  return list;
}

export const BUILDINGS: BuildingFootprint[] = generate();
