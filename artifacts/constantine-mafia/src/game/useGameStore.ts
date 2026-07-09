import { create } from 'zustand';

export type CameraMode    = 'third' | 'second' | 'first';
export type SteeringMode  = 'wheel' | 'arrows' | 'tilt' | 'slider';
export type PedalMode     = 'buttons' | 'slider';
export type Transmission  = 'auto' | 'manual';
export type FpsCap        = 0 | 30 | 60;  // 0 = unlimited

export type GameState = {
  // Player
  playerId:           string | null;
  username:           string;
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
  activePanel: 'none' | 'settings' | 'map' | 'missions' | 'shop' | 'leaderboard';
  interactionHint:    string | null;
  hudEditMode:        boolean;

  // Settings
  language:           'en' | 'ar' | 'fr';
  masterVolume:       number;
  musicVolume:        number;
  sfxVolume:          number;
  graphicsQuality:    'low' | 'medium' | 'high';
  showTouchControls:  boolean;
  fpsCap:             FpsCap;

  // Crime & Police
  lockedPropertyIds:  string[];
  stolenVehicleIds:   string[];
  pursuitActive:      boolean;
  lastCrimeTime:      number;

  // Lifestyle (homes)
  currentOutfitId:    string;
  showTv:             boolean;
  showWardrobe:       boolean;
  dialogueNpcId:      string | null;

  // Screen
  screen: 'main_menu' | 'character_creation' | 'playing' | 'game_over';

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
  sleep:              (hours?: number) => void;

  // Garage vehicle storage
  garageStoredVehicles: Record<string, string[]>;
  storeVehicleInGarage:    (garageId: string, vehicleId: string) => void;
  retrieveVehicleFromGarage: (garageId: string, vehicleId: string) => void;
};

const initialState: Omit<GameState,
  | 'setPlayerState' | 'setPlayerPosition' | 'damagePlayer' | 'healPlayer'
  | 'addMoney'       | 'addXp'            | 'setWantedLevel'| 'setScreen'
  | 'togglePause'    | 'setActivePanel'   | 'setInteractionHint'
  | 'setDayTime'     | 'enterInterior'    | 'exitInterior'  | 'resetGame'
  | 'togglePropertyLock' | 'markVehicleStolen' | 'triggerCrime' | 'decayWanted'
  | 'setOutfit'      | 'setDialogueNpc'   | 'sleep'
  | 'storeVehicleInGarage' | 'retrieveVehicleFromGarage'
> = {
  playerId:            null,
  username:            '',
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
  playerPosition:      [0, 1, 0],
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

  language:            'en',
  masterVolume:        100,
  musicVolume:         100,
  sfxVolume:           100,
  graphicsQuality:     'medium',
  showTouchControls:   false,
  fpsCap:              0,

  lockedPropertyIds:   [],
  stolenVehicleIds:    [],
  pursuitActive:       false,
  lastCrimeTime:       0,

  currentOutfitId:     'default',
  showTv:              false,
  showWardrobe:        false,
  dialogueNpcId:       null,

  garageStoredVehicles: {},

  screen:              'main_menu',
};

export const useGameStore = create<GameState>((set) => ({
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

  sleep: (hours = 8) => set((s) => ({
    dayTime: (s.dayTime + hours / 24) % 1,
    health:  100,
  })),

  storeVehicleInGarage: (garageId, vehicleId) => set((s) => {
    const current = s.garageStoredVehicles[garageId] ?? [];
    if (current.includes(vehicleId)) return {};
    return {
      garageStoredVehicles: { ...s.garageStoredVehicles, [garageId]: [...current, vehicleId] },
      // De-equip the vehicle since it's now parked
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

  resetGame: () => set(initialState),
}));
