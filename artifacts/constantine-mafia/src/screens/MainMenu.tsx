import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { useSaveSystem } from '../game/useSaveSystem';
import { t } from '../game/constants';
import { motion, AnimatePresence } from 'framer-motion';

const CONTROLS = [
  { key: 'W/A/S/D',  action: 'Move'        }, { key: 'SHIFT',    action: 'Sprint'      },
  { key: 'E',        action: 'Enter/Exit'  }, { key: 'F',        action: 'Interact'    },
  { key: 'M',        action: 'Map'         }, { key: 'I',        action: 'Inventory'   },
  { key: 'P / ESC',  action: 'Pause'       }, { key: 'Mouse',    action: 'Aim/Camera'  },
  { key: 'LMB',      action: 'Fire/Attack' }, { key: 'R',        action: 'Reload'      },
];

export function MainMenu() {
  const store = useGameStore();
  const { hasSaveGame, loadGame } = useSaveSystem();
  const lang = store.language;
  const rtl = lang === 'ar';
  const [showControls, setShowControls] = useState(false);

  if (store.screen !== 'main_menu') return null;

  return (
    <div className="absolute inset-0 bg-[#050810] flex items-center justify-center overflow-hidden" dir={rtl ? 'rtl' : 'ltr'}>

      {/* ── Cinematic layered background ── */}
      <div className="absolute inset-0">
        {/* Dark city silhouette gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040a] via-[#060c1a] to-[#050810]" />
        {/* Amber city-glow at horizon */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#ff8c1a]/12 to-transparent" />
        {/* Radial gold bloom behind title */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px]" />
        {/* Grid lines — subtle urban feel */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#d4a800 1px, transparent 1px), linear-gradient(90deg, #d4a800 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        {/* Scan-line overlay */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)' }}
        />
      </div>

      <div className="relative z-20 flex flex-col items-center w-full max-w-4xl px-8">

        {/* ── Title block ── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="text-center mb-14"
        >
          {/* Version badge */}
          <p className="text-[10px] font-bold tracking-[0.35em] text-primary/60 uppercase mb-6">
            ◆ Open World Crime RPG ◆
          </p>

          <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none"
            style={{
              background: 'linear-gradient(180deg, #ffffff 30%, #888888 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textShadow: 'none', filter: 'drop-shadow(0 0 40px rgba(212,168,0,0.35))',
            }}
          >
            CONSTANTINE
          </h1>

          <div className="flex items-center justify-center gap-5 mt-3">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-primary/80" />
            <h2 className="text-xl md:text-2xl font-black text-primary uppercase tracking-[0.45em]">
              MAFIA
            </h2>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-primary/80" />
          </div>

          <p className="mt-4 text-sm text-gray-500 font-medium tracking-[0.25em] uppercase">
            {lang === 'ar' ? 'المدينة تحت الحصار' : lang === 'fr' ? 'La Ville Assiégée' : 'City Under Siege'}
          </p>
        </motion.div>

        {/* ── Button cluster ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          {hasSaveGame() && (
            <button
              onClick={() => loadGame()}
              className="w-full py-4 px-8 bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/40 text-white font-bold rounded-lg text-base uppercase tracking-[0.18em] transition-all"
            >
              {t('continue', lang)}
            </button>
          )}

          <button
            onClick={() => {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              audioCtx.resume();
              store.setScreen('character_creation');
            }}

            className="w-full py-5 px-8 font-black rounded-lg text-lg uppercase tracking-[0.2em] transition-all"
            style={{
              background: 'linear-gradient(135deg, #d4a800 0%, #f0c820 50%, #d4a800 100%)',
              boxShadow: '0 0 32px rgba(212,168,0,0.4), 0 2px 0 rgba(0,0,0,0.4)',
              color: '#050810',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
          >
            {t('new_game', lang)}
          </button>

          <button
            onClick={() => setShowControls(true)}
            className="w-full py-3.5 px-8 bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/25 text-gray-400 hover:text-white font-bold rounded-lg text-sm uppercase tracking-[0.2em] transition-all mt-1"
          >
            {lang === 'ar' ? 'كيفية اللعب' : lang === 'fr' ? 'Comment Jouer' : 'How to Play'}
          </button>

          {/* Language switcher */}
          <div className="flex gap-6 mt-6 justify-center">
            {(['en', 'ar', 'fr'] as const).map((l) => (
              <button
                key={l}
                onClick={() => store.setPlayerState({ language: l })}
                className={`text-xs font-black tracking-[0.2em] transition-all ${
                  lang === l ? 'text-primary' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Footer tagline ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 text-[10px] text-gray-700 tracking-[0.3em] uppercase"
        >
          Constantine, Algeria · Open World · Crime RPG
        </motion.p>
      </div>

      {/* ── How to Play overlay ── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-8"
            onClick={() => setShowControls(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0e1a] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 text-center">
                {lang === 'ar' ? 'التحكم' : lang === 'fr' ? 'Contrôles' : 'Controls'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {CONTROLS.map(({ key, action }) => (
                  <div key={key} className="flex items-center justify-between gap-3 bg-white/5 rounded-lg px-3 py-2">
                    <kbd className="text-xs font-mono font-black text-primary bg-primary/10 border border-primary/30 rounded px-2 py-0.5">{key}</kbd>
                    <span className="text-xs text-gray-300">{action}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-gray-600 text-center">
                {lang === 'ar' ? 'اضغط في أي مكان للإغلاق' : lang === 'fr' ? 'Cliquez n\'importe où pour fermer' : 'Click anywhere to close'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
