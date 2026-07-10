/**
 * Door triggers in the city + interior room layouts.
 *
 * ── Interior/trigger data cleared — ready for new map generation ──
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

// ─── Empty data — ready for new map ──────────────────────────────────────────

export const INTERIORS: Record<string, InteriorLayout> = {};

export const DOOR_TRIGGERS: DoorTrigger[] = [];

export const NPC_TALKERS: NpcTalker[] = [];
