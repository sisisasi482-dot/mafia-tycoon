/**
 * Door triggers in the city + interior room layouts.
 * All interiors are placed far east (centerX ≥ 700) to avoid overlap with the city.
 *
 * Door trigger world positions scaled 2× to match the expanded city map.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DoorTrigger {
  id: string;
  label: string;
  worldX: number;
  worldZ: number;
  radius: number;       // interaction distance (units)
  interiorId: string;
  color: string;        // door frame accent colour shown in City.tsx
}

export interface FurniturePiece {
  pos:    [number, number, number]; // local offset from room center
  size:   [number, number, number];
  color:  string;
  roughness?:         number;
  metalness?:         number;
  emissive?:          string;
  emissiveIntensity?: number;
}

export interface InteriorLayout {
  id:     string;
  label:  string;
  centerX: number;      // world X of room centre
  centerZ: number;      // world Z of room centre
  roomW:  number;
  roomH:  number;
  roomD:  number;
  furniture: FurniturePiece[];
  lightColor:     string;
  lightIntensity: number;
  floorColor: string;
  wallColor:  string;
  /** Offset from center to the exit (door) wall mid-point */
  exitOffsetX: number;
  exitOffsetZ: number;
}

export interface NpcTalker {
  id:       string;
  label:    string;
  worldX:   number;
  worldZ:   number;
  radius:   number;
  dialogue: string;
}

// ─── Interior layouts (placed at x ≥ 700 to stay clear of the city) ──────────

export const INTERIORS: Record<string, InteriorLayout> = {

  corner_store: {
    id: 'corner_store', label: 'Corner Store',
    centerX: 700, centerZ: 0,
    roomW: 10, roomH: 3.5, roomD: 8,
    lightColor: '#fff8e0', lightIntensity: 1.4,
    floorColor: '#c8b89a', wallColor: '#e8e0d0',
    exitOffsetX: 0, exitOffsetZ: 4,
    furniture: [
      { pos: [0, 0.5, -2.5], size: [6, 1, 1], color: '#8b6914' },                   // counter
      { pos: [-3.5, 1.2, 0], size: [0.3, 2, 5], color: '#9b7a34' },                 // shelf L
      { pos: [ 3.5, 1.2, 0], size: [0.3, 2, 5], color: '#9b7a34' },                 // shelf R
      { pos: [-3.2, 0.8, -1.5], size: [0.4, 0.4, 0.4], color: '#cc3333' },
      { pos: [-3.2, 0.8,  0.0], size: [0.4, 0.4, 0.4], color: '#3366cc' },
      { pos: [-3.2, 0.8,  1.5], size: [0.4, 0.4, 0.4], color: '#33aa44' },
      { pos: [-3.2, 1.3, -1.5], size: [0.4, 0.4, 0.4], color: '#cc8833' },
      { pos: [-3.2, 1.3,  1.5], size: [0.4, 0.4, 0.4], color: '#8833cc' },
      { pos: [1.5, 1.05, -2.5], size: [0.6, 0.3, 0.4], color: '#222222',
        emissive: '#00ff44', emissiveIntensity: 0.3 },
      { pos: [3.8, 1.0, -2], size: [0.5, 2, 1.5], color: '#dddddd', metalness: 0.5 },
    ],
  },

  police_station: {
    id: 'police_station', label: 'Police Station',
    centerX: 700, centerZ: 30,
    roomW: 14, roomH: 4, roomD: 12,
    lightColor: '#ddeeff', lightIntensity: 1.6,
    floorColor: '#808090', wallColor: '#c0c8d8',
    exitOffsetX: 0, exitOffsetZ: 6,
    furniture: [
      { pos: [0, 0.65, -3], size: [8, 1.3, 1.2], color: '#444466' },
      { pos: [-1.5, 1.35, -3.3], size: [0.8, 0.6, 0.1], color: '#111122',
        emissive: '#2244ff', emissiveIntensity: 0.5 },
      { pos: [ 1.5, 1.35, -3.3], size: [0.8, 0.6, 0.1], color: '#111122',
        emissive: '#2244ff', emissiveIntensity: 0.5 },
      { pos: [-4.5, 1.5, 1],  size: [0.1, 3, 5],   color: '#444444', metalness: 0.8 },
      { pos: [-3.5, 1.5, 3.5], size: [5, 3, 0.1],  color: '#444444', metalness: 0.8 },
      { pos: [2,  0.25, 1], size: [0.8, 0.5, 0.8], color: '#336688' },
      { pos: [4,  0.25, 1], size: [0.8, 0.5, 0.8], color: '#336688' },
      { pos: [5.5, 2.5, -5.5], size: [2.5, 1.5, 0.08], color: '#1a3a8a' },
      { pos: [-2, 2.5, -5.5],  size: [1,   1.4, 0.08], color: '#f0e0c0' },
    ],
  },

  safe_house: {
    id: 'safe_house', label: 'Safe House',
    centerX: 700, centerZ: 60,
    roomW: 10, roomH: 3, roomD: 10,
    lightColor: '#ffa060', lightIntensity: 0.9,
    floorColor: '#5a4020', wallColor: '#8a7060',
    exitOffsetX: 0, exitOffsetZ: 5,
    furniture: [
      { pos: [-2.5, 0.35, -2.5],  size: [3.5, 0.7, 5.5], color: '#2a2a4a' },
      { pos: [-2.5, 0.75, -4.5],  size: [3.5, 0.5, 1.5], color: '#1a1a3a' },
      { pos: [2.5,  0.4,  -3.5],  size: [3,   0.8, 1.5], color: '#6b4210' },
      { pos: [2.5,  0.85, -3.5],  size: [0.9, 0.6, 0.1], color: '#111111',
        emissive: '#00aaff', emissiveIntensity: 0.4 },
      { pos: [4.6, 1.5, -4.5],    size: [0.8, 1,   0.8], color: '#222222', metalness: 0.7 },
      { pos: [2.5, 0.25, -2],     size: [0.8, 0.5, 0.8], color: '#4a3010' },
      { pos: [0,   1.2,  -4.7],   size: [2,   1.2, 0.1], color: '#111111',
        emissive: '#1a1a2a', emissiveIntensity: 0.2 },
      { pos: [-3.5, 0.3,  2],     size: [1.5, 0.6, 1],   color: '#4a3a2a' },
      { pos: [4.6,  2,    0],     size: [0.08, 1.5, 2.5], color: '#c0a870' },
    ],
  },

  warehouse: {
    id: 'warehouse', label: 'Warehouse',
    centerX: 700, centerZ: 90,
    roomW: 18, roomH: 7, roomD: 14,
    lightColor: '#ffd080', lightIntensity: 0.7,
    floorColor: '#303030', wallColor: '#484848',
    exitOffsetX: 0, exitOffsetZ: 7,
    furniture: [
      { pos: [-5, 1,  -4], size: [3, 2, 2.5], color: '#8b7055' },
      { pos: [-5, 1,  -1], size: [3, 2, 2.5], color: '#7a6045' },
      { pos: [-5, 3, -2.5], size: [3, 2, 5],  color: '#9b8065' },
      { pos: [ 5, 1,  -4], size: [3, 2, 2.5], color: '#6a7a55' },
      { pos: [ 5, 1,  -1], size: [3, 2, 2.5], color: '#5a6a45' },
      { pos: [ 2, 0.5,  3], size: [1.5, 1, 2.5], color: '#e8a020' },
      { pos: [ 2, 1.5,  4.5], size: [0.2, 2, 0.2], color: '#cc8010' },
      { pos: [-2, 0.5,  3], size: [0.7, 1, 0.7], color: '#1a1a1a',
        emissive: '#ff3300', emissiveIntensity: 0.08 },
      { pos: [-1, 0.5,  3], size: [0.7, 1, 0.7], color: '#1a1a1a' },
      { pos: [-2, 0.5,  2], size: [0.7, 1, 0.7], color: '#1a1a1a' },
      { pos: [ 5, 0.4,  3], size: [3,   0.8, 1.5], color: '#5a4a3a' },
    ],
  },

  restaurant: {
    id: 'restaurant', label: 'Restaurant',
    centerX: 700, centerZ: 120,
    roomW: 12, roomH: 3.5, roomD: 10,
    lightColor: '#ffcc88', lightIntensity: 1.2,
    floorColor: '#a08060', wallColor: '#e8d8c0',
    exitOffsetX: 0, exitOffsetZ: 5,
    furniture: [
      { pos: [-2.5, 0.4, -1], size: [1.8, 0.08, 1.2], color: '#5a3a10' },
      { pos: [ 2.5, 0.4, -1], size: [1.8, 0.08, 1.2], color: '#5a3a10' },
      { pos: [-2.5, 0.4,  2], size: [1.8, 0.08, 1.2], color: '#5a3a10' },
      { pos: [ 2.5, 0.4,  2], size: [1.8, 0.08, 1.2], color: '#5a3a10' },
      { pos: [-3.5, 0.25, -1], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [-1.5, 0.25, -1], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [ 1.5, 0.25, -1], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [ 3.5, 0.25, -1], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [-3.5, 0.25,  2], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [-1.5, 0.25,  2], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [ 1.5, 0.25,  2], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [ 3.5, 0.25,  2], size: [0.7, 0.5, 0.7], color: '#3a2010' },
      { pos: [0, 0.5, -4], size: [8, 1, 1], color: '#888888', metalness: 0.4 },
      { pos: [-2, 0.55, -4.3], size: [1.5, 0.2, 0.6], color: '#333333',
        emissive: '#ff4400', emissiveIntensity: 0.15 },
      { pos: [4.8, 2, -4], size: [0.08, 1.5, 2], color: '#1a1a1a',
        emissive: '#aaff88', emissiveIntensity: 0.15 },
    ],
  },

  medina_shop: {
    id: 'medina_shop', label: 'Medina Shop',
    centerX: 700, centerZ: 150,
    roomW: 8, roomH: 3, roomD: 8,
    lightColor: '#ffaa40', lightIntensity: 1.0,
    floorColor: '#c4a060', wallColor: '#d4c090',
    exitOffsetX: 0, exitOffsetZ: 4,
    furniture: [
      { pos: [0, 0.3, 0], size: [5, 0.6, 2], color: '#8b6030' },
      { pos: [-2, 1, 0], size: [0.4, 1.5, 0.4], color: '#cc3333' },
      { pos: [-1, 1, 0], size: [0.4, 1.5, 0.4], color: '#3333cc' },
      { pos: [ 0, 1, 0], size: [0.4, 1.5, 0.4], color: '#33aa44' },
      { pos: [ 1, 1, 0], size: [0.4, 1.5, 0.4], color: '#cc8833' },
      { pos: [ 2, 1, 0], size: [0.4, 1.5, 0.4], color: '#8833cc' },
      { pos: [-1.5, 2.6, -2], size: [0.3, 0.3, 0.3], color: '#ffaa00',
        emissive: '#ffaa00', emissiveIntensity: 2 },
      { pos: [ 1.5, 2.6, -2], size: [0.3, 0.3, 0.3], color: '#ff8800',
        emissive: '#ff8800', emissiveIntensity: 2 },
      { pos: [0, 1.5, -3.5], size: [6, 0.1, 1], color: '#8b6030' },
      { pos: [-2, 1.65, -3.5], size: [0.4, 0.4, 0.4], color: '#c07040' },
      { pos: [ 0, 1.65, -3.5], size: [0.5, 0.6, 0.5], color: '#a06030' },
      { pos: [ 2, 1.65, -3.5], size: [0.3, 0.5, 0.3], color: '#d08050' },
    ],
  },

  airport_terminal: {
    id: 'airport_terminal', label: 'Airport Terminal',
    centerX: 700, centerZ: 180,
    roomW: 20, roomH: 5, roomD: 12,
    lightColor: '#ffffff', lightIntensity: 1.8,
    floorColor: '#e0e8f0', wallColor: '#f0f4f8',
    exitOffsetX: 0, exitOffsetZ: 6,
    furniture: [
      { pos: [-6, 0.55, -3], size: [3, 1.1, 1], color: '#3355aa' },
      { pos: [-2, 0.55, -3], size: [3, 1.1, 1], color: '#3355aa' },
      { pos: [ 2, 0.55, -3], size: [3, 1.1, 1], color: '#3355aa' },
      { pos: [ 6, 0.55, -3], size: [3, 1.1, 1], color: '#3355aa' },
      { pos: [-6, 1.15, -3.4], size: [0.7, 0.5, 0.08], color: '#111122',
        emissive: '#2244ff', emissiveIntensity: 0.6 },
      { pos: [-2, 1.15, -3.4], size: [0.7, 0.5, 0.08], color: '#111122',
        emissive: '#2244ff', emissiveIntensity: 0.6 },
      { pos: [ 2, 1.15, -3.4], size: [0.7, 0.5, 0.08], color: '#111122',
        emissive: '#2244ff', emissiveIntensity: 0.6 },
      { pos: [ 6, 1.15, -3.4], size: [0.7, 0.5, 0.08], color: '#111122',
        emissive: '#2244ff', emissiveIntensity: 0.6 },
      { pos: [0, 3.5, -5.5], size: [10, 1.5, 0.15], color: '#111122',
        emissive: '#ffaa00', emissiveIntensity: 0.4 },
      { pos: [-4, 0.35, 2], size: [4, 0.7, 0.6], color: '#445577' },
      { pos: [ 4, 0.35, 2], size: [4, 0.7, 0.6], color: '#445577' },
      { pos: [-4, 0.35, 4], size: [4, 0.7, 0.6], color: '#445577' },
      { pos: [ 4, 0.35, 4], size: [4, 0.7, 0.6], color: '#445577' },
      { pos: [0, 1, 0], size: [0.3, 2, 1.5], color: '#666666', metalness: 0.6 },
      { pos: [2, 1, 0], size: [0.3, 2, 1.5], color: '#666666', metalness: 0.6 },
      { pos: [1, 0.1, 0], size: [2, 0.2, 1.5], color: '#444444', metalness: 0.8 },
    ],
  },
};

// ─── Door triggers in world space (2× scale) ─────────────────────────────────

export const DOOR_TRIGGERS: DoorTrigger[] = [
  { id: 'dt_corner_store',     label: 'Corner Store',     worldX: -236, worldZ:  10, radius: 4.0, interiorId: 'corner_store',     color: '#e8c83a' },
  { id: 'dt_police_station',   label: 'Police Station',   worldX:   60, worldZ:  84, radius: 4.0, interiorId: 'police_station',   color: '#1a3aee' },
  { id: 'dt_safe_house',       label: 'Safe House',       worldX: -170, worldZ: -50, radius: 3.5, interiorId: 'safe_house',       color: '#444444' },
  { id: 'dt_warehouse',        label: 'Warehouse',        worldX: -524, worldZ:  56, radius: 5.0, interiorId: 'warehouse',        color: '#777777' },
  { id: 'dt_restaurant',       label: 'Restaurant',       worldX:   36, worldZ: -16, radius: 3.5, interiorId: 'restaurant',       color: '#cc4411' },
  { id: 'dt_medina_shop',      label: 'Medina Shop',      worldX:  264, worldZ: -30, radius: 3.5, interiorId: 'medina_shop',      color: '#d4a030' },
  { id: 'dt_airport_terminal', label: 'Airport Terminal', worldX: -296, worldZ: 280, radius: 6.0, interiorId: 'airport_terminal', color: '#4169e1' },
];

// ─── Stationary NPC interaction markers (2× scale) ───────────────────────────

export const NPC_TALKERS: NpcTalker[] = [
  { id: 'npc_dealer',  label: 'Street Dealer', worldX: -256, worldZ:  24, radius: 4, dialogue: '"You lookin\' for somethin\'?"' },
  { id: 'npc_elder',   label: 'Elder',          worldX:  290, worldZ: -36, radius: 4, dialogue: '"Constantine stood long before any of us."' },
  { id: 'npc_contact', label: 'Contact',        worldX:   44, worldZ: -10, radius: 4, dialogue: '"Meet me tonight. Usual spot."' },
];
