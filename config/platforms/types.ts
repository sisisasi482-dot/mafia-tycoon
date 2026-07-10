/**
 * Shared platform-configuration contract for Constantine Mafia.
 *
 * Every platform file in this folder (android/ios/pc) exports one object
 * matching `PlatformConfig`. The game never branches on `Platform.OS`-style
 * checks scattered through gameplay code — it asks a single
 * `PlatformManager` (see `artifacts/constantine-mafia/src/game/platform/PlatformManager.ts`)
 * for the active config and reads `input` / `quality` / `packaging` from it.
 *
 * This keeps the three concerns cleanly separated:
 *   - `input`     → how the player controls the game (touch vs keyboard/mouse)
 *   - `quality`    → rendering/perf budget for the target device class
 *   - `packaging`  → build/export metadata used by the Capacitor pipeline
 */

export type PlatformId = 'android' | 'ios' | 'pc';

/** Value types intentionally mirror the existing fields on `useGameStore` so
 *  a platform config can be applied to the store with no translation layer. */
export type GraphicsQuality = 'low' | 'medium' | 'high';
/** 0 = unlimited, matches `FpsCap` in `useGameStore.ts`. */
export type FpsCapValue = 0 | 30 | 60;

export interface InputScheme {
  /** Primary input paradigm for this platform. */
  scheme: 'touch' | 'keyboard-mouse';
  /** Show the on-screen virtual joystick + steering wheel/pedals. */
  virtualJoystick: boolean;
  /** Show on-screen action buttons (sprint/use/jump, gear, exit). */
  touchButtons: boolean;
  /** Enable pointer-lock mouse-look (desktop only — meaningless on touch). */
  pointerLock: boolean;
  /** Allow device-tilt (gyroscope) steering while driving. */
  gyroSteering: boolean;
  /** Default keyboard bindings; omitted entirely on touch-only platforms. */
  keyboardBindings?: Record<string, string[]>;
}

export interface QualitySettings {
  graphicsQuality: GraphicsQuality;
  textureQuality: GraphicsQuality;
  shadowsEnabled: boolean;
  postProcessing: boolean;
  /** Multiplies the renderer's device-pixel-ratio cap — lets tablets render
   *  below native resolution for performance without touching desktop. */
  resolutionScale: number;
  npcDensity: GraphicsQuality;
  npcCount: number;
  fpsCap: FpsCapValue;
}

export interface PackagingConfig {
  /** Reverse-DNS app id used by Capacitor / app stores. */
  appId: string;
  appName: string;
  /** Export targets this platform's build pipeline supports. */
  buildTargets: string[];
  notes: string;
}

export interface PlatformConfig {
  id: PlatformId;
  displayName: string;
  input: InputScheme;
  quality: QualitySettings;
  packaging: PackagingConfig;
}
