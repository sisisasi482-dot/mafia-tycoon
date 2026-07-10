import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/useGameStore';
import { t } from '../game/constants';
import {
  CONSUMABLES,
  WEAPON_AMMO,
  WEAPON_NAMES,
  WEAPON_ICONS,
  AMMO_DISPLAY,
  WEAPON_IDS,
  CAR_KEY_PREFIX,
  isCarKey,
  vehicleIdFromKey,
  VEHICLE_NAMES_MAP,
} from '../game/items';

// ─── Static catalogs (same as before — unchanged) ─────────────────────────────

type ShopCategory = 'weapons' | 'vehicles' | 'properties' | 'consumables' | 'ammo' | 'inventory';

const WEAPONS = [
  { id: 'knife',   name: 'Knife',         nameAr: 'سكين',          nameFr: 'Couteau',          price: 200,  icon: '🔪', desc: 'Silent and deadly' },
  { id: 'pistol',  name: 'Pistol',        nameAr: 'مسدس',          nameFr: 'Pistolet',         price: 800,  icon: '🔫', desc: 'Standard sidearm' },
  { id: 'shotgun', name: 'Shotgun',       nameAr: 'بندقية',        nameFr: 'Fusil',            price: 2500, icon: '🔫', desc: 'Heavy close range' },
  { id: 'smg',     name: 'SMG',           nameAr: 'رشاش',          nameFr: 'Mitraillette',     price: 4000, icon: '🔫', desc: 'Fast fire rate' },
  { id: 'rifle',   name: 'Assault Rifle', nameAr: 'بندقية اقتحام', nameFr: 'Fusil d\'assaut',  price: 8000, icon: '🔫', desc: 'Military grade' },
];

const VEHICLES = [
  { id: 'renault',    name: 'Renault 25',   nameAr: 'رونو 25',       nameFr: 'Renault 25',   price: 3000,  icon: '🚗', desc: 'Classic Algerian street car' },
  { id: 'kangoo',     name: 'Kangoo',       nameAr: 'كانغو',         nameFr: 'Kangoo',       price: 5000,  icon: '🚐', desc: 'Rugged delivery van' },
  { id: 'bmw',        name: 'BMW 5 Series', nameAr: 'بي إم دبليو',   nameFr: 'BMW Série 5',  price: 15000, icon: '🏎️', desc: 'High-speed getaway' },
  { id: 'moto',       name: 'Motorcycle',   nameAr: 'دراجة نارية',   nameFr: 'Moto',         price: 4000,  icon: '🏍️', desc: 'Weave through traffic' },
  { id: 'police_car', name: 'Police Crown', nameAr: 'سيارة الشرطة',  nameFr: 'Voiture BRI',  price: 25000, icon: '🚓', desc: 'Stolen from the BRI' },
];

const PROPERTIES = [
  { id: 'garage_am',  name: 'Garage – Ali Mendjeli',       nameAr: 'كراج علي منجلي',               nameFr: 'Garage Ali Mendjeli',       price: 10000, icon: '🏚️', desc: 'Store vehicles safely' },
  { id: 'safehouse_cv', name: 'Safehouse – Centre-Ville',  nameAr: 'ملجأ وسط المدينة',             nameFr: 'Planque Centre-Ville',       price: 25000, icon: '🏠', desc: 'Respawn point + save' },
  { id: 'shop_oc',    name: 'Weapon Shop – Old City',      nameAr: 'محل أسلحة المدينة القديمة',    nameFr: 'Armurerie Vieille Ville',    price: 50000, icon: '🏪', desc: 'Passive income' },
  { id: 'factory_am', name: 'Factory – Ain M\'lila',       nameAr: 'مصنع عين مليلة',               nameFr: 'Usine Ain M\'lila',          price: 80000, icon: '🏭', desc: 'High income every 5 min' },
  { id: 'garage_1',   name: 'Garage – Suburb',             nameAr: 'كراج الضاحية',                 nameFr: 'Garage Banlieue',            price: 8000,  icon: '🚗', desc: 'Park & sleep — cheaper than a house' },
  { id: 'garage_2',   name: 'Garage – Riverside',          nameAr: 'كراج ضفة النهر',               nameFr: 'Garage Rive',                price: 12000, icon: '🚗', desc: 'Park & sleep near Old City' },
  { id: 'house_1',    name: 'House – Old City Villa',      nameAr: 'منزل — فيلا المدينة القديمة',  nameFr: 'Maison – Villa Vieille Ville', price: 45000, icon: '🏡', desc: 'Living room, bedroom, kitchen & bathroom' },
  { id: 'house_2',    name: 'House – Riverside',           nameAr: 'منزل — ضفة النهر',             nameFr: 'Maison – Rive',              price: 65000, icon: '🏡', desc: 'Spacious home with river views' },
  { id: 'house_3',    name: 'House – Hilltop Residence',   nameAr: 'منزل — تلة الإقامة',           nameFr: 'Maison – Résidence Colline', price: 90000, icon: '🏡', desc: 'Premium hilltop residence' },
];

function getLocalName(item: { name: string; nameAr: string; nameFr: string }, lang: string) {
  if (lang === 'ar') return item.nameAr;
  if (lang === 'fr') return item.nameFr;
  return item.name;
}

// ─── Firing interface (inline weapon use panel) ───────────────────────────────

function FiringInterface({ weaponId }: { weaponId: string }) {
  const store     = useGameStore();
  const [scoped,  setScoped]  = useState(false);
  const [flash,   setFlash]   = useState<'fired' | 'empty' | null>(null);
  const [reloaded, setReloaded] = useState(false);

  const cfg      = WEAPON_AMMO[weaponId];
  const magSize  = cfg?.magSize ?? 0;
  const mag      = cfg ? (store.weaponMags[weaponId] ?? magSize) : null;
  const reserve  = cfg ? (store.ammoReserves[cfg.ammoType] ?? 0) : null;
  const isMelee  = !cfg;

  const handleFire = () => {
    if (isMelee) {
      setFlash('fired');
      setTimeout(() => setFlash(null), 400);
      return;
    }
    const fired = store.fireWeapon(weaponId, magSize);
    setFlash(fired ? 'fired' : 'empty');
    setTimeout(() => setFlash(null), 400);
  };

  const handleReload = () => {
    if (!cfg) return;
    store.reloadWeapon(weaponId, cfg.magSize, cfg.ammoType);
    setReloaded(true);
    setTimeout(() => setReloaded(false), 1200);
  };

  const isEmpty       = !isMelee && mag === 0;
  const canReload     = !isMelee && mag !== null && mag < magSize && (reserve ?? 0) > 0;
  const noAmmoInShop  = !isMelee && mag === 0 && (reserve ?? 0) === 0;

  return (
    <div className={`mt-3 rounded-lg border p-3 space-y-3 transition-all ${
      scoped ? 'border-green-500/40 bg-green-950/20' : 'border-white/10 bg-black/30'
    }`}>
      {/* Ammo readout */}
      {!isMelee && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Magazine</span>
          <span className="font-mono font-black text-white">
            <span className={isEmpty ? 'text-red-400' : 'text-primary'}>{mag}</span>
            <span className="text-gray-500"> / {magSize}</span>
          </span>
          <span className="text-[10px] text-gray-500 ml-auto">
            Reserve: <span className="text-gray-300 font-mono">{reserve}</span>
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {/* Scope toggle */}
        <button
          onClick={() => setScoped((v) => !v)}
          className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wide transition-all ${
            scoped
              ? 'border-green-500 bg-green-500/20 text-green-300'
              : 'border-white/15 bg-white/5 text-gray-400 hover:border-white/40 hover:text-white'
          }`}
        >
          🔭 {scoped ? 'Scoped ON' : 'Scope'}
        </button>

        {/* Reload */}
        {canReload && (
          <button
            onClick={handleReload}
            className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wide transition-all ${
              reloaded
                ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                : 'border-blue-500/40 bg-blue-900/20 text-blue-400 hover:bg-blue-500/20'
            }`}
          >
            {reloaded ? '✓ Reloaded' : '🔄 Reload'}
          </button>
        )}

        {/* Fire */}
        <button
          onClick={handleFire}
          disabled={isEmpty}
          className={`px-4 py-1.5 rounded border text-xs font-black uppercase tracking-widest transition-all ${
            flash === 'fired'
              ? 'border-yellow-400 bg-yellow-400/30 text-yellow-300 scale-95'
              : flash === 'empty'
              ? 'border-red-500 bg-red-900/20 text-red-400'
              : isEmpty
              ? 'border-white/5 bg-white/3 text-gray-600 cursor-not-allowed'
              : 'border-red-600/60 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300'
          }`}
        >
          {flash === 'fired' ? '💥 FIRE!' : flash === 'empty' ? '🔴 EMPTY' : '🔴 Fire'}
        </button>
      </div>

      {/* Empty + need shop hint */}
      {noAmmoInShop && (
        <p className="text-[10px] text-yellow-500/80 italic">
          ⚠ No ammo — visit a Weapon Shop NPC to buy {cfg && AMMO_DISPLAY[cfg.ammoType]?.name}.
        </p>
      )}
    </div>
  );
}

// ─── Inventory tab ─────────────────────────────────────────────────────────────

/** Car-key entry: Spawn / Despawn / Lock / Unlock actions for an owned vehicle. */
function CarKeyRow({ keyId }: { keyId: string }) {
  const store      = useGameStore();
  const vehicleId  = vehicleIdFromKey(keyId);
  const vehName    = VEHICLE_NAMES_MAP[vehicleId] ?? vehicleId;
  const instance   = store.ownedVehicleInstances.find((v) => v.vehicleId === vehicleId);
  const locked     = instance ? store.lockedVehicleIds.includes(instance.id) : false;

  const handleSpawn = () => {
    const [px, , pz] = store.playerPosition;
    const ry = store.playerRotationY;
    // Place a few units in front of the player
    const spawnX = px - Math.sin(ry) * 4;
    const spawnZ = pz - Math.cos(ry) * 4;
    store.spawnOwnedVehicle(vehicleId, [spawnX, 1, spawnZ], ry);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3">
      <span className="text-2xl">🔑</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm">{vehName} — Key</div>
        <div className="text-[10px] text-gray-500">
          {instance ? (locked ? 'Spawned · Locked' : 'Spawned · Unlocked') : 'Not spawned'}
        </div>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
        {!instance ? (
          <button
            onClick={handleSpawn}
            className="px-2 py-1 rounded border border-green-700/40 text-green-400 text-[10px] font-bold uppercase tracking-wide hover:bg-green-900/20 transition-all"
          >
            Spawn Car
          </button>
        ) : (
          <>
            <button
              onClick={() => store.toggleVehicleLock(instance.id)}
              className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wide transition-all ${
                locked
                  ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/20'
                  : 'border-blue-500/40 text-blue-400 hover:bg-blue-900/20'
              }`}
            >
              {locked ? 'Unlock' : 'Lock'}
            </button>
            <button
              onClick={() => store.despawnOwnedVehicle(instance.id)}
              className="px-2 py-1 rounded border border-red-800/40 text-red-500 text-[10px] font-bold uppercase tracking-wide hover:bg-red-900/20 transition-all"
            >
              Despawn Car
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InventoryTab() {
  const store = useGameStore();
  const [activeWeapon, setActiveWeapon] = useState<string | null>(null);

  const ownedWeapons = store.ownedAssetIds.filter((id) => WEAPON_IDS.has(id));
  const consumableEntries = CONSUMABLES.filter((c) => (store.inventory[c.id] ?? 0) > 0);
  const carKeys = store.ownedAssetIds.filter((id) => isCarKey(id));
  const hasAnything = ownedWeapons.length > 0 || consumableEntries.length > 0 || carKeys.length > 0;

  return (
    <div className="space-y-4">
      {/* Vehicle keys */}
      {carKeys.length > 0 && (
        <div>
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Vehicle Keys</h4>
          <div className="space-y-2">
            {carKeys.map((keyId) => <CarKeyRow key={keyId} keyId={keyId} />)}
          </div>
        </div>
      )}

      {/* Weapons */}
      {ownedWeapons.length > 0 && (
        <div>
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Weapons</h4>
          <div className="space-y-2">
            {ownedWeapons.map((wid) => {
              const cfg      = WEAPON_AMMO[wid];
              const magSize  = cfg?.magSize ?? 0;
              const mag      = cfg ? (store.weaponMags[wid] ?? magSize) : null;
              const isOpen   = activeWeapon === wid;
              const equipped = store.equippedWeaponId === wid;

              return (
                <div
                  key={wid}
                  className={`rounded-xl border transition-all ${
                    isOpen ? 'border-primary/40 bg-primary/5' : 'border-white/8 bg-white/3'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-2xl">{WEAPON_ICONS[wid] ?? '🔫'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">
                        {WEAPON_NAMES[wid] ?? wid}
                        {equipped && (
                          <span className="ml-2 text-[9px] font-black text-primary uppercase">Equipped</span>
                        )}
                      </div>
                      {mag !== null && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          Mag: {mag}/{magSize} · Reserve: {cfg ? (store.ammoReserves[cfg.ammoType] ?? 0) : '–'}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => store.setPlayerState({ equippedWeaponId: wid })}
                        className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wide transition-all ${
                          equipped
                            ? 'border-primary/40 text-primary bg-primary/10'
                            : 'border-white/15 text-gray-400 hover:border-primary/50 hover:text-primary'
                        }`}
                      >
                        {equipped ? '✓ Eq.' : 'Equip'}
                      </button>
                      <button
                        onClick={() => setActiveWeapon(isOpen ? null : wid)}
                        className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wide transition-all ${
                          isOpen
                            ? 'border-yellow-400/60 text-yellow-300 bg-yellow-900/20'
                            : 'border-white/15 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-300'
                        }`}
                      >
                        Use
                      </button>
                      <button
                        onClick={() => {
                          if (isOpen) setActiveWeapon(null);
                          store.dropWeapon(wid);
                        }}
                        className="px-2 py-1 rounded border border-red-800/40 text-red-500 text-[10px] font-bold uppercase tracking-wide hover:bg-red-900/20 transition-all"
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3">
                      <FiringInterface weaponId={wid} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consumables */}
      {consumableEntries.length > 0 && (
        <div>
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Consumables</h4>
          <div className="space-y-2">
            {consumableEntries.map((item) => {
              const qty = store.inventory[item.id] ?? 0;
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{item.name}</div>
                    <div className="text-[10px] text-gray-500">{item.desc}</div>
                  </div>
                  <span className="text-xs font-mono text-gray-400">×{qty}</span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => store.useConsumable(item.id)}
                      className="px-2 py-1 rounded border border-green-700/40 text-green-400 text-[10px] font-bold uppercase tracking-wide hover:bg-green-900/20 transition-all"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => store.dropConsumable(item.id)}
                      className="px-2 py-1 rounded border border-red-800/40 text-red-500 text-[10px] font-bold uppercase tracking-wide hover:bg-red-900/20 transition-all"
                    >
                      Drop
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasAnything && (
        <div className="text-center py-8 text-gray-600 text-sm">
          Your inventory is empty. Visit a shop to buy items.
        </div>
      )}
    </div>
  );
}

// ─── Consumables tab ──────────────────────────────────────────────────────────

function ConsumablesTab() {
  const store = useGameStore();
  const lang  = store.language;
  const [flash, setFlash] = useState<Record<string, 'ok' | 'fail'>>({});

  const handleBuy = (id: string, price: number) => {
    const ok = store.buyConsumable(id, price);
    setFlash((f) => ({ ...f, [id]: ok ? 'ok' : 'fail' }));
    setTimeout(() => setFlash((f) => { const n = { ...f }; delete n[id]; return n; }), 900);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500 italic">
        Food and supplies — find these at corner stores and restaurants.
      </p>
      {CONSUMABLES.map((item) => {
        const qty      = store.inventory[item.id] ?? 0;
        const canAfford = store.money >= item.price;
        const localName = lang === 'ar' ? item.nameAr : lang === 'fr' ? item.nameFr : item.name;
        const f = flash[item.id];

        return (
          <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3 hover:border-white/15 transition-all">
            <span className="text-3xl">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white">{localName}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {qty > 0 && (
                <span className="text-[10px] font-mono text-primary">×{qty} owned</span>
              )}
              <span className={`text-sm font-mono font-bold ${canAfford ? 'text-primary' : 'text-red-400'}`}>
                {item.price.toLocaleString()} DA
              </span>
              <button
                onClick={() => handleBuy(item.id, item.price)}
                className={`text-xs font-bold uppercase px-3 py-1 rounded transition-all ${
                  f === 'ok'
                    ? 'bg-green-500 text-black scale-95'
                    : f === 'fail'
                    ? 'bg-red-600/90 text-white'
                    : canAfford
                    ? 'bg-primary text-black hover:bg-primary/90'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
              >
                {f === 'ok' ? '✓ Bought!' : f === 'fail' ? '✗ No funds' : t('buy', lang)}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ammo tab ─────────────────────────────────────────────────────────────────

function AmmoTab() {
  const store = useGameStore();
  const lang  = store.language;

  const ownedWeapons = store.ownedAssetIds.filter((id) => WEAPON_IDS.has(id) && WEAPON_AMMO[id]);

  if (ownedWeapons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        You don't own any firearms. Buy a weapon first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500 italic">
        Ammunition for owned firearms — visit a Weapon Shop NPC to restock.
      </p>
      {ownedWeapons.map((wid) => {
        const cfg      = WEAPON_AMMO[wid]!;
        const display  = AMMO_DISPLAY[cfg.ammoType];
        const reserve  = store.ammoReserves[cfg.ammoType] ?? 0;
        const mag      = store.weaponMags[wid] ?? cfg.magSize;
        const canAfford = store.money >= cfg.ammoPrice;

        return (
          <div key={wid} className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3 hover:border-white/15 transition-all">
            <span className="text-3xl">{display.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white">{WEAPON_NAMES[wid]}</div>
              <div className="text-xs text-gray-500">{display.name}</div>
              <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                Mag: {mag}/{cfg.magSize} · Reserve: {reserve} rds
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-[10px] text-gray-500">×{cfg.packSize} rds / pack</span>
              <span className={`text-sm font-mono font-bold ${canAfford ? 'text-primary' : 'text-red-400'}`}>
                {cfg.ammoPrice.toLocaleString()} DA
              </span>
              <button
                onClick={() => store.buyAmmo(wid, cfg.ammoPrice, cfg.packSize, cfg.ammoType)}
                disabled={!canAfford}
                className="text-xs font-bold uppercase px-3 py-1 rounded bg-primary text-black hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {t('buy', lang)}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ShopPanel ───────────────────────────────────────────────────────────

export function ShopPanel() {
  const store     = useGameStore();
  const lang      = store.language;
  const shopNpcTab = store.shopNpcTab;

  const [tab, setTab] = useState<ShopCategory>('inventory');

  // When opened via a shop NPC, jump to the relevant tab
  useEffect(() => {
    if (shopNpcTab === 'consumables') setTab('consumables');
    else if (shopNpcTab === 'ammo')      setTab('ammo');
    else if (shopNpcTab === 'weapons')   setTab('weapons');
    else if (shopNpcTab === 'vehicles')  setTab('vehicles');
  }, [shopNpcTab]);

  // Weapons and Vehicles are physical-store-only (Weapon Store / Car Dealership) —
  // they're only visible when the panel was opened by walking up to that NPC.
  // Opening the panel generically (e.g. the Inventory quick-access button) only
  // exposes Properties/Supplies/Ammo/Inventory.

  const items = tab === 'weapons' ? WEAPONS : tab === 'vehicles' ? VEHICLES : PROPERTIES;

  const handleBuy = (id: string, price: number) => {
    if (store.money < price) return;
    if (store.ownedAssetIds.includes(id)) return;
    const isVehicle = tab === 'vehicles';
    const carKeyId  = isVehicle ? `${CAR_KEY_PREFIX}${id}` : null;
    const existing  = new Set(store.ownedAssetIds);
    const toAdd     = [id, ...(carKeyId ? [carKeyId] : [])].filter((x) => !existing.has(x));
    const newOwned  = [...store.ownedAssetIds, ...toAdd];
    store.setPlayerState({
      money:             store.money - price,
      ownedAssetIds:     newOwned,
      equippedWeaponId:  tab === 'weapons'   ? id : store.equippedWeaponId,
      equippedVehicleId: isVehicle           ? id : store.equippedVehicleId,
    });
  };

  const allTabs: { key: ShopCategory; label: string; icon: string }[] = [
    { key: 'weapons',     label: t('weapons', lang),    icon: '🔫' },
    { key: 'vehicles',    label: t('vehicles', lang),   icon: '🚗' },
    { key: 'properties',  label: t('properties', lang), icon: '🏠' },
    { key: 'consumables', label: 'Supplies',             icon: '🥙' },
    { key: 'ammo',        label: 'Ammo',                 icon: '🔹' },
    { key: 'inventory',   label: 'Inventory',            icon: '🎒' },
  ];

  // Gate Weapons/Vehicles tabs behind physically visiting the Weapon Store /
  // Car Dealership NPC — they don't appear when the panel is opened generically.
  const tabs = allTabs.filter((tb) => {
    if (tb.key === 'weapons')  return shopNpcTab === 'weapons';
    if (tb.key === 'vehicles') return shopNpcTab === 'vehicles';
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-2xl font-bold text-white">{t('shop', lang)}</h3>
        <span className="text-primary font-mono font-bold text-lg">
          {store.money.toLocaleString()} {t('money', lang)}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              tab === tb.key
                ? 'bg-primary text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{tb.icon}</span>
            <span className="hidden sm:inline">{tb.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* Passthrough tabs */}
        {(tab === 'consumables') && <ConsumablesTab />}
        {(tab === 'ammo')        && <AmmoTab />}
        {(tab === 'inventory')   && <InventoryTab />}

        {/* Catalog tabs */}
        {(tab === 'weapons' || tab === 'vehicles' || tab === 'properties') &&
          items.map((item) => {
            const owned     = store.ownedAssetIds.includes(item.id);
            const canAfford = store.money >= item.price;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  owned ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/3 hover:border-white/15'
                }`}
              >
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{getLocalName(item, lang)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-sm font-mono font-bold ${canAfford || owned ? 'text-primary' : 'text-red-400'}`}>
                    {item.price.toLocaleString()} DA
                  </span>
                  {owned ? (
                    <span className="text-xs font-bold text-primary uppercase px-3 py-1 border border-primary/40 rounded">
                      {t('owned', lang)}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuy(item.id, item.price)}
                      disabled={!canAfford}
                      className="text-xs font-bold uppercase px-3 py-1 rounded bg-primary text-black hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {t('buy', lang)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
