/**
 * Mounts inside the R3F <Canvas>. Owns nothing but timing:
 *  - keeps the shared AudioListener glued to the active camera every frame.
 *  - drives the two persistent loop voices (vehicle engine, police siren)
 *    from existing store state — no new store fields required for playback,
 *    only `gangSuppressionUntil` was added (consumed by Police.tsx) so gang
 *    cover-fire has a real gameplay effect.
 *
 * Does not touch City/buildingPool/NPCs/proximityStream — purely additive.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../useGameStore';
import { audioManager } from './AudioManager';

export function AudioManagerBridge() {
  const { camera } = useThree();
  const prevPos      = useRef<[number, number, number] | null>(null);
  const engineOn     = useRef(false);
  const sirenOn      = useRef(false);
  const clockT       = useRef(0);

  // Guarantee loops never outlive this bridge (unmount, HMR, or leaving the
  // playing screen entirely) — useFrame alone only stops them on the next
  // tick, and won't run at all once the component is gone.
  useEffect(() => {
    return () => {
      if (engineOn.current) { audioManager.stopLoop('player_engine'); engineOn.current = false; }
      if (sirenOn.current)  { audioManager.stopLoop('police_siren');  sirenOn.current = false; }
    };
  }, []);

  useFrame((_, delta) => {
    const screenNow = useGameStore.getState().screen;
    if (screenNow !== 'playing') {
      if (engineOn.current) { audioManager.stopLoop('player_engine'); engineOn.current = false; prevPos.current = null; }
      if (sirenOn.current)  { audioManager.stopLoop('police_siren');  sirenOn.current = false; }
      return;
    }
    audioManager.updateListener(camera);
    clockT.current += delta;

    const s = useGameStore.getState();

    // ── Vehicle engine loop — pitch/volume follow actual travel speed ──────
    if (s.inVehicle && !s.isPaused) {
      if (!engineOn.current) {
        audioManager.startLoop('player_engine', 'sawtooth', 90);
        engineOn.current = true;
      }
      const pos = s.playerPosition;
      let speed = 0;
      if (prevPos.current) {
        const dx = pos[0] - prevPos.current[0];
        const dz = pos[2] - prevPos.current[2];
        speed = Math.hypot(dx, dz) / Math.max(delta, 1 / 60);
      }
      prevPos.current = [pos[0], pos[1], pos[2]];
      const norm = THREE.MathUtils.clamp(speed / 30, 0, 1);
      audioManager.updateLoop('player_engine', pos, 0.16 + norm * 0.26, 85 + norm * 220);
    } else if (engineOn.current) {
      audioManager.stopLoop('player_engine');
      engineOn.current = false;
      prevPos.current = null;
    }

    // ── Police siren loop — active for the whole duration of any pursuit ──
    const pursuing = s.wantedLevel > 0 && s.pursuitActive && !s.isPaused;
    if (pursuing) {
      if (!sirenOn.current) {
        audioManager.startLoop('police_siren', 'sine', 500);
        sirenOn.current = true;
      }
      const wobble = Math.sin(clockT.current * 6) * 240;
      const [px, , pz] = s.playerPosition;
      // Siren "orbits" near the player — a stand-in for real pursuit-car
      // positions (not exposed outside Police.tsx) while still giving real
      // spatial rolloff/panning relative to the camera.
      const ox = px + Math.sin(clockT.current * 0.5) * 14;
      const oz = pz + Math.cos(clockT.current * 0.5) * 14;
      audioManager.updateLoop('police_siren', [ox, 1, oz], 0.2 + (s.wantedLevel / 5) * 0.15, 500 + wobble);
    } else if (sirenOn.current) {
      audioManager.stopLoop('police_siren');
      sirenOn.current = false;
    }
  });

  return null;
}
