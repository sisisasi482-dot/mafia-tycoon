import { create } from 'zustand';

export type CameraMode = 'third' | 'second' | 'first';
export type SteeringMode = 'wheel' | 'arrows' | 'tilt' | 'slider';
export type PedalMode = 'buttons' | 'slider';
export type Transmission = 'auto' | 'manual';

export type GameState = {
  // Player
  playerId: string | null;
  username: string;
  money: number;
  health: number;
  armor: number;
  level: number;
  xp: number;
  careerPath: 'street_thug' | 'gangster' | 'crime_boss' | 'business_tycoon';
  ownedAssetIds: string[];
  completedMissionIds: string[];
  equippedVehicleId: string | null;
  equippedWeaponId: string | null;

  // World
  district: 'ali_mendjeli' | 'centre_ville' | 'old_city' | 'ain_mlila' | 'airport';
  wantedLevel: number;
  currentMissionId: string | null;
  gameMode: 'story' | 'free_world';

  // Player Physics State (not persisted)
  playerPosition: [number, number, number];
  playerRotationY: number;
  inVehicle: boolean;

  // Camera
  cameraMode: CameraMode;

  // Vehicle Controls
  vehicleSteeringMode: SteeringMode;
  vehiclePedalMode: PedalMode;
  vehicleTransmission: Transmission;

  // Radio
  radioUrl: string;
  radioVolume: number;
  showRadio: boolean;

  // UI state
  isPaused: boolean;
  showMap: boolean;
  showShop: boolean;
  showMissions: boolean;
  showLeaderboard: boolean;
  activePanel: 'none' | 'settings' | 'map' | 'missions' | 'shop' | 'leaderboard';
  interactionHint: string | null;
  hudEditMode: boolean;

  // Settings
  language: 'en' | 'ar' | 'fr';
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  showTouchControls: boolean;

  // Screen
  screen: 'main_menu' | 'character_creation' | 'playing' | 'game_over';

  // Actions
  setPlayerState: (state: Partial<GameState>) => void;
  setPlayerPosition: (pos: [number, number, number], rotY?: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  addMoney: (amount: number) => void;
  addXp: (amount: number) => void;
  setWantedLevel: (level: number) => void;
  setScreen: (screen: GameState['screen']) => void;
  togglePause: () => void;
  setActivePanel: (panel: GameState['activePanel']) => void;
  setInteractionHint: (hint: string | null) => void;
  resetGame: () => void;
};

const initialState: Omit<GameState,
  'setPlayerState' | 'setPlayerPosition' | 'damagePlayer' | 'healPlayer' |
  'addMoney' | 'addXp' | 'setWantedLevel' | 'setScreen' | 'togglePause' |
  'setActivePanel' | 'setInteractionHint' | 'resetGame'
> = {
  playerId: null,
  username: '',
  money: 500,
  health: 100,
  armor: 0,
  level: 1,
  xp: 0,
  careerPath: 'street_thug',
  ownedAssetIds: [],
  completedMissionIds: [],
  equippedVehicleId: null,
  equippedWeaponId: null,
  district: 'ali_mendjeli',
  wantedLevel: 0,
  currentMissionId: null,
  gameMode: 'free_world',
  playerPosition: [-125, 1, 0],
  playerRotationY: 0,
  inVehicle: false,
  cameraMode: 'third',
  vehicleSteeringMode: 'wheel',
  vehiclePedalMode: 'buttons',
  vehicleTransmission: 'auto',
  radioUrl: '',
  radioVolume: 80,
  showRadio: false,
  isPaused: false,
  showMap: false,
  showShop: false,
  showMissions: false,
  showLeaderboard: false,
  activePanel: 'none',
  interactionHint: null,
  hudEditMode: false,
  language: 'en',
  masterVolume: 100,
  musicVolume: 100,
  sfxVolume: 100,
  graphicsQuality: 'medium',
  showTouchControls: false,
  screen: 'main_menu',
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setPlayerState: (state) => set((prev) => ({ ...prev, ...state })),
  setPlayerPosition: (pos, rotY) => set((s) => ({
    playerPosition: pos,
    playerRotationY: rotY !== undefined ? rotY : s.playerRotationY,
  })),

  damagePlayer: (amount) => set((state) => {
    let newArmor = state.armor;
    let newHealth = state.health;
    if (newArmor > 0) {
      if (newArmor >= amount) { newArmor -= amount; amount = 0; }
      else { amount -= newArmor; newArmor = 0; }
    }
    newHealth -= amount;
    if (newHealth <= 0) {
      return { health: 0, armor: 0, screen: 'game_over', money: Math.max(0, state.money * 0.8) };
    }
    return { health: newHealth, armor: newArmor };
  }),

  healPlayer: (amount) => set((state) => ({ health: Math.min(100, state.health + amount) })),
  addMoney: (amount) => set((state) => ({ money: state.money + amount })),

  addXp: (amount) => set((state) => {
    const newXp = state.xp + amount;
    const requiredForNext = Math.floor(100 * Math.pow(state.level, 1.5));
    if (newXp >= requiredForNext) {
      return { xp: newXp - requiredForNext, level: state.level + 1, health: 100 };
    }
    return { xp: newXp };
  }),

  setWantedLevel: (level) => set({ wantedLevel: Math.max(0, Math.min(5, level)) }),
  setScreen: (screen) => set({ screen }),
  togglePause: () => set((state) => ({
    isPaused: !state.isPaused,
    activePanel: state.isPaused ? 'none' : 'settings',
    hudEditMode: false,
  })),
  setActivePanel: (activePanel) => set({ activePanel }),
  setInteractionHint: (interactionHint) => set({ interactionHint }),
  resetGame: () => set(initialState),
}));
