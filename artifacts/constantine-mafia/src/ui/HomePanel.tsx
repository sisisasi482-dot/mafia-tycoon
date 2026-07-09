/**
 * HomePanel — shown when indoors in an owned home or garage.
 * Provides: Sleep · Eat · Watch TV · Wardrobe · Lock & Exit
 */
import React from 'react';
import { useGameStore } from '../game/useGameStore';

const HOME_IDS   = new Set(['house_1', 'house_2', 'house_3']);
const GARAGE_IDS = new Set(['garage_1', 'garage_2']);

export function HomePanel() {
  const store = useGameStore();
  const { indoors, interiorId, isPaused, screen } = store;

  // Only show when inside an owned property during active play
  if (!indoors || !interiorId || isPaused || screen !== 'playing') return null;
  if (!store.ownedAssetIds.includes(interiorId)) return null;

  const isHome   = HOME_IDS.has(interiorId);
  const isGarage = GARAGE_IDS.has(interiorId);
  if (!isHome && !isGarage) return null;

  const handleSleep = () => {
    store.sleep(8);
  };

  const handleEat = () => {
    if (store.money < 50) return;
    store.healPlayer(25);
    store.setPlayerState({ money: store.money - 50 });
  };

  const handleLockExit = () => {
    // Lock then exit — Player.tsx's useEffect on `indoors` will snap 3D position
    if (!store.lockedPropertyIds.includes(interiorId)) {
      store.togglePropertyLock(interiorId);
    }
    store.exitInterior();
  };

  const handleExit = () => {
    store.exitInterior();
  };

  const btn = (label: string, icon: string, onClick: () => void, disabled = false, danger = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all
        ${danger
          ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
          : disabled
          ? 'border-white/5 text-gray-600 cursor-not-allowed'
          : 'border-white/10 text-white hover:bg-white/10'}`}
    >
      <span className="text-xl leading-none">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30" style={{ pointerEvents: 'all' }}>
      <div className="bg-black/88 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-2xl">
        {btn('Sleep', '🛏', handleSleep)}
        {btn('Eat · 50 DA', '🍽', handleEat, store.money < 50)}

        {isHome && (
          <>
            {btn('Watch TV', '📺', () => store.setPlayerState({ showTv: true }))}
            {btn('Wardrobe', '👕', () => store.setPlayerState({ showWardrobe: true }))}
          </>
        )}

        {btn('Lock & Exit', '🔒', handleLockExit, false, true)}
        {btn('Exit', '🚪', handleExit)}
      </div>
    </div>
  );
}
