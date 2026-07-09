/**
 * HomePanel — shown when indoors in an owned home or garage.
 * Provides:
 *   Home:   Sleep · Eat · Watch TV · Wardrobe · Lock & Exit
 *   Garage: Sleep · Eat · Store Vehicle · Retrieve Vehicle · Lock & Exit
 */
import React from 'react';
import { useGameStore } from '../game/useGameStore';

const HOME_IDS   = new Set(['house_1', 'house_2', 'house_3']);
const GARAGE_IDS = new Set(['garage_1', 'garage_2']);

/** Human-readable labels for every vehicle that can be owned or stored. */
const VEHICLE_LABELS: Record<string, string> = {
  renault:    'Renault 25',
  kangoo:     'Kangoo',
  bmw:        'BMW 5 Series',
  moto:       'Motorcycle',
  police_car: 'Police Crown',
  v1:         'Taxi',
  v2:         'Police Car',
  v3:         'Sports Car',
  v4:         'SUV',
  v5:         'Truck',
};

export function HomePanel() {
  const store = useGameStore();
  const { indoors, interiorId, isPaused, screen } = store;

  // Only show when inside an owned property during active play
  if (!indoors || !interiorId || isPaused || screen !== 'playing') return null;
  if (!store.ownedAssetIds.includes(interiorId)) return null;

  const isHome   = HOME_IDS.has(interiorId);
  const isGarage = GARAGE_IDS.has(interiorId);
  if (!isHome && !isGarage) return null;

  const garageId = interiorId;
  const stored   = isGarage ? (store.garageStoredVehicles[garageId] ?? []) : [];
  // Use lastDrivenVehicleId — equippedVehicleId is cleared when the player exits
  // the vehicle before walking to the garage door, so we track the last dismounted
  // vehicle and offer to store it here.
  const parkableId = store.lastDrivenVehicleId;
  const canStore   = isGarage && !!parkableId && !stored.includes(parkableId);

  const handleSleep = () => { store.sleep(8); };

  const handleEat = () => {
    if (store.money < 50) return;
    store.healPlayer(25);
    store.setPlayerState({ money: store.money - 50 });
  };

  const handleLockExit = () => {
    if (!store.lockedPropertyIds.includes(interiorId)) {
      store.togglePropertyLock(interiorId);
    }
    store.exitInterior();
  };

  const handleExit = () => { store.exitInterior(); };

  const handleStoreVehicle = () => {
    if (!parkableId) return;
    store.storeVehicleInGarage(garageId, parkableId);
    // Clear lastDrivenVehicleId so the button resets after parking
    store.setPlayerState({ lastDrivenVehicleId: null });
  };

  const handleRetrieve = (vehicleId: string) => {
    store.retrieveVehicleFromGarage(garageId, vehicleId);
    // Mark the retrieved vehicle as the active selection and exit.
    // Full exterior spawning is a planned upgrade; for now the player's HUD
    // reflects the retrieved vehicle and they can re-enter any matching world vehicle.
    store.setInteractionHint(`🚗 ${VEHICLE_LABELS[vehicleId] ?? vehicleId} ready — exit and find it outside.`);
    setTimeout(() => useGameStore.getState().setInteractionHint(null), 3500);
    store.exitInterior();
  };

  const btn = (
    label: string,
    icon: string,
    onClick: () => void,
    disabled = false,
    danger = false,
  ) => (
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
      <div className="bg-black/88 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex flex-col gap-2 shadow-2xl max-w-md">

        {/* ── Common actions row ── */}
        <div className="flex items-center gap-2">
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

        {/* ── Garage: vehicle storage ── */}
        {isGarage && (
          <div className="border-t border-white/10 pt-2 flex flex-col gap-2">
            {/* Store button */}
            <div className="flex items-center gap-2">
              {btn(
                canStore
                  ? `Park ${VEHICLE_LABELS[parkableId!] ?? parkableId!}`
                  : 'No Vehicle to Park',
                '🅿️',
                handleStoreVehicle,
                !canStore,
              )}
              <span className="text-[10px] text-gray-500 leading-tight">
                {canStore
                  ? `Store your ${VEHICLE_LABELS[parkableId!] ?? parkableId} in this garage`
                  : stored.includes(parkableId ?? '')
                  ? 'That vehicle is already stored here'
                  : 'Exit a vehicle near this garage, then enter to park it'}
              </span>
            </div>

            {/* Stored vehicles list */}
            {stored.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stored.map((vid) => (
                  <button
                    key={vid}
                    onClick={() => handleRetrieve(vid)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 transition-all"
                  >
                    🚗 {VEHICLE_LABELS[vid] ?? vid}
                    <span className="text-[10px] text-emerald-600 font-normal">retrieve</span>
                  </button>
                ))}
              </div>
            )}

            {stored.length === 0 && (
              <p className="text-[10px] text-gray-600">Garage is empty — park a vehicle to store it here.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
