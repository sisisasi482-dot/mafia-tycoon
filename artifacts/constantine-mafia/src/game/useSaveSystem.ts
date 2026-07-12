import { useEffect } from 'react';
import { useUser } from '@clerk/react';
import { useGameStore } from './useGameStore';
import { getMyPlayer, saveMyPlayer } from '@workspace/api-client-react';

const SAVE_KEY = 'constantine_mafia_save';

// Module-scoped (not per-component) — several components call useSaveSystem()
// (MainMenu, PauseMenu), each mounting its own copy of the "pull cloud save
// on first load" effect below. Without this guard, opening the pause menu
// shortly after character creation (before the 30s autosave interval writes
// a local save) re-ran the pull, fetched the cloud player row — which still
// had ownedAssetIds: [] because linkMyPlayer only sends username/height —
// and stomped the freshly-granted national_id via setPlayerState. Gate to
// exactly one attempt per page load, regardless of how many components mount.
let cloudPullAttempted = false;

// Subset of PERSIST_KEYS that also exists as columns on the cloud player
// profile (see lib/db/src/schema/players.ts + PlayerSave in openapi.yaml).
// Fields like inventory/ammo/garage vehicles remain local-only for now —
// cloud save is an additive sync of the core profile, not a full replica.
const CLOUD_KEYS = [
  'username', 'height', 'money', 'level', 'xp', 'careerPath',
  'district', 'ownedAssetIds', 'completedMissionIds',
] as const;

/**
 * Best-effort push of the core player profile to the cloud for the
 * signed-in Google account. No-ops silently offline/signed-out/on error —
 * localStorage remains the source of truth for gameplay continuity.
 */
async function syncCloudSave(): Promise<void> {
  const s = useGameStore.getState();
  if (!s.clerkUserId) return;
  const payload: Record<string, unknown> = {};
  for (const key of CLOUD_KEYS) payload[key] = s[key];
  try {
    await saveMyPlayer(payload as never);
  } catch (e) {
    console.error('Cloud save sync failed (will retry on next autosave)', e);
  }
}

// Keys to persist (never persist ephemeral runtime state)
const PERSIST_KEYS = [
  'playerId', 'username', 'height', 'money', 'level', 'xp', 'careerPath',
  'ownedAssetIds', 'completedMissionIds', 'equippedVehicleId', 'equippedWeaponId',
  'district', 'language', 'graphicsQuality',
  // Inventory & ammo — must persist so purchases survive page reload
  'inventory', 'ammoReserves', 'weaponMags',
  // Redeem codes — must persist to prevent re-use after reload
  'redeemedCodes',
  // Garage — stored vehicle lists must persist across reloads
  'garageStoredVehicles',
  // Performance settings
  'shadowsEnabled', 'postProcessing', 'npcDensity', 'textureQuality', 'npcCount', 'fpsCap',
  // Owned vehicle instances (spawned via car key) + their lock state
  'ownedVehicleInstances', 'lockedVehicleIds',
  // Property lock state (house/garage keys) — ownership itself lives in
  // ownedAssetIds (already persisted + cloud-synced above).
  'lockedPropertyIds',
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

/** Standalone check usable outside React (e.g. PlatformManager) — true once a *valid* save exists. */
export function hasSaveGameSnapshot(): boolean {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    JSON.parse(raw);
    return true;
  } catch {
    // Corrupted save data — treat as no save so first-launch platform defaults still apply.
    return false;
  }
}

export function useSaveSystem() {
  // Use specific selectors so this hook only re-renders when screen changes.
  // All other reads use getState() so they never subscribe to store changes.
  const screen = useGameStore((s) => s.screen);
  const { user, isLoaded } = useUser();

  const saveGame = () => {
    const ok = saveGameSnapshot();
    void syncCloudSave();
    return ok;
  };

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
          playerPosition: [310, 1, 0], // City B (Modern Downtown) — see worldConstants.SPAWN_XZ
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

  const hasSaveGame = hasSaveGameSnapshot;

  // Auto-save every 30 seconds while playing (writes local + best-effort cloud)
  useEffect(() => {
    if (screen !== 'playing') return;
    const interval = setInterval(saveGame, 30_000);
    return () => clearInterval(interval);
  }, [screen]); // only depends on screen — saveGame reads store via getState()

  // On first load, if this device has no local save yet but the player is
  // signed in with Google, pull their cloud profile so returning on a new
  // device (or after clearing storage) doesn't look like a fresh start.
  useEffect(() => {
    if (!isLoaded || !user || hasSaveGameSnapshot() || cloudPullAttempted) return;
    cloudPullAttempted = true;
    let cancelled = false;
    getMyPlayer()
      .then((player) => {
        if (cancelled) return;
        useGameStore.getState().setPlayerState({
          username: player.username,
          height: player.height,
          clerkUserId: user.id,
          money: player.money,
          level: player.level,
          xp: player.xp,
          careerPath: player.careerPath,
          district: player.district as never,
          ownedAssetIds: player.ownedAssetIds,
          completedMissionIds: player.completedMissionIds,
        });
        saveGameSnapshot();
      })
      .catch(() => {
        // No cloud save linked yet (404) or offline — fall through to the
        // normal Character Creation flow, nothing to do here.
      });
    return () => { cancelled = true; };
  }, [isLoaded, user]);

  return { saveGame, loadGame, hasSaveGame };
}
