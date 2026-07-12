import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { VEHICLE_RENDER_MAP } from './items';
import { FittedGLB, glbUrl } from './glbModels';

/** Vehicle type → glb5 model file (Task 2: New Models). */
const VEHICLE_MODEL_FILE: Record<VehicleDef['type'], string> = {
  sedan:  'sedan',
  taxi:   'taxi',
  police: 'police',
  truck:  'truck',
  suv:    'suv',
};
// Kenney's car-kit models face +Z nose-forward; this game's driving physics
// treats -Z as "forward" (see `fwd` vector below), so every model needs a
// 180° yaw to line its nose up with the direction the car actually drives.
const VEHICLE_MODEL_ROTATION_Y = Math.PI;
Object.values(VEHICLE_MODEL_FILE).forEach((f) => useGLTF.preload(glbUrl('glb5', f)));

/* ─── Vehicle definitions (spawn positions 2× scaled) ────────────────────── */
interface VehicleDef {
  id: string;
  label: string;
  position: [number, number, number];
  rotY: number;
  bodyColor: string;
  roofColor: string;
  type: 'sedan' | 'taxi' | 'police' | 'truck' | 'suv';
}

// ── Vehicle spawn data cleared — ready for new map generation ──
const SPAWN_VEHICLES: VehicleDef[] = [];

/* ─── Single vehicle mesh + logic ─────────────────────────────────────────── */
function SingleVehicle({
  def,
  activeVehicleRef,
  instanceId,
}: {
  def: VehicleDef;
  activeVehicleRef: React.RefObject<THREE.Group | null>;
  /** Set when this is a player-owned spawned instance (car key) rather than a fixed world vehicle. */
  instanceId?: string;
}) {
  const groupRef       = useRef<THREE.Group>(null);
  const [, getKeys]    = useKeyboardControls();
  const speedRef       = useRef(0);
  const steerAccum     = useRef(0);
  const interactLatch  = useRef(false);
  const syncTimer      = useRef(0);

  const px              = useGameStore((s) => s.playerPosition[0]);
  const pz              = useGameStore((s) => s.playerPosition[2]);
  const inVehicle       = useGameStore((s) => s.inVehicle);
  const equippedVehicleId = useGameStore((s) => s.equippedVehicleId);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...def.position);
    groupRef.current.rotation.y = def.rotY;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const state = useGameStore.getState();
    if (state.isPaused) return;

    const vp = groupRef.current.position;
    const pp = state.playerPosition;
    const dist2 = (vp.x - pp[0]) ** 2 + (vp.z - pp[2]) ** 2;
    const vehId    = instanceId ?? def.id;
    const isNear   = dist2 < 30;
    const isActive = state.inVehicle && state.equippedVehicleId === vehId;
    const locked   = !!instanceId && state.lockedVehicleIds.includes(instanceId);
    const keys     = getKeys();

    /* ── Enter / Exit ── */
    if (keys.interact) {
      if (!interactLatch.current) {
        interactLatch.current = true;
        if (isNear && !state.inVehicle && locked) {
          state.setInteractionHint(`🔒 ${def.label} is locked — use your car key to unlock`);
          setTimeout(() => {
            if (useGameStore.getState().interactionHint?.includes('is locked')) {
              useGameStore.getState().setInteractionHint(null);
            }
          }, 2000);
        } else if (isNear && !state.inVehicle) {
          const ry = groupRef.current.rotation.y;
          // World spawn vehicles are "stolen" unless already in ownedAssetIds.
          // Owned spawned instances (car key) are never flagged as stolen.
          if (!instanceId && !state.ownedAssetIds.includes(def.id)) {
            state.markVehicleStolen(def.id);
          }
          state.setPlayerState({
            inVehicle: true,
            equippedVehicleId: vehId,
            playerPosition: [vp.x, 1, vp.z],
            playerRotationY: ry,
          });
          if (activeVehicleRef.current) {
            activeVehicleRef.current.position.copy(vp);
            activeVehicleRef.current.rotation.y = ry;
          }
        } else if (isActive) {
          const ry    = groupRef.current.rotation.y;
          const exitX = vp.x + Math.cos(ry) * 3.5;
          const exitZ = vp.z - Math.sin(ry) * 3.5;
          // Capture last driven vehicle before clearing equippedVehicleId so
          // garages can offer to park it even after the player dismounts.
          state.setPlayerState({
            inVehicle: false,
            lastDrivenVehicleId: state.equippedVehicleId,
            equippedVehicleId: null,
            playerPosition: [exitX, 1, exitZ],
            playerRotationY: ry,
          });
          speedRef.current   = 0;
          steerAccum.current = 0;
        }
      }
    } else {
      interactLatch.current = false;
    }

    if (!isActive) return;

    /* ── Driving physics ── */
    const isTruck   = def.type === 'truck';
    const maxFwd    = isTruck ? 20 : def.type === 'suv' ? 26 : 38;
    const maxRev    = maxFwd * 0.35;
    const accel     = isTruck ? 10 : 18;

    if (keys.forward) {
      speedRef.current = Math.min(speedRef.current + accel * delta, maxFwd);
    } else if (keys.back) {
      speedRef.current = Math.max(speedRef.current - accel * 0.7 * delta, -maxRev);
    } else {
      speedRef.current *= Math.pow(0.92, delta * 60);
    }

    if (keys.jump) speedRef.current *= Math.pow(0.75, delta * 60);

    const steerInput  = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    // Tighter turn radius: higher input multiplier + clamp + faster yaw rate.
    // At low speed steerFactor ramps from 0→1 so you can't spin on the spot.
    const steerFactor = Math.min(Math.abs(speedRef.current) / (maxFwd * 0.6), 1);
    steerAccum.current += steerInput * 3.2 * steerFactor * delta;
    steerAccum.current *= Math.pow(0.72, delta * 60); // snappier self-centering
    steerAccum.current  = THREE.MathUtils.clamp(steerAccum.current, -0.90, 0.90);

    if (Math.abs(speedRef.current) > 0.05) {
      groupRef.current.rotation.y +=
        steerAccum.current * Math.sign(speedRef.current) * delta * 4.0;
    }

    const fwd = new THREE.Vector3(
      -Math.sin(groupRef.current.rotation.y),
      0,
      -Math.cos(groupRef.current.rotation.y),
    );
    groupRef.current.position.addScaledVector(fwd, speedRef.current * delta);

    // World bounds (2× map)
    groupRef.current.position.x = THREE.MathUtils.clamp(groupRef.current.position.x, -610, 490);
    groupRef.current.position.z = THREE.MathUtils.clamp(groupRef.current.position.z, -200, 450);

    if (activeVehicleRef.current) {
      activeVehicleRef.current.position.copy(groupRef.current.position);
      activeVehicleRef.current.rotation.y = groupRef.current.rotation.y;
    }

    syncTimer.current += delta;
    if (syncTimer.current > 0.1) {
      syncTimer.current = 0;
      state.setPlayerPosition(
        [groupRef.current.position.x, 1, groupRef.current.position.z],
        groupRef.current.rotation.y,
      );
    }
  });

  const vx = groupRef.current?.position.x ?? def.position[0];
  const vz = groupRef.current?.position.z ?? def.position[2];
  const d2 = (vx - px) ** 2 + (vz - pz) ** 2;
  const vehId2    = instanceId ?? def.id;
  const showEnter = d2 < 30 && !inVehicle;
  const showExit  = inVehicle && equippedVehicleId === vehId2;
  const lockedNow = !!instanceId && useGameStore.getState().lockedVehicleIds.includes(instanceId);

  const isTruck = def.type === 'truck';
  const isSUV   = def.type === 'suv';
  const bodyW   = isTruck ? 2.6 : isSUV ? 2.2 : 2.0;
  const bodyL   = isTruck ? 6.0 : isSUV ? 4.8 : 4.5;
  const cabW    = bodyW - 0.35;
  const cabL    = isTruck ? 2.2 : isSUV ? 2.2 : 2.1;
  const cabH    = isTruck ? 0.85 : 0.72;
  const cabZ    = isTruck ? bodyL / 2 - 1.5 : 0;

  const bodyTopY  = 0.65;

  return (
    <group ref={groupRef}>
      {/* Real GLB vehicle model (Task 2: New Models) — replaces the old
          hand-built box body/cab/wheels, fit to the same footprint. */}
      <FittedGLB
        set="glb5"
        model={VEHICLE_MODEL_FILE[def.type]}
        targetSize={[bodyW + 0.3, bodyTopY + cabH + 0.16, bodyL]}
        rotationY={VEHICLE_MODEL_ROTATION_Y}
      />
      {/* Small light accents kept on top of the model — cheap, and the kit
          models don't reliably expose emissive head/tail lamps. */}
      {([-0.58, 0.58] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.44, -bodyL / 2 - 0.05]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshStandardMaterial color="#ffffee" emissive="#ffff99" emissiveIntensity={4} />
        </mesh>
      ))}
      {([-0.58, 0.58] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.44, bodyL / 2 + 0.05]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshStandardMaterial color="#dd1111" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      ))}
      {def.type === 'police' && (
        <mesh position={[0, bodyTopY + cabH + 0.15, 0]}>
          <boxGeometry args={[1.1, 0.2, 0.28]} />
          <meshStandardMaterial color="#111133" emissive="#5555ff" emissiveIntensity={1.2} />
        </mesh>
      )}
      {def.type === 'taxi' && (
        <mesh position={[0, bodyTopY + cabH + 0.17, 0]}>
          <boxGeometry args={[0.75, 0.22, 0.28]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={1.5} />
        </mesh>
      )}
      {(showEnter || showExit) && (
        <Html position={[0, 2.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '6px',
            padding: '5px 12px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            letterSpacing: '0.05em',
          }}>
            {showEnter ? (lockedNow ? `🔒 ${def.label} — Locked` : `[E] Enter ${def.label}`) : '[E] Exit Vehicle'}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─── Owned vehicle instance (spawned via car key) ────────────────────────── */
function OwnedVehicle({
  instanceId,
  vehicleId,
  position,
  rotY,
  activeVehicleRef,
}: {
  instanceId: string;
  vehicleId: string;
  position: [number, number, number];
  rotY: number;
  activeVehicleRef: React.RefObject<THREE.Group | null>;
}) {
  const render = VEHICLE_RENDER_MAP[vehicleId] ?? { type: 'sedan' as const, bodyColor: '#aaaaaa', roofColor: '#333333' };
  const def: VehicleDef = {
    id: instanceId,
    label: `Your ${vehicleId}`,
    position,
    rotY,
    bodyColor: render.bodyColor,
    roofColor: render.roofColor,
    type: render.type,
  };
  return <SingleVehicle def={def} activeVehicleRef={activeVehicleRef} instanceId={instanceId} />;
}

/**
 * Watches unlocked, unattended owned vehicle instances and periodically has a
 * chance for a nearby NPC to steal one — mirroring the request that "unlocked,
 * unattended cars can be stolen by NPCs". Simplified as a probabilistic
 * despawn-after-dwell rather than full pathing AI (no dedicated thief mesh),
 * but the game-state effect (car disappears, player notified) is real.
 */
function VehicleTheftWatcher() {
  const dwell = useRef<Record<string, number>>({});
  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || state.indoors) return;
    const [px, , pz] = state.playerPosition;
    for (const inst of state.ownedVehicleInstances) {
      const locked   = state.lockedVehicleIds.includes(inst.id);
      const attended = state.inVehicle && state.equippedVehicleId === inst.id;
      const playerNear = Math.hypot(px - inst.position[0], pz - inst.position[2]) < 12;
      if (locked || attended || playerNear) {
        dwell.current[inst.id] = 0;
        continue;
      }
      dwell.current[inst.id] = (dwell.current[inst.id] ?? 0) + delta;
      // After ~20 s unlocked & unattended (and player not standing guard nearby),
      // there's a chance per second an NPC jacks it.
      if (dwell.current[inst.id] > 20 && Math.random() < delta * 0.15) {
        useGameStore.getState().reportVehicleStolen(inst.id);
        delete dwell.current[inst.id];
      }
    }
  });
  return null;
}

/* ─── Public export ───────────────────────────────────────────────────────── */
export function Vehicles({ activeVehicleRef }: { activeVehicleRef: React.RefObject<THREE.Group | null> }) {
  const ownedInstances = useGameStore((s) => s.ownedVehicleInstances);
  return (
    <>
      {SPAWN_VEHICLES.map((def) => (
        <SingleVehicle key={def.id} def={def} activeVehicleRef={activeVehicleRef} />
      ))}
      {ownedInstances.map((inst) => (
        <OwnedVehicle
          key={inst.id}
          instanceId={inst.id}
          vehicleId={inst.vehicleId}
          position={inst.position}
          rotY={inst.rotY}
          activeVehicleRef={activeVehicleRef}
        />
      ))}
      <VehicleTheftWatcher />
    </>
  );
}
