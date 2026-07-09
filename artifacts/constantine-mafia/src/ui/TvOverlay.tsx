/**
 * TvOverlay — simulated TV viewing with channel switching.
 * Shown when store.showTv === true while indoors in an owned home.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/useGameStore';

const CHANNELS = [
  {
    id:      'news',
    label:   'Constantine News',
    content: '"Police increase checkpoint patrols following a wave of vehicle thefts across the city. Residents are advised to carry valid documentation at all times."',
    color:   '#2244aa',
  },
  {
    id:      'sports',
    label:   'Sports Channel',
    content: '"CS Constantine defeats their rivals 2–1 in a dramatic late-night fixture. Fans flood the Rue Larbi Ben M\'hidi in celebration."',
    color:   '#226622',
  },
  {
    id:      'music',
    label:   'Télévision Algérienne',
    content: '♪ A haunting chaâbi melody drifts through the static. The singer\'s voice echoes off the canyon walls of the old city ♪',
    color:   '#885500',
  },
  {
    id:      'crime',
    label:   'Crime Beat',
    content: '"Authorities confirm three unsolved vehicle thefts near the industrial zone. Anyone with information is urged to contact the local brigade."',
    color:   '#882222',
  },
];

export function TvOverlay() {
  const store   = useGameStore();
  const [channel, setChannel] = useState(0);

  // Only render when actively indoors in an owned property
  if (!store.showTv || !store.indoors) return null;

  const current = CHANNELS[channel];

  return (
    <AnimatePresence>
      <motion.div
        key="tv"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/92 z-[60] flex items-center justify-center"
        style={{ pointerEvents: 'all' }}
      >
        <div className="w-[min(92vw,660px)] bg-[#0d0d0d] border-4 border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
          {/* Screen */}
          <div
            className="aspect-video flex flex-col items-center justify-center gap-6 p-10 relative"
            style={{ background: `radial-gradient(ellipse at 50% 40%, ${current.color}33, #050510)` }}
          >
            {/* Scan lines effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)',
              }}
            />
            <div
              className="text-[10px] uppercase tracking-[0.25em] font-bold opacity-60"
              style={{ color: current.color }}
            >
              ● LIVE · {current.label.toUpperCase()}
            </div>
            <p className="text-white text-base text-center leading-relaxed max-w-lg relative z-10">
              {current.content}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between bg-[#0a0a0a] px-5 py-4 gap-3">
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setChannel(i)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
                    channel === i
                      ? 'bg-primary text-black'
                      : 'bg-white/8 text-gray-400 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => store.setPlayerState({ showTv: false })}
              className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition shrink-0"
            >
              Turn Off
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
