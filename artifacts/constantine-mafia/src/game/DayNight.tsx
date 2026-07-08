import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

/** One full day–night cycle in real seconds (8 minutes) */
const CYCLE_DURATION = 480;

/** Start a bit past dawn (t ≈ 0.3 = mid-morning) */
const INITIAL_T = 0.30;

/**
 * Drives all dynamic outdoor lighting and sky colour from a single useFrame.
 *
 * t = 0   → midnight (dark blue)
 * t = 0.25 → dawn (warm orange)
 * t = 0.5  → noon  (bright blue sky)
 * t = 0.75 → dusk  (red-orange)
 * t = 1   → midnight again
 */
export function DayNight() {
  const dirRef  = useRef<THREE.DirectionalLight>(null);
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const tRef     = useRef(INITIAL_T);
  const syncTick = useRef(0);

  const skyColor = useMemo(() => new THREE.Color(), []);
  const sunColor = useMemo(() => new THREE.Color(), []);
  const ambColor = useMemo(() => new THREE.Color(), []);

  const { scene } = useThree();

  useFrame((state, delta) => {
    tRef.current = (tRef.current + delta / CYCLE_DURATION) % 1;
    const t = tRef.current;

    /* ── Sun orbit ──────────────────────────────────────────────────────────
     * phase 0   → t=0 (midnight): sun directly below   (sunY = −120)
     * phase π   → t=0.5 (noon):  sun directly above    (sunY = +120)
     */
    const phase  = t * Math.PI * 2;              // 0 → 2π over one cycle
    const sunY   = Math.sin(phase - Math.PI / 2) * 120;  // -120..+120
    const sunX   = Math.cos(phase - Math.PI / 2) * 80;

    /* dayFactor: 0 at midnight, 1 at noon — only positive while sun is up */
    const dayFactor    = Math.max(0, Math.min(1, (sunY + 15) / 135));
    /* goldenFactor: peaks near dawn (t≈0.22) and dusk (t≈0.78), 0 at noon/midnight */
    const goldenFactor = dayFactor * (1 - dayFactor) * 4;

    /* ── Directional light (sun) ───────────────────────────────────────────*/
    if (dirRef.current) {
      dirRef.current.position.set(sunX + 30, sunY, 50);
      dirRef.current.intensity = dayFactor * 1.5;
      sunColor.setRGB(
        Math.min(1, 0.90 + goldenFactor * 0.10),
        Math.min(1, 0.85 + dayFactor * 0.15 - goldenFactor * 0.10),
        Math.min(1, 0.80 + dayFactor * 0.20 - goldenFactor * 0.28),
      );
      dirRef.current.color.copy(sunColor);
    }

    /* ── Ambient light ─────────────────────────────────────────────────────*/
    if (ambRef.current) {
      ambRef.current.intensity = 0.07 + dayFactor * 0.60 + goldenFactor * 0.12;
      ambColor.setRGB(
        Math.min(1, 0.12 + dayFactor * 0.57 + goldenFactor * 0.18),
        Math.min(1, 0.14 + dayFactor * 0.60 - goldenFactor * 0.04),
        Math.min(1, 0.20 + dayFactor * 0.55 - goldenFactor * 0.08),
      );
      ambRef.current.color.copy(ambColor);
    }

    /* ── Hemisphere light ──────────────────────────────────────────────────*/
    if (hemiRef.current) {
      hemiRef.current.intensity = 0.08 + dayFactor * 0.35 + goldenFactor * 0.08;
    }

    /* ── Sky / scene background ────────────────────────────────────────────
     * Night → deep #050810, Dawn/Dusk → warm orange, Noon → clear #3f6ea5
     */
    skyColor.setRGB(
      Math.max(0.02, Math.min(1, 0.02 + dayFactor * 0.27 + goldenFactor * 0.60)),
      Math.max(0.03, Math.min(1, 0.03 + dayFactor * 0.43 - goldenFactor * 0.06)),
      Math.max(0.06, Math.min(1, 0.06 + dayFactor * 0.60 - goldenFactor * 0.18)),
    );
    state.scene.background = skyColor;

    /* ── Fog ───────────────────────────────────────────────────────────────*/
    if (state.scene.fog instanceof THREE.Fog) {
      state.scene.fog.color.copy(skyColor);
      state.scene.fog.near  = 55 - dayFactor * 15;
      state.scene.fog.far   = 340 - dayFactor * 40;
    }

    /* ── Store sync (~1 Hz) ────────────────────────────────────────────────*/
    syncTick.current += delta;
    if (syncTick.current >= 1) {
      syncTick.current = 0;
      useGameStore.getState().setDayTime(t);
    }
  });

  return (
    <>
      {/* Lights are controlled imperatively via refs every frame */}
      <ambientLight ref={ambRef}    color="#b0c0e0" intensity={0.65} />
      <directionalLight
        ref={dirRef}
        castShadow
        position={[50, 100, 50]}
        intensity={1.3}
        color="#d0e0ff"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-camera-far={400}
      />
      <hemisphereLight ref={hemiRef} args={['#1a2040', '#ff8c20', 0.4]} />
    </>
  );
}
