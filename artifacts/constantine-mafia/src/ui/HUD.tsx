import React, { useEffect, useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { t } from '../game/constants';
import { motion, AnimatePresence } from 'framer-motion';

export function HUD() {
  const store = useGameStore();
  const lang = store.language;
  const rtl = lang === 'ar';
  
  const [districtName, setDistrictName] = useState('');
  
  useEffect(() => {
    const formatted = store.district.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    setDistrictName(formatted);
  }, [store.district]);

  if (store.screen !== 'playing' || store.showMap || store.showShop || store.isPaused) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none p-4 flex flex-col justify-between ${rtl ? 'rtl text-right' : 'ltr text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-start">
        {/* Top Left: District & Wanted */}
        <div className="flex flex-col gap-2">
           <div className="bg-black/80 backdrop-blur-md text-white p-3 rounded-md border border-white/10 shadow-lg">
             <h3 className="font-bold text-lg text-primary flex gap-1 items-center tracking-widest">
               {Array.from({ length: 5 }).map((_, i) => (
                 <span key={i} className={i < store.wantedLevel ? 'text-white drop-shadow-[0_0_5px_white]' : 'text-gray-700 opacity-50'}>
                   ★
                 </span>
               ))}
             </h3>
             <p className="text-sm font-medium text-gray-300 mt-1 uppercase tracking-wide">{districtName}</p>
           </div>
        </div>
        
        {/* Top Right: Money & Level */}
        <div className="flex flex-col gap-2 items-end">
           <div className="bg-black/80 backdrop-blur-md text-white p-4 rounded-md border border-white/10 shadow-lg min-w-[200px] flex flex-col items-end">
             <h2 className="text-3xl font-black text-primary font-sans tracking-tight">
               {t('money', lang)} {store.money.toLocaleString()}
             </h2>
             <div className="flex items-center gap-3 mt-2 w-full justify-between">
               <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('level', lang)} {store.level}</span>
               <div className="flex-1 max-w-[100px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                   style={{ width: `${(store.xp / Math.max(1, Math.floor(100 * Math.pow(store.level, 1.5)))) * 100}%` }} 
                 />
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        {/* Bottom Left: Health/Armor */}
        <div className="flex flex-col gap-2 w-56">
          <div className="w-full h-4 bg-black/60 border border-white/10 rounded overflow-hidden p-0.5">
            <div className="h-full bg-destructive transition-all rounded-sm shadow-[0_0_10px_rgba(220,20,60,0.5)]" style={{ width: `${store.health}%` }} />
          </div>
          {store.armor > 0 && (
            <div className="w-full h-4 bg-black/60 border border-white/10 rounded overflow-hidden p-0.5">
              <div className="h-full bg-blue-400 transition-all rounded-sm shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: `${store.armor}%` }} />
            </div>
          )}
        </div>
        
        {/* Bottom Center: Hints */}
        <AnimatePresence>
          {store.interactionHint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/90 px-8 py-3 rounded border-t-2 border-primary shadow-[0_0_20px_rgba(255,215,0,0.15)]"
            >
              <span className="text-white font-bold tracking-widest uppercase text-sm">{t(store.interactionHint as any, lang) || store.interactionHint}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Right: Minimap Placeholder */}
        <div className="w-48 h-48 rounded-full bg-[#111] border-4 border-black ring-2 ring-white/10 overflow-hidden relative shadow-2xl">
           <div className="absolute inset-0 opacity-30" style={{ 
             backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
             backgroundSize: '10px 10px' 
           }} />
           <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_white] z-10" />
           <div className="absolute top-0 w-full h-full bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
