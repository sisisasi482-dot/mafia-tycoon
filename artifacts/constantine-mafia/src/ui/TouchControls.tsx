import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../game/useGameStore';

// ── Key dispatch helpers ─────────────────────────────────────────────────────

function press(code: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
}
function release(code: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
}

// ── Joystick component ───────────────────────────────────────────────────────

interface JoystickProps { onDirection: (dx: number, dz: number) => void; size?: number; }

function Joystick({ onDirection, size = 96 }: JoystickProps) {
  const base   = useRef<HTMLDivElement>(null);
  const thumb  = useRef<HTMLDivElement>(null);
  const origin = useRef({ x: 0, y: 0 });
  const active = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    origin.current = { x: t.clientX, y: t.clientY };
    active.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!active.current) return;
    const t  = e.touches[0];
    const dx = t.clientX - origin.current.x;
    const dy = t.clientY - origin.current.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const maxR = size * 0.35;
    const nx = len > maxR ? (dx / len) * maxR : dx;
    const ny = len > maxR ? (dy / len) * maxR : dy;
    if (thumb.current) {
      thumb.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
    // Normalise -1..1
    onDirection(dx / Math.max(len, 1), dy / Math.max(len, 1));
  }, [size, onDirection]);

  const onTouchEnd = useCallback(() => {
    active.current = false;
    if (thumb.current) thumb.current.style.transform = 'translate(0,0)';
    onDirection(0, 0);
  }, [onDirection]);

  const w = size; const h = size;
  return (
    <div
      ref={base}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center"
      style={{ width: w, height: h, touchAction: 'none' }}
    >
      <div
        ref={thumb}
        className="w-10 h-10 rounded-full bg-white/20 border border-white/30 transition-none"
        style={{ transition: 'transform 0ms' }}
      />
    </div>
  );
}

// ── Steering Wheel component ─────────────────────────────────────────────────

function SteeringWheel({ onAngle }: { onAngle: (a: number) => void }) {
  const startAngle = useRef(0);
  const curAngle   = useRef(0);
  const [rotation, setRotation] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const rect  = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx    = rect.left + rect.width / 2;
    const cy    = rect.top  + rect.height / 2;
    const t     = e.touches[0];
    startAngle.current = Math.atan2(t.clientY - cy, t.clientX - cx) - curAngle.current;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const rect  = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx    = rect.left + rect.width / 2;
    const cy    = rect.top  + rect.height / 2;
    const t     = e.touches[0];
    const angle = Math.atan2(t.clientY - cy, t.clientX - cx) - startAngle.current;
    const clamped = Math.max(-Math.PI * 0.6, Math.min(Math.PI * 0.6, angle));
    curAngle.current = clamped;
    setRotation(clamped);
    onAngle(clamped / (Math.PI * 0.6)); // -1..1
  }, [onAngle]);

  const onTouchEnd = useCallback(() => {
    curAngle.current = 0;
    setRotation(0);
    onAngle(0);
  }, [onAngle]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="w-28 h-28 rounded-full border-4 border-white/30 bg-white/5 backdrop-blur-sm
                 flex items-center justify-center relative"
      style={{ transform: `rotate(${rotation}rad)`, touchAction: 'none' }}
    >
      {/* Wheel spokes */}
      {[0, 60, 120].map((deg) => (
        <div key={deg} className="absolute w-0.5 h-10 bg-white/30 rounded-full origin-bottom"
          style={{ transform: `rotate(${deg}deg) translateX(-50%)`, bottom: '50%', left: '50%' }} />
      ))}
      <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30" />
    </div>
  );
}

// ── Main TouchControls ───────────────────────────────────────────────────────

export function TouchControls() {
  const store = useGameStore();
  const heldKeys = useRef<Set<string>>(new Set());
  const tiltRef  = useRef<{ active: boolean }>({ active: false });

  // Tilt / DeviceOrientation
  useEffect(() => {
    if (!store.inVehicle || store.vehicleSteeringMode !== 'tilt') return;
    tiltRef.current.active = true;
    const handler = (e: DeviceOrientationEvent) => {
      if (!tiltRef.current.active) return;
      const gamma = Math.max(-45, Math.min(45, e.gamma ?? 0)); // left/right tilt
      if (gamma < -10) { press('KeyA'); heldKeys.current.add('KeyA'); }
      else { release('KeyA'); heldKeys.current.delete('KeyA'); }
      if (gamma > 10)  { press('KeyD'); heldKeys.current.add('KeyD'); }
      else { release('KeyD'); heldKeys.current.delete('KeyD'); }
    };
    window.addEventListener('deviceorientation', handler as EventListener);
    return () => {
      tiltRef.current.active = false;
      window.removeEventListener('deviceorientation', handler as EventListener);
      release('KeyA'); release('KeyD');
    };
  }, [store.inVehicle, store.vehicleSteeringMode]);

  // Joystick movement handler (walking / driving with joystick)
  // Must be defined before any early return to satisfy Rules of Hooks
  const handleJoystick = useCallback((dx: number, dz: number) => {
    const DEAD = 0.25;
    // Forward/back
    if (dz < -DEAD) { press('KeyW'); heldKeys.current.add('KeyW'); }
    else            { release('KeyW'); heldKeys.current.delete('KeyW'); }
    if (dz > DEAD)  { press('KeyS'); heldKeys.current.add('KeyS'); }
    else            { release('KeyS'); heldKeys.current.delete('KeyS'); }
    // Left/right
    if (dx < -DEAD) { press('KeyA'); heldKeys.current.add('KeyA'); }
    else            { release('KeyA'); heldKeys.current.delete('KeyA'); }
    if (dx > DEAD)  { press('KeyD'); heldKeys.current.add('KeyD'); }
    else            { release('KeyD'); heldKeys.current.delete('KeyD'); }
  }, []);

  const handleWheelAngle = useCallback((a: number) => {
    const DEAD = 0.2;
    if (a < -DEAD) { press('KeyA'); heldKeys.current.add('KeyA'); release('KeyD'); heldKeys.current.delete('KeyD'); }
    else if (a > DEAD) { press('KeyD'); heldKeys.current.add('KeyD'); release('KeyA'); heldKeys.current.delete('KeyA'); }
    else { release('KeyA'); release('KeyD'); heldKeys.current.delete('KeyA'); heldKeys.current.delete('KeyD'); }
  }, []);

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch && !store.showTouchControls) return null;
  if (store.screen !== 'playing' || store.isPaused) return null;

  // ── Vehicle HUD ─────────────────────────────────────────────────────────
  if (store.inVehicle) {
    return (
      <div className="absolute inset-0 pointer-events-none z-40">
        {/* Gear indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 rounded-full px-4 py-1.5 text-white text-sm font-mono font-bold">
          {store.vehicleTransmission === 'auto' ? 'AUTO' : 'MANUAL'} · D
        </div>

        {/* Steering */}
        <div className="absolute bottom-20 left-8 pointer-events-auto select-none">
          {store.vehicleSteeringMode === 'wheel' && (
            <SteeringWheel onAngle={handleWheelAngle} />
          )}
          {store.vehicleSteeringMode === 'arrows' && (
            <div className="relative w-32 h-32 bg-white/5 rounded-full border border-white/10 flex items-center justify-center">
              <button className="absolute top-0 w-14 h-10 bg-white/10 rounded-t active:bg-white/30 flex items-center justify-center text-white text-lg"
                onTouchStart={() => press('KeyW')} onTouchEnd={() => release('KeyW')}>▲</button>
              <button className="absolute bottom-0 w-14 h-10 bg-white/10 rounded-b active:bg-white/30 flex items-center justify-center text-white text-lg"
                onTouchStart={() => press('KeyS')} onTouchEnd={() => release('KeyS')}>▼</button>
              <button className="absolute left-0 w-10 h-14 bg-white/10 rounded-l active:bg-white/30 flex items-center justify-center text-white text-lg"
                onTouchStart={() => press('KeyA')} onTouchEnd={() => release('KeyA')}>◄</button>
              <button className="absolute right-0 w-10 h-14 bg-white/10 rounded-r active:bg-white/30 flex items-center justify-center text-white text-lg"
                onTouchStart={() => press('KeyD')} onTouchEnd={() => release('KeyD')}>►</button>
            </div>
          )}
          {store.vehicleSteeringMode === 'slider' && (
            <div className="w-48 flex flex-col items-center gap-2">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Steer</span>
              <input type="range" min={-1} max={1} step={0.05} defaultValue={0}
                className="w-full accent-primary h-3"
                onTouchMove={(e: React.TouchEvent<HTMLInputElement>) => {
                  handleWheelAngle((e.currentTarget as HTMLInputElement).valueAsNumber);
                }}
                onTouchEnd={() => { handleWheelAngle(0); }}
              />
            </div>
          )}
          {store.vehicleSteeringMode === 'tilt' && (
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-full px-4 py-2">
              <span className="text-2xl">📱</span>
              <span className="text-white text-xs font-bold uppercase">Tilt to steer</span>
            </div>
          )}
        </div>

        {/* Pedals */}
        <div className="absolute bottom-8 right-8 pointer-events-auto select-none flex gap-3 items-end">
          {store.vehiclePedalMode === 'buttons' ? (
            <>
              <button className="w-20 h-16 rounded-xl bg-blue-500/40 border-2 border-blue-400 text-white font-black text-sm active:bg-blue-500/80"
                onTouchStart={() => press('KeyS')} onTouchEnd={() => release('KeyS')}>
                ◀ BRAKE
              </button>
              <button className="w-20 h-20 rounded-xl bg-green-500/40 border-2 border-green-400 text-white font-black text-sm active:bg-green-500/80"
                onTouchStart={() => press('KeyW')} onTouchEnd={() => release('KeyW')}>
                ▶ GAS
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-gray-400 text-xs">Gas</span>
              <input type="range" min={0} max={1} step={0.05} defaultValue={0}
                className="h-32 accent-green-400"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' } as React.CSSProperties}
                onTouchMove={(e: React.TouchEvent<HTMLInputElement>) => {
                  const v = (e.currentTarget as HTMLInputElement).valueAsNumber;
                  if (v > 0.1) { press('KeyW'); release('KeyS'); }
                  else { release('KeyW'); press('KeyS'); }
                }}
                onTouchEnd={() => { release('KeyW'); release('KeyS'); }}
              />
              <span className="text-gray-400 text-xs">Brake</span>
            </div>
          )}
          {/* Exit vehicle */}
          <button className="w-14 h-14 rounded-xl bg-red-500/40 border-2 border-red-400 text-white font-bold text-xs active:bg-red-500/80 mb-4"
            onTouchStart={() => press('KeyE')} onTouchEnd={() => release('KeyE')}>
            EXIT
          </button>
        </div>
      </div>
    );
  }

  // ── On-foot controls ─────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Movement joystick (left) */}
      <div className="absolute bottom-10 left-8 pointer-events-auto">
        <Joystick onDirection={handleJoystick} size={112} />
      </div>

      {/* Action buttons (right) */}
      <div className="absolute bottom-10 right-8 pointer-events-auto select-none flex gap-3 items-end">
        <button
          className="w-14 h-14 rounded-full bg-blue-500/50 border-2 border-blue-400 text-white font-bold text-xs active:bg-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.3)] mb-8"
          onTouchStart={() => press('ShiftLeft')} onTouchEnd={() => release('ShiftLeft')}
        >SPR</button>
        <button
          className="w-14 h-14 rounded-full bg-yellow-500/50 border-2 border-yellow-400 text-white font-bold text-xs active:bg-yellow-500/80 shadow-[0_0_12px_rgba(234,179,8,0.3)] mb-16"
          onTouchStart={() => press('KeyE')} onTouchEnd={() => release('KeyE')}
        >USE</button>
        <button
          className="w-18 h-18 rounded-full bg-primary/60 border-2 border-primary text-black font-bold text-sm active:bg-primary/90 shadow-[0_0_16px_rgba(255,215,0,0.4)]"
          style={{ width: 72, height: 72 }}
          onTouchStart={() => press('Space')} onTouchEnd={() => release('Space')}
        >JMP</button>
      </div>
    </div>
  );
}
