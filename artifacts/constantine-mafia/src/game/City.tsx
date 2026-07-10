/**
 * City — renders the open-world city scene.
 *
 * ── All hardcoded map geometry cleared (roads, sidewalks, landmarks, signs,
 *    district markers, airport, bridge, park, store kiosks, street lights).
 *    Ready for new map generation. ──
 *
 * The building pool streaming infrastructure is preserved:
 * buildings from the shared BUILDINGS array stream in by proximity at
 * BUILDING_TOGGLE_BATCH_SIZE per frame once the player approaches.
 */
import React, { useEffect, useMemo, useRef, useReducer } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDINGS } from './buildings';
import { generateBuildingTextures, disposeBuildingTextures } from './buildingTextures';
import { useGameStore } from './useGameStore';
import {
  activeMask,
  unlockedMask,
  resetActiveBuildings,
  seedInitialUnlock,
  scanBuildingProximity,
  countVisibleBuildingMeshes,
  checkMemorySafety,
  BUILDING_UPDATE_INTERVAL_FRAMES,
  BUILDING_TOGGLE_BATCH_SIZE,
} from './buildingPool';
import { SPAWN_XZ } from './worldConstants';

export function City() {
  const texPool = useMemo(() => generateBuildingTextures(), []);
  useEffect(() => () => disposeBuildingTextures(texPool), [texPool]);

  /* ── Building staged-loading pool ──────────────────────────────────────── */
  const buildingRefs = useRef<(THREE.Mesh | null)[]>([]);
  const frameCount = useRef(0);
  const pendingStreamIn = useRef<number[]>([]);
  const pendingToggles = useRef<number[]>([]);
  const [, bumpUnlockVersion] = useReducer((x: number) => x + 1, 0);
  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    resetActiveBuildings();
    seedInitialUnlock(...SPAWN_XZ);
    frameCount.current = 0;
    pendingStreamIn.current = [];
    pendingToggles.current = [];
    setInitialized(true);
  }, []);

  useFrame(() => {
    frameCount.current += 1;
    if (frameCount.current >= BUILDING_UPDATE_INTERVAL_FRAMES) {
      frameCount.current = 0;

      const [px, , pz] = useGameStore.getState().playerPosition;
      const { streamIn, toggle } = scanBuildingProximity(px, pz);
      pendingStreamIn.current.push(...streamIn);
      pendingToggles.current.push(...toggle);

      checkMemorySafety(
        countVisibleBuildingMeshes(buildingRefs.current),
        Date.now(),
        () => countVisibleBuildingMeshes(buildingRefs.current),
      );
    }

    if (pendingToggles.current.length > 0) {
      const batch = pendingToggles.current.splice(0, BUILDING_TOGGLE_BATCH_SIZE);
      for (const i of batch) {
        const mesh = buildingRefs.current[i];
        if (mesh) mesh.visible = activeMask[i] === 1;
      }
    }

    if (pendingStreamIn.current.length > 0) {
      const batch = pendingStreamIn.current.splice(0, BUILDING_TOGGLE_BATCH_SIZE);
      for (const i of batch) unlockedMask[i] = 1;
      bumpUnlockVersion();
    }
  });

  return (
    <group>
      {/* ── Ground plane ─────────────────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#1e1e22" roughness={0.95} />
      </mesh>

      {/* ── Buildings (staged loading) ────────────────────────────────────── */}
      {BUILDINGS.map((b, i) => {
        if (!initialized || unlockedMask[i] === 0) return null;
        const tex = b.texKey ? texPool[b.texKey]?.[b.texIdx] : undefined;
        return (
          <mesh
            key={`b-${i}`}
            ref={(el) => { buildingRefs.current[i] = el; if (el) el.visible = activeMask[i] === 1; }}
            visible={activeMask[i] === 1}
            castShadow
            receiveShadow
            position={[b.x, b.h / 2, b.z]}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={tex ?? null}
              color={b.color}
              emissive={b.emissive}
              emissiveIntensity={b.emissiveIntensity}
              roughness={0.82}
              metalness={0.0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
