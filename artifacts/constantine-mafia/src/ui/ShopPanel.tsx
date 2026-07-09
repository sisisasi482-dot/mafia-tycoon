import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { t } from '../game/constants';

type ShopCategory = 'weapons' | 'vehicles' | 'properties';

const WEAPONS = [
  { id: 'knife',       name: 'Knife',         nameAr: 'سكين',          nameFr: 'Couteau',    price: 200,    icon: '🔪', desc: 'Silent and deadly' },
  { id: 'pistol',      name: 'Pistol',        nameAr: 'مسدس',          nameFr: 'Pistolet',   price: 800,    icon: '🔫', desc: 'Standard sidearm' },
  { id: 'shotgun',     name: 'Shotgun',       nameAr: 'بندقية',        nameFr: 'Fusil',      price: 2500,   icon: '🔫', desc: 'Heavy close range' },
  { id: 'smg',         name: 'SMG',           nameAr: 'رشاش',          nameFr: 'Mitraillette', price: 4000, icon: '🔫', desc: 'Fast fire rate' },
  { id: 'rifle',       name: 'Assault Rifle', nameAr: 'بندقية اقتحام', nameFr: 'Fusil d\'assaut', price: 8000, icon: '🔫', desc: 'Military grade' },
];

const VEHICLES = [
  { id: 'renault',     name: 'Renault 25',    nameAr: 'رونو 25',       nameFr: 'Renault 25', price: 3000,   icon: '🚗', desc: 'Classic Algerian street car' },
  { id: 'kangoo',      name: 'Kangoo',        nameAr: 'كانغو',         nameFr: 'Kangoo',     price: 5000,   icon: '🚐', desc: 'Rugged delivery van' },
  { id: 'bmw',         name: 'BMW 5 Series',  nameAr: 'بي إم دبليو',   nameFr: 'BMW Série 5', price: 15000, icon: '🏎️', desc: 'High-speed getaway' },
  { id: 'moto',        name: 'Motorcycle',    nameAr: 'دراجة نارية',   nameFr: 'Moto',       price: 4000,   icon: '🏍️', desc: 'Weave through traffic' },
  { id: 'police_car',  name: 'Police Crown',  nameAr: 'سيارة الشرطة',  nameFr: 'Voiture BRI', price: 25000, icon: '🚓', desc: 'Stolen from the BRI' },
];

const PROPERTIES = [
  // ── Abstract investment properties (passive income) ───────────────────────
  { id: 'garage_am',   name: 'Garage – Ali Mendjeli',         nameAr: 'كراج علي منجلي',                nameFr: 'Garage Ali Mendjeli',       price: 10000, icon: '🏚️', desc: 'Store vehicles safely' },
  { id: 'safehouse_cv', name: 'Safehouse – Centre-Ville',     nameAr: 'ملجأ وسط المدينة',              nameFr: 'Planque Centre-Ville',       price: 25000, icon: '🏠', desc: 'Respawn point + save' },
  { id: 'shop_oc',     name: 'Weapon Shop – Old City',        nameAr: 'محل أسلحة المدينة القديمة',     nameFr: 'Armurerie Vieille Ville',    price: 50000, icon: '🏪', desc: 'Passive income' },
  { id: 'factory_am',  name: 'Factory – Ain M\'lila',         nameAr: 'مصنع عين مليلة',                nameFr: 'Usine Ain M\'lila',          price: 80000, icon: '🏭', desc: 'High income every 5 min' },
  // ── Standalone physical garages (enter & sleep) ───────────────────────────
  { id: 'garage_1',    name: 'Garage – Suburb',               nameAr: 'كراج الضاحية',                  nameFr: 'Garage Banlieue',            price:  8000, icon: '🚗', desc: 'Park & sleep — cheaper than a house' },
  { id: 'garage_2',    name: 'Garage – Riverside',            nameAr: 'كراج ضفة النهر',                nameFr: 'Garage Rive',                price: 12000, icon: '🚗', desc: 'Park & sleep near Old City' },
  // ── Standalone homes (multi-zone, sleep / TV / eat / wardrobe) ───────────
  { id: 'house_1',     name: 'House – Old City Villa',        nameAr: 'منزل — فيلا المدينة القديمة',   nameFr: 'Maison – Villa Vieille Ville', price: 45000, icon: '🏡', desc: 'Living room, bedroom, kitchen & bathroom' },
  { id: 'house_2',     name: 'House – Riverside',             nameAr: 'منزل — ضفة النهر',              nameFr: 'Maison – Rive',              price: 65000, icon: '🏡', desc: 'Spacious home with river views' },
  { id: 'house_3',     name: 'House – Hilltop Residence',     nameAr: 'منزل — تلة الإقامة',            nameFr: 'Maison – Résidence Colline', price: 90000, icon: '🏡', desc: 'Premium hilltop residence' },
];

function getLocalName(item: { name: string; nameAr: string; nameFr: string }, lang: string) {
  if (lang === 'ar') return item.nameAr;
  if (lang === 'fr') return item.nameFr;
  return item.name;
}

export function ShopPanel() {
  const store = useGameStore();
  const lang = store.language;
  const [tab, setTab] = useState<ShopCategory>('weapons');

  const items = tab === 'weapons' ? WEAPONS : tab === 'vehicles' ? VEHICLES : PROPERTIES;

  const handleBuy = (id: string, price: number) => {
    if (store.money < price) return;
    if (store.ownedAssetIds.includes(id)) return;
    store.setPlayerState({
      money: store.money - price,
      ownedAssetIds: [...store.ownedAssetIds, id],
      equippedWeaponId: tab === 'weapons' ? id : store.equippedWeaponId,
      equippedVehicleId: tab === 'vehicles' ? id : store.equippedVehicleId,
    });
  };

  const tabs: { key: ShopCategory; label: string }[] = [
    { key: 'weapons',    label: t('weapons', lang) },
    { key: 'vehicles',   label: t('vehicles', lang) },
    { key: 'properties', label: t('properties', lang) },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-2xl font-bold text-white">{t('shop', lang)}</h3>
        <span className="text-primary font-mono font-bold text-lg">
          {store.money.toLocaleString()} {t('money', lang)}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              tab === tb.key
                ? 'bg-primary text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {items.map((item) => {
          const owned = store.ownedAssetIds.includes(item.id);
          const canAfford = store.money >= item.price;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                owned
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-white/5 bg-white/3 hover:border-white/15'
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
