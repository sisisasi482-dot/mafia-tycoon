import type { PlatformConfig } from './types';

/**
 * Android — phones and tablets, packaged via Capacitor into a Gradle
 * project that produces an installable APK (see
 * `artifacts/constantine-mafia/capacitor.config.ts` and the
 * `build:android` / `open:android` scripts in that package's package.json).
 */
const androidConfig: PlatformConfig = {
  id: 'android',
  displayName: 'Android (Phone / Tablet)',
  input: {
    scheme: 'touch',
    virtualJoystick: true,
    touchButtons: true,
    pointerLock: false,
    gyroSteering: true, // tablets have accelerometer/gyro — tilt-to-steer is available
  },
  quality: {
    graphicsQuality: 'low',
    textureQuality: 'low',
    shadowsEnabled: false,
    postProcessing: false,
    // Tablet GPUs (esp. mid-range Android tablets) struggle at native DPR
    // with a full 3D city — render a bit below native and let CSS upscale.
    resolutionScale: 0.85,
    npcDensity: 'low',
    npcCount: 10,
    fpsCap: 30,
  },
  packaging: {
    appId: 'com.constantine.mafia',
    appName: 'Constantine Mafia',
    buildTargets: ['apk', 'aab'],
    notes:
      'Run `pnpm --filter @workspace/constantine-mafia run build:android` to produce ' +
      'the web bundle and sync it into the native android/ Gradle project, then open ' +
      'android/ in Android Studio (or run `cd android && ./gradlew assembleDebug` on a ' +
      'machine with the Android SDK installed) to generate an installable APK for your tablet.',
  },
};

export default androidConfig;
