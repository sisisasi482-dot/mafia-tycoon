import type { PlatformConfig, PlatformId } from './types';
import androidConfig from './android.config';
import iosConfig from './ios.config';
import pcConfig from './pc.config';

export type { PlatformConfig, PlatformId, InputScheme, QualitySettings, PackagingConfig } from './types';
export { androidConfig, iosConfig, pcConfig };

export const PLATFORM_CONFIGS: Record<PlatformId, PlatformConfig> = {
  android: androidConfig,
  ios: iosConfig,
  pc: pcConfig,
};

export function getPlatformConfig(id: PlatformId): PlatformConfig {
  return PLATFORM_CONFIGS[id];
}
