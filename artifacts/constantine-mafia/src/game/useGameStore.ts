import { create } from 'zustand';
import { REDEEM_CODES } from './items';
import { audioManager } from './audio/AudioManager';

/**
 * Synchronous mobile detection, evaluated once at module load (before the
 * first render) so the store's initial performance settings are already
 * correct for the device — no post-mount flash of desktop-quality settings.
 * Combines a UA sniff (works even before layout) with a coarse viewport
 * check as a fallback for UA strings we don't recognize.
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const uaIsMobile = /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
  const coarsePointer =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;
  const narrowViewport = typeof window !== 'undefined' && window.innerWidth < 768;
  return uaIsMobile || (coarsePointer && narrowViewport);
}

export const IS_MOBILE_DEVICE = isMobileDevice();

export type CameraMode    = 'third' | 'second' | 'first';
export type SteeringMode  = 'wheel' | 'arrows' | 'tilt' | 'slider';
export type PedalMode     = 'buttons' | 'slider';
export type Transmission  = 'auto' | 'manual';
export type FpsCap        = 0 | 30 | 60;  // 0 = unlimited

/** A player-owned vehicle spawned into the world from a car key ("Spawn Car"). */
export interface OwnedVehicleInstance {
  id:          string;   // unique instance id
  vehicleId:   string;   // catalog id (e.g. 'renault', 'bmw') — determines look
  position:    [number, number, number];
  rotY:        number;
}

export type GameState = {
  // Player
  playerId:           string | null;
  username:           string;
  /** Player height in centimeters, set during character creation. */
  height:             number;
  /** Clerk user id once signed in with Google — enables cloud save sync. */
  clerkUserId:        string | null;
  money:              number;
  health:             number;
  armor:              number;
  level:              number;
  xp:                 number;
  careerPath: 'street_thug' | 'gangster' | 'crime_boss' | 'business_tycoon';
  ownedAssetIds:      string[];
  completedMissionIds:string[];
  equippedVehicleId:  string | null;
  equippedWeaponId:   string | null;

  // World
  district: 'ali_mendjeli' | 'centre_ville' | 'old_city' | 'ain_mlila' | 'airport';
  wantedLevel:        number;
  currentMissionId:   string | null;
  gameMode:           'story' | 'free_world';

  // Physics state (not persisted)
  playerPosition:     [number, number, number];
  playerRotationY:    number;
  inVehicle:          boolean;
  /** Vehicle that was most recently exited — persists after dismount so garages can park it. */
  lastDrivenVehicleId: string | null;

  // Interior system
  indoors:            boolean;
  interiorId:         string | null;
  interiorExitPos:    [number, number, number];

  // Time
  dayTime:            number;   // 0–1

  // Camera
  cameraMode:         CameraMode;

  // Vehicle controls
  vehicleSteeringMode:SteeringMode;
  vehiclePedalMode:   PedalMode;
  vehicleTransmission:Transmission;

  // Radio
  radioUrl:           string;
  radioVolume:        number;
  showRadio:          boolean;

  // UI state
  isPaused:           boolean;
  showMap:            boolean;
  showShop:           boolean;
  showMissions:       boolean;
  showLeaderboard:    boolean;
  activePanel: 'none' | 'settings' | 'map' | 'missions' | 'shop' | 'leaderboard' | 'hotel' | 'license_quiz';
  interactionHint:    string | null;
  hudEditMode:        boolean;
  /** Tab the shop should pre-select when opened via a shop NPC. */
  shopNpcTab:         'consumables' | 'ammo' | 'weapons' | 'vehicles' | 'properties' | null;

  // Settings
  language:           'en' | 'ar' | 'fr';
  masterVolume:       number;
  musicVolume:        number;
  sfxVolume:          number;
  graphicsQuality:    'low' | 'medium' | 'high';
  showTouchControls:  boolean;
  /** Set once by PlatformManager on startup — informational (HUD/debug), never branched on by gameplay code. */
  activePlatform:     'android' | 'ios' | 'pc' | null;
  fpsCap:             FpsCap;

  // Performance settings
  shadowsEnabled:     boolean;
  postProcessing:     boolean;
  npcDensity:         'low' | 'medium' | 'high';
  textureQuality:     'low' | 'medium' | 'high';
  /** Hard cap on simultaneously active NPCs — slider in Settings, defaults to 10 on mobile. */
  npcCount:           number;

  // Crime & Police
  lockedPropertyIds:  string[];
  stolenVehicleIds:   string[];
  pursuitActive:      boolean;
  lastCrimeTime:      number;
  /** True while the player is in the 3-second black-screen arrest sequence. */
  isArrested:         boolean;
  /** Player-owned vehicle instances spawned into the world via a car key ("Spawn Car"). */
  ownedVehicleInstances: OwnedVehicleInstance[];
  /** Vehicle instance ids currently locked (keyed by instance id). */
  lockedVehicleIds:   string[];

  // Lifestyle (homes)
  currentOutfitId:    string;
  showTv:             boolean;
  showWardrobe:       boolean;
  dialogueNpcId:      string | null;

  // Screen
  screen: 'main_menu' | 'character_creation' | 'playing' | 'game_over';

  /** 0–100, real progress of the staged map load — drives the loading bar. */
  mapLoadProgress: number;
  /** True once the map has finished its initial load — hides the loading overlay. */
  mapReady: boolean;

  // Garage vehicle storage
  garageStoredVehicles: Record<string, string[]>;

  // ── Inventory / ammo / redeem ──────────────────────────────────────────────
  /** consumable id → quantity owned */
  inventory:          Record<string, number>;
  /** ammo type → total reserve rounds */
  ammoReserves:       Record<string, number>;
  /** weaponId → rounds currently in magazine */
  weaponMags:         Record<string, number>;
  /** codes already redeemed (one-time use) */
  redeemedCodes:      string[];
  /** timestamp (ms) when cigarette dizziness ends; 0 = not dizzy */
  dizzyUntil:         number;

  // ── Bank heist ───────────────────────────────────────────────────────────
  /** True while the bank vault heist sequence (alarm/lights) is active. */
  heistActive:        boolean;
  /** Timestamp (ms) the last heist completed; 0 = never robbed. */
  heistCompletedAt:   number;

  // ── Gang followers ───────────────────────────────────────────────────────
  /** NPC spawn ids of currently-recruited gang followers (max 3). */
  gangMemberIds:      number[];
  /** Timestamp (ms) until which gang cover-fire is suppressing nearby police (pauses arrest hold). */
  gangSuppressionUntil: number;

  // ── Inventory panel UI ───────────────────────────────────────────────────
  showInventory:      boolean;
  /** True while the player is aiming their equipped weapon. */
  aimMode:            boolean;

  // Actions
  setPlayerState:     (state: Partial<GameState>) => void;
  setPlayerPosition:  (pos: [number, number, number], rotY?: number) => void;
  damagePlayer:       (amount: number) => void;
  healPlayer:         (amount: number) => void;
  addMoney:           (amount: number) => void;
  addXp:              (amount: number) => void;
  setWantedLevel:     (level: number) => void;
  setScreen:          (screen: GameState['screen']) => void;
  togglePause:        () => void;
  setActivePanel:     (panel: GameState['activePanel']) => void;
  setInteractionHint: (hint: string | null) => void;
  setDayTime:         (t: number) => void;
  enterInterior:      (id: string, exitPos: [number, number, number]) => void;
  exitInterior:       () => void;
  resetGame:          () => void;

  // Crime & lifestyle actions
  togglePropertyLock: (id: string) => void;
  markVehicleStolen:  (id: string) => void;
  triggerCrime:       (severity?: number) => void;
  decayWanted:        () => void;
  setOutfit:          (id: string) => void;
  setDialogueNpc:     (id: string | null) => void;
  /** Advances the clock. When `snapToMorning` is true (Hotel stays), time-skips directly to the next morning. */
  sleep:              (hours?: number, snapToMorning?: boolean) => void;
  /** Sells an owned property back: removes ownership + house key + lock state, refunds money. */
  sellProperty:       (id: string, refund: number) => void;

  // Vehicle key / theft / arrest actions
  /** Spawns an owned vehicle near the player. No-op if already spawned. */
  spawnOwnedVehicle:   (vehicleId: string, position: [number, number, number], rotY: number) => void;
  /** Removes an owned vehicle instance from the world (does not un-own the key). */
  despawnOwnedVehicle: (instanceId: string) => void;
  /** Toggles lock state for a spawned vehicle instance. */
  toggleVehicleLock:   (instanceId: string) => void;
  /** Called by NPC theft AI when an unlocked, unattended owned vehicle is stolen. */
  reportVehicleStolen: (instanceId: string) => void;
  /** Runs the 5-second-proximity arrest: clears contraband, resets wanted level, flags black-screen. */
  arrestPlayer:        () => void;
  /** Clears the black-screen arrest flag once the respawn has been applied. */
  clearArrest:         () => void;

  // Garage vehicle storage
  storeVehicleInGarage:    (garageId: string, vehicleId: string) => void;
  retrieveVehicleFromGarage: (garageId: string, vehicleId: string) => void;

  // ── Inventory / ammo / redeem actions ─────────────────────────────────────
  addInventoryItem:   (id: string, qty?: number) => void;
  useConsumable:      (id: string) => void;
  dropConsumable:     (id: string) => void;
  /** Buy an ammo pack. Returns false if insufficient funds. */
  buyAmmo:            (weaponId: string, price: number, packSize: number, ammoType: string) => boolean;
  /** Fire one round from a weapon magazine. Returns true if fired, false if mag empty. */
  fireWeapon:         (weaponId: string, magSize: number) => boolean;
  /** Reload weapon from ammo reserves. */
  reloadWeapon:       (weaponId: string, magSize: number, ammoType: string) => void;
  /** Drop (remove) a weapon from inventory. */
  dropWeapon:         (weaponId: string) => void;
  /** Attempt to redeem a code. Returns result object. */
  redeemCode:         (code: string) => { ok: boolean; amount: number; msg: string };
  /** Atomically deduct money and add one consumable to inventory. Returns false if insufficient funds. */
  buyConsumable:      (id: string, price: number) => boolean;

  // ── Bank heist actions ─────────────────────────────────────────────────────
  /** Starts the vault heist: credits money, sets wanted level, flashes alarm. */
  startHeist:         () => void;

  // ── Gang follower actions ───────────────────────────────────────────────────
  recruitGangMember:  (id: number) => void;
  dismissGangMember:  (id: number) => void;

  // ── Inventory panel actions ─────────────────────────────────────────────────
  toggleInventory:    () => void;
};

const initialState: Omit<GameState,
  | 'setPlayerState' | 'setPlayerPosition' | 'damagePlayer' | 'healPlayer'
  | 'addMoney'       | 'addXp'            | 'setWantedLevel'| 'setScreen'
  | 'togglePause'    | 'setActivePanel'   | 'setInteractionHint'
  | 'setDayTime'     | 'enterInterior'    | 'exitInterior'  | 'resetGame'
  | 'togglePropertyLock' | 'markVehicleStolen' | 'triggerCrime' | 'decayWanted'
  | 'setOutfit'      | 'setDialogueNpc'   | 'sleep'          | 'sellProperty'
  | 'spawnOwnedVehicle' | 'despawnOwnedVehicle' | 'toggleVehicleLock'
  | 'reportVehicleStolen' | 'arrestPlayer' | 'clearArrest'
  | 'storeVehicleInGarage' | 'retrieveVehicleFromGarage'
  | 'addInventoryItem' | 'useConsumable'  | 'dropConsumable' | 'buyAmmo'
  | 'fireWeapon'     | 'reloadWeapon'    | 'dropWeapon'     | 'redeemCode' | 'buyConsumable'
  | 'startHeist'     | 'recruitGangMember' | 'dismissGangMember' | 'toggleInventory'
> = {
  playerId:            null,
  username:            '',
  height:              175,
  clerkUserId:         null,
  money:               500,
  health:              100,
  armor:               0,
  level:               1,
  xp:                  0,
  careerPath:          'street_thug',
  ownedAssetIds:       [],
  completedMissionIds: [],
  equippedVehicleId:   null,
  equippedWeaponId:    null,

  district:            'ali_mendjeli',
  wantedLevel:         0,
  currentMissionId:    null,
  gameMode:            'free_world',

  // Spawn at central plaza (0, 1, 0) — open area at main road intersection
  playerPosition:      [310, 1, 0], // City B (Modern Downtown) — see worldConstants.SPAWN_XZ
  playerRotationY:     0,
  inVehicle:           false,
  lastDrivenVehicleId: null,

  indoors:             false,
  interiorId:          null,
  interiorExitPos:     [0, 1, 0],

  dayTime:             0.30,

  cameraMode:          'third',
  vehicleSteeringMode: 'wheel',
  vehiclePedalMode:    'buttons',
  vehicleTransmission: 'auto',

  radioUrl:            '',
  radioVolume:         80,
  showRadio:           false,

  isPaused:            false,
  showMap:             false,
  showShop:            false,
  showMissions:        false,
  showLeaderboard:     false,
  activePanel:         'none',
  interactionHint:     null,
  hudEditMode:         false,
  shopNpcTab:          null,

  language:            'en',
  masterVolume:        100,
  musicVolume:         100,
  sfxVolume:           100,
  graphicsQuality:     IS_MOBILE_DEVICE ? 'low' : 'medium',
  showTouchControls:   false,
  activePlatform:      null,
  fpsCap:              0,

  // Mobile-first: force LOW quality defaults on mobile browsers so the game
  // never boots into a heavy configuration that has to be manually downgraded.
  shadowsEnabled:      !IS_MOBILE_DEVICE,
  postProcessing:      !IS_MOBILE_DEVICE,
  npcDensity:          IS_MOBILE_DEVICE ? 'low' : 'medium',
  textureQuality:      IS_MOBILE_DEVICE ? 'low' : 'medium',
  npcCount:            IS_MOBILE_DEVICE ? 10 : 25,

  lockedPropertyIds:   [],
  stolenVehicleIds:    [],
  pursuitActive:       false,
  lastCrimeTime:       0,
  isArrested:          false,
  ownedVehicleInstances: [],
  lockedVehicleIds:    [],

  currentOutfitId:     'default',
  showTv:              false,
  showWardrobe:        false,
  dialogueNpcId:       null,

  garageStoredVehicles: {},

  inventory:           {},
  ammoReserves:        {},
  weaponMags:          {},
  redeemedCodes:       [],
  dizzyUntil:          0,

  heistActive:         false,
  heistCompletedAt:    0,

  gangMemberIds:       [],
  gangSuppressionUntil: 0,

  showInventory:       false,
  aimMode:             false,

  screen:              'main_menu',
  mapLoadProgress:     0,
  mapReady:            false,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setPlayerState:  (state) => set((prev) => ({ ...prev, ...state })),

  setPlayerPosition: (pos, rotY) => set((s) => ({
    playerPosition:  pos,
    playerRotationY: rotY !== undefined ? rotY : s.playerRotationY,
  })),

  damagePlayer: (amount) => set((state) => {
    let armor  = state.armor;
    let health = state.health;
    if (armor > 0) {
      if (armor >= amount) { armor -= amount; amount = 0; }
      else                 { amount -= armor; armor = 0; }
    }
    health -= amount;
    if (health <= 0) {
      return { health: 0, armor: 0, screen: 'game_over', money: Math.max(0, state.money * 0.8) };
    }
    return { health, armor };
  }),

  healPlayer:    (amount) => set((s) => ({ health: Math.min(100, s.health + amount) })),
  addMoney:      (amount) => set((s) => ({ money:  s.money  + amount })),

  addXp: (amount) => set((s) => {
    const newXp    = s.xp + amount;
    const required = Math.floor(100 * Math.pow(s.level, 1.5));
    if (newXp >= required) return { xp: newXp - required, level: s.level + 1, health: 100 };
    return { xp: newXp };
  }),

  setWantedLevel:     (level) => set({ wantedLevel: Math.max(0, Math.min(5, level)) }),
  setScreen:          (screen) => set({ screen }),
  togglePause:        () => set((s) => ({
    isPaused:  !s.isPaused,
    activePanel: s.isPaused ? 'none' : 'settings',
    hudEditMode: false,
    shopNpcTab: null,
  })),
  setActivePanel:     (activePanel)     => set({ activePanel }),
  setInteractionHint: (interactionHint) => set({ interactionHint }),
  setDayTime:         (dayTime)         => set({ dayTime }),

  enterInterior: (id, exitPos) => set({ indoors: true, interiorId: id, interiorExitPos: exitPos }),
  exitInterior:  ()            => set({ indoors: false, interiorId: null }),

  togglePropertyLock: (id) => set((s) => ({
    lockedPropertyIds: s.lockedPropertyIds.includes(id)
      ? s.lockedPropertyIds.filter((p) => p !== id)
      : [...s.lockedPropertyIds, id],
  })),

  markVehicleStolen: (id) => set((s) =>
    s.stolenVehicleIds.includes(id) ? {} : { stolenVehicleIds: [...s.stolenVehicleIds, id] },
  ),

  triggerCrime: (severity = 1) => set((s) => ({
    wantedLevel:   Math.max(0, Math.min(5, s.wantedLevel + severity)),
    pursuitActive: true,
    lastCrimeTime: Date.now(),
  })),

  /** Called ~once/sec while playing: cools wanted level down after a period with no new crime. */
  decayWanted: () => set((s) => {
    if (s.wantedLevel <= 0) return { pursuitActive: false };
    const idleMs = Date.now() - s.lastCrimeTime;
    if (idleMs > 12000) {
      const next = s.wantedLevel - 1;
      return { wantedLevel: next, lastCrimeTime: Date.now(), pursuitActive: next > 0 };
    }
    return {};
  }),

  setOutfit:      (currentOutfitId) => set({ currentOutfitId }),
  setDialogueNpc: (dialogueNpcId)   => set({ dialogueNpcId }),

  sleep: (hours = 8, snapToMorning = false) => set((s) => ({
    dayTime: snapToMorning ? 0.28 : (s.dayTime + hours / 24) % 1,
    health:  100,
  })),

  sellProperty: (id, refund) => set((s) => ({
    ownedAssetIds:     s.ownedAssetIds.filter((a) => a !== id && a !== `house_key_${id}`),
    lockedPropertyIds: s.lockedPropertyIds.filter((p) => p !== id),
    money:             s.money + refund,
  })),

  // ── Vehicle keys / theft / arrest ──────────────────────────────────────────

  spawnOwnedVehicle: (vehicleId, position, rotY) => set((s) => {
    if (s.ownedVehicleInstances.some((v) => v.vehicleId === vehicleId)) return {};
    const instance: OwnedVehicleInstance = { id: `owned_${vehicleId}_${Date.now()}`, vehicleId, position, rotY };
    return { ownedVehicleInstances: [...s.ownedVehicleInstances, instance] };
  }),

  despawnOwnedVehicle: (instanceId) => set((s) => ({
    ownedVehicleInstances: s.ownedVehicleInstances.filter((v) => v.id !== instanceId),
    lockedVehicleIds:      s.lockedVehicleIds.filter((id) => id !== instanceId),
    equippedVehicleId: s.equippedVehicleId === instanceId ? null : s.equippedVehicleId,
    inVehicle: s.equippedVehicleId === instanceId ? false : s.inVehicle,
  })),

  toggleVehicleLock: (instanceId) => set((s) => ({
    lockedVehicleIds: s.lockedVehicleIds.includes(instanceId)
      ? s.lockedVehicleIds.filter((id) => id !== instanceId)
      : [...s.lockedVehicleIds, instanceId],
  })),

  reportVehicleStolen: (instanceId) => set((s) => ({
    ownedVehicleInstances: s.ownedVehicleInstances.filter((v) => v.id !== instanceId),
    lockedVehicleIds:      s.lockedVehicleIds.filter((id) => id !== instanceId),
    interactionHint: '🚗 Your car was stolen!',
  })),

  /**
   * Full arrest strip: officers confiscate every weapon magazine, ammo
   * reserve, and carried consumable, unequip the current weapon, and empty
   * the player's pockets down to a flat 500 DA — matching a real booking.
   * Permanently-owned assets (properties, vehicle keys) are not revoked.
   */
  arrestPlayer: () => set((s) => {
    const clearedMags: Record<string, number> = {};
    for (const k of Object.keys(s.weaponMags)) clearedMags[k] = 0;
    return {
      isArrested:       true,
      wantedLevel:      0,
      pursuitActive:    false,
      lastCrimeTime:    Date.now(),
      weaponMags:       clearedMags,
      ammoReserves:     {},
      inventory:        {},
      equippedWeaponId: null,
      inVehicle:        false,
      equippedVehicleId: null,
      money:            500,
    };
  }),

  clearArrest: () => set({ isArrested: false }),

  storeVehicleInGarage: (garageId, vehicleId) => set((s) => {
    const current = s.garageStoredVehicles[garageId] ?? [];
    if (current.includes(vehicleId)) return {};
    return {
      garageStoredVehicles: { ...s.garageStoredVehicles, [garageId]: [...current, vehicleId] },
      equippedVehicleId: s.equippedVehicleId === vehicleId ? null : s.equippedVehicleId,
    };
  }),

  retrieveVehicleFromGarage: (garageId, vehicleId) => set((s) => {
    const current = s.garageStoredVehicles[garageId] ?? [];
    return {
      garageStoredVehicles: {
        ...s.garageStoredVehicles,
        [garageId]: current.filter((v) => v !== vehicleId),
      },
      equippedVehicleId: vehicleId,
    };
  }),

  // ── Inventory ────────────────────────────────────────────────────────────────

  addInventoryItem: (id, qty = 1) => set((s) => ({
    inventory: { ...s.inventory, [id]: (s.inventory[id] ?? 0) + qty },
  })),

  useConsumable: (id) => set((s) => {
    const qty = s.inventory[id] ?? 0;
    if (qty <= 0) return {};
    const inv = { ...s.inventory, [id]: qty - 1 };
    if (id === 'food')       return { inventory: inv, health: Math.min(100, s.health + 30) };
    if (id === 'stimulants') return { inventory: inv, health: Math.min(100, s.health + 20) };
    if (id === 'cigarettes') return { inventory: inv, dizzyUntil: Date.now() + 10_000 };
    return { inventory: inv };
  }),

  dropConsumable: (id) => set((s) => {
    const qty = s.inventory[id] ?? 0;
    if (qty <= 0) return {};
    return { inventory: { ...s.inventory, [id]: qty - 1 } };
  }),

  // ── Ammo ─────────────────────────────────────────────────────────────────────

  buyAmmo: (weaponId, price, packSize, ammoType) => {
    const s = get();
    if (s.money < price) return false;
    set((st) => ({
      money:        st.money - price,
      ammoReserves: { ...st.ammoReserves, [ammoType]: (st.ammoReserves[ammoType] ?? 0) + packSize },
    }));
    return true;
  },

  fireWeapon: (weaponId, magSize) => {
    const s   = get();
    const mag = s.weaponMags[weaponId] ?? magSize;
    if (mag <= 0) return false;
    set((st) => ({
      weaponMags: {
        ...st.weaponMags,
        [weaponId]: Math.max(0, (st.weaponMags[weaponId] ?? magSize) - 1),
      },
    }));
    return true;
  },

  reloadWeapon: (weaponId, magSize, ammoType) => set((s) => {
    const currentMag = s.weaponMags[weaponId] ?? magSize;
    const reserve    = s.ammoReserves[ammoType] ?? 0;
    const needed     = magSize - currentMag;
    const loaded     = Math.min(needed, reserve);
    if (loaded <= 0) return {};
    return {
      weaponMags:   { ...s.weaponMags,   [weaponId]: currentMag + loaded },
      ammoReserves: { ...s.ammoReserves, [ammoType]: reserve - loaded },
    };
  }),

  dropWeapon: (weaponId) => set((s) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [weaponId]: _dropped, ...restMags } = s.weaponMags;
    return {
      ownedAssetIds:    s.ownedAssetIds.filter((id) => id !== weaponId),
      equippedWeaponId: s.equippedWeaponId === weaponId ? null : s.equippedWeaponId,
      weaponMags:       restMags,
    };
  }),

  buyConsumable: (id, price) => {
    const s = get();
    if (s.money < price) return false;
    set((st) => ({
      money:     st.money - price,
      inventory: { ...st.inventory, [id]: (st.inventory[id] ?? 0) + 1 },
    }));
    return true;
  },

  // ── Redeem codes ─────────────────────────────────────────────────────────────

  redeemCode: (code) => {
    const trimmed = code.trim().toLowerCase();
    if (!(REDEEM_CODES as readonly string[]).includes(trimmed)) return { ok: false, amount: 0, msg: 'Invalid code.' };
    const s = get();
    if (s.redeemedCodes.includes(trimmed)) return { ok: false, amount: 0, msg: 'Already redeemed.' };
    // Parse amount from code name: e.g. "200k" → 200 × 1000 = 200,000 DA
    const match = trimmed.match(/^(\d+)k$/i);
    const amount = match ? parseInt(match[1], 10) * 1_000 : 10_000;
    set((st) => ({
      redeemedCodes: [...st.redeemedCodes, trimmed],
      money:         st.money + amount,
    }));
    return { ok: true, amount, msg: `+${amount.toLocaleString()} DA credited!` };
  },

  resetGame: () => set(initialState),

  // ── Bank heist ───────────────────────────────────────────────────────────
  // Crew bonus: every recruited gang member adds 15,000 DA — a direct,
  // tangible payoff for building a gang before pulling the job. The vault
  // "cracks" over the alarm-light window (3s) rather than paying out
  // instantly, so the cash lands right as sirens start closing in.
  startHeist: () => {
    const crew = get().gangMemberIds.length;
    const take = 50_000 + crew * 15_000;
    set({
      heistActive:      true,
      wantedLevel:      5,
      pursuitActive:    true,
      lastCrimeTime:    Date.now(),
      heistCompletedAt: Date.now(),
    });
    audioManager.playOneShot('siren', 'alarm', [...get().playerPosition]);
    setTimeout(() => {
      set((s) => ({ heistActive: false, money: s.money + take }));
      get().setInteractionHint(
        crew > 0
          ? `🏦 Vault cracked! +${take.toLocaleString()} DA (crew bonus: +${(crew * 15_000).toLocaleString()})`
          : `🏦 Vault cracked! +${take.toLocaleString()} DA`,
      );
      setTimeout(() => {
        if (get().interactionHint?.includes('Vault cracked')) get().setInteractionHint(null);
      }, 3000);
    }, 3000);
  },

  // ── Gang followers ───────────────────────────────────────────────────────
  recruitGangMember: (id) => set((s) =>
    s.gangMemberIds.includes(id) || s.gangMemberIds.length >= 3
      ? {}
      : { gangMemberIds: [...s.gangMemberIds, id] },
  ),

  dismissGangMember: (id) => set((s) => ({
    gangMemberIds: s.gangMemberIds.filter((m) => m !== id),
  })),

  // ── Inventory panel ──────────────────────────────────────────────────────
  toggleInventory: () => set((s) => ({ showInventory: !s.showInventory })),
}));
