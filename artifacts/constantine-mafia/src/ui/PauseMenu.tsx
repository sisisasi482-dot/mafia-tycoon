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

function SettingsPanel() {
  const store = useGameStore();
  const lang = store.language;
  
  return (
    <div className="space-y-8 max-w-lg">
      <h3 className="text-3xl font-bold text-white mb-6 border-b border-white/10 pb-4">{t('settings', lang)}</h3>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">{t('language', lang)}</label>
        <div className="flex gap-2">
          {['en', 'ar', 'fr'].map((l) => (
            <button 
              key={l}
              onClick={() => store.setPlayerState({ language: l as any })}
              className={`flex-1 py-3 rounded border font-medium uppercase ${store.language === l ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/20 text-white hover:border-white/50'}`}
            >
              {l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Français'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">{t('graphics', lang)}</label>
        <div className="flex gap-2">
          {['low', 'medium', 'high'].map((g) => (
            <button 
              key={g}
              onClick={() => store.setPlayerState({ graphicsQuality: g as any })}
              className={`flex-1 py-3 rounded border font-medium uppercase ${store.graphicsQuality === g ? 'bg-white/20 text-white border-white' : 'bg-transparent border-white/20 text-gray-400 hover:border-white/50'}`}
            >
              {t(g as any, lang)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">{t('audio', lang)}</label>
        <input type="range" min="0" max="100" value={store.masterVolume} onChange={(e) => store.setPlayerState({ masterVolume: parseInt(e.target.value) })} className="w-full accent-primary" />
      </div>
      
      <div className="space-y-4 pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={store.showTouchControls} 
            onChange={(e) => store.setPlayerState({ showTouchControls: e.target.checked })}
            className="w-5 h-5 rounded border-white/20 bg-black/50 accent-primary"
          />
          <span className="text-white font-medium">{t('touch_controls', lang)}</span>
        </label>
      </div>
    </div>
  );
}
