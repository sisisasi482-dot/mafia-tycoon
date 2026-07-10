/**
 * Inventory Panel (press 'I' to toggle).
 * Lists owned weapons and car keys. Allows equip / unequip.
 * 'K' or clicking Unequip while a weapon is equipped hides the weapon.
 */
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../game/useGameStore';
import {
  WEAPON_IDS, WEAPON_NAMES, WEAPON_ICONS, WEAPON_AMMO,
  CAR_KEY_PREFIX, isCarKey, vehicleIdFromKey, VEHICLE_NAMES_MAP,
  CONSUMABLES,
} from '../game/items';

export function InventoryPanel() {
  const showInventory    = useGameStore((s) => s.showInventory);
  const toggleInventory  = useGameStore((s) => s.toggleInventory);
  const ownedAssetIds    = useGameStore((s) => s.ownedAssetIds);
  const equippedWeaponId = useGameStore((s) => s.equippedWeaponId);
  const equippedVehicleId= useGameStore((s) => s.equippedVehicleId);
  const inventory        = useGameStore((s) => s.inventory);
  const weaponMags       = useGameStore((s) => s.weaponMags);
  const ammoReserves     = useGameStore((s) => s.ammoReserves);
  const screen           = useGameStore((s) => s.screen);
  const isPaused         = useGameStore((s) => s.isPaused);

  const weapons   = ownedAssetIds.filter((id) => WEAPON_IDS.has(id));
  const carKeys   = Object.keys(inventory).filter(isCarKey).filter((k) => (inventory[k] ?? 0) > 0);
  const consumables = CONSUMABLES.filter((c) => (inventory[c.id] ?? 0) > 0);

  // 'K' key — unequip current weapon
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyK') return;
      const s = useGameStore.getState();
      if (s.screen !== 'playing') return;
      s.setPlayerState({ equippedWeaponId: null, aimMode: false });
      s.setInteractionHint('🔫 Weapon holstered');
      setTimeout(() => {
        if (useGameStore.getState().interactionHint === '🔫 Weapon holstered')
          useGameStore.getState().setInteractionHint(null);
      }, 1500);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (screen !== 'playing') return null;

  const equip = (weaponId: string) => {
    useGameStore.getState().setPlayerState({ equippedWeaponId: weaponId, aimMode: false });
    useGameStore.getState().setInteractionHint(`🔫 ${WEAPON_NAMES[weaponId] ?? weaponId} equipped`);
    setTimeout(() => {
      if (useGameStore.getState().interactionHint?.includes('equipped'))
        useGameStore.getState().setInteractionHint(null);
    }, 1500);
  };

  const unequip = () => {
    useGameStore.getState().setPlayerState({ equippedWeaponId: null, aimMode: false });
  };

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
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">🎒 Inventory</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[10px]">[I] close · [K] holster</span>
              <button
                onClick={toggleInventory}
                className="text-gray-500 hover:text-white text-sm leading-none"
              >✕</button>
            </div>
          </div>

          <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">

            {/* ── Weapons ───────────────────────────────────────────────── */}
            {weapons.length > 0 && (
              <section>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">Weapons</p>
                <div className="space-y-1">
                  {weapons.map((wid) => {
                    const cfg     = WEAPON_AMMO[wid];
                    const icon    = WEAPON_ICONS[wid] ?? '🔪';
                    const name    = WEAPON_NAMES[wid] ?? wid;
                    const mag     = cfg ? (weaponMags[wid] ?? cfg.magSize) : null;
                    const reserve = cfg ? (ammoReserves[cfg.ammoType] ?? 0) : null;
                    const active  = equippedWeaponId === wid;
                    return (
                      <div
                        key={wid}
                        onClick={() => active ? unequip() : equip(wid)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                          ${active
                            ? 'bg-yellow-400/20 border border-yellow-400/50'
                            : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold leading-none">{name}</p>
                          {cfg && mag !== null && (
                            <p className="text-gray-400 text-[11px] mt-0.5">
                              {mag}/{cfg.magSize} mag · {reserve} reserve
                            </p>
                          )}
                          {!cfg && (
                            <p className="text-gray-500 text-[11px] mt-0.5">∞ melee</p>
                          )}
                        </div>
                        {active && (
                          <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {equippedWeaponId && (
                  <button
                    onClick={unequip}
                    className="mt-1.5 w-full text-center text-gray-500 text-[11px] py-1.5 rounded-lg
                               hover:bg-white/5 hover:text-gray-300 transition border border-transparent
                               hover:border-white/10"
                  >
                    [K] Holster / Unequip
                  </button>
                )}
              </section>
            )}

            {/* ── Car Keys ──────────────────────────────────────────────── */}
            {carKeys.length > 0 && (
              <section>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">Car Keys</p>
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

            {/* ── Consumables ───────────────────────────────────────────── */}
            {consumables.length > 0 && (
              <section>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1.5 px-1">Consumables</p>
                <div className="space-y-1">
                  {consumables.map((item) => (
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

            {/* Empty state */}
            {weapons.length === 0 && carKeys.length === 0 && consumables.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <p className="text-2xl mb-2">🎒</p>
                <p className="text-xs uppercase tracking-wider">Inventory empty</p>
                <p className="text-[11px] text-gray-700 mt-1">Visit a shop to buy weapons or vehicles</p>
              </div>
            )}
          </div>

          {/* Combat hint footer */}
          {equippedWeaponId && (
            <div className="border-t border-white/10 px-4 py-2">
              <p className="text-gray-500 text-[10px] text-center">
                Right-click → Aim · Left-click → Fire · [K] → Holster
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
