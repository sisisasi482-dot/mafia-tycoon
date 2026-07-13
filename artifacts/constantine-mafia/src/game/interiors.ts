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

export interface GlbFurniturePiece {
  /** GLB model filename without extension, e.g. 'bedDouble' */
  model:  string;
  pos:    [number, number, number];
  rotY?:  number;
  /** Target bounding-box size passed to FittedGLB (default 1.4) */
  scale?: number;
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
  /** Optional GLB6 models rendered on top of the box-primitive furniture layer. */
  glbFurniture?: GlbFurniturePiece[];
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
  kind:         'buy' | 'info' | 'conflict' | 'shop' | 'job' | 'drug_deal';
  cost?:        number;
  /** Money paid TO the player (used by drug deals, job payouts, etc.) */
  reward?:      number;
  itemId?:      string;
  /** For kind:'shop' — which ShopPanel tab to jump to. */
  shopTab?:     'consumables' | 'ammo' | 'weapons' | 'vehicles' | 'properties';
  /** For kind:'job' — hourly earnings rate in DA. */
  hourlyRate?:  number;
  responseText: string;
}

export interface NpcTalker {
  id:       string;
  label:    string;
  worldX:   number;
  worldZ:   number;
  radius:   number;
  dialogue: string;
  /** Optional pool of alternate opening lines — when present, one is picked
   *  at random (Math.random()) each time the player talks to this NPC,
   *  instead of always showing the same static `dialogue` line. */
  dialogueVariants?: string[];
  options?: DialogueOption[];
  shopType?: 'consumables' | 'ammo' | 'weapons' | 'vehicles' | 'hospital' | 'hotel';
  /** Interior the NPC stands inside (relocated from the outdoor city scene). Undefined = outdoor NPC. */
  interiorId?: string;
  /** Marks the Driving License examiner — opens the quiz overlay instead of dialogue/shop. */
  quiz?: boolean;
  /** Bar/club NPCs rendered with a looping sway-dance animation. */
  dancing?: boolean;
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

  // ── Real Estate Agency ───────────────────────────────────────────────────
  real_estate: {
    id: 'real_estate',
    label: 'Constantine Real Estate',
    centerX: 920, centerZ: 0,
    roomW: 12, roomH: 3.0, roomD: 9,
    lightColor: '#fff2cc', lightIntensity: 2.6,
    floorColor: '#c0a878',
    wallColor:  '#e8dcc0',
    exitOffsetX: 0, exitOffsetZ: 4.5,
    furniture: [
      // Agent's desk
      { pos: [0, 0.75, -3.4], size: [3.2, 1.5, 1.3], color: '#5a4028', roughness: 0.6 },
      { pos: [0, 1.5, -3.4], size: [3.3, 0.06, 1.4], color: '#8a6840', roughness: 0.5 },
      // Monitor
      { pos: [0.6, 1.7, -3.6], size: [0.6, 0.5, 0.1], color: '#1a1a1a', emissive: '#224488', emissiveIntensity: 0.5 },
      // Property model board (back wall — framed listings)
      { pos: [-4, 1.8, -4.4], size: [1.6, 1.1, 0.1], color: '#ffffff', emissive: '#ccddff', emissiveIntensity: 0.2 },
      { pos: [-1.8, 1.8, -4.4], size: [1.6, 1.1, 0.1], color: '#ffffff', emissive: '#ccddff', emissiveIntensity: 0.2 },
      { pos: [1.8, 1.8, -4.4], size: [1.6, 1.1, 0.1], color: '#ffffff', emissive: '#ccddff', emissiveIntensity: 0.2 },
      { pos: [4, 1.8, -4.4], size: [1.6, 1.1, 0.1], color: '#ffffff', emissive: '#ccddff', emissiveIntensity: 0.2 },
      // Waiting chairs
      { pos: [4.2, 0.4, 1.5], size: [0.9, 0.8, 0.9], color: '#3a3020', roughness: 0.8 },
      { pos: [-4.2, 0.4, 1.5], size: [0.9, 0.8, 0.9], color: '#3a3020', roughness: 0.8 },
      // Ceiling light
      { pos: [0, 2.9, -1], size: [4, 0.08, 0.2], color: '#ffffff', emissive: '#ffeecc', emissiveIntensity: 1.8 },
      // Entrance mat
      { pos: [0, 0.015, 4.0], size: [2.6, 0.03, 1.3], color: '#5a4a30', roughness: 0.98 },
    ],
  },

  // ── Grand Hotel Constantine ──────────────────────────────────────────────
  hotel_lobby: {
    id: 'hotel_lobby',
    label: 'Grand Hotel Constantine',
    centerX: 940, centerZ: 0,
    roomW: 16, roomH: 3.6, roomD: 12,
    lightColor: '#ffe0b0', lightIntensity: 3.0,
    floorColor: '#8a7040',
    wallColor:  '#3a2c1c',
    exitOffsetX: 0, exitOffsetZ: 5.5,
    furniture: [
      // Reception counter
      { pos: [0, 1.0, -4.8], size: [6.5, 2.0, 1.2], color: '#2a1c10', roughness: 0.5 },
      { pos: [0, 2.0, -4.8], size: [6.6, 0.06, 1.3], color: '#c8a860', roughness: 0.4, metalness: 0.3 },
      // Key rack behind counter
      { pos: [0, 2.5, -5.6], size: [3.5, 0.9, 0.15], color: '#1a120a', roughness: 0.8 },
      // Lounge sofas
      { pos: [-5.5, 0.4, 1.0], size: [3.2, 0.8, 1.5], color: '#7a2020', roughness: 0.75 },
      { pos: [5.5, 0.4, 1.0], size: [3.2, 0.8, 1.5], color: '#7a2020', roughness: 0.75 },
      // Chandelier (emissive)
      { pos: [0, 3.5, -1], size: [1.2, 0.4, 1.2], color: '#ffdd88', emissive: '#ffcc66', emissiveIntensity: 2.2, roughness: 0.4 },
      // Marble pillars
      { pos: [-6.5, 1.8, -2], size: [0.6, 3.6, 0.6], color: '#d8d0c0', roughness: 0.4 },
      { pos: [6.5, 1.8, -2], size: [0.6, 3.6, 0.6], color: '#d8d0c0', roughness: 0.4 },
      // Entrance mat
      { pos: [0, 0.015, 5.0], size: [4, 0.03, 1.8], color: '#4a1010', roughness: 0.95 },
    ],
  },

  // ── Suburb houses (shared simple interior template) ──────────────────────
  house_1: {
    id: 'house_1', label: 'Old City Villa',
    centerX: 960, centerZ: 0, roomW: 12, roomH: 2.8, roomD: 9,
    lightColor: '#ffddaa', lightIntensity: 2.4, floorColor: '#c8a878', wallColor: '#e0d4b8',
    exitOffsetX: 0, exitOffsetZ: 4.5,
    furniture: [
      { pos: [0, 2.75, -1], size: [3, 0.06, 0.15], color: '#fff2cc', emissive: '#ffe0aa', emissiveIntensity: 1.6 },
      // Floor rug
      { pos: [1.5, 0.018, 0], size: [5, 0.03, 4], color: '#7a4a28', roughness: 0.98 },
    ],
    glbFurniture: [
      { model: 'bedDouble',    pos: [-3.5, 0, -3.0], rotY: 0,           scale: 2.4 },
      { model: 'chair',        pos: [ 3.0, 0, -3.2], rotY: Math.PI,     scale: 1.1 },
      { model: 'desk',         pos: [ 3.8, 0,  1.2], rotY: -Math.PI/2,  scale: 1.4 },
    ],
  },
  house_2: {
    id: 'house_2', label: 'Riverside House',
    centerX: 980, centerZ: 0, roomW: 13, roomH: 2.9, roomD: 9,
    lightColor: '#ffddaa', lightIntensity: 2.4, floorColor: '#b8a888', wallColor: '#d8ccb0',
    exitOffsetX: 0, exitOffsetZ: 4.5,
    furniture: [
      { pos: [0, 2.85, -1], size: [3.2, 0.06, 0.15], color: '#fff2cc', emissive: '#ffe0aa', emissiveIntensity: 1.6 },
      // Floor rug
      { pos: [1.5, 0.018, 0.5], size: [5.5, 0.03, 4.5], color: '#5a6a3a', roughness: 0.98 },
    ],
    glbFurniture: [
      { model: 'bedDouble',         pos: [-3.8, 0, -3.0], rotY: 0,           scale: 2.5 },
      { model: 'bookcaseOpen',      pos: [ 5.5, 0, -4.2], rotY: 0,           scale: 1.6 },
      { model: 'chairDesk',         pos: [ 3.5, 0,  1.5], rotY: -Math.PI/2,  scale: 1.1 },
    ],
  },
  house_3: {
    id: 'house_3', label: 'Hilltop Residence',
    centerX: 1000, centerZ: 0, roomW: 14, roomH: 3.1, roomD: 10,
    lightColor: '#ffe8c8', lightIntensity: 2.6, floorColor: '#d0c8d8', wallColor: '#eee8f0',
    exitOffsetX: 0, exitOffsetZ: 5,
    furniture: [
      { pos: [0, 3.05, -1.5], size: [3.6, 0.06, 0.15], color: '#fff2cc', emissive: '#ffe0aa', emissiveIntensity: 1.8 },
      // Floor rug
      { pos: [1.5, 0.018, 0.5], size: [6, 0.03, 5], color: '#6a4888', roughness: 0.98 },
    ],
    glbFurniture: [
      { model: 'bedDouble',         pos: [-4.2, 0, -3.4], rotY: 0,           scale: 2.6 },
      { model: 'computerScreen',    pos: [ 4.0, 0,  0.5], rotY: -Math.PI/2,  scale: 0.9 },
      { model: 'chairRounded',      pos: [ 3.0, 0, -3.0], rotY: Math.PI/2,   scale: 1.1 },
      { model: 'cabinetTelevision', pos: [-1.0, 0,  4.3], rotY: Math.PI,      scale: 1.8 },
    ],
  },

  // ── Suburb garages (shared simple interior template) ─────────────────────
  garage_1: {
    id: 'garage_1', label: 'Garage – Suburb',
    centerX: 1020, centerZ: 0, roomW: 10, roomH: 3.0, roomD: 8,
    lightColor: '#ffffff', lightIntensity: 2.0, floorColor: '#222222', wallColor: '#333330',
    exitOffsetX: 0, exitOffsetZ: 4,
    furniture: [
      { pos: [0, 0.06, 0], size: [4, 0.12, 6], color: '#1a1a18', roughness: 0.85, metalness: 0.2 },
      { pos: [-4, 1.0, -2.5], size: [1.4, 2.0, 0.6], color: '#cc3300', roughness: 0.5 },
      { pos: [0, 2.9, 0], size: [4, 0.06, 0.15], color: '#ffffff', emissive: '#eeeeff', emissiveIntensity: 1.8 },
    ],
  },
  garage_2: {
    id: 'garage_2', label: 'Garage – Riverside',
    centerX: 1040, centerZ: 0, roomW: 10, roomH: 3.0, roomD: 8,
    lightColor: '#ffffff', lightIntensity: 2.0, floorColor: '#242424', wallColor: '#353330',
    exitOffsetX: 0, exitOffsetZ: 4,
    furniture: [
      { pos: [0, 0.06, 0], size: [4, 0.12, 6], color: '#1a1a18', roughness: 0.85, metalness: 0.2 },
      { pos: [4, 1.0, -2.5], size: [1.4, 2.0, 0.6], color: '#2266cc', roughness: 0.5 },
      { pos: [0, 2.9, 0], size: [4, 0.06, 0.15], color: '#ffffff', emissive: '#eeeeff', emissiveIntensity: 1.8 },
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
  // ── Real Estate / Hotel (suburb road, past the houses) ─────────────────
  {
    id:         'door-real-estate',
    label:      'Constantine Real Estate',
    worldX:     440,
    worldZ:     155,
    radius:     4.5,
    interiorId: 'real_estate',
    color:      '#cc9922',
  },
  {
    id:         'door-hotel',
    label:      'Grand Hotel Constantine',
    worldX:     480,
    worldZ:     162,
    radius:     5.0,
    interiorId: 'hotel_lobby',
    color:      '#ffaa44',
  },
  // ── Suburb houses & garages (own properties, south-east suburb zone) ───
  {
    id:          'door-house-1',
    label:       'Old City Villa',
    worldX:      250,
    worldZ:      156,
    radius:      4.5,
    interiorId:  'house_1',
    color:       '#2a8a3a',
    propertyId:  'house_1',
    propertyType:'home',
  },
  {
    id:          'door-house-2',
    label:       'Riverside House',
    worldX:      323,
    worldZ:      175,
    radius:      4.5,
    interiorId:  'house_2',
    color:       '#2a8a3a',
    propertyId:  'house_2',
    propertyType:'home',
  },
  {
    id:          'door-house-3',
    label:       'Hilltop Residence',
    worldX:      397,
    worldZ:      146,
    radius:      4.5,
    interiorId:  'house_3',
    color:       '#2a8a3a',
    propertyId:  'house_3',
    propertyType:'home',
  },
  {
    id:          'door-garage-1',
    label:       'Garage – Suburb',
    worldX:      280,
    worldZ:      196.5,
    radius:      4.5,
    interiorId:  'garage_1',
    color:       '#3a9a4a',
    propertyId:  'garage_1',
    propertyType:'garage',
  },
  {
    id:          'door-garage-2',
    label:       'Garage – Riverside',
    worldX:      360,
    worldZ:      196.5,
    radius:      4.5,
    interiorId:  'garage_2',
    color:       '#3a9a4a',
    propertyId:  'garage_2',
    propertyType:'garage',
  },
];

// ─── NPC Talkers / Shop vendors ───────────────────────────────────────────────
//
// shopType determines which shop panel tab opens when the player presses E.
// Each NPC is placed 3–4 units in front of the corresponding door trigger
// so they are visible before the door interaction radius is entered.
//
export const NPC_TALKERS: NpcTalker[] = [
  // ── Weapons dealer (relocated inside the armory, behind the counter) ───
  {
    id:       'npc-weapons-dealer',
    label:    '🔫 Dealer — Weapons',
    worldX:   797,
    worldZ:   -3,
    radius:   2.8,
    dialogue: 'You need hardware? Best prices in Constantine.',
    shopType: 'weapons',
    interiorId: 'weapons_shop',
  },

  // ── Ammo resupply NPC (relocated inside the armory, opposite counter) ──
  {
    id:       'npc-ammo-vendor',
    label:    '🔹 Ammo Vendor',
    worldX:   803,
    worldZ:   -3,
    radius:   2.8,
    dialogue: 'Need rounds? I\'ve got everything from 9mm to 7.62.',
    shopType: 'ammo',
    interiorId: 'weapons_shop',
  },

  // ── Convenience store clerk (relocated behind the shop counter) ────────
  {
    id:       'npc-store-clerk',
    label:    '🥙 Corner Store',
    worldX:   820,
    worldZ:   -3,
    radius:   3.0,
    dialogue: 'Food, drinks, cigarettes — we have it all, habibi.',
    shopType: 'consumables',
    interiorId: 'convenience',
  },

  // ── Car dealer (relocated inside Ali Mendjeli Garage) ──────────────────
  {
    id:       'npc-car-dealer',
    label:    '🚗 Car Dealer',
    worldX:   864,
    worldZ:   -4,
    radius:   4.0,
    dialogue: 'Need wheels? I have keys for Renault, BMW, even a Kangoo.',
    shopType: 'vehicles',
    interiorId: 'garage_am',
  },

  // ── DMV examiner (shares the garage — driving license quiz desk) ───────
  {
    id:       'npc-license-examiner',
    label:    '🪪 Licensing Desk',
    worldX:   856,
    worldZ:   -4,
    radius:   3.0,
    dialogue: 'Take the driving test and I\'ll issue your license on the spot.',
    interiorId: 'garage_am',
    quiz: true,
    // NOTE: `quiz` opens the dedicated LicenseQuizPanel (see Player.tsx / PauseMenu.tsx) —
    // `options` is intentionally omitted here so the quiz branch takes priority.
  },

  // ── Hospital doctor (relocated behind the reception desk) ──────────────
  {
    id:       'npc-doctor',
    label:    '⚕ Dr. Amrani',
    worldX:   900,
    worldZ:   -4,
    radius:   4.0,
    dialogue: 'You look rough. Let me patch you up — no charge.',
    shopType: 'hospital',
    interiorId: 'hospital',
  },

  // ── Bar — 10 NPCs total: owner + 9 patrons/dancers ──────────────────────

  {
    id:       'npc-bar-owner',
    label:    '☕ Café Owner',
    worldX:   880,
    worldZ:   -3.2,
    radius:   3.2,
    dialogue: 'Welcome to Café Constantine. Best kahwa in the city, my friend.',
    dialogueVariants: [
      'Welcome to Café Constantine. Best kahwa in the city, my friend.',
      'Back again? Sit anywhere you like, habibi.',
      'This place has seen a hundred years of gossip. Pull up a chair.',
      'Careful with the coffee tonight — I made it extra strong.',
      'Every mafia deal in this city starts at this counter, you know.',
    ],
    interiorId: 'bar_old_city',
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

  // ── Electronics shop clerk (inside convenience — sells smartphone) ─────────
  {
    id:       'npc-electronics-clerk',
    label:    '📱 Electronics',
    worldX:   826,
    worldZ:   -3,
    radius:   3.0,
    dialogue: 'Latest smartphones, just arrived from Algiers. Best models, good price.',
    interiorId: 'convenience',
    options: [
      {
        id:           'opt-buy-phone',
        label:        'Buy a smartphone (4,500 DA)',
        kind:         'buy',
        cost:         4500,
        itemId:       'smartphone',
        responseText: 'Here you go — contacts, dating app, mission tracker, all preloaded. Stay connected.',
      },
    ],
  },

  // ── Bar female NPCs — available for dating via smartphone ──────────────────
  {
    id:       'npc-bar-rania',
    label:    '👩 Rania',
    worldX:   884,
    worldZ:   -2.8,
    radius:   2.5,
    dialogue: 'I come here every evening after work. The kahwa is excellent, no?',
    dialogueVariants: [
      'I come here every evening after work. The kahwa is excellent, no?',
      'Oh, it\'s you again. Still hanging around this bar?',
      'Do you always stare before saying hello?',
      'The music tonight is better than usual, don\'t you think?',
    ],
    options: [
      {
        id:           'opt-rania-chat',
        label:        'You look interesting — can I get your number?',
        kind:         'info',
        responseText: 'Ha… bold one. Fine. Rania has been added to your contacts.',
      },
      {
        id:           'opt-rania-city',
        label:        'What do you think of Constantine?',
        kind:         'info',
        responseText: 'This city has a soul. The gorge, the bridges, the old medina… there is nowhere like it in Algeria.',
      },
    ],
  },
  {
    id:       'npc-bar-yasmine',
    label:    '👩 Yasmine',
    worldX:   877,
    worldZ:   -3.6,
    radius:   2.5,
    dialogue: 'Excuse me? I am waiting for my sister. She is always late.',
    dialogueVariants: [
      'Excuse me? I am waiting for my sister. She is always late.',
      'Still no sign of her. Typical.',
      'You keep coming back here — should I be worried?',
      'This café has the only decent wifi in the old city, that\'s why I stay.',
    ],
    options: [
      {
        id:           'opt-yasmine-chat',
        label:        'Maybe I can keep you company in the meantime?',
        kind:         'info',
        responseText: 'Smooth. Yasmine seems amused. She hands you her contact. "Don\'t be annoying."',
      },
      {
        id:           'opt-yasmine-work',
        label:        'Do you work around here?',
        kind:         'info',
        responseText: 'I teach at the university. Literature. You probably don\'t read much, do you?',
      },
    ],
  },

  // ── Bar dancing patrons (7 more → 10 total in bar) ───────────────────────
  { id:'npc-bar-dancer-1', label:'🕺 Khaled',   worldX:876, worldZ:-4.4, radius:2.5, dancing:true, interiorId:'bar_old_city',
    dialogue:'Best music in Constantine tonight!',
    dialogueVariants:['Best music in Constantine tonight!', 'You feel that bassline? Unreal.', 'I haven\'t stopped dancing in an hour!'],
    options:[{ id:'opt-kh1', label:'Great moves!', kind:'info', responseText:'Ha! Thank you, friend. Join me!' }] },
  { id:'npc-bar-dancer-2', label:'💃 Meriem',   worldX:882, worldZ:-4.1, radius:2.5, dancing:true, interiorId:'bar_old_city',
    dialogue:'I come here every Friday. The DJ is amazing.',
    dialogueVariants:['I come here every Friday. The DJ is amazing.', 'This is my favorite spot in the whole city.', 'Careful, my dance moves are contagious.'],
    options:[{ id:'opt-dm2', label:'You dance beautifully.', kind:'info', responseText:'Buy me a coffee and I will teach you.' }] },
  { id:'npc-bar-dancer-3', label:'🕺 Amine',    worldX:878, worldZ:-1.8, radius:2.5, dancing:true, interiorId:'bar_old_city',
    dialogue:'I forgot all my problems on this dance floor.',
    dialogueVariants:['I forgot all my problems on this dance floor.', 'Work can wait. Tonight is for dancing.', 'You should see me on a good night — I never stop.'],
    options:[{ id:'opt-am3', label:'Same here.', kind:'info', responseText:'Friday nights are pure magic in Constantine.' }] },
  { id:'npc-bar-dancer-4', label:'💃 Houria',   worldX:885, worldZ:-4.8, radius:2.5, dancing:true, interiorId:'bar_old_city',
    dialogue:'I love this track! My cousin knows the DJ.',
    dialogueVariants:['I love this track! My cousin knows the DJ.', 'This song always gets me moving.', 'My cousin promised the DJ will play until dawn.'],
    options:[{ id:'opt-ho4', label:'Really?', kind:'info', responseText:'He plays until 3 AM. Tonight will be good.' }] },
  { id:'npc-bar-dancer-5', label:'🕺 Redouane', worldX:874, worldZ:-2.4, radius:2.5, dancing:true, interiorId:'bar_old_city',
    dialogue:'I worked a double shift. Now I dance.',
    dialogueVariants:['I worked a double shift. Now I dance.', 'Twelve hours on my feet, and I still have moves left.', 'This is how I unwind after a long week.'],
    options:[{ id:'opt-rd5', label:'You deserve it.', kind:'info', responseText:'Exactly what I said. Cheers, habibi.' }] },
  { id:'npc-bar-dancer-6', label:'💃 Lyna',     worldX:886, worldZ:-2.0, radius:2.5, dancing:true, interiorId:'bar_old_city',
    dialogue:'I only dance to good songs. This is a good song.',
    dialogueVariants:['I only dance to good songs. This is a good song.', 'I have standards — this DJ meets them.', 'Not every night is worth dancing. Tonight is.'],
    options:[{ id:'opt-ly6', label:'I agree.', kind:'info', responseText:'Smart man. Stay for the next one.' }] },
  { id:'npc-bar-dancer-7', label:'🕺 Sofiane',  worldX:879, worldZ:-5.2, radius:2.5, dancing:true, interiorId:'bar_old_city',
    dialogue:'Forget the street drama. Here we are all equal.',
    dialogueVariants:['Forget the street drama. Here we are all equal.', 'No gangs, no politics — just music in here.', 'This floor is the only peace this city has left.'],
    options:[{ id:'opt-sf7', label:'Well said.', kind:'info', responseText:'One more round and I will believe it myself.' }] },

  // ── 4 Outdoor restaurants ─────────────────────────────────────────────────

  // Restaurant 1 — Centre-Ville classic (near the old city centre)
  {
    id:       'npc-restaurant-le-pont',
    label:    '🍽 Restaurant Le Pont',
    worldX:   55,
    worldZ:   50,
    radius:   5.5,
    dialogue: 'Welcome to Le Pont. Finest traditional Algerian cuisine — couscous, chakhchoukha, lamb tajine.',
    options: [
      {
        id: 'opt-lp-couscous', label: 'Couscous du vendredi (300 DA)', kind: 'buy', cost: 300,
        itemId: 'food', responseText: 'Enjoy — our grandmother\'s recipe, slow-cooked since dawn.',
      },
      {
        id: 'opt-lp-tajine', label: 'Lamb tajine with olives (500 DA)', kind: 'buy', cost: 500,
        itemId: 'food', responseText: 'Slow-braised since 5 AM. Best tajine north of the Aurès.',
      },
      {
        id: 'opt-lp-coffee', label: 'Café maure (80 DA)', kind: 'buy', cost: 80,
        responseText: 'Dark, cardamom-spiced. The way your grandfather drank it.',
      },
    ],
  },

  // Restaurant 2 — Ali Mendjeli fast snack (near City A centre)
  {
    id:       'npc-snack-constantine',
    label:    '🥙 Snack Constantine',
    worldX:   -295,
    worldZ:   55,
    radius:   5.0,
    dialogue: 'Sandwiches, merguez, pizza — fast and cheap. Good for the man on the move.',
    options: [
      {
        id: 'opt-sc-sandwich', label: 'Merguez sandwich (120 DA)', kind: 'buy', cost: 120,
        itemId: 'food', responseText: 'Hot off the grill. Be careful — spicy!',
      },
      {
        id: 'opt-sc-pizza', label: 'Slice of pizza (90 DA)', kind: 'buy', cost: 90,
        itemId: 'food', responseText: 'Constantine-style — thick crust, loaded.',
      },
      {
        id: 'opt-sc-soda', label: 'Cold soda (40 DA)', kind: 'buy', cost: 40,
        responseText: 'Ice cold. Enjoy.',
      },
    ],
  },

  // Restaurant 3 — Café Cirta (City A west, upscale)
  {
    id:       'npc-cafe-cirta',
    label:    '☕ Café Cirta',
    worldX:   -380,
    worldZ:   -55,
    radius:   5.0,
    dialogue: 'Cirta was Constantine\'s ancient name. Our café carries that history. Sit, rest, eat.',
    options: [
      {
        id: 'opt-cc-pastry', label: 'Makroud + coffee (200 DA)', kind: 'buy', cost: 200,
        itemId: 'food', responseText: 'Honey-drenched semolina cake, just out of the oven.',
      },
      {
        id: 'opt-cc-harira', label: 'Bowl of harira soup (150 DA)', kind: 'buy', cost: 150,
        itemId: 'food', responseText: 'Thick, warming. Good for long nights.',
      },
      {
        id: 'opt-cc-info', label: 'Hear any street news?', kind: 'info',
        responseText: 'The gang from Ali Mendjeli pushed out the Highway Boys last Tuesday. Things are heating up.',
      },
    ],
  },

  // Restaurant 4 — El Djazair (City B, modern)
  {
    id:       'npc-restaurant-eldjazair',
    label:    '🍽 Restaurant El Djazair',
    worldX:   280,
    worldZ:   55,
    radius:   5.5,
    dialogue: 'Modern Algerian fusion — traditional recipes, contemporary presentation. Welcome.',
    options: [
      {
        id: 'opt-ed-steak', label: 'Grilled kefta plate (450 DA)', kind: 'buy', cost: 450,
        itemId: 'food', responseText: 'Charcoal-grilled, served with roasted peppers. Excellent choice.',
      },
      {
        id: 'opt-ed-salad', label: 'Salade méchouia (200 DA)', kind: 'buy', cost: 200,
        itemId: 'food', responseText: 'Roasted peppers and tomatoes — smoky and fresh.',
      },
      {
        id: 'opt-ed-premium', label: 'Chef\'s set menu (900 DA)', kind: 'buy', cost: 900,
        itemId: 'food', responseText: 'Three courses, premium sourcing. Worth every dinar.',
      },
    ],
  },

  // ── Real Estate agent (inside the agency — sells National ID + property) ─
  {
    id:       'npc-real-estate-agent',
    label:    '🏠 Real Estate Agent',
    worldX:   920,
    worldZ:   -3.4,
    radius:   3.2,
    dialogue: 'Looking for a place in Constantine? I can set you up — with the right papers.',
    interiorId: 'real_estate',
    options: [
      {
        id:           'opt-national-id',
        label:        'Apply for National ID',
        kind:         'buy',
        cost:         3000,
        itemId:       'national_id',
        responseText: 'Your National ID is ready. You can now legally purchase property.',
      },
      {
        id:           'opt-browse-properties',
        label:        'Browse properties',
        kind:         'shop',
        shopTab:      'properties',
        responseText: '',
      },
      {
        id:           'opt-info',
        label:        'What do I need to buy a house?',
        kind:         'info',
        responseText: 'A National ID, and enough cash. Come back once you have both.',
      },
    ],
  },

  // ── Hotel clerk (inside the lobby — offers a stay of 1 day to 1 month) ──
  {
    id:       'npc-hotel-clerk',
    label:    '🛎 Hotel Clerk',
    worldX:   940,
    worldZ:   -4.4,
    radius:   3.5,
    dialogue: 'Welcome to the Grand Hotel. How long will you be staying?',
    shopType: 'hotel',
    interiorId: 'hotel_lobby',
  },

  // ── Outdoor job dispatchers ───────────────────────────────────────────────

  // Bus dispatcher — near the highway junction (City B side)
  {
    id:       'npc-bus-dispatcher',
    label:    '🚌 Bus Dispatcher',
    worldX:   200,
    worldZ:   -18,
    radius:   5,
    dialogue: 'Need a steady income? Drive the City B bus route — 1,500 DA per hour.',
    options: [
      {
        id:          'opt-start-bus',
        label:       'Start bus driver shift (1,500 DA/hr)',
        kind:        'job',
        itemId:      'bus_driver',
        hourlyRate:  1500,
        responseText: 'Shift started! Drive safely. Come back here when you want to end the shift and collect your pay.',
      },
      {
        id:          'opt-end-bus',
        label:       'End current shift & collect pay',
        kind:        'job',
        itemId:      'bus_driver_end',
        responseText: 'Great work today.',
      },
    ],
  },

  // Taxi company recruiter — City B commercial area
  {
    id:       'npc-taxi-company',
    label:    '🚕 Taxi Dispatcher',
    worldX:   340,
    worldZ:   -18,
    radius:   5,
    dialogue: 'Join our taxi fleet! 2,000 DA per hour — best rates in Constantine.',
    options: [
      {
        id:          'opt-start-taxi',
        label:       'Start taxi driver shift (2,000 DA/hr)',
        kind:        'job',
        itemId:      'taxi_driver',
        hourlyRate:  2000,
        responseText: 'Shift started! Pick up passengers and come back when done.',
      },
      {
        id:          'opt-end-taxi',
        label:       'End current shift & collect pay',
        kind:        'job',
        itemId:      'taxi_driver_end',
        responseText: 'Good driving today.',
      },
    ],
  },

  // Farm manager — near Ain M'lila / City A outskirts
  {
    id:       'npc-farm-manager',
    label:    '🌾 Farm Manager',
    worldX:   -390,
    worldZ:   -18,
    radius:   5,
    dialogue: 'Looking for honest work? We pay 1,000 DA an hour. Good land, good people.',
    options: [
      {
        id:          'opt-start-farm',
        label:       'Start farming shift (1,000 DA/hr)',
        kind:        'job',
        itemId:      'farmer',
        hourlyRate:  1000,
        responseText: 'Shift started! Come back when you want to end the shift and collect your earnings.',
      },
      {
        id:          'opt-end-farm',
        label:       'End current shift & collect pay',
        kind:        'job',
        itemId:      'farmer_end',
        responseText: 'Good work in the fields today.',
      },
    ],
  },

  // ── 10 Job dispatchers (total 13 with bus/taxi/farm above) ───────────────

  // 4. Security guard — City B commercial block
  { id: 'npc-security-dispatcher', label: '🛡 Security Company', worldX: 260, worldZ: 55, radius: 5,
    dialogue: 'We need reliable guards for City B warehouses. 1,800 DA/hr, night shift.',
    options: [
      { id: 'opt-start-sec', label: 'Start security shift (1,800 DA/hr)', kind: 'job', itemId: 'security_guard',    hourlyRate: 1800, responseText: 'Uniform is yours. Patrol the perimeter every 20 minutes.' },
      { id: 'opt-end-sec',   label: 'End shift & collect pay',            kind: 'job', itemId: 'security_guard_end', responseText: 'Good work. No incidents tonight.' },
    ] },

  // 5. Construction foreman — Highway junction
  { id: 'npc-construction-foreman', label: '🏗 Construction Site', worldX: 0, worldZ: -18, radius: 5,
    dialogue: 'Highway expansion needs workers. 1,200 DA/hr. Hard hats provided.',
    options: [
      { id: 'opt-start-con', label: 'Start construction shift (1,200 DA/hr)', kind: 'job', itemId: 'construction_worker',    hourlyRate: 1200, responseText: 'Start on the eastern ramp. Gloves are in the container.' },
      { id: 'opt-end-con',   label: 'End shift & collect pay',               kind: 'job', itemId: 'construction_worker_end', responseText: 'Good laying today. See you tomorrow.' },
    ] },

  // 6. Hospital admin — near hospital exterior
  { id: 'npc-hospital-admin', label: '🏥 Hospital Admin', worldX: 405, worldZ: 55, radius: 5,
    dialogue: 'Orderlies needed urgently. Clean record required. 1,600 DA/hr.',
    options: [
      { id: 'opt-start-hosp', label: 'Start orderly shift (1,600 DA/hr)', kind: 'job', itemId: 'hospital_orderly',    hourlyRate: 1600, responseText: 'Report to Ward 3. Be gentle with the patients.' },
      { id: 'opt-end-hosp',   label: 'End shift & collect pay',           kind: 'job', itemId: 'hospital_orderly_end', responseText: 'The patients were well cared for. Thank you.' },
    ] },

  // 7. Garage mechanic — near Ali Mendjeli garage exterior
  { id: 'npc-garage-recruiter', label: '🔧 Auto Workshop', worldX: -360, worldZ: 55, radius: 5,
    dialogue: 'Experienced mechanics wanted. City B is growing — lots of cars, not enough hands. 2,200 DA/hr.',
    options: [
      { id: 'opt-start-mec', label: 'Start mechanic shift (2,200 DA/hr)', kind: 'job', itemId: 'mechanic',    hourlyRate: 2200, responseText: 'Bay 3 is yours. Start with the Kangoo — oil change and brakes.' },
      { id: 'opt-end-mec',   label: 'End shift & collect pay',           kind: 'job', itemId: 'mechanic_end', responseText: 'Five cars done. Excellent work.' },
    ] },

  // 8. School director — City A cultural zone
  { id: 'npc-school-director', label: '📚 School Director', worldX: -250, worldZ: 55, radius: 5,
    dialogue: 'Substitute teachers needed — mathematics and Arabic. 1,400 DA/hr. Professional appearance required.',
    options: [
      { id: 'opt-start-tea', label: 'Start teaching shift (1,400 DA/hr)', kind: 'job', itemId: 'teacher',    hourlyRate: 1400, responseText: 'Room 12. Year 4 students. They are a handful — good luck.' },
      { id: 'opt-end-tea',   label: 'End shift & collect pay',            kind: 'job', itemId: 'teacher_end', responseText: 'The students actually learned something today. Impressive.' },
    ] },

  // 9. Café supervisor — near Café Cirta
  { id: 'npc-cafe-supervisor', label: '☕ Café Supervisor', worldX: -415, worldZ: 55, radius: 5,
    dialogue: 'Friday rush is brutal. Need waiters now. 800 DA/hr plus tips.',
    options: [
      { id: 'opt-start-wait', label: 'Start waiter shift (800 DA/hr + tips)', kind: 'job', itemId: 'cafe_waiter',    hourlyRate: 800, responseText: 'Apron is in the back. Tables 5–10 are yours.' },
      { id: 'opt-end-wait',   label: 'End shift & collect pay',               kind: 'job', itemId: 'cafe_waiter_end', responseText: 'Tips were generous today. You have a way with people.' },
    ] },

  // 10. Market overseer — Centre-Ville souk
  { id: 'npc-market-overseer', label: '🛒 Souk Overseer', worldX: 55, worldZ: -55, radius: 5,
    dialogue: 'We need vendors for the Centre-Ville market. Own stall, 900 DA/hr base.',
    options: [
      { id: 'opt-start-vend', label: 'Start vendor shift (900 DA/hr)', kind: 'job', itemId: 'market_vendor',    hourlyRate: 900, responseText: 'Stall 14 near the fountain. Spices and dates. Shout loud.' },
      { id: 'opt-end-vend',   label: 'End shift & collect pay',        kind: 'job', itemId: 'market_vendor_end', responseText: 'Good sales. People liked your voice.' },
    ] },

  // 11. Logistics manager — highway delivery hub
  { id: 'npc-logistics-manager', label: '🚛 Delivery Depot', worldX: 100, worldZ: -18, radius: 5,
    dialogue: 'Delivery drivers needed — Constantine to Ain Mlila route. Own vehicle preferred. 1,700 DA/hr.',
    options: [
      { id: 'opt-start-del', label: 'Start delivery shift (1,700 DA/hr)', kind: 'job', itemId: 'delivery_driver',    hourlyRate: 1700, responseText: 'Three drops: Old City, City B, highway exit 4. Go.' },
      { id: 'opt-end-del',   label: 'End shift & collect pay',            kind: 'job', itemId: 'delivery_driver_end', responseText: 'All packages arrived. No damage. Excellent.' },
    ] },

  // 12. Factory supervisor — Ain M\'lila industrial zone
  { id: 'npc-factory-supervisor', label: '🏭 Factory Floor', worldX: -430, worldZ: -18, radius: 5,
    dialogue: 'Line workers needed, night shift. 1,100 DA/hr. Safety training provided on day one.',
    options: [
      { id: 'opt-start-fac', label: 'Start factory shift (1,100 DA/hr)', kind: 'job', itemId: 'factory_worker',    hourlyRate: 1100, responseText: 'Line 4. Gloves on, ear protection in. Supervisor is Mustapha.' },
      { id: 'opt-end-fac',   label: 'End shift & collect pay',           kind: 'job', itemId: 'factory_worker_end', responseText: '320 units. Above quota. Nice work.' },
    ] },

  // 13. Bank branch manager — City B financial district
  { id: 'npc-bank-manager', label: '🏦 Bank Branch', worldX: 360, worldZ: 55, radius: 5,
    dialogue: 'Teller positions open at City B branch. Clean record, ID required. 2,500 DA/hr.',
    options: [
      { id: 'opt-start-bank', label: 'Start bank teller shift (2,500 DA/hr)', kind: 'job', itemId: 'bank_clerk',    hourlyRate: 2500, responseText: 'Counter 3 is yours. Remember: smile at every customer.' },
      { id: 'opt-end-bank',   label: 'End shift & collect pay',               kind: 'job', itemId: 'bank_clerk_end', responseText: 'Balanced to the dirham. We will see you tomorrow.' },
    ] },

  // ── Drug dealer — near the gang hideout ─────────────────────────────────
  {
    id:       'npc-drug-dealer',
    label:    '💊 Street Dealer',
    worldX:   -355,
    worldZ:   140,
    radius:   5,
    dialogue: 'Looking for something? I got cigarettes, pills — whatever you need. Cops don\'t come here often.',
    options: [
      {
        id:          'opt-buy-street-cigs',
        label:       'Buy contraband cigarettes (100 DA)',
        kind:        'buy',
        cost:        100,
        itemId:      'cigarettes',
        responseText: 'Here you go. Don\'t flash those in front of the law.',
      },
      {
        id:          'opt-buy-stims',
        label:       'Buy stimulants (300 DA)',
        kind:        'buy',
        cost:        300,
        itemId:      'stimulants',
        responseText: 'Quality stuff. Effects kick in fast.',
      },
      {
        id:          'opt-deal-sell',
        label:       'Sell drugs to him — risky! (+500 DA)',
        kind:        'drug_deal',
        reward:      500,
        responseText: 'Deal done. But someone saw that exchange — the cops will be looking for you.',
      },
    ],
  },
];
