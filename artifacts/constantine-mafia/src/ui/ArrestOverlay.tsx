import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../game/useGameStore';

/**
 * Full black-screen arrest sequence: shown for ~3s after Police.tsx's
 * arrestPlayer() fires (5-second-proximity arrest or a failed checkpoint
 * search), then clears the flag so the player resumes control at the
 * police station with contraband already wiped by arrestPlayer().
 */
export function ArrestOverlay() {
  const isArrested = useGameStore((s) => s.isArrested);
  const clearArrest = useGameStore((s) => s.clearArrest);
  const [phase, setPhase] = useState<'fade' | 'hold'>('fade');

  useEffect(() => {
    if (!isArrested) { setPhase('fade'); return; }
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => clearArrest(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isArrested, clearArrest]);

  return (
    <AnimatePresence>
      {isArrested && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black z-[80] flex flex-col items-center justify-center gap-3"
        >
          <div className="text-red-500 text-3xl font-black uppercase tracking-[0.3em]">Busted</div>
          {phase === 'hold' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 text-sm tracking-widest uppercase"
            >
              Weapons confiscated · Released at the station
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
