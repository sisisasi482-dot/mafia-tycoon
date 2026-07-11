/**
 * interiors.ts — door triggers in the city + interior room layouts.
 *
 * Interior rooms are placed far east (centerX ≥ 800) so they never
 * overlap with the city geometry. The player is teleported there on
 * "Enter" and returned to the door world-position on "Exit".
 *
 * Door trigger positions are placed along the clear central boulevard
 * (z ∈ [−35, 35]) of each city, so they are always accessible.
 *
 * ── Interior map ──
 *   weapons_shop    x=800   Weapons Dealer in City B
 *   convenience     x=820   Corner Store near spawn
 *   safehouse_cv    x=840   Centre-Ville Safehouse (owned property)
 *   garage_am       x=860   Ali Mendjeli Garage (owned property)
 *   bar_old_city    x=880   Café Constantine, City A
 *   hospital        x=900   City Hospital, City B
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DoorTrigger {
  id: string;
  label: string;
  worldX: number;
  worldZ: number;
  radius: number;
  interiorId: string;
  color: string;
  propertyId?:   string;
  propertyType?: 'home' | 'garage';
}

export interface FurniturePiece {
  pos:    [number, number, number];
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
  centerX: number;
  centerZ: number;
  roomW:  number;
  roomH:  number;
  roomD:  number;
  furniture: FurniturePiece[];
  lightColor:     string;
  lightIntensity: number;
  floorColor: string;
  wallColor:  string;
  exitOffsetX: number;
  exitOffsetZ: number;
}

export interface DialogueOption {
  id:           string;
  label:        string;
  kind:         'buy' | 'info' | 'conflict';
  cost?:        number;
  itemId?:      string;
  responseText: string;
}

export interface NpcTalker {
  id:       string;
  label:    string;
  worldX:   number;
  worldZ:   number;
  radius:   number;
  dialogue: string;
  options?: DialogueOption[];
  shopType?: 'consumables' | 'ammo' | 'weapons' | 'vehicles' | 'hospital';
}

// ─── Interior room layouts ────────────────────────────────────────────────────

export const INTERIORS: Record<string, InteriorLayout> = {

  // ── Weapons Dealer / Black Market Armory ─────────────────────────────────
  weapons_shop: {
    id: 'weapons_shop',
    label: 'Black Market Armory',
    centerX: 800, centerZ: 0,
    roomW: 16, roomH: 3.2, roomD: 12,
    lightColor: '#ffaa55', lightIntensity: 3.0,
    floorColor: '#1e1e1e',
    wallColor:  '#161418',
    exitOffsetX: 0, exitOffsetZ: 6,
    furniture: [
      // Glass display counter across the back
      { pos: [0, 0.55, -4.6], size: [11, 1.1, 1.3], color: '#2a2a30', metalness: 0.45, roughness: 0.35 },
      { pos: [0, 0.20, -4.6], size: [11, 0.4, 1.3], color: '#557799', metalness: 0.5, roughness: 0.25, emissive: '#112233', emissiveIntensity: 0.3 },
      // Weapon rack panels on back wall (dark boards)
      { pos: [-3.5, 2.2, -5.85], size: [4.5, 0.18, 0.12], color: '#1a1010', roughness: 0.9 },
      { pos: [ 3.5, 2.2, -5.85], size: [4.5, 0.18, 0.12], color: '#1a1010', roughness: 0.9 },
      // Rack pegs (weapon silhouette markers)
      { pos: [-4.8, 2.25, -5.84], size: [0.08, 0.06, 0.08], color: '#888888', metalness: 0.7 },
      { pos: [-3.5, 2.25, -5.84], size: [0.08, 0.06, 0.08], color: '#888888', metalness: 0.7 },
      { pos: [-2.2, 2.25, -5.84], size: [0.08, 0.06, 0.08], color: '#888888', metalness: 0.7 },
      { pos: [ 2.2, 2.25, -5.84], size: [0.08, 0.06, 0.08], color: '#888888', metalness: 0.7 },
      { pos: [ 3.5, 2.25, -5.84], size: [0.08, 0.06, 0.08], color: '#888888', metalness: 0.7 },
      { pos: [ 4.8, 2.25, -5.84], size: [0.08, 0.06, 0.08], color: '#888888', metalness: 0.7 },
      // Ammo crates stacked on floor left side
      { pos: [-6.2, 0.4,  -3.5], size: [1.6, 0.8, 2.0], color: '#3a4a22', roughness: 0.9 },
      { pos: [-6.2, 1.2,  -3.5], size: [1.6, 0.8, 1.6], color: '#2e3c1a', roughness: 0.9 },
      // Ammo crates right side
      { pos: [ 6.2, 0.4,  -3.0], size: [1.6, 0.8, 2.0], color: '#3a4a22', roughness: 0.9 },
      // Security camera bracket on ceiling
      { pos: [0, 3.15, -1.5], size: [0.4, 0.1, 0.4], color: '#1a1a1a', roughness: 0.6, metalness: 0.4 },
      // Ceiling neon tube (emissive) — red tint
      { pos: [0, 3.12, -3.0], size: [8, 0.08, 0.12], color: '#ff3333', emissive: '#ff2222', emissiveIntensity: 1.6 },
      // Floor mat at entrance
      { pos: [0, 0.015, 4.8], size: [3.5, 0.03, 2.2], color: '#3a0000', roughness: 0.98 },
    ],
  },

  // ── Corner Convenience Store ─────────────────────────────────────────────
  convenience: {
    id: 'convenience',
    label: 'Corner Store',
    centerX: 820, centerZ: 0,
    roomW: 14, roomH: 3.0, roomD: 10,
    lightColor: '#ffffdd', lightIntensity: 3.5,
    floorColor: '#c8c4b0',
    wallColor:  '#e0ddd0',
    exitOffsetX: 0, exitOffsetZ: 5,
    furniture: [
      // Service counter front-left
      { pos: [-4.5, 0.9, -3.8], size: [3.5, 1.8, 1.2], color: '#8a7a60', roughness: 0.7 },
      { pos: [-4.5, 1.75, -3.8], size: [3.6, 0.06, 1.3], color: '#a09070', roughness: 0.6 },
      // Cash register on counter
      { pos: [-4.0, 1.85, -4.0], size: [0.6, 0.4, 0.4], color: '#333333', roughness: 0.5, metalness: 0.3 },
      // Shelving units (back wall)
      { pos: [ 0, 1.2, -4.7], size: [10, 2.4, 0.3], color: '#c8c0a8', roughness: 0.75 },
      // Shelf dividers
      { pos: [-3, 0.6, -4.6], size: [0.06, 2.4, 0.28], color: '#aaa090', roughness: 0.8 },
      { pos: [ 3, 0.6, -4.6], size: [0.06, 2.4, 0.28], color: '#aaa090', roughness: 0.8 },
      // Products on shelves (colourful boxes proxy)
      { pos: [-4.5, 0.55, -4.55], size: [2.4, 0.55, 0.22], color: '#cc4422', roughness: 0.9 },
      { pos: [ 1.5, 0.55, -4.55], size: [2.4, 0.55, 0.22], color: '#2244cc', roughness: 0.9 },
      { pos: [-1.5, 1.15, -4.55], size: [2.6, 0.55, 0.22], color: '#22aa44', roughness: 0.9 },
      { pos: [ 3.5, 1.75, -4.55], size: [2.4, 0.55, 0.22], color: '#cc9922', roughness: 0.9 },
      // Refrigerator unit right wall
      { pos: [6.2, 1.4, -1.5], size: [1.2, 2.8, 5.0], color: '#c0c8d0', roughness: 0.4, metalness: 0.2 },
      { pos: [6.6, 1.4, -1.5], size: [0.06, 2.6, 4.8], color: '#88aacc', roughness: 0.2, metalness: 0.3, emissive: '#445566', emissiveIntensity: 0.4 },
      // Floor display stand
      { pos: [2.5, 0.6, 1.5], size: [1.2, 1.2, 1.2], color: '#aa8822', roughness: 0.85 },
      // Entrance mat
      { pos: [0, 0.015, 4.5], size: [3, 0.03, 1.5], color: '#2a4a22', roughness: 0.98 },
    ],
  },

  // ── Centre-Ville Safehouse ───────────────────────────────────────────────
  safehouse_cv: {
    id: 'safehouse_cv',
    label: 'Centre-Ville Safehouse',
    centerX: 840, centerZ: 0,
    roomW: 14, roomH: 3.0, roomD: 10,
    lightColor: '#ffcc88', lightIntensity: 2.5,
    floorColor: '#3a2e20',
    wallColor:  '#2a2418',
    exitOffsetX: 0, exitOffsetZ: 5,
    furniture: [
      // Bed (back-left)
      { pos: [-4.5, 0.35, -4.0], size: [3.5, 0.7, 5.5], color: '#1a1a2a', roughness: 0.9 },
      { pos: [-4.5, 0.72, -4.0], size: [3.6, 0.05, 5.6], color: '#8a4a2a', roughness: 0.85 }, // blanket
      { pos: [-4.5, 0.90, -5.9], size: [3.5, 0.5, 0.4], color: '#d4c8b0', roughness: 0.8 },   // pillow
      // Side table + lamp
      { pos: [-2.3, 0.55, -4.8], size: [0.9, 1.1, 0.9], color: '#4a3818', roughness: 0.8 },
      { pos: [-2.3, 1.2, -4.8], size: [0.2, 0.5, 0.2], color: '#c8a860', roughness: 0.6 },
      { pos: [-2.3, 1.48, -4.8], size: [0.5, 0.15, 0.5], color: '#ffeecc', emissive: '#ffdd88', emissiveIntensity: 1.8, roughness: 0.6 },
      // Couch (opposite wall)
      { pos: [4.5, 0.45, -3.5], size: [3.8, 0.9, 1.8], color: '#3a2a1a', roughness: 0.88 },
      { pos: [4.5, 0.92, -4.3], size: [3.8, 0.85, 0.3], color: '#3a2a1a', roughness: 0.88 }, // back cushion
      // Coffee table
      { pos: [3.5, 0.36, -1.0], size: [2.2, 0.72, 1.4], color: '#2e1e0e', roughness: 0.7 },
      { pos: [3.5, 0.72, -1.0], size: [2.2, 0.04, 1.4], color: '#5a4028', roughness: 0.5 }, // glass top
      // TV unit + screen
      { pos: [-3.5, 0.55, 4.5], size: [4.5, 1.1, 0.6], color: '#1a1a1a', roughness: 0.5 },
      { pos: [-3.5, 1.45, 4.6], size: [3.8, 2.0, 0.1], color: '#0a0a0a', roughness: 0.2, emissive: '#112244', emissiveIntensity: 0.5 },
      // Wardrobe (back-right)
      { pos: [5.5, 1.5, -4.6], size: [2.0, 3.0, 0.65], color: '#2e1e0e', roughness: 0.7 },
      // Kitchen counter (right wall)
      { pos: [6.2, 0.85, 1.5], size: [1.2, 1.7, 4.5], color: '#404038', roughness: 0.7 },
      { pos: [6.2, 1.7, 1.5], size: [1.25, 0.05, 4.6], color: '#787860', roughness: 0.4, metalness: 0.2 },
      // Floor rug under couch
      { pos: [3.8, 0.018, -1.5], size: [5.5, 0.03, 4.5], color: '#6a4020', roughness: 0.99 },
    ],
  },

  // ── Ali Mendjeli Garage ──────────────────────────────────────────────────
  garage_am: {
    id: 'garage_am',
    label: 'Ali Mendjeli Garage',
    centerX: 860, centerZ: 0,
    roomW: 22, roomH: 5.0, roomD: 16,
    lightColor: '#ffffff', lightIntensity: 2.2,
    floorColor: '#1c1c1c',
    wallColor:  '#2a2a28',
    exitOffsetX: 0, exitOffsetZ: 8,
    furniture: [
      // Vehicle lift platform (centre floor)
      { pos: [0, 0.08, 0], size: [6.5, 0.16, 12], color: '#1a1a18', roughness: 0.85, metalness: 0.2 },
      { pos: [-3.1, 0.08, 0], size: [0.18, 0.6, 12], color: '#555550', roughness: 0.7, metalness: 0.4 },
      { pos: [ 3.1, 0.08, 0], size: [0.18, 0.6, 12], color: '#555550', roughness: 0.7, metalness: 0.4 },
      // Lift arm beams
      { pos: [-3.1, 1.8, -4.0], size: [0.18, 3.6, 0.18], color: '#888880', roughness: 0.5, metalness: 0.5 },
      { pos: [ 3.1, 1.8, -4.0], size: [0.18, 3.6, 0.18], color: '#888880', roughness: 0.5, metalness: 0.5 },
      { pos: [-3.1, 1.8,  4.0], size: [0.18, 3.6, 0.18], color: '#888880', roughness: 0.5, metalness: 0.5 },
      { pos: [ 3.1, 1.8,  4.0], size: [0.18, 3.6, 0.18], color: '#888880', roughness: 0.5, metalness: 0.5 },
      // Workbench (right wall)
      { pos: [9.8, 0.9, -3.0], size: [1.8, 1.8, 8.0], color: '#2e2a22', roughness: 0.8 },
      { pos: [9.8, 1.8, -3.0], size: [1.85, 0.06, 8.1], color: '#4a4438', roughness: 0.6 },
      // Vice on bench
      { pos: [9.8, 1.92, -5.8], size: [0.7, 0.28, 0.55], color: '#555555', roughness: 0.4, metalness: 0.6 },
      // Tool cabinet (back wall right)
      { pos: [7.5, 1.5, -7.3], size: [2.4, 3.0, 0.7], color: '#cc3300', roughness: 0.5, metalness: 0.2 },
      { pos: [7.5, 1.0, -7.0], size: [2.3, 0.06, 0.5], color: '#aaaaaa', roughness: 0.4, metalness: 0.4 },
      { pos: [7.5, 1.6, -7.0], size: [2.3, 0.06, 0.5], color: '#aaaaaa', roughness: 0.4, metalness: 0.4 },
      { pos: [7.5, 2.2, -7.0], size: [2.3, 0.06, 0.5], color: '#aaaaaa', roughness: 0.4, metalness: 0.4 },
      // Tyre stack (left wall)
      { pos: [-9.5, 0.5, -4.0], size: [1.6, 1.0, 1.6], color: '#1a1a1a', roughness: 0.95 },
      { pos: [-9.5, 1.5, -4.0], size: [1.6, 1.0, 1.6], color: '#1a1a1a', roughness: 0.95 },
      { pos: [-9.5, 0.5, -1.6], size: [1.6, 1.0, 1.6], color: '#222222', roughness: 0.95 },
      // Oil drum pair
      { pos: [-9.0, 0.8,  3.5], size: [0.8, 1.6, 0.8], color: '#1a3a1a', roughness: 0.7, metalness: 0.3 },
      { pos: [-8.0, 0.8,  3.5], size: [0.8, 1.6, 0.8], color: '#3a1a1a', roughness: 0.7, metalness: 0.3 },
      // Ceiling fluorescent tubes (emissive)
      { pos: [-4, 4.88, 0], size: [6, 0.08, 0.15], color: '#ffffff', emissive: '#eeeeff', emissiveIntensity: 2.0 },
      { pos: [ 4, 4.88, 0], size: [6, 0.08, 0.15], color: '#ffffff', emissive: '#eeeeff', emissiveIntensity: 2.0 },
      // Oil stain on floor
      { pos: [0, 0.013, -1], size: [5, 0.02, 4], color: '#111110', roughness: 0.99 },
    ],
  },

  // ── Café Constantine (bar/social hangout) ───────────────────────────────
  bar_old_city: {
    id: 'bar_old_city',
    label: 'Café Constantine',
    centerX: 880, centerZ: 0,
    roomW: 15, roomH: 3.2, roomD: 11,
    lightColor: '#ffaa33', lightIntensity: 2.8,
    floorColor: '#3a2a18',
    wallColor:  '#2a1c10',
    exitOffsetX: 0, exitOffsetZ: 5.5,
    furniture: [
      // Bar counter (L-shaped, back wall)
      { pos: [0, 1.05, -4.5], size: [11, 2.1, 1.4], color: '#3a2810', roughness: 0.65 },
      { pos: [0, 2.08, -4.5], size: [11.1, 0.06, 1.5], color: '#6a4a22', roughness: 0.5 },
      // Bar stool row
      { pos: [-4.0, 0.85,  -2.8], size: [0.55, 1.7, 0.55], color: '#1a1a1a', roughness: 0.7, metalness: 0.3 },
      { pos: [-1.5, 0.85,  -2.8], size: [0.55, 1.7, 0.55], color: '#1a1a1a', roughness: 0.7, metalness: 0.3 },
      { pos: [ 1.0, 0.85,  -2.8], size: [0.55, 1.7, 0.55], color: '#1a1a1a', roughness: 0.7, metalness: 0.3 },
      { pos: [ 3.5, 0.85,  -2.8], size: [0.55, 1.7, 0.55], color: '#1a1a1a', roughness: 0.7, metalness: 0.3 },
      // Bar stool seats
      { pos: [-4.0, 1.75,  -2.8], size: [0.9, 0.1, 0.9], color: '#4a2818', roughness: 0.85 },
      { pos: [-1.5, 1.75,  -2.8], size: [0.9, 0.1, 0.9], color: '#4a2818', roughness: 0.85 },
      { pos: [ 1.0, 1.75,  -2.8], size: [0.9, 0.1, 0.9], color: '#4a2818', roughness: 0.85 },
      { pos: [ 3.5, 1.75,  -2.8], size: [0.9, 0.1, 0.9], color: '#4a2818', roughness: 0.85 },
      // Liquor shelf (back wall, above counter)
      { pos: [ 0, 2.6, -5.3], size: [8.0, 0.12, 0.4], color: '#5a3c18', roughness: 0.7 },
      { pos: [ 0, 2.2, -5.3], size: [8.0, 0.12, 0.4], color: '#5a3c18', roughness: 0.7 },
      // Bottle proxies on shelf
      { pos: [-3, 2.35, -5.3], size: [0.18, 0.38, 0.18], color: '#336622', roughness: 0.3, metalness: 0.1 },
      { pos: [-2, 2.35, -5.3], size: [0.18, 0.38, 0.18], color: '#882222', roughness: 0.3, metalness: 0.1 },
      { pos: [-1, 2.35, -5.3], size: [0.18, 0.38, 0.18], color: '#226688', roughness: 0.3, metalness: 0.1 },
      { pos: [ 0, 2.35, -5.3], size: [0.18, 0.38, 0.18], color: '#aa8822', roughness: 0.3, metalness: 0.1 },
      { pos: [ 1, 2.35, -5.3], size: [0.18, 0.38, 0.18], color: '#663322', roughness: 0.3, metalness: 0.1 },
      { pos: [ 2, 2.35, -5.3], size: [0.18, 0.38, 0.18], color: '#224422', roughness: 0.3, metalness: 0.1 },
      // Small table cluster (right side)
      { pos: [5.5, 0.38,  1.0], size: [1.8, 0.76, 1.8], color: '#3a2810', roughness: 0.7 },
      { pos: [5.5, 0.76,  1.0], size: [1.9, 0.05, 1.9], color: '#5a3c1a', roughness: 0.55 },
      // Table chairs
      { pos: [4.2, 0.45,  1.0], size: [0.8, 0.9, 0.8], color: '#2a1a08', roughness: 0.8 },
      { pos: [6.8, 0.45,  1.0], size: [0.8, 0.9, 0.8], color: '#2a1a08', roughness: 0.8 },
      // Ceiling pendant light (emissive)
      { pos: [0, 3.12, -1.5], size: [0.4, 0.6, 0.4], color: '#cc7700', emissive: '#ff9900', emissiveIntensity: 2.5, roughness: 0.6 },
      // Floor tiles pattern (darker strip near bar)
      { pos: [0, 0.015, -3.0], size: [14, 0.03, 4.0], color: '#221810', roughness: 0.98 },
    ],
  },

  // ── City Hospital ─────────────────────────────────────────────────────────
  hospital: {
    id: 'hospital',
    label: 'City Hospital',
    centerX: 900, centerZ: 0,
    roomW: 18, roomH: 3.5, roomD: 14,
    lightColor: '#ffffff', lightIntensity: 3.5,
    floorColor: '#d0d0d0',
    wallColor:  '#e8e8e8',
    exitOffsetX: 0, exitOffsetZ: 7,
    furniture: [
      // Reception desk
      { pos: [0, 0.9, -5.5], size: [6, 1.8, 1.5], color: '#d8d0c8', roughness: 0.6 },
      { pos: [0, 1.8, -5.5], size: [6.1, 0.05, 1.6], color: '#f0f0f0', roughness: 0.5 },
      // Computer on desk
      { pos: [1.5, 1.9, -5.6], size: [0.8, 0.6, 0.12], color: '#1a1a1a', roughness: 0.4, emissive: '#224488', emissiveIntensity: 0.6 },
      // Medical beds (two exam beds)
      { pos: [-6.0, 0.5, -2.0], size: [2.2, 1.0, 5.5], color: '#e8e8e8', roughness: 0.7 },
      { pos: [-6.0, 1.0, -2.0], size: [2.2, 0.04, 5.5], color: '#f8f8f8', roughness: 0.55 }, // sheet
      { pos: [-6.0, 1.06,-4.5], size: [2.0, 0.35, 0.3], color: '#ffffff', roughness: 0.6 },  // pillow
      { pos: [ 6.0, 0.5, -2.0], size: [2.2, 1.0, 5.5], color: '#e8e8e8', roughness: 0.7 },
      { pos: [ 6.0, 1.0, -2.0], size: [2.2, 0.04, 5.5], color: '#f8f8f8', roughness: 0.55 },
      { pos: [ 6.0, 1.06,-4.5], size: [2.0, 0.35, 0.3], color: '#ffffff', roughness: 0.6 },
      // IV pole proxies
      { pos: [-4.5, 1.5, -4.5], size: [0.08, 3.0, 0.08], color: '#cccccc', roughness: 0.4, metalness: 0.5 },
      { pos: [ 7.5, 1.5, -4.5], size: [0.08, 3.0, 0.08], color: '#cccccc', roughness: 0.4, metalness: 0.5 },
      // Medical supply cabinet (back wall)
      { pos: [ 7.5, 1.5, -6.8], size: [2.0, 3.0, 0.6], color: '#f0f0ee', roughness: 0.5 },
      { pos: [ 7.5, 1.5, -6.5], size: [1.9, 0.06, 0.5], color: '#cccccc', roughness: 0.4 },
      { pos: [ 7.5, 2.1, -6.5], size: [1.9, 0.06, 0.5], color: '#cccccc', roughness: 0.4 },
      // Red cross sign
      { pos: [0, 3.3, -6.8], size: [1.5, 1.5, 0.12], color: '#cc0000', roughness: 0.6, emissive: '#ee0000', emissiveIntensity: 0.5 },
      // Ceiling light strips
      { pos: [0, 3.44, 0], size: [14, 0.06, 0.2], color: '#ffffff', emissive: '#eeeeff', emissiveIntensity: 1.5 },
      { pos: [0, 3.44, -3], size: [14, 0.06, 0.2], color: '#ffffff', emissive: '#eeeeff', emissiveIntensity: 1.5 },
      // Entrance mat
      { pos: [0, 0.015, 6.5], size: [4, 0.03, 1.5], color: '#335533', roughness: 0.98 },
    ],
  },
};

// ─── Door triggers ────────────────────────────────────────────────────────────
//
// Placed along city boulevards (z ∈ [−35, 35]) for guaranteed accessibility.
// City B spawn is (310, 1, 0), so City B doors are discovered first.
//
export const DOOR_TRIGGERS: DoorTrigger[] = [
  // ── City B doors ────────────────────────────────────────────────────────
  {
    id:         'door-weapons-shop',
    label:      'Black Market Armory',
    worldX:     240,
    worldZ:     28,
    radius:     5.0,
    interiorId: 'weapons_shop',
    color:      '#880000',
  },
  {
    id:          'door-safehouse-cv',
    label:       'Centre-Ville Safehouse',
    worldX:      270,
    worldZ:      -26,
    radius:      4.5,
    interiorId:  'safehouse_cv',
    color:       '#004488',
    propertyId:  'safehouse_cv',
    propertyType:'home',
  },
  {
    id:         'door-hospital',
    label:      'City Hospital',
    worldX:     360,
    worldZ:     26,
    radius:     5.5,
    interiorId: 'hospital',
    color:      '#ffffff',
  },
  {
    id:         'door-convenience',
    label:      'Corner Store',
    worldX:     60,
    worldZ:     -24,
    radius:     4.5,
    interiorId: 'convenience',
    color:      '#888800',
  },
  // ── City A doors ────────────────────────────────────────────────────────
  {
    id:          'door-garage-am',
    label:       'Ali Mendjeli Garage',
    worldX:      -220,
    worldZ:      26,
    radius:      5.5,
    interiorId:  'garage_am',
    color:       '#886600',
    propertyId:  'garage_am',
    propertyType:'garage',
  },
  {
    id:         'door-bar',
    label:      'Café Constantine',
    worldX:     -300,
    worldZ:     -25,
    radius:     4.5,
    interiorId: 'bar_old_city',
    color:      '#884400',
  },
];

// ─── NPC Talkers / Shop vendors ───────────────────────────────────────────────
//
// shopType determines which shop panel tab opens when the player presses E.
// Each NPC is placed 3–4 units in front of the corresponding door trigger
// so they are visible before the door interaction radius is entered.
//
export const NPC_TALKERS: NpcTalker[] = [
  // ── Weapons dealer (in front of armory door) ───────────────────────────
  {
    id:       'npc-weapons-dealer',
    label:    '🔫 Dealer — Weapons',
    worldX:   240,
    worldZ:   23,
    radius:   5.0,
    dialogue: 'You need hardware? Step inside. Best prices in Constantine.',
    shopType: 'weapons',
  },

  // ── Ammo resupply NPC (near spawn, at weapons armory vicinity) ─────────
  {
    id:       'npc-ammo-vendor',
    label:    '🔹 Ammo Vendor',
    worldX:   325,
    worldZ:   -26,
    radius:   5.0,
    dialogue: 'Need rounds? I\'ve got everything from 9mm to 7.62.',
    shopType: 'ammo',
  },

  // ── Convenience store clerk (in front of corner store door) ────────────
  {
    id:       'npc-store-clerk',
    label:    '🥙 Corner Store',
    worldX:   60,
    worldZ:   -20,
    radius:   5.0,
    dialogue: 'Food, drinks, cigarettes — we have it all, habibi.',
    shopType: 'consumables',
  },

  // ── Car dealer (City A, near garage) ──────────────────────────────────
  {
    id:       'npc-car-dealer',
    label:    '🚗 Car Dealer',
    worldX:   -220,
    worldZ:   21,
    radius:   5.0,
    dialogue: 'Need wheels? I have keys for Renault, BMW, even a Kangoo.',
    shopType: 'vehicles',
  },

  // ── Hospital doctor (in front of hospital door) ─────────────────────────
  {
    id:       'npc-doctor',
    label:    '⚕ Dr. Amrani',
    worldX:   360,
    worldZ:   21,
    radius:   5.5,
    dialogue: 'You look rough. Let me patch you up — no charge.',
    shopType: 'hospital',
  },

  // ── Bar owner (City A) ──────────────────────────────────────────────────
  {
    id:       'npc-bar-owner',
    label:    '☕ Café Owner',
    worldX:   -300,
    worldZ:   -20,
    radius:   4.5,
    dialogue: 'Welcome to Café Constantine. Best kahwa in the city, my friend.',
    options: [
      {
        id:           'opt-coffee',
        label:        'Buy a coffee',
        kind:         'buy',
        cost:         50,
        responseText: 'Enjoy it — dark and strong, just like Constantine.',
      },
      {
        id:           'opt-info',
        label:        'Any news in the city?',
        kind:         'info',
        responseText: 'The police are running extra checkpoints tonight. Watch yourself.',
      },
    ],
  },
];
