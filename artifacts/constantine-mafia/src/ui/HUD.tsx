import React, { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { t } from '../game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MiniMap } from './MiniMap';
import { useHudLayout, useDraggable, DEFAULT_HUD_LAYOUT } from '../game/useHudLayout';
import { WEAPON_AMMO, WEAPON_ICONS, WEAPON_NAMES } from '../game/items';

// ── Draggable wrapper ──────────────────────────────────────────────────────────

interface DraggableProps {
  id: string;
  editMode: boolean;
  layout: ReturnType<typeof useHudLayout>['layout'];
  updateElement: ReturnType<typeof useHudLayout>['updateElement'];
  children: React.ReactNode;
  label?: string;
}

function DraggableElement({ id, editMode, layout, updateElement, children, label }: DraggableProps) {
  const el = layout[id] ?? DEFAULT_HUD_LAYOUT[id];
  const posRef = useRef({ x: el.x, y: el.y });

  const onMove = useCallback((dx: number, dy: number) => {
    posRef.current = { x: posRef.current.x + dx, y: posRef.current.y + dy };
    updateElement(id, { x: posRef.current.x, y: posRef.current.y });
  }, [id, updateElement]);

  const onEnd = useCallback(() => {
    updateElement(id, { x: posRef.current.x, y: posRef.current.y });
  }, [id, updateElement]);

  const dragProps = useDraggable(editMode, onMove, onEnd);

  const cur = layout[id] ?? DEFAULT_HUD_LAYOUT[id];

  return (
    <div
      {...dragProps}
      style={{
        position: 'absolute',
        left: cur.x,
        top: cur.y,
        opacity: cur.opacity,
        width: cur.width,
        minHeight: cur.height,
        cursor: editMode ? 'move' : 'default',
        pointerEvents: editMode ? 'all' : 'none',
        userSelect: 'none',
        touchAction: editMode ? 'none' : 'auto',
        outline: editMode ? '1.5px dashed rgba(255,215,0,0.7)' : 'none',
        borderRadius: 8,
        zIndex: editMode ? 100 : 'auto',
      }}
    >
      {children}

      {editMode && (
        <div
          className="absolute -bottom-8 left-0 w-full flex items-center gap-2 bg-black/80 rounded px-2 py-1"
          style={{ pointerEvents: 'all' }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-yellow-400 text-[10px] font-bold uppercase shrink-0">{label}</span>
          <span className="text-gray-500 text-[10px]">α</span>
          <input
            type="range" min={0} max={1} step={0.05}
            value={cur.opacity}
            onChange={(e) => updateElement(id, { opacity: Number(e.target.value) })}
            className="flex-1 accent-yellow-400 h-1"
          />
        </div>
      )}
    </div>
  );
}

// ── Main HUD ──────────────────────────────────────────────────────────────────

export function HUD() {
  const store = useGameStore();
  const lang  = store.language;
  const { layout, updateElement, resetLayout } = useHudLayout();

  const [showMinimap, setShowMinimap] = useState(true);

  if (store.screen !== 'playing' || store.isPaused) return null;

  const editMode = store.hudEditMode;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: editMode ? 'all' : 'none' }}
    >
      {/* ── Edit mode banner ── */}
      {editMode && (
        <div
          className="absolute top-0 left-0 right-0 z-[200] flex items-center justify-between
                     bg-yellow-400/95 text-black px-4 py-2"
          style={{ pointerEvents: 'all' }}
        >
          <span className="font-black text-sm uppercase tracking-widest">✏ HUD Editor — Drag to move · Slider for opacity</span>
          <div className="flex gap-2">
            <button
              onClick={resetLayout}
              className="px-3 py-1 bg-black/20 rounded font-bold text-xs hover:bg-black/30 transition"
            >Reset</button>
            <button
              onClick={() => store.setPlayerState({ hudEditMode: false })}
              className="px-3 py-1 bg-black rounded font-bold text-xs hover:bg-gray-900 transition"
            >✓ Done</button>
          </div>
        </div>
      )}

      {/* ── Health / Armor ── */}
      <DraggableElement id="health" editMode={editMode} layout={layout} updateElement={updateElement} label="Health">
        <div
          className="bg-black/80 backdrop-blur-md p-2.5 rounded-lg border border-white/10 shadow-lg flex flex-col gap-1.5"
          style={{ pointerEvents: editMode ? 'none' : 'auto' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">❤️</span>
            <div className="flex-1 h-3 bg-black/60 border border-white/10 rounded overflow-hidden p-0.5">
              <div
                className={`h-full transition-all rounded-sm shadow-[0_0_8px_rgba(220,20,60,0.6)] ${store.health <= 25 ? 'bg-red-600 animate-pulse' : 'bg-destructive'}`}
                style={{ width: `${store.health}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-gray-400 w-7 text-right shrink-0">{Math.ceil(store.health)}</span>
          </div>
          {store.armor > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <div className="flex-1 h-3 bg-black/60 border border-white/10 rounded overflow-hidden p-0.5">
                <div className="h-full bg-blue-400 transition-all rounded-sm shadow-[0_0_6px_rgba(96,165,250,0.6)]" style={{ width: `${store.armor}%` }} />
              </div>
              <span className="text-[10px] font-mono text-gray-400 w-7 text-right shrink-0">{Math.ceil(store.armor)}</span>
            </div>
          )}
        </div>
      </DraggableElement>

      {/* ── Wanted stars (directly under the health bar) ── */}
      <DraggableElement id="wanted" editMode={editMode} layout={layout} updateElement={updateElement} label="Wanted">
        <div
          className="bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg flex items-center gap-1.5"
          style={{ pointerEvents: editMode ? 'none' : 'auto' }}
        >
          <span className="text-sm">👮</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={
                  i < store.wantedLevel
                    ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.9)]'
                    : 'text-gray-700 opacity-50'
                }
              >★</span>
            ))}
          </div>
        </div>
      </DraggableElement>

      {/* ── Money / Level ── */}
      <DraggableElement id="money" editMode={editMode} layout={layout} updateElement={updateElement} label="Money">
        <div className="bg-black/80 backdrop-blur-md text-white p-3 rounded-lg border border-white/10 shadow-lg">
          <h2 className="text-2xl font-black text-primary font-sans tracking-tight">
            {t('money', lang)} {store.money.toLocaleString()}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('level', lang)} {store.level}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                style={{ width: `${(store.xp / Math.max(1, Math.floor(100 * Math.pow(store.level, 1.5)))) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </DraggableElement>

      {/* ── Minimap (top-right by default; toggle lives under the Pause button) ── */}
      {showMinimap && (
        <DraggableElement id="minimap" editMode={editMode} layout={layout} updateElement={updateElement} label="Minimap">
          <div className="relative rounded-xl overflow-hidden border-2 border-black/60 shadow-2xl" style={{ width: '100%', height: layout.minimap?.height ?? 120 }}>
            <div className="absolute inset-0">
              <MiniMap />
            </div>
            {/* Camera mode badge */}
            <div className="absolute bottom-1 left-1 text-[8px] font-bold text-gray-400 uppercase tracking-wider bg-black/60 px-1 rounded">
              {store.cameraMode === 'first' ? 'FPV' : store.cameraMode === 'second' ? '2nd' : '3rd'}
            </div>
          </div>
        </DraggableElement>
      )}

      {/* ── In-vehicle radio toggle ── */}
      {store.inVehicle && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2"
          style={{ pointerEvents: 'all' }}
        >
          <button
            onClick={() => store.setPlayerState({ showRadio: !store.showRadio })}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all shadow-lg
                        ${store.showRadio ? 'bg-primary text-black border-primary' : 'bg-black/70 text-gray-300 border-white/20 hover:border-white/50'}`}
          >
            📻 Radio
          </button>
        </div>
      )}

      {/* ── Interaction hint ── */}
      <AnimatePresence>
        {store.interactionHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute',
              left: (layout.hints?.x ?? 120) - 40,
              top: layout.hints?.y ?? 740,
              pointerEvents: 'none',
            }}
          >
            <div className="bg-black/90 px-6 py-2 rounded border-t-2 border-primary shadow-[0_0_20px_rgba(255,215,0,0.15)]">
              <span className="text-white font-bold tracking-widest uppercase text-xs">
                {t(store.interactionHint as any, lang) || store.interactionHint}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ammo widget (bottom-right, shows mag + reserve for equipped weapon) ── */}
      {(() => {
        const wid = store.equippedWeaponId;
        if (!wid || store.inVehicle) return null;
        const cfg    = WEAPON_AMMO[wid];
        const icon   = WEAPON_ICONS[wid] ?? '🔪';
        const name   = WEAPON_NAMES[wid] ?? wid;
        if (!cfg) {
          // Melee weapon — show icon only
          return (
            <DraggableElement id="ammo" editMode={editMode} layout={layout} updateElement={updateElement} label="Ammo">
              <div className="bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-white/10 shadow-lg flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{name}</span>
                <span className="text-[10px] text-gray-500">∞</span>
              </div>
            </DraggableElement>
          );
        }
        const mag     = store.weaponMags[wid] ?? cfg.magSize;
        const reserve = store.ammoReserves[cfg.ammoType] ?? 0;
        const isEmpty = mag === 0;
        return (
          <DraggableElement id="ammo" editMode={editMode} layout={layout} updateElement={updateElement} label="Ammo">
            <div className="bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-white/10 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <div>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className={`font-black text-lg leading-none ${isEmpty ? 'text-red-400' : 'text-white'}`}>{mag}</span>
                    <span className="text-gray-600 text-xs">/ {cfg.magSize}</span>
                    <span className="text-gray-500 text-[10px] ml-1">·</span>
                    <span className="text-gray-400 text-xs">{reserve}</span>
                  </div>
                  {isEmpty && (
                    <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                      Need Ammo
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DraggableElement>
        );
      })()}

      {/* ── Dizziness overlay ── */}
      {store.dizzyUntil > Date.now() && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
            animation: 'pulse 1s ease-in-out infinite',
            filter: 'blur(1px)',
          }}
        />
      )}

      {/* ── Pause button (top-right, always touch-accessible) ── */}
      <div className="absolute top-4 right-4" style={{ pointerEvents: 'all' }}>
        <button
          onClick={store.togglePause}
          className="w-10 h-10 bg-black/50 border border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm active:bg-white/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="8" y1="4" x2="8" y2="20" /><line x1="16" y1="4" x2="16" y2="20" />
          </svg>
        </button>
      </div>

      {/* ── Mini-map toggle (directly under the Pause button) ── */}
      <div className="absolute top-16 right-4" style={{ pointerEvents: 'all' }}>
        <button
          onClick={() => setShowMinimap((v) => !v)}
          title={showMinimap ? 'Hide mini-map' : 'Show mini-map'}
          className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border text-sm transition-colors
                      ${showMinimap ? 'bg-primary/80 border-primary text-black' : 'bg-black/50 border-white/20 text-white active:bg-white/20'}`}
        >
          🗺
        </button>
      </div>
    </div>
  );
}
