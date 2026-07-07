import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export function TouchControls() {
  const store = useGameStore();

  const handleTouchStart = (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: key }));
  };
  const handleTouchEnd = (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: key }));
  };

  // Only show on touch devices or if forced in settings
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch && !store.showTouchControls) return null;
  if (store.screen !== 'playing' || store.isPaused || store.showMap) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Menu / Pause Button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button 
          onClick={store.togglePause}
          className="w-12 h-12 bg-black/50 border-2 border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm active:bg-white/20"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="8" y1="4" x2="8" y2="20"></line>
            <line x1="16" y1="4" x2="16" y2="20"></line>
          </svg>
        </button>
      </div>

      {/* D-Pad (Left side) */}
      <div className="absolute bottom-12 left-12 pointer-events-auto select-none">
        <div className="relative w-40 h-40 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm flex items-center justify-center">
           {/* Simple 4-way D-Pad */}
           <button 
             className="absolute top-0 w-16 h-12 bg-white/10 rounded-t active:bg-white/30"
             onTouchStart={() => handleTouchStart('KeyW')}
             onTouchEnd={() => handleTouchEnd('KeyW')}
           />
           <button 
             className="absolute bottom-0 w-16 h-12 bg-white/10 rounded-b active:bg-white/30"
             onTouchStart={() => handleTouchStart('KeyS')}
             onTouchEnd={() => handleTouchEnd('KeyS')}
           />
           <button 
             className="absolute left-0 w-12 h-16 bg-white/10 rounded-l active:bg-white/30"
             onTouchStart={() => handleTouchStart('KeyA')}
             onTouchEnd={() => handleTouchEnd('KeyA')}
           />
           <button 
             className="absolute right-0 w-12 h-16 bg-white/10 rounded-r active:bg-white/30"
             onTouchStart={() => handleTouchStart('KeyD')}
             onTouchEnd={() => handleTouchEnd('KeyD')}
           />
        </div>
      </div>

      {/* Action Buttons (Right side) */}
      <div className="absolute bottom-12 right-12 pointer-events-auto select-none flex gap-4 items-end">
        <button 
          className="w-16 h-16 rounded-full bg-blue-500/50 border-2 border-blue-400 text-white font-bold text-xl active:bg-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)] mb-8"
          onTouchStart={() => handleTouchStart('ShiftLeft')}
          onTouchEnd={() => handleTouchEnd('ShiftLeft')}
        >
          SPR
        </button>
        <button 
          className="w-16 h-16 rounded-full bg-yellow-500/50 border-2 border-yellow-400 text-white font-bold text-xl active:bg-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)] mb-16"
          onTouchStart={() => handleTouchStart('KeyE')}
          onTouchEnd={() => handleTouchEnd('KeyE')}
        >
          INT
        </button>
        <button 
          className="w-20 h-20 rounded-full bg-primary/60 border-2 border-primary text-black font-bold text-2xl active:bg-primary/90 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
          onTouchStart={() => handleTouchStart('Space')}
          onTouchEnd={() => handleTouchEnd('Space')}
        >
          JMP
        </button>
      </div>
    </div>
  );
}
