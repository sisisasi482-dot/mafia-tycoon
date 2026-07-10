import { useEffect } from 'react';
import { useGameStore } from './useGameStore';

const SAVE_KEY = 'constantine_mafia_save';

// Keys to persist (never persist ephemeral runtime state)
const PERSIST_KEYS = [
  'playerId', 'username', 'money', 'level', 'xp', 'careerPath',
  'ownedAssetIds', 'completedMissionIds', 'equippedVehicleId', 'equippedWeaponId',
  'district', 'language', 'graphicsQuality',
  // Inventory & ammo — must persist so purchases survive page reload
  'inventory', 'ammoReserves', 'weaponMags',
  // Redeem codes — must persist to prevent re-use after reload
  'redeemedCodes',
  // Garage — stored vehicle lists must persist across reloads
  'garageStoredVehicles',
  // Performance settings
  'shadowsEnabled', 'postProcessing', 'npcDensity', 'textureQuality', 'npcCount',
  // Owned vehicle instances (spawned via car key) + their lock state
  'ownedVehicleInstances', 'lockedVehicleIds',
] as const;

/**
 * Standalone snapshot save — callable outside React (e.g. from the building
 * pool's memory-safety monitor right before a forced reload) so an
 * emergency reload never throws away unsaved progress.
 */
export function saveGameSnapshot(): boolean {
  const s = useGameStore.getState();
  const saveState: Record<string, unknown> = {};
  for (const key of PERSIST_KEYS) saveState[key] = s[key];
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
  return true;
}

export function useSaveSystem() {
  // Use specific selectors so this hook only re-renders when screen changes.
  // All other reads use getState() so they never subscribe to store changes.
  const screen = useGameStore((s) => s.screen);

  const saveGame = saveGameSnapshot;

  const loadGame = () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Whitelist only known persist keys — never let saved data stomp actions or ephemeral state
        const safe: Record<string, unknown> = {};
        for (const key of PERSIST_KEYS) {
          if (key in parsed) safe[key] = parsed[key];
        }
        useGameStore.getState().setPlayerState({
          ...safe,
          screen: 'playing',
          health: 100,
          wantedLevel: 0,
          isArrested: false,
          inVehicle: false,
          equippedVehicleId: null,
          playerPosition: [-125, 1, 0],
          mapLoadProgress: 0,
          mapReady: false,
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to load game', e);
    }
    return false;
  };

  const hasSaveGame = () => localStorage.getItem(SAVE_KEY) !== null;

  // Auto-save every 30 seconds while playing
  useEffect(() => {
    if (screen !== 'playing') return;
    const interval = setInterval(saveGame, 30_000);
    return () => clearInterval(interval);
  }, [screen]); // only depends on screen — saveGame reads store via getState()

  return { saveGame, loadGame, hasSaveGame };
}
