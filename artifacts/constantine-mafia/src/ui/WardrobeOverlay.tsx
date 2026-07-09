/**
 * WardrobeOverlay — outfit selection screen shown when store.showWardrobe === true.
 * Outfit selection feeds into Player.tsx's visual rendering.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/useGameStore';

const OUTFITS = [
  { id: 'default',   icon: '👕', label: 'Street Clothes', desc: 'Low-key, city standard'  },
  { id: 'formal',    icon: '🤵', label: 'Formal Suit',    desc: 'Sharp — opens doors'     },
  { id: 'tracksuit', icon: '🏃', label: 'Tracksuit',      desc: 'Light and fast'           },
  { id: 'tactical',  icon: '🥷', label: 'Tactical Gear',  desc: 'Dark ops — blends in'    },
  { id: 'djellaba',  icon: '🧥', label: 'Djellaba',       desc: 'Traditional — respected' },
  { id: 'police',    icon: '👮', label: 'Police Uniform', desc: 'Bluff your way through'  },
];

export function WardrobeOverlay() {
  const store = useGameStore();

  // Only render when actively indoors in an owned property
  if (!store.showWardrobe || !store.indoors) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="wardrobe"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 z-[60] flex items-center justify-center"
        style={{ pointerEvents: 'all' }}
      >
        <div className="w-[min(92vw,440px)] bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
          <h3 className="text-white font-black text-lg uppercase tracking-[0.12em]">
            Wardrobe
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {OUTFITS.map((o) => {
              const active = store.currentOutfitId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => store.setOutfit(o.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(255,215,0,0.15)]'
                      : 'border-white/8 hover:border-white/25 hover:bg-white/4'
                  }`}
                >
                  <span className="text-3xl leading-none">{o.icon}</span>
                  <span className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-primary' : 'text-white'}`}>
                    {o.label}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-snug">{o.desc}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => store.setPlayerState({ showWardrobe: false })}
            className="w-full py-3 rounded-xl bg-primary text-black font-black text-sm uppercase tracking-wider hover:bg-primary/90 transition"
          >
            Done
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
