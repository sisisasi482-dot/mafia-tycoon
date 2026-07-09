/**
 * Consumable items, ammo types, and weapon catalog.
 * All static data lives here so ShopPanel and useGameStore share one source.
 */

// ─── Consumables ──────────────────────────────────────────────────────────────

export type ConsumableId = 'food' | 'cigarettes' | 'stimulants';

export interface ConsumableItem {
  id:     ConsumableId;
  name:   string;
  nameAr: string;
  nameFr: string;
  icon:   string;
  price:  number;
  desc:   string;
}

export const CONSUMABLES: ConsumableItem[] = [
  { id: 'food',       name: 'Food',       nameAr: 'طعام',   nameFr: 'Nourriture',
    icon: '🥙', price: 50,  desc: '+30 Health' },
  { id: 'cigarettes', name: 'Cigarettes', nameAr: 'سجائر',  nameFr: 'Cigarettes',
    icon: '🚬', price: 30,  desc: 'Dizziness for 10 s — blurs vision' },
  { id: 'stimulants', name: 'Stimulants', nameAr: 'محفزات', nameFr: 'Stimulants',
    icon: '💊', price: 150, desc: '+20 Health boost' },
];

// ─── Ammo ─────────────────────────────────────────────────────────────────────

export type AmmoType = 'pistol_ammo' | 'shotgun_shells' | 'smg_ammo' | 'rifle_ammo';

export interface WeaponAmmoConfig {
  weaponId:  string;
  ammoType:  AmmoType;
  magSize:   number;
  ammoPrice: number;   // DA per pack
  packSize:  number;   // rounds per pack
}

/** Weapons that consume ammo (knife is excluded — infinite melee). */
export const WEAPON_AMMO: Record<string, WeaponAmmoConfig> = {
  pistol:  { weaponId: 'pistol',  ammoType: 'pistol_ammo',   magSize: 15, ammoPrice: 200, packSize: 60 },
  shotgun: { weaponId: 'shotgun', ammoType: 'shotgun_shells', magSize: 8,  ammoPrice: 300, packSize: 24 },
  smg:     { weaponId: 'smg',     ammoType: 'smg_ammo',       magSize: 30, ammoPrice: 400, packSize: 90 },
  rifle:   { weaponId: 'rifle',   ammoType: 'rifle_ammo',     magSize: 30, ammoPrice: 500, packSize: 90 },
};

export const AMMO_DISPLAY: Record<AmmoType, { name: string; icon: string }> = {
  pistol_ammo:    { name: '9mm Rounds',     icon: '🔹' },
  shotgun_shells: { name: 'Shotgun Shells', icon: '🔸' },
  smg_ammo:       { name: 'SMG Rounds',     icon: '🔷' },
  rifle_ammo:     { name: 'Rifle Rounds',   icon: '🔶' },
};

export const WEAPON_NAMES: Record<string, string> = {
  knife:   'Knife',
  pistol:  'Pistol',
  shotgun: 'Shotgun',
  smg:     'SMG',
  rifle:   'Assault Rifle',
};

export const WEAPON_ICONS: Record<string, string> = {
  knife:   '🔪',
  pistol:  '🔫',
  shotgun: '🔫',
  smg:     '🔫',
  rifle:   '🔫',
};

/** Valid single-use redeem codes — each grants a random cash amount (1 k–200 k DA). */
export const REDEEM_CODES = ['1000k', '200k', '30000k', '600000k', '67k'] as const;
export type RedeemCode = typeof REDEEM_CODES[number];

/** IDs that are weapons (used by ShopPanel to filter ownedAssetIds). */
export const WEAPON_IDS = new Set(['knife', 'pistol', 'shotgun', 'smg', 'rifle']);

// ─── Car keys ─────────────────────────────────────────────────────────────────

/** Inventory item prefix for vehicle keys granted on purchase. */
export const CAR_KEY_PREFIX = 'car_key_';

/** True if an inventory slot ID is a car key. */
export function isCarKey(id: string): boolean { return id.startsWith(CAR_KEY_PREFIX); }

/** Extract the vehicle ID encoded in a car key inventory ID. */
export function vehicleIdFromKey(keyId: string): string {
  return keyId.slice(CAR_KEY_PREFIX.length);
}

/** Human-readable name for every purchasable or world vehicle. */
export const VEHICLE_NAMES_MAP: Record<string, string> = {
  renault:    'Renault 25',
  kangoo:     'Kangoo',
  bmw:        'BMW 5 Series',
  moto:       'Motorcycle',
  police_car: 'Police Crown',
  v1: 'Taxi', v2: 'Police Car', v3: 'Sports Car', v4: 'SUV', v5: 'Truck',
};
