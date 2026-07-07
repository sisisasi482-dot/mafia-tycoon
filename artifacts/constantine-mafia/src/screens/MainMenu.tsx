import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { useSaveSystem } from '../game/useSaveSystem';
import { t } from '../game/constants';
import { motion } from 'framer-motion';

export function MainMenu() {
  const store = useGameStore();
  const { hasSaveGame, loadGame } = useSaveSystem();
  const lang = store.language;
  const rtl = lang === 'ar';

  if (store.screen !== 'main_menu') return null;

  return (
    <div className="absolute inset-0 bg-[#050810] flex items-center justify-center overflow-hidden" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Cinematic Background Placeholder */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent z-10" />
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-20 flex flex-col items-center w-full max-w-4xl px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 uppercase tracking-tighter drop-shadow-2xl">
            CONSTANTINE
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-[2px] w-12 bg-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-primary uppercase tracking-[0.3em]">
              MAFIA
            </h2>
            <div className="h-[2px] w-12 bg-primary" />
          </div>
          <p className="mt-6 text-xl text-gray-400 font-medium tracking-widest uppercase">
            City Under Siege / المدينة تحت الحصار
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col gap-4 w-full max-w-sm"
        >
          {hasSaveGame() && (
            <button 
              onClick={() => loadGame()}
              className="w-full py-4 px-8 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/50 text-white font-bold rounded-lg text-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              {t('continue', lang)}
            </button>
          )}
          
          <button 
            onClick={() => store.setScreen('character_creation')}
            className="w-full py-5 px-8 bg-primary hover:bg-primary/90 text-black font-black rounded-lg text-xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-105"
          >
            {t('new_game', lang)}
          </button>
          
          <button 
            className="w-full py-4 px-8 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold rounded-lg text-lg uppercase tracking-widest transition-all mt-4"
          >
            {t('leaderboard', lang)}
          </button>
          
          <div className="flex gap-4 mt-8 justify-center">
            <button onClick={() => store.setPlayerState({ language: 'en' })} className={`text-sm font-bold ${lang === 'en' ? 'text-primary' : 'text-gray-500'}`}>EN</button>
            <button onClick={() => store.setPlayerState({ language: 'ar' })} className={`text-sm font-bold ${lang === 'ar' ? 'text-primary' : 'text-gray-500'}`}>AR</button>
            <button onClick={() => store.setPlayerState({ language: 'fr' })} className={`text-sm font-bold ${lang === 'fr' ? 'text-primary' : 'text-gray-500'}`}>FR</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
