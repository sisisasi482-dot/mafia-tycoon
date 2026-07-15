import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { KeyboardControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { Player, ControlsMap } from './Player';

const City = React.lazy(() => import('./City'));
const Terrain = React.lazy(() => import('./Terrain'));
const CityA = React.lazy(() => import('./CityA'));
const CityB = React.lazy(() => import('./CityB'));
const Highway = React.lazy(() => import('./Highway'));
const Industrial = React.lazy(() => import('./Industrial'));
const WorldBoundary = React.lazy(() => import('./WorldBoundary'));

import { Camera } from './Camera';

const Vehicles = React.lazy(() => import('./Vehicles'));
const NPCs = React.lazy(() => import('./NPCs').then(m => ({ default: m.NPCs })));
const ShopkeeperNPCs = React.lazy(() => import('./NPCs').then(m => ({ default: m.ShopkeeperNPCs })));
const ChildNPCs = React.lazy(() => import('./NPCs').then(m => ({ default: m.ChildNPCs })));
const ParkActivityZone = React.lazy(() => import('./NPCs').then(m => ({ default: m.ParkActivityZone })));

const DoorSigns = React.lazy(() => import('./DoorSigns'));
import { DayNight } from './DayNight';
import { InteriorRoom } from './InteriorRoom';

const Traffic = React.lazy(() => import('./Traffic'));
const Police = React.lazy(() => import('./Police'));
const Houses = React.lazy(() => import('./Houses'));
const Environment = React.lazy(() => import('./Environment'));
const Bank = React.lazy(() => import('./Bank'));
const GangFollowers = React.lazy(() => import('./GangFollowers'));

import { audioManager } from './audio/AudioManager';
import { AudioManagerBridge } from './audio/AudioManagerBridge';
import { barMusicPlayer } from './audio/barMusicPlayer';
import { getActivePlatformConfig, applyPlatformConfig } from './platform/PlatformManager';
import { useGameStore, FpsCap, IS_MOBILE_DEVICE } from './useGameStore';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { TouchControls } from '../ui/TouchControls';
import { RadioWidget } from '../ui/RadioWidget';
import { DialogueUI } from '../ui/DialogueUI';
import { HomePanel } from '../ui/HomePanel';
import { TvOverlay } from '../ui/TvOverlay';
import { WardrobeOverlay } from '../ui/WardrobeOverlay';
import { ArrestOverlay } from '../ui/ArrestOverlay';
import { InventoryPanel } from '../ui/InventoryPanel';

/**
 * Sets renderer pixel ratio based on post-processing flag.
 * ON  → device pixel ratio (full resolution + AA-quality output)
 * OFF → pixel ratio 1 (lower resolution = faster GPU fill)
 */
function PixelRatioController({ enabled }: { enabled: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    const cap = Math.min(window.devicePixelRatio, 1.2) * getActivePlatformConfig().quality.resolutionScale;
    gl.setPixelRatio(enabled ? cap : Math.min(1, cap));
  }, [enabled, gl]);
  return null;
}

/**
 * Real EffectComposer pass chain (Bloom + Vignette), gated by the
 * 'Post-Processing' setting. `EffectComposer`'s own `enabled` prop toggles
 * the whole pass chain on/off immediately — no remount, no page reload —
 * so flipping the settings button takes effect the same frame.
 * Skipped entirely on mobile (see `<Postprocessing>` below) since the extra
 * render passes are one of the "unnecessary shaders" mobile should avoid.
 */
function Postprocessing({ enabled }: { enabled: boolean }) {
  if (IS_MOBILE_DEVICE) return null;
  return (
    <EffectComposer enabled={enabled} multisampling={0}>
      <Bloom intensity={0.35} luminanceThreshold={0.65} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.25} darkness={0.6} />
    </EffectComposer>
  );
}

/**
 * 'Shadows' setting binding. Toggling flips the renderer's shadow map AND
 * walks the whole scene graph (scene.traverse) flipping castShadow /
 * receiveShadow on every object — applied immediately, in place, with no
 * page reload. Each mesh's *baseline* shadow-casting intent (whether it
 * should cast/receive at all when shadows are ON) is read once via a
 * userData flag stamped by the mesh itself; if a mesh has no explicit
 * baseline it falls back to its current castShadow/receiveShadow prop.
 */
function ShadowsController({ enabled }: { enabled: boolean }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = enabled;
    if (enabled) gl.shadowMap.type = THREE.PCFSoftShadowMap;

    gl.shadowMap.width = 512;
    gl.shadowMap.height = 512;
    
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!('castShadow' in mesh)) return;
      if (mesh.userData.baseCastShadow === undefined) {
        mesh.userData.baseCastShadow = mesh.castShadow;
      }
      if (mesh.userData.baseReceiveShadow === undefined) {
        mesh.userData.baseReceiveShadow = mesh.receiveShadow;
      }
      mesh.castShadow    = enabled && mesh.userData.baseCastShadow;
      mesh.receiveShadow = enabled && mesh.userData.baseReceiveShadow;
    });

    gl.shadowMap.needsUpdate = true;
  }, [enabled, gl, scene]);
  return null;
}

/**
 * Reports real map-loading progress to the store so the Loading screen's
 * progress bar reflects actual milestones, not a fake timer:
 *   50%  → Canvas/renderer created (onCreated fired)
 *   80%  → world content mounted (City/Environment/Houses committed to the
 *          scene graph — texture generation + Stage-1 building unlock done)
 *  100%  → the first real frame has been rendered — the map is genuinely on
 *          screen, so the overlay can drop instantly with zero black-screen
 *          risk (frameloop="demand", so this only fires once invalidate()
 *          has actually produced a frame).
 */
function LoadingMilestones() {
  const reportedReady = useRef(false);
  useEffect(() => {
    // Content mount effect runs after City/Environment/Houses have committed.
    useGameStore.getState().setPlayerState({ mapLoadProgress: 80 });
  }, []);
  useFrame(() => {
    if (reportedReady.current) return;
    reportedReady.current = true;
    useGameStore.getState().setPlayerState({ mapLoadProgress: 100, mapReady: true });
  });
  return null;
}

/**
 * Sets texture anisotropy default so newly created textures respect quality.
 * LOW → aniso 1, MEDIUM → aniso 4, HIGH → max supported by GPU.
 */
function TextureQualityController({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const { gl } = useThree();
  useEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy();
    THREE.Texture.DEFAULT_ANISOTROPY =
      quality === 'high'   ? Math.min(2.5, max) :
      quality === 'medium' ? Math.min(1.5, max) : 1;
  }, [quality, gl]);
  return null;
}

/**
 * FPS cap controller.
 * Uses frameloop="demand" on the Canvas + calls invalidate() at the target rate.
 * When fpsCap === 0 (unlimited), drives a RAF loop for max frame rate.
 */
function FpsCapController({ fpsCap }: { fpsCap: FpsCap }) {
  const { invalidate } = useThree();

  useEffect(() => {
    let raf: number;

    if (fpsCap === 0) {
      // "Unlimited": نترك المتصفح يقرر أقصى سرعة ممكنة (غالباً 60 أو 120 حسب شاشة هاتفك)
      const loop = () => {
        invalidate();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      // "Capped": نستخدم طريقة دقيقة لحساب الفريمات بدون استخدام setInterval المزعجة
      let lastTime = 0;
      const interval = 1000 / fpsCap;

      const loop = (time: number) => {
        if (time - lastTime >= interval) {
          invalidate();
          lastTime = time;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(raf);
  }, [fpsCap, invalidate]);

  return null;
}


/**
 * Resume the Three.js shared AudioContext on the first user gesture.
 */
function useAudioContextResume() {
  useEffect(() => {
    const resume = () => {
      try {
        const ctx = THREE.AudioContext.getContext() as unknown as AudioContext;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      } catch { /* no audio context yet */ }
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown',     resume, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown',     resume);
    };
  }, []);
}

export function GameEngine() {
  const targetRef  = useRef<THREE.Group>(null);
  const vehicleRef = useRef<THREE.Group>(null);

  const inVehicle      = useGameStore((s) => s.inVehicle);
  const indoors        = useGameStore((s) => s.indoors);
  const interiorId     = useGameStore((s) => s.interiorId);

  // ── Bar music: shuffle real MP3 tracks from public/audio while inside the
  // bar, stop the instant the player leaves (or unmounts).
  useEffect(() => {
    if (interiorId === 'bar_old_city') {
      barMusicPlayer.start();
    } else {
      barMusicPlayer.stop();
    }
    return () => { barMusicPlayer.stop(); };
  }, [interiorId]);
  const screen         = useGameStore((s) => s.screen);
  const cameraMode     = useGameStore((s) => s.cameraMode);
  const togglePause    = useGameStore((s) => s.togglePause);
  const fpsCap         = useGameStore((s) => s.fpsCap);
  const shadowsEnabled = useGameStore((s) => s.shadowsEnabled);
  const postProcessing = useGameStore((s) => s.postProcessing);
  const textureQuality = useGameStore((s) => s.textureQuality);
  const dizzyUntil     = useGameStore((s) => s.dizzyUntil);

  // Dizzy/blur state — cleared via a timed effect so we don't poll Date.now() every render
  const [isDizzy, setIsDizzy] = React.useState(false);
  useEffect(() => {
    const now = Date.now();
    if (dizzyUntil > now) {
      setIsDizzy(true);
      const remaining = dizzyUntil - now;
      const t = setTimeout(() => setIsDizzy(false), remaining);
      return () => clearTimeout(t);
    }
    setIsDizzy(false);
    return undefined;
  }, [dizzyUntil]);

  useAudioContextResume();

  // Platform-agnostic core: the only place gameplay code touches platform
  // detection. Applies the active platform's input/quality defaults once —
  // everything else (Player, TouchControls, quality controllers below)
  // just reads ordinary store state and stays unaware a platform even exists.
  useEffect(() => {
    applyPlatformConfig();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && screen === 'playing') togglePause();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, togglePause]);

  if (screen !== 'playing') return null;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#050810] overflow-hidden">
      {/* ── Cigarette / drug dizzy blur overlay ── */}
      {isDizzy && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backdropFilter: 'blur(6px) saturate(1.6) hue-rotate(15deg)',
            WebkitBackdropFilter: 'blur(6px) saturate(1.6) hue-rotate(15deg)',
            background: 'rgba(80, 0, 120, 0.08)',
            transition: 'opacity 0.5s ease',
          }}
        />
      )}
      <KeyboardControls map={ControlsMap}>
        {/*
          frameloop="demand": only renders when invalidate() is called.
          FpsCapController inside the Canvas drives the invalidate() calls
          at the selected frame rate cap (or unlimited via RAF).
        */}
        <Canvas
          shadows={shadowsEnabled}
          frameloop="demand"
          camera={{ position: [0, 10, 10], fov: cameraMode === 'first' ? 80 : 60 }}
          gl={{ antialias: false }}
          onCreated={() => useGameStore.getState().setPlayerState({ mapLoadProgress: 50 })}
        >
          {/* Base background & fog — DayNight overwrites these every frame */}
          <color attach="background" args={['#050810']} />
          {/* Fog far distance 2× expanded for the larger map */}
          <fog attach="fog" args={['#080818', 80, 500]} />

          {/* Starfield is a pure decorative shader cost — skip on mobile */}
          {!IS_MOBILE_DEVICE && (
            <Stars radius={200} depth={60} count={3000} factor={4} saturation={0} fade speed={1} />
          )}

          <LoadingMilestones />

          {/* Performance controllers — settings apply live, no reload */}
          <FpsCapController fpsCap={fpsCap} />
          <PixelRatioController enabled={postProcessing} />
          <ShadowsController enabled={shadowsEnabled} />
          <TextureQualityController quality={textureQuality} />

          {/* Dynamic day/night lighting */}
          <DayNight />

          {/* Camera anchor for the active vehicle */}
          <group ref={vehicleRef} />

          {/* World geometry - معدل للأداء في الموبايل */}
          {!indoors && (
            <group>
              <City />
              <Terrain />
              <Highway />
              <Industrial />

              {/* تظهر فقط في البيسي لتخفيف الضغط على الموبايل */}
              {!IS_MOBILE_DEVICE && (
                <>
                  <CityA />
                  <CityB />
                  <Traffic />
                  <Police />
                </>
              )}

              <WorldBoundary />
              <Vehicles activeVehicleRef={vehicleRef} />
              <NPCs />
              <ChildNPCs />
              <DoorSigns />
              <ShopkeeperNPCs />
              <Houses />
              <Environment />
              <Bank />
              <GangFollowers />
              <ParkActivityZone />
            </group>
          )}

          {/* Spatial 3D audio — engine/combat/npc/siren, pooled voices */}
          <AudioManagerBridge />

          {/* Interior room (when player is inside a building) */}
          {indoors && <InteriorRoom />}

          {/* Player (camera follows this ref) */}
          <Player ref={targetRef} />

          <Camera
            targetRef={inVehicle ? vehicleRef : targetRef}
            inVehicle={inVehicle}
            cameraMode={cameraMode}
          />

          {/* Post-processing pass chain — enabled prop toggles live, no remount */}
          <Postprocessing enabled={postProcessing} />
        </Canvas>
      </KeyboardControls>

      <HUD />
      <TouchControls />
      <RadioWidget />
      <PauseMenu />
      <DialogueUI />
      <HomePanel />
      <TvOverlay />
      <WardrobeOverlay />
      <ArrestOverlay />
      <InventoryPanel />
    </div>
  );
}
