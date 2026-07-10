/**
 * Platform-agnostic core boundary.
 *
 * Nothing in game logic (Player, Vehicles, Police, GangFollowers, Bank,
 * audio, proximity streaming, etc.) should ever check "am I on Android?" —
 * that would scatter platform branching across the codebase. Instead:
 *
 *   1. `detectPlatform()` figures out which of android/ios/pc we're running
 *      on exactly once, using Capacitor's native bridge when the app has
 *      been packaged (see `capacitor.config.ts`), falling back to touch/UA
 *      heuristics for the plain browser build.
 *   2. `getActivePlatformConfig()` returns the matching config object from
 *      `/config/platforms/` — the single source of truth for that
 *      platform's input scheme and quality budget.
 *   3. `applyPlatformConfig()` is the ONLY place that pushes those values
 *      into the game store. Call it once at startup; everything downstream
 *      (Player's ControlsMap, TouchControls' visibility, the quality
 *      controllers in GameEngine) already reads store state, so no other
 *      file needs to know a platform config exists at all.
 *
 * Result: game logic stays platform-agnostic; only this module + the
 * `/config/platforms/*` data files know platform details.
 */
import { androidConfig, iosConfig, pcConfig, type PlatformConfig, type PlatformId } from '@platform-config';
import { useGameStore } from '../useGameStore';
import { hasSaveGameSnapshot } from '../useSaveSystem';

/** Manual override for testing/QA — e.g. `?platform=android` while developing in a desktop browser. */
function getOverride(): PlatformId | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('platform');
  if (param === 'android' || param === 'ios' || param === 'pc') return param;
  return null;
}

/** True once wrapped by Capacitor and running inside the native shell (not the plain browser). */
function getCapacitorPlatform(): PlatformId | null {
  const cap = (globalThis as any).Capacitor;
  if (!cap || typeof cap.getPlatform !== 'function') return null;
  const platform = cap.getPlatform();
  if (platform === 'android') return 'android';
  if (platform === 'ios') return 'ios';
  return null; // Capacitor reports 'web' when running its dev server in a plain browser
}

export function detectPlatform(): PlatformId {
  const override = getOverride();
  if (override) return override;

  const native = getCapacitorPlatform();
  if (native) return native;

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    const touch = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
    if (touch && /Android/i.test(ua)) return 'android';
    if (touch && /iPad|iPhone|iPod/i.test(ua)) return 'ios';
  }
  return 'pc';
}

const PLATFORM_CONFIGS: Record<PlatformId, PlatformConfig> = {
  android: androidConfig,
  ios: iosConfig,
  pc: pcConfig,
};

let activePlatform: PlatformId | null = null;

export function getActivePlatformConfig(): PlatformConfig {
  if (!activePlatform) activePlatform = detectPlatform();
  return PLATFORM_CONFIGS[activePlatform];
}

/**
 * Applies one platform config's input/quality defaults to the store.
 *
 * Only overwrites graphics/quality settings on a player's very first launch
 * (no save file yet) — once they have a save, those fields are part of
 * `PERSIST_KEYS` and reflect the player's own choices from the Settings
 * menu, which must never be silently stomped just because GameEngine
 * remounted. `activePlatform` and `showTouchControls` are re-applied every
 * time regardless, since they describe the current device/session, not a
 * saved preference.
 */
export function applyPlatformConfig(config: PlatformConfig = getActivePlatformConfig()): void {
  const { quality, id } = config;
  const isFirstLaunch = !hasSaveGameSnapshot();

  useGameStore.getState().setPlayerState({
    ...(isFirstLaunch
      ? {
          graphicsQuality: quality.graphicsQuality,
          textureQuality: quality.textureQuality,
          shadowsEnabled: quality.shadowsEnabled,
          postProcessing: quality.postProcessing,
          npcDensity: quality.npcDensity,
          npcCount: quality.npcCount,
          fpsCap: quality.fpsCap,
        }
      : {}),
    showTouchControls: config.input.scheme === 'touch',
    activePlatform: id,
  });
}
