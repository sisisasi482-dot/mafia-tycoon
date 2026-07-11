/**
 * mapData.ts — single source of truth for everything the mini-map and full
 * map screen draw. Coordinates here are pulled directly from the real
 * world-building files (cityLayout.ts, interiors.ts DOOR_TRIGGERS,
 * Police.tsx) so the map can never drift out of sync with the actual
 * playable world again.
 *
 * If a new door/property/landmark is added to the world, add its entry
 * here and both map views pick it up automatically.
 */

import { DISTRICTS } from './constants';

/** Full world extent — the union of every authoritative bound in the
 *  codebase: the player movement clamp (Player.tsx, x:[-455,455] z:[-205,205]),
 *  every DISTRICTS bounding box (game/constants.ts, out to x:[-600,500]
 *  z:[-200,500] for ain_mlila/old_city/airport), and the outermost door
 *  triggers / NPC patrol points. Deliberately generous so no district or
 *  landmark is ever cropped off the map, even ones (like the airport zone)
 *  that extend past where the player can currently walk. */
export const WORLD_BOUNDS = { x0: -620, x1: 520, z0: -215, z1: 510 };

export type LandmarkCategory = 'police' | 'hospital' | 'shop' | 'property' | 'landmark' | 'gang';

export interface MapLandmark {
  id:       string;
  label:    string;
  icon:     string;
  x:        number;
  z:        number;
  category: LandmarkCategory;
}

/**
 * Landmarks shown on both map views. Positions are copied from the actual
 * gameplay data that places these locations in the 3D world:
 *  - Police Station: Police.tsx POLICE_STATION_RESPAWN — where an arrest
 *    teleports the player, the game's only concrete "station" coordinate.
 *  - Hospital / shops / properties: interiors.ts DOOR_TRIGGERS (worldX/worldZ).
 *  - Bank: cityLayout.ts BANK_POS.
 *
 * Extensible by design — gang/heist and mission phases can push their own
 * markers into a separate array and render them alongside LANDMARKS without
 * touching this list.
 */
export const LANDMARKS: MapLandmark[] = [
  { id: 'police_station', label: 'Police Station',            icon: '👮', x: 60,   z: 100,   category: 'police'   },
  { id: 'hospital',       label: 'City Hospital',              icon: '⚕️', x: 360,  z: 26,    category: 'hospital' },

  { id: 'weapons_shop',   label: 'Black Market Armory',        icon: '🔫', x: 240,  z: 28,    category: 'shop'     },
  // Ali Mendjeli Garage doubles as the car dealership + a storable garage — one marker, one door.
  { id: 'car_dealer',     label: 'Ali Mendjeli Garage (Cars)',  icon: '🚗', x: -220, z: 26,    category: 'shop'     },
  { id: 'convenience',    label: 'Corner Store',                icon: '🏪', x: 60,   z: -24,   category: 'shop'     },

  { id: 'bank',           label: 'Centre-Ville Bank',           icon: '🏦', x: 55,   z: -55,   category: 'landmark' },
  { id: 'hotel',          label: 'Grand Hotel Constantine',     icon: '🏨', x: 480,  z: 162,   category: 'landmark' },
  { id: 'real_estate',    label: 'Constantine Real Estate',    icon: '🏠', x: 440,  z: 155,   category: 'landmark' },
  { id: 'bar',            label: 'Café Constantine',            icon: '🍷', x: -300, z: -25,   category: 'landmark' },
  { id: 'safehouse_cv',   label: 'Centre-Ville Safehouse',      icon: '🔑', x: 270,  z: -26,   category: 'property' },

  // Gang hideout — mirrors the recruit spawn cluster in NPCs.tsx/GangFollowers.tsx.
  { id: 'gang_hideout',   label: 'Gang Hideout',                icon: '💀', x: -380, z: 138,   category: 'gang'     },
];

/** District bounding boxes — same DISTRICTS data used by real gameplay logic
 *  (constants.ts), so the shaded zones on the map match whichever district
 *  the player is actually standing in. */
export const MAP_DISTRICTS = Object.values(DISTRICTS);

/** Clamp a district rect to the world bounds purely for drawing purposes. */
export function clampDistrictRect(bounds: { x: readonly [number, number]; z: readonly [number, number] }) {
  return {
    x0: Math.max(WORLD_BOUNDS.x0, bounds.x[0]),
    x1: Math.min(WORLD_BOUNDS.x1, bounds.x[1]),
    z0: Math.max(WORLD_BOUNDS.z0, bounds.z[0]),
    z1: Math.min(WORLD_BOUNDS.z1, bounds.z[1]),
  };
}

/** Highway + landmark line features, also pulled from cityLayout.ts. */
export const HIGHWAY = { x0: -160, x1: 160, z: 0 };
export const GORGE   = { x0: 138, x1: 182, z0: -50, z1: 50 };
export const BRIDGE  = { x0: 138, x1: 182, z: 0, label: "Sidi M'Cid" };
export const BANK_POS: [number, number] = [55, -55];

/** Determine which district a world position falls in (mirrors DISTRICTS
 *  bounds so the highlighted zone always matches the player's real district). */
export function districtAt(x: number, z: number): string | null {
  for (const d of MAP_DISTRICTS) {
    if (x >= d.bounds.x[0] && x <= d.bounds.x[1] && z >= d.bounds.z[0] && z <= d.bounds.z[1]) {
      return d.id;
    }
  }
  return null;
}
