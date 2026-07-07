import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { useSaveSystem } from '../game/useSaveSystem';
import { t } from '../game/constants';
import { motion, AnimatePresence } from 'framer-motion';

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
          className="w-full max-w-4xl h-full max-h-[800px] bg-[#0a0a0a] border border-white/10 rounded-xl flex shadow-2xl overflow-hidden"
        >
          {/* Sidebar Tabs */}
          <div className="w-64 bg-[#111] border-r border-white/10 p-6 flex flex-col gap-2">
            <h2 className="text-xl font-bold text-primary mb-8 uppercase tracking-widest">Constantine</h2>
            
            <MenuButton active={store.activePanel === 'settings'} onClick={() => store.setActivePanel('settings')}>
              {t('settings', lang)}
            </MenuButton>
            <MenuButton active={store.activePanel === 'map'} onClick={() => store.setActivePanel('map')}>
              {t('map', lang)}
            </MenuButton>
            <MenuButton active={store.activePanel === 'missions'} onClick={() => store.setActivePanel('missions')}>
              {t('missions', lang)}
            </MenuButton>
            <MenuButton active={store.activePanel === 'shop'} onClick={() => store.setActivePanel('shop')}>
              {t('shop', lang)}
            </MenuButton>
            
            <div className="flex-1" />
            
            <button 
              onClick={() => {
                saveGame();
                alert(t('saved', lang));
              }}
              className="w-full p-4 text-left font-medium rounded text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              {t('save_game', lang)}
            </button>
            <button 
              onClick={() => {
                store.setScreen('main_menu');
                store.togglePause();
              }}
              className="w-full p-4 text-left font-medium rounded text-destructive hover:bg-destructive/10 transition-colors mt-2"
            >
              {t('exit_to_menu', lang)}
            </button>
            <button 
              onClick={() => store.togglePause()}
              className="w-full p-4 text-center font-bold rounded bg-primary text-black hover:bg-primary/90 transition-colors mt-4 uppercase tracking-widest"
            >
              {t('resume', lang)}
            </button>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            {store.activePanel === 'settings' && <SettingsPanel />}
            {store.activePanel === 'map' && <div className="h-full flex items-center justify-center text-muted-foreground">Map Coming Soon</div>}
            {store.activePanel === 'missions' && <div className="h-full flex items-center justify-center text-muted-foreground">Missions Coming Soon</div>}
            {store.activePanel === 'shop' && <div className="h-full flex items-center justify-center text-muted-foreground">Shop Coming Soon</div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MenuButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 text-left font-medium rounded transition-all ${
        active 
          ? 'bg-primary/10 text-primary border-l-4 border-primary' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
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
