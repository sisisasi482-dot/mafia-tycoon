import type { PlatformConfig } from './types';
import { DEFAULT_BINDINGS } from '../../artifacts/constantine-mafia/src/game/keyBindings';

/**
 * PC — desktop/laptop browsers. Keyboard + mouse, no on-screen touch UI,
 * and the highest quality tier since desktop GPUs/displays can afford it.
 */
const pcConfig: PlatformConfig = {
  id: 'pc',
  displayName: 'PC (Desktop Browser)',
  input: {
    scheme: 'keyboard-mouse',
    virtualJoystick: false,
    touchButtons: false,
    pointerLock: true,
    gyroSteering: false,
    keyboardBindings: DEFAULT_BINDINGS,
  },
  quality: {
    graphicsQuality: 'high',
    textureQuality: 'high',
    shadowsEnabled: true,
    postProcessing: true,
    // Desktop displays can be high-DPI — allow rendering above 1x DPR.
    resolutionScale: 1.5,
    npcDensity: 'medium',
    npcCount: 25,
    fpsCap: 0, // unlimited
  },
  packaging: {
    appId: 'com.constantine.mafia',
    appName: 'Constantine Mafia',
    buildTargets: ['web'],
    notes: 'Ships as the standard Vite web build — no native packaging step required.',
  },
};

export default pcConfig;
