/**
 * Inventory Panel (press 'I' or the HUD 🎒 button to toggle).
 *
 * Deliberately isolated from the Shop/Properties/Ammo/Weapons UI — this
 * panel only ever shows three categories: Food, Keys, and ID Card. Weapon
 * equip/holster and shop-tab access live elsewhere (equip via the world
 * NPC shop panels; holster via 'K' while a weapon is equipped in HUD).
 */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../game/useGameStore';
import {
  isCarKey, vehicleIdFromKey, VEHICLE_NAMES_MAP,
  CONSUMABLES, NATIONAL_ID_ID,
} from '../game/items';

export function InventoryPanel() {
  const showInventory    = useGameStore((s) => s.showInventory);
  const toggleInventory  = useGameStore((s) => s.toggleInventory);
  const ownedAssetIds    = useGameStore((s) => s.ownedAssetIds);
  const equippedVehicleId= useGameStore((s) => s.equippedVehicleId);
  const inventory        = useGameStore((s) => s.inventory);
  const screen           = useGameStore((s) => s.screen);
  const isPaused         = useGameStore((s) => s.isPaused);
  const username         = useGameStore((s) => s.username);
  const [viewingId, setViewingId] = useState(false);

  const carKeys   = Object.keys(inventory).filter(isCarKey).filter((k) => (inventory[k] ?? 0) > 0);
  const food      = CONSUMABLES.filter((c) => (inventory[c.id] ?? 0) > 0);
  const hasNationalId  = ownedAssetIds.includes(NATIONAL_ID_ID);

  const showId = () => {
    const gs = useGameStore.getState();
    // Showing valid papers to an officer eases suspicion — small, real effect
    // rather than a no-op button.
    if (gs.wantedLevel > 0) gs.setWantedLevel(gs.wantedLevel - 1);
    gs.setInteractionHint('🪪 ID card shown to officer — identity confirmed');
    setTimeout(() => {
      if (useGameStore.getState().interactionHint?.includes('ID card shown'))
        useGameStore.getState().setInteractionHint(null);
    }, 2000);
  };

  // 'I' toggles the panel.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useGameStore.getState();
      if (s.screen !== 'playing' || s.isPaused) return;

      if (e.code === 'KeyI') {
        s.toggleInventory();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (screen !== 'playing') return null;

  const equipKey = (keyId: string) => {
    const vehicleId = vehicleIdFromKey(keyId);
    useGameStore.getState().setPlayerState({ equippedVehicleId: vehicleId });
    useGameStore.getState().setInteractionHint(`🚗 ${VEHICLE_NAMES_MAP[vehicleId] ?? vehicleId} key selected — press Spawn Car`);
    setTimeout(() => {
      if (useGameStore.getState().interactionHint?.includes('key selected'))
        useGameStore.getState().setInteractionHint(null);
    }, 2500);
  };

  return (
    <AnimatePresence>
      {showInventory && !isPaused && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.18 }}
          className="absolute top-16 right-16 w-72 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50"
          style={{ pointerEvents: 'all' }}
        >
          {/* Header — clean, isolated from Shop/Ammo UI; 'X' close top-right */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">🎒 Inventory</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[10px]">[I] close</span>
              <button
                onClick={toggleInventory}
                aria-label="Close inventory"
                className="text-gray-500 hover:text-white text-sm leading-none"
              >✕</button>
            </div>
          </div>

          <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">

            {/* ── Food ──────────────────────────────────────────────────── */}
            {food.length > 0 && (
              <section>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">Food</p>
                <div className="space-y-1">
                  {food.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => useGameStore.getState().useConsumable(item.id)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                                 bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20 transition"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-bold">{item.name}</p>
                        <p className="text-gray-400 text-[11px]">{item.desc}</p>
                      </div>
                      <span className="text-gray-300 text-sm font-bold shrink-0">×{inventory[item.id]}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Keys ──────────────────────────────────────────────────── */}
            {carKeys.length > 0 && (
              <section>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">Keys</p>
                <div className="space-y-1">
                  {carKeys.map((keyId) => {
                    const vehicleId = vehicleIdFromKey(keyId);
                    const vname     = VEHICLE_NAMES_MAP[vehicleId] ?? vehicleId;
                    const active    = equippedVehicleId === vehicleId;
                    return (
                      <div
                        key={keyId}
                        onClick={() => equipKey(keyId)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                          ${active
                            ? 'bg-blue-500/20 border border-blue-500/40'
                            : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        <span className="text-xl">🔑</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">{vname}</p>
                          <p className="text-gray-400 text-[11px]">×{inventory[keyId]} key{(inventory[keyId] ?? 0) > 1 ? 's' : ''}</p>
                        </div>
                        {active && (
                          <span className="text-blue-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                            SELECTED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── ID Card ───────────────────────────────────────────────── */}
            {hasNationalId && (
              <section>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">ID Card</p>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-transparent">
                  <span className="text-xl">🪪</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold leading-none">National ID</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">Permanent · cannot be dropped</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setViewingId(true)}
                      className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider transition"
                    >View</button>
                    <button
                      onClick={showId}
                      className="px-2 py-1 rounded-md bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 text-[10px] font-bold uppercase tracking-wider transition"
                    >Show</button>
                  </div>
                </div>
              </section>
            )}

            {/* Empty state */}
            {food.length === 0 && carKeys.length === 0 && !hasNationalId && (
              <div className="text-center py-8 text-gray-600">
                <p className="text-2xl mb-2">🎒</p>
                <p className="text-xs uppercase tracking-wider">Inventory empty</p>
                <p className="text-[11px] text-gray-700 mt-1">Food, car keys, and your ID card will appear here</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* National ID viewer — its own overlay so it works even if the
          inventory panel is closed behind it. */}
      {viewingId && hasNationalId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70"
          style={{ pointerEvents: 'all' }}
          onClick={() => setViewingId(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-80 rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-500/60 bg-gradient-to-br from-emerald-900 to-emerald-950"
          >
            <div className="px-4 py-2 bg-emerald-950/80 border-b border-yellow-500/40 flex items-center justify-between">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">🇩🇿 République Algérienne</span>
              <button onClick={() => setViewingId(false)} className="text-gray-400 hover:text-white text-sm leading-none">✕</button>
            </div>
            <div className="p-4 flex gap-3">
              <div className="w-16 h-20 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-3xl shrink-0">🙂</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight truncate">{username || 'Citizen'}</p>
                <p className="text-emerald-300 text-[11px] uppercase tracking-wider mt-1">National ID Card</p>
                <p className="text-emerald-400/70 text-[11px] mt-2">City: Constantine</p>
                <p className="text-emerald-400/70 text-[11px]">Status: Verified</p>
              </div>
            </div>
            <button
              onClick={() => { showId(); setViewingId(false); }}
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest transition"
            >Show to Officer</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
