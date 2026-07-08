import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { useSaveSystem } from '../game/useSaveSystem';
import { t } from '../game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MapView } from './MapView';
import { ShopPanel } from './ShopPanel';
import { MissionPanel } from './MissionPanel';

export function PauseMenu() {
  const store = useGameStore();
  const { saveGame } = useSaveSystem();
  const lang = store.language;
  const rtl = lang === 'ar';

  if (!store.isPaused || store.screen !== 'playing') return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-4xl h-full max-h-[800px] bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col md:flex-row shadow-2xl overflow-hidden"
        >
          {/* Sidebar / top tab bar
              – mobile: full-width horizontal strip at the top (flex-row, scrollable)
              – md+:    fixed-width vertical sidebar on the left (flex-col) */}
          <div className="md:w-52 bg-[#111] md:border-r border-b md:border-b-0 border-white/10
                          flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible
                          p-2 md:p-4 shrink-0">
            {/* Title — hidden on mobile to save space */}
            <h2 className="hidden md:block text-sm font-bold text-primary mb-2 uppercase tracking-widest px-2">
              Constantine
            </h2>

            {/* Resume — always first */}
            <button
              onClick={() => store.togglePause()}
              className="shrink-0 px-3 md:px-0 md:w-full py-2 md:py-3 text-center font-black rounded-lg
                         bg-primary text-black hover:bg-primary/90 transition-colors
                         uppercase tracking-widest text-xs md:text-sm md:mb-1 whitespace-nowrap"
            >
              ▶ {t('resume', lang)}
            </button>

            <MobileMenuButton active={store.activePanel === 'settings'} onClick={() => store.setActivePanel('settings')}>
              ⚙ <span className="hidden md:inline">{t('settings', lang)}</span><span className="md:hidden">Settings</span>
            </MobileMenuButton>
            <MobileMenuButton active={store.activePanel === 'map'} onClick={() => store.setActivePanel('map')}>
              🗺 <span className="hidden md:inline">{t('map', lang)}</span><span className="md:hidden">Map</span>
            </MobileMenuButton>
            <MobileMenuButton active={store.activePanel === 'missions'} onClick={() => store.setActivePanel('missions')}>
              📋 <span className="hidden md:inline">{t('missions', lang)}</span><span className="md:hidden">Missions</span>
            </MobileMenuButton>
            <MobileMenuButton active={store.activePanel === 'shop'} onClick={() => store.setActivePanel('shop')}>
              🛒 <span className="hidden md:inline">{t('shop', lang)}</span><span className="md:hidden">Shop</span>
            </MobileMenuButton>

            {/* Spacer + bottom actions only visible on desktop */}
            <div className="hidden md:flex flex-1" />
            <button
              onClick={() => { saveGame(); alert(t('saved', lang)); }}
              className="hidden md:block w-full p-3 text-left text-sm font-medium rounded
                         text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              💾 {t('save_game', lang)}
            </button>
            <button
              onClick={() => { store.setScreen('main_menu'); store.togglePause(); }}
              className="hidden md:block w-full p-3 text-left text-sm font-medium rounded
                         text-red-400 hover:bg-red-900/20 transition-colors"
            >
              ✕ {t('exit_to_menu', lang)}
            </button>

            {/* Mobile-only: save + exit as compact icon buttons */}
            <div className="md:hidden flex gap-1 ml-auto shrink-0">
              <button
                onClick={() => { saveGame(); alert(t('saved', lang)); }}
                title={t('save_game', lang)}
                className="px-3 py-2 rounded text-gray-400 hover:bg-white/10 text-sm transition-colors"
              >💾</button>
              <button
                onClick={() => { store.setScreen('main_menu'); store.togglePause(); }}
                title={t('exit_to_menu', lang)}
                className="px-3 py-2 rounded text-red-400 hover:bg-red-900/20 text-sm transition-colors"
              >✕</button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {store.activePanel === 'settings'  && <SettingsPanel />}
            {store.activePanel === 'map'        && <MapView />}
            {store.activePanel === 'missions'   && <MissionPanel />}
            {store.activePanel === 'shop'       && <ShopPanel />}
            {store.activePanel === 'none'       && (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                Select an option from the menu.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MobileMenuButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 md:px-0 md:w-full py-2 md:py-3 text-left text-xs md:text-sm font-medium rounded
                  whitespace-nowrap transition-all
                  ${active
                    ? 'bg-primary/10 text-primary md:border-l-4 border-b-2 md:border-b-0 border-primary'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white md:border-l-4 border-b-2 md:border-b-0 border-transparent'
                  }`}
    >
      {children}
    </button>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Opt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide transition-all ${
        active ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/15 text-gray-400 hover:border-white/40 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function SettingsPanel() {
  const store = useGameStore();
  const lang  = store.language;

  return (
    <div className="space-y-6 max-w-lg overflow-y-auto">
      <h3 className="text-2xl font-bold text-white border-b border-white/10 pb-3">{t('settings', lang)}</h3>

      {/* ── Language ── */}
      <OptionRow label={t('language', lang)}>
        {(['en', 'ar', 'fr'] as const).map((l) => (
          <Opt key={l} active={store.language === l} onClick={() => store.setPlayerState({ language: l })}>
            {l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Français'}
          </Opt>
        ))}
      </OptionRow>

      {/* ── Graphics ── */}
      <OptionRow label={t('graphics', lang)}>
        {(['low', 'medium', 'high'] as const).map((g) => (
          <Opt key={g} active={store.graphicsQuality === g} onClick={() => store.setPlayerState({ graphicsQuality: g })}>
            {t(g, lang)}
          </Opt>
        ))}
      </OptionRow>

      {/* ── Audio ── */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{t('audio', lang)}</label>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">🔈</span>
          <input type="range" min="0" max="100" value={store.masterVolume}
            onChange={(e) => store.setPlayerState({ masterVolume: parseInt(e.target.value) })}
            className="flex-1 accent-primary h-1.5" />
          <span className="text-gray-400 text-xs w-8">{store.masterVolume}%</span>
        </div>
      </div>

      {/* ── Camera Mode ── */}
      <OptionRow label="Camera Mode">
        <Opt active={store.cameraMode === 'third'}  onClick={() => store.setPlayerState({ cameraMode: 'third'  })}>Third-Person</Opt>
        <Opt active={store.cameraMode === 'second'} onClick={() => store.setPlayerState({ cameraMode: 'second' })}>Second-Person</Opt>
        <Opt active={store.cameraMode === 'first'}  onClick={() => store.setPlayerState({ cameraMode: 'first'  })}>First-Person (FPV)</Opt>
      </OptionRow>

      {/* ── Vehicle Controls ── */}
      <div className="border-t border-white/8 pt-4 space-y-4">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Vehicle Controls</h4>

        <OptionRow label="Steering">
          <Opt active={store.vehicleSteeringMode === 'wheel'}  onClick={() => store.setPlayerState({ vehicleSteeringMode: 'wheel'  })}>🎡 Wheel</Opt>
          <Opt active={store.vehicleSteeringMode === 'arrows'} onClick={() => store.setPlayerState({ vehicleSteeringMode: 'arrows' })}>⬆ Arrows</Opt>
          <Opt active={store.vehicleSteeringMode === 'tilt'}   onClick={() => store.setPlayerState({ vehicleSteeringMode: 'tilt'   })}>📱 Tilt</Opt>
          <Opt active={store.vehicleSteeringMode === 'slider'} onClick={() => store.setPlayerState({ vehicleSteeringMode: 'slider' })}>↔ Slider</Opt>
        </OptionRow>

        <OptionRow label="Pedals">
          <Opt active={store.vehiclePedalMode === 'buttons'} onClick={() => store.setPlayerState({ vehiclePedalMode: 'buttons' })}>Buttons</Opt>
          <Opt active={store.vehiclePedalMode === 'slider'}  onClick={() => store.setPlayerState({ vehiclePedalMode: 'slider'  })}>Slider</Opt>
        </OptionRow>

        <OptionRow label="Transmission">
          <Opt active={store.vehicleTransmission === 'auto'}   onClick={() => store.setPlayerState({ vehicleTransmission: 'auto'   })}>Auto</Opt>
          <Opt active={store.vehicleTransmission === 'manual'} onClick={() => store.setPlayerState({ vehicleTransmission: 'manual' })}>Manual</Opt>
        </OptionRow>
      </div>

      {/* ── HUD ── */}
      <div className="border-t border-white/8 pt-4 space-y-3">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">HUD</h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={store.showTouchControls}
            onChange={(e) => store.setPlayerState({ showTouchControls: e.target.checked })}
            className="w-4 h-4 accent-primary" />
          <span className="text-white text-sm font-medium">{t('touch_controls', lang)}</span>
        </label>
        <button
          onClick={() => { store.setPlayerState({ hudEditMode: true }); store.togglePause(); }}
          className="w-full py-3 rounded-lg border border-yellow-400/40 text-yellow-400 font-bold text-sm
                     uppercase tracking-widest hover:bg-yellow-400/10 transition-all"
        >
          ✏ Edit HUD Layout
        </button>
      </div>
    </div>
  );
}
