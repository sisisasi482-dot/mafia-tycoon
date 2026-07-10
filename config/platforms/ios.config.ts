import type { PlatformConfig } from './types';

/**
 * iOS — packaged via Capacitor into an Xcode project. Building and signing
 * the final .ipa requires Xcode + an Apple Developer account on macOS; this
 * config only covers what the web layer needs to know to behave correctly
 * once wrapped (input scheme + quality budget) plus the packaging metadata
 * consumed by `npx cap sync ios` / `npx cap open ios`.
 */
const iosConfig: PlatformConfig = {
  id: 'ios',
  displayName: 'iOS (iPhone / iPad)',
  input: {
    scheme: 'touch',
    virtualJoystick: true,
    touchButtons: true,
    pointerLock: false,
    gyroSteering: true,
  },
  quality: {
    // iPhones/iPads generally have stronger, more consistent GPUs per-class
    // than budget Android tablets, so default one notch above Android.
    graphicsQuality: 'medium',
    textureQuality: 'medium',
    shadowsEnabled: false,
    postProcessing: false,
    resolutionScale: 0.9,
    npcDensity: 'low',
    npcCount: 12,
    fpsCap: 30,
  },
  packaging: {
    appId: 'com.constantine.mafia',
    appName: 'Constantine Mafia',
    buildTargets: ['ipa'],
    notes:
      'Run `pnpm --filter @workspace/constantine-mafia run build:ios` to produce the web ' +
      'bundle and sync it into the native ios/ Xcode project, then open ios/App/App.xcworkspace ' +
      'in Xcode (macOS + Apple Developer account required) to archive and export the .ipa. ' +
      'This container cannot build or sign iOS binaries — Xcode is macOS-only.',
  },
};

export default iosConfig;
