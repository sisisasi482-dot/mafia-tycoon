import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the existing Vite web build (dist/public) into native
 * Android/iOS projects — the game's React/Three.js/Zustand code is never
 * duplicated or rewritten, only packaged. Metadata here is intentionally
 * kept in sync with `/config/platforms/android.config.ts` and
 * `ios.config.ts` (appId/appName), which remain the source of truth for
 * platform *behavior*; this file only concerns native packaging.
 */
const config: CapacitorConfig = {
  appId: 'com.constantine.mafia',
  appName: 'Constantine Mafia',
  webDir: 'dist/public',
  server: {
    // Allow cleartext during local device testing against the Replit dev
    // server; production builds always bundle the static dist/public assets.
    androidScheme: 'https',
  },
};

export default config;
