import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore, FpsCap } from '../game/useGameStore';
import { useSaveSystem } from '../game/useSaveSystem';
import { t } from '../game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MapView } from './MapView';
import { ShopPanel } from './ShopPanel';
import { MissionPanel } from './MissionPanel';
import { DEFAULT_BINDINGS } from '../game/Player';

export function PauseMenu() {
  const store = useGameStore();
  const { saveGame } = useSaveSystem();
  const lang = store.language;
  const rtl = lang === 'ar';

  if (!store.isPaused || store.screen !== 'playing') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-4xl h-full max-h-[800px] bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col md:flex-row shadow-2xl overflow-hidden"
        >
          {/* Sidebar */}
          <div className="md:w-52 bg-[#111] md:border-r border-b md:border-b-0 border-white/10
                          flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible
                          p-2 md:p-4 shrink-0">
            <h2 className="hidden md:block text-sm font-bold text-primary mb-2 uppercase tracking-widest px-2">
              Constantine
            </h2>
            <button
              onClick={() => store.togglePause()}
              className="shrink-0 px-3 md:px-0 md:w-full py-2 md:py-3 text-center font-black rounded-lg
                         bg-primary text-black hover:bg-primary/90 transition-colors
                         uppercase tracking-widest text-xs md:text-sm md:mb-1 whitespace-nowrap"
            >
              ▶ {t('resume', lang)}
            </button>
            <MobileMenuButton active={store.activePanel === 'settings'}    onClick={() => store.setActivePanel('settings')}>
              ⚙ <span className="hidden md:inline">{t('settings', lang)}</span><span className="md:hidden">Settings</span>
            </MobileMenuButton>
            <MobileMenuButton active={store.activePanel === 'map'}         onClick={() => store.setActivePanel('map')}>
              🗺 <span className="hidden md:inline">{t('map', lang)}</span><span className="md:hidden">Map</span>
            </MobileMenuButton>
            <MobileMenuButton active={store.activePanel === 'missions'}    onClick={() => store.setActivePanel('missions')}>
              📋 <span className="hidden md:inline">{t('missions', lang)}</span><span className="md:hidden">Missions</span>
            </MobileMenuButton>
            <MobileMenuButton active={store.activePanel === 'shop'}        onClick={() => store.setActivePanel('shop')}>
              🛒 <span className="hidden md:inline">{t('shop', lang)}</span><span className="md:hidden">Shop</span>
            </MobileMenuButton>

            <div className="hidden md:flex flex-1" />
            <button
              onClick={() => { saveGame(); alert(t('saved', lang)); }}
              className="hidden md:block w-full p-3 text-left text-sm font-medium rounded
                         text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              💾 {t('save_game', lang)}
            </button>
            <button
              onClick={() => { store.setScreen('main_menu'); store.togglePause(); }}
              className="hidden md:block w-full p-3 text-left text-sm font-medium rounded
                         text-red-400 hover:bg-red-900/20 transition-colors"
            >
              ✕ {t('exit_to_menu', lang)}
            </button>

            <div className="md:hidden flex gap-1 ml-auto shrink-0">
              <button
                onClick={() => { saveGame(); alert(t('saved', lang)); }}
                title={t('save_game', lang)}
                className="px-3 py-2 rounded text-gray-400 hover:bg-white/10 text-sm transition-colors"
              >💾</button>
              <button
                onClick={() => { store.setScreen('main_menu'); store.togglePause(); }}
                title={t('exit_to_menu', lang)}
                className="px-3 py-2 rounded text-red-400 hover:bg-red-900/20 text-sm transition-colors"
              >✕</button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {store.activePanel === 'settings'  && <SettingsPanel />}
            {store.activePanel === 'map'        && <MapView />}
            {store.activePanel === 'missions'   && <MissionPanel />}
            {store.activePanel === 'shop'       && <ShopPanel />}
            {store.activePanel === 'none'       && (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                Select an option from the menu.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MobileMenuButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 md:px-0 md:w-full py-2 md:py-3 text-left text-xs md:text-sm font-medium rounded
                  whitespace-nowrap transition-all
                  ${active
                    ? 'bg-primary/10 text-primary md:border-l-4 border-b-2 md:border-b-0 border-primary'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white md:border-l-4 border-b-2 md:border-b-0 border-transparent'
                  }`}
    >
      {children}
    </button>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Opt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide transition-all ${
        active ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/15 text-gray-400 hover:border-white/40 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

type SettingsTab = 'general' | 'controls' | 'performance';

function SettingsPanel() {
  const store = useGameStore();
  const lang  = store.language;
  const [tab, setTab] = useState<SettingsTab>('general');

  return (
    <div className="space-y-4 max-w-lg">
      <h3 className="text-2xl font-bold text-white border-b border-white/10 pb-3">{t('settings', lang)}</h3>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-white/8 pb-3">
        {(['general', 'controls', 'performance'] as SettingsTab[]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${
              tab === s ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'
            }`}
          >
            {s === 'general' ? '⚙ General' : s === 'controls' ? '🎮 Controls' : '⚡ Performance'}
          </button>
        ))}
      </div>

      {tab === 'general'     && <GeneralSettings />}
      {tab === 'controls'    && <KeybindingsPanel />}
      {tab === 'performance' && <PerformancePanel />}
    </div>
  );
}

// ─── General Settings ─────────────────────────────────────────────────────────

function GeneralSettings() {
  const store = useGameStore();
  const lang  = store.language;

  return (
    <div className="space-y-6 overflow-y-auto">
      <OptionRow label={t('language', lang)}>
        {(['en', 'ar', 'fr'] as const).map((l) => (
          <Opt key={l} active={store.language === l} onClick={() => store.setPlayerState({ language: l })}>
            {l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Français'}
          </Opt>
        ))}
      </OptionRow>

      <OptionRow label={t('graphics', lang)}>
        {(['low', 'medium', 'high'] as const).map((g) => (
          <Opt key={g} active={store.graphicsQuality === g} onClick={() => store.setPlayerState({ graphicsQuality: g })}>
            {t(g, lang)}
          </Opt>
        ))}
      </OptionRow>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{t('audio', lang)}</label>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">🔈</span>
          <input type="range" min="0" max="100" value={store.masterVolume}
            onChange={(e) => store.setPlayerState({ masterVolume: parseInt(e.target.value) })}
            className="flex-1 accent-primary h-1.5" />
          <span className="text-gray-400 text-xs w-8">{store.masterVolume}%</span>
        </div>
      </div>

      <OptionRow label="Camera Mode">
        <Opt active={store.cameraMode === 'third'}  onClick={() => store.setPlayerState({ cameraMode: 'third'  })}>Third-Person</Opt>
        <Opt active={store.cameraMode === 'second'} onClick={() => store.setPlayerState({ cameraMode: 'second' })}>Second-Person</Opt>
        <Opt active={store.cameraMode === 'first'}  onClick={() => store.setPlayerState({ cameraMode: 'first'  })}>First-Person</Opt>
      </OptionRow>

      <div className="border-t border-white/8 pt-4 space-y-4">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Vehicle Controls</h4>
        <OptionRow label="Steering">
          <Opt active={store.vehicleSteeringMode === 'wheel'}  onClick={() => store.setPlayerState({ vehicleSteeringMode: 'wheel'  })}>🎡 Wheel</Opt>
          <Opt active={store.vehicleSteeringMode === 'arrows'} onClick={() => store.setPlayerState({ vehicleSteeringMode: 'arrows' })}>⬆ Arrows</Opt>
          <Opt active={store.vehicleSteeringMode === 'tilt'}   onClick={() => store.setPlayerState({ vehicleSteeringMode: 'tilt'   })}>📱 Tilt</Opt>
          <Opt active={store.vehicleSteeringMode === 'slider'} onClick={() => store.setPlayerState({ vehicleSteeringMode: 'slider' })}>↔ Slider</Opt>
        </OptionRow>
        <OptionRow label="Pedals">
          <Opt active={store.vehiclePedalMode === 'buttons'} onClick={() => store.setPlayerState({ vehiclePedalMode: 'buttons' })}>Buttons</Opt>
          <Opt active={store.vehiclePedalMode === 'slider'}  onClick={() => store.setPlayerState({ vehiclePedalMode: 'slider'  })}>Slider</Opt>
        </OptionRow>
        <OptionRow label="Transmission">
          <Opt active={store.vehicleTransmission === 'auto'}   onClick={() => store.setPlayerState({ vehicleTransmission: 'auto'   })}>Auto</Opt>
          <Opt active={store.vehicleTransmission === 'manual'} onClick={() => store.setPlayerState({ vehicleTransmission: 'manual' })}>Manual</Opt>
        </OptionRow>
      </div>

      <div className="border-t border-white/8 pt-4 space-y-3">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">HUD</h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={store.showTouchControls}
            onChange={(e) => store.setPlayerState({ showTouchControls: e.target.checked })}
            className="w-4 h-4 accent-primary" />
          <span className="text-white text-sm font-medium">{t('touch_controls', lang)}</span>
        </label>
        <button
          onClick={() => { store.setPlayerState({ hudEditMode: true }); store.togglePause(); }}
          className="w-full py-3 rounded-lg border border-yellow-400/40 text-yellow-400 font-bold text-sm
                     uppercase tracking-widest hover:bg-yellow-400/10 transition-all"
        >
          ✏ Edit HUD Layout
        </button>
      </div>

      <RedeemCodePanel />
    </div>
  );
}

// ─── Redeem Code Panel ────────────────────────────────────────────────────────

function RedeemCodePanel() {
  const store = useGameStore();
  const [code,    setCode]    = useState('');
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null);

  const handleRedeem = () => {
    if (!code.trim()) return;
    const res = store.redeemCode(code.trim());
    setResult({ ok: res.ok, msg: res.msg });
    if (res.ok) setCode('');
    setTimeout(() => setResult(null), 4000);
  };

  return (
    <div className="border-t border-white/8 pt-4 space-y-3">
      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">🎁 Redeem Code</h4>
      <p className="text-[11px] text-gray-600 italic">
        Enter a promo code to claim a random cash reward (once per code).
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          placeholder="Enter code…"
          className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2
                     text-white text-sm placeholder-gray-600 outline-none
                     focus:border-primary/60 transition-colors"
        />
        <button
          onClick={handleRedeem}
          disabled={!code.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-black font-black text-xs
                     uppercase tracking-widest hover:bg-primary/90
                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Redeem
        </button>
      </div>
      {result && (
        <div className={`text-xs font-bold px-3 py-2 rounded-lg border ${
          result.ok
            ? 'border-green-500/40 bg-green-900/20 text-green-400'
            : 'border-red-700/40 bg-red-900/20 text-red-400'
        }`}>
          {result.ok ? '✓ ' : '✗ '}{result.msg}
        </div>
      )}
    </div>
  );
}

// ─── Performance Panel ────────────────────────────────────────────────────────

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wide transition-all ${
        active
          ? 'bg-primary/15 border-primary/60 text-primary'
          : 'bg-white/3 border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
      }`}
    >
      <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${
        active ? 'bg-primary border-primary' : 'border-gray-600'
      }`} />
      {children}
    </button>
  );
}

function NpcCountSlider() {
  const npcCount = useGameStore((s) => s.npcCount);
  const setPlayerState = useGameStore((s) => s.setPlayerState);

  return (
    <OptionRow label="NPC Count">
      <div className="flex items-center gap-3 w-full">
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={npcCount}
          onChange={(e) => setPlayerState({ npcCount: Number(e.target.value) })}
          className="flex-1 accent-primary"
        />
        <span className="text-xs font-bold text-primary w-8 text-right tabular-nums">{npcCount}</span>
      </div>
    </OptionRow>
  );
}

function PerformancePanel() {
  const store = useGameStore();

  return (
    <div className="space-y-6">

      <OptionRow label="Shadows">
        <Toggle active={store.shadowsEnabled}  onClick={() => store.setPlayerState({ shadowsEnabled: true  })}>On</Toggle>
        <Toggle active={!store.shadowsEnabled} onClick={() => store.setPlayerState({ shadowsEnabled: false })}>Off</Toggle>
      </OptionRow>

      <OptionRow label="Post-Processing">
        <Toggle active={store.postProcessing}  onClick={() => store.setPlayerState({ postProcessing: true  })}>On</Toggle>
        <Toggle active={!store.postProcessing} onClick={() => store.setPlayerState({ postProcessing: false })}>Off</Toggle>
      </OptionRow>

      <OptionRow label="NPC Density">
        <Opt active={store.npcDensity === 'low'}    onClick={() => store.setPlayerState({ npcDensity: 'low'    })}>Low</Opt>
        <Opt active={store.npcDensity === 'medium'} onClick={() => store.setPlayerState({ npcDensity: 'medium' })}>Medium</Opt>
        <Opt active={store.npcDensity === 'high'}   onClick={() => store.setPlayerState({ npcDensity: 'high'   })}>High</Opt>
      </OptionRow>

      <NpcCountSlider />

      <OptionRow label="Texture Quality">
        <Opt active={store.textureQuality === 'low'}    onClick={() => store.setPlayerState({ textureQuality: 'low'    })}>Low</Opt>
        <Opt active={store.textureQuality === 'medium'} onClick={() => store.setPlayerState({ textureQuality: 'medium' })}>Medium</Opt>
        <Opt active={store.textureQuality === 'high'}   onClick={() => store.setPlayerState({ textureQuality: 'high'   })}>High</Opt>
      </OptionRow>

      <OptionRow label="FPS Cap">
        <Opt active={store.fpsCap === 0}  onClick={() => store.setPlayerState({ fpsCap: 0  })}>Unlimited</Opt>
        <Opt active={store.fpsCap === 60} onClick={() => store.setPlayerState({ fpsCap: 60 })}>60 FPS</Opt>
        <Opt active={store.fpsCap === 30} onClick={() => store.setPlayerState({ fpsCap: 30 })}>30 FPS</Opt>
      </OptionRow>

      <div className="rounded-lg bg-white/5 border border-white/8 p-4 text-xs text-gray-500 space-y-1.5">
        <p className="font-bold text-gray-400 uppercase tracking-wide">💡 Performance Tips</p>
        <p>Turn off <span className="text-white font-semibold">Shadows</span> for the biggest GPU boost on low-end devices.</p>
        <p>Set <span className="text-white font-semibold">NPC Density</span> to Low to reduce CPU load in crowded areas.</p>
        <p>Set <span className="text-white font-semibold">FPS Cap</span> to 30 to reduce heat on laptops.</p>
      </div>
    </div>
  );
}

// ─── Keybindings Panel ────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  forward:  'Move Forward',
  back:     'Move Backward',
  left:     'Strafe Left',
  right:    'Strafe Right',
  jump:     'Jump',
  sprint:   'Sprint',
  interact: 'Interact / Enter',
  attack:   'Attack',
  map:      'Toggle Map',
  escape:   'Pause / Menu',
};

/** Read overrides from localStorage.  Returns { action → keyCode } */
function loadOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem('cm_keybindings');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/** Friendly display name for a KeyboardEvent.code */
function friendlyKey(code: string): string {
  const map: Record<string, string> = {
    KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D',
    KeyE: 'E', KeyF: 'F', KeyM: 'M', KeyR: 'R',
    KeyQ: 'Q', KeyZ: 'Z', KeyX: 'X', KeyC: 'C',
    Space: 'Space', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift',
    ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl',
    AltLeft: 'L-Alt', AltRight: 'R-Alt',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', Backspace: 'Bksp',
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
    Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8',
    Digit9: '9', Digit0: '0',
  };
  return map[code] ?? code.replace(/^Key/, '').replace(/^Digit/, '');
}

function KeybindingsPanel() {
  const [overrides, setOverrides] = useState<Record<string, string>>(loadOverrides);
  const [rebinding, setRebinding] = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);

  // Capture next keydown when rebinding
  useEffect(() => {
    if (!rebinding) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setRebinding(null);
        return;
      }
      setOverrides((prev) => ({ ...prev, [rebinding]: e.code }));
      setRebinding(null);
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [rebinding]);

  const save = useCallback(() => {
    try {
      localStorage.setItem('cm_keybindings', JSON.stringify(overrides));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* storage unavailable */ }
  }, [overrides]);

  const reset = useCallback(() => {
    localStorage.removeItem('cm_keybindings');
    setOverrides({});
    setSaved(false);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">
        Click a key button, then press any key to remap. Changes take effect on the next game session.
      </p>

      <div className="space-y-1">
        {Object.entries(DEFAULT_BINDINGS).map(([action, defaultKeys]) => {
          const activeKey = overrides[action] ?? defaultKeys[0];
          const isListening = rebinding === action;

          return (
            <div key={action} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-gray-300 font-medium">
                {ACTION_LABELS[action] ?? action}
              </span>
              <div className="flex items-center gap-2">
                {/* Default key(s) as grey badge */}
                <span className="text-[10px] text-gray-600 font-mono hidden sm:block">
                  default: {defaultKeys.map(friendlyKey).join(' / ')}
                </span>
                <button
                  onClick={() => setRebinding(action)}
                  className={`min-w-[56px] px-3 py-1.5 rounded border font-mono text-xs font-bold transition-all ${
                    isListening
                      ? 'border-primary bg-primary/20 text-primary animate-pulse'
                      : 'border-white/20 bg-white/5 text-white hover:border-primary/60 hover:text-primary'
                  }`}
                >
                  {isListening ? '…' : friendlyKey(activeKey)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={save}
          className={`flex-1 py-2.5 rounded-lg border font-bold text-sm uppercase tracking-widest transition-all ${
            saved
              ? 'border-green-500 bg-green-500/20 text-green-400'
              : 'border-primary/50 text-primary hover:bg-primary/10'
          }`}
        >
          {saved ? '✓ Saved!' : '💾 Save Bindings'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-lg border border-white/10 text-gray-500 text-sm font-medium hover:border-white/30 hover:text-white transition-all"
        >
          Reset
        </button>
      </div>

      <p className="text-[11px] text-gray-600 italic">
        ⚠ Saved bindings apply after the game is restarted (Resume → exit to menu → New Game).
      </p>
    </div>
  );
}
