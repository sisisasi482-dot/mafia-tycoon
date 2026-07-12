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

// ─── Electronics / special items ──────────────────────────────────────────────

export interface SpecialItem {
  id:     string;
  name:   string;
  nameAr: string;
  nameFr: string;
  icon:   string;
  price:  number;
  desc:   string;
}

export const SPECIAL_ITEMS: SpecialItem[] = [
  {
    id:     'smartphone',
    name:   'Smartphone',
    nameAr: 'هاتف ذكي',
    nameFr: 'Smartphone',
    icon:   '📱',
    price:  4500,
    desc:   'Contacts, dating app, mission tracker — never be out of the loop',
  },
];

/** Valid single-use redeem codes — each grants a random cash amount (1 k–200 k DA). */
export const REDEEM_CODES = ['1000k', '200k', '30000k', '600000k', '67k', 'car'] as const;
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

/** Body-render category + colours for every purchasable vehicle catalog id
 *  (used by Vehicles.tsx to draw spawned owned-vehicle instances). */
export const VEHICLE_RENDER_MAP: Record<string, { type: 'sedan' | 'taxi' | 'police' | 'truck' | 'suv'; bodyColor: string; roofColor: string }> = {
  renault:    { type: 'sedan', bodyColor: '#c8c8c8', roofColor: '#888888' },
  kangoo:     { type: 'suv',   bodyColor: '#3a5aaa', roofColor: '#1a2a5a' },
  bmw:        { type: 'sedan', bodyColor: '#101820', roofColor: '#050505' },
  moto:       { type: 'sedan', bodyColor: '#cc2222', roofColor: '#111111' },
  police_car: { type: 'police', bodyColor: '#1a3aee', roofColor: '#f0f0f0' },
};

// ─── House keys ───────────────────────────────────────────────────────────────

/** Inventory item prefix for property/house keys granted on purchase. */
export const HOUSE_KEY_PREFIX = 'house_key_';

/** True if an inventory slot ID is a house/property key. */
export function isHouseKey(id: string): boolean { return id.startsWith(HOUSE_KEY_PREFIX); }

/** Extract the property ID encoded in a house key inventory ID. */
export function propertyIdFromKey(keyId: string): string {
  return keyId.slice(HOUSE_KEY_PREFIX.length);
}

// ─── Identity documents ─────────────────────────────────────────────────────────

/** National ID — required to legally purchase property from the Real Estate Agency. */
export const NATIONAL_ID_ID = 'national_id';
export const NATIONAL_ID_PRICE = 3000;

/** Driving License — earned via a short quiz at the DMV desk (Ali Mendjeli Garage). */
export const DRIVING_LICENSE_ID = 'driving_license';

export interface QuizQuestion {
  id:      string;
  q:       string;
  options: string[];
  answer:  number; // index into options
}

/** Question bank for the Driving License test — 3 are drawn each attempt. */
export const DRIVING_LICENSE_QUIZ: QuizQuestion[] = [
  { id: 'q1', q: 'What does a red traffic light mean?', options: ['Speed up', 'Stop', 'Turn left only', 'Ignore it'], answer: 1 },
  { id: 'q2', q: 'Before overtaking another vehicle, you should:', options: ['Honk and swerve', 'Check mirrors & blind spot', 'Close your eyes', 'Flash your lights only'], answer: 1 },
  { id: 'q3', q: 'The maximum urban speed limit is typically:', options: ['50 km/h', '150 km/h', '10 km/h', 'No limit'], answer: 0 },
  { id: 'q4', q: 'At a pedestrian crossing, a driver must:', options: ['Accelerate', 'Yield to pedestrians', 'Honk continuously', 'Reverse'], answer: 1 },
  { id: 'q5', q: 'Driving under the influence of alcohol is:', options: ['Illegal and dangerous', 'Allowed at night', 'Encouraged', 'Only a minor issue'], answer: 0 },
  { id: 'q6', q: 'A seatbelt should be worn:', options: ['Only on highways', 'Never', 'At all times while driving', 'Only by passengers'], answer: 2 },
];
