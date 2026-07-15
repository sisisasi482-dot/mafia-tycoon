import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../useGameStore';
import { audioManager } from './AudioManager';

export function AudioManagerBridge() {
  const { camera } = useThree();
  const prevPos = useRef<[number, number, number] | null>(null);
  const engineOn = useRef(false);
  const sirenOn = useRef(false);
  const clockT = useRef(0);

  // Store previous state to minimize unnecessary updates
  const lastEngineState = useRef({ volume: -1, pitch: -1 });

  useEffect(() => {
    return () => {
      audioManager.stopLoop('player_engine');
      audioManager.stopLoop('police_siren');
    };
  }, []);

  useFrame((_, delta) => {
    const s = useGameStore.getState();
    if (s.screen !== 'playing') return;

    audioManager.updateListener(camera);
    clockT.current += delta;

    // ── Vehicle engine loop ──────
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
      prevPos.current = pos;
      
      const norm = THREE.MathUtils.clamp(speed / 30, 0, 1);
      const volume = 0.16 + norm * 0.26;
      const pitch = 85 + norm * 220;

      // Update only if values significantly changed for optimization
      if (Math.abs(lastEngineState.current.volume - volume) > 0.01) {
        audioManager.updateLoop('player_engine', pos, volume, pitch);
        lastEngineState.current = { volume, pitch };
      }
    } else if (engineOn.current) {
      audioManager.stopLoop('player_engine');
      engineOn.current = false;
      prevPos.current = null;
    }

    // ── Police siren loop ──
    const pursuing = s.wantedLevel > 0 && s.pursuitActive && !s.isPaused;
    if (pursuing) {
      if (!sirenOn.current) {
        audioManager.startLoop('police_siren', 'sine', 500);
        sirenOn.current = true;
      }
      const wobble = Math.sin(clockT.current * 6) * 240;
      const [px, , pz] = s.playerPosition;
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
