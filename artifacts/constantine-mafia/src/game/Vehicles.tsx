import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

/* ─── Vehicle definitions ─────────────────────────────────────────────────── */
interface VehicleDef {
  id: string;
  label: string;
  position: [number, number, number];
  rotY: number;
  bodyColor: string;
  roofColor: string;
  type: 'sedan' | 'taxi' | 'police' | 'truck' | 'suv';
}

const SPAWN_VEHICLES: VehicleDef[] = [
  { id: 'v1', label: 'Taxi',       position: [-115, 1,  12], rotY:  0.0,  bodyColor: '#e8c830', roofColor: '#111111', type: 'taxi'   },
  { id: 'v2', label: 'Police Car', position: [  28, 1,  48], rotY:  0.5,  bodyColor: '#1a3aee', roofColor: '#f0f0f0', type: 'police' },
  { id: 'v3', label: 'Sports Car', position: [ -78, 1, -30], rotY: -0.3,  bodyColor: '#cc1111', roofColor: '#880000', type: 'sedan'  },
  { id: 'v4', label: 'SUV',        position: [ 118, 1,  78], rotY:  1.2,  bodyColor: '#2a4a2a', roofColor: '#1a3018', type: 'suv'    },
  { id: 'v5', label: 'Truck',      position: [ 168, 1, -78], rotY: -1.0,  bodyColor: '#777777', roofColor: '#444444', type: 'truck'  },
];

/* ─── Single vehicle mesh + logic ─────────────────────────────────────────── */
function SingleVehicle({
  def,
  activeVehicleRef,
}: {
  def: VehicleDef;
  activeVehicleRef: React.RefObject<THREE.Group | null>;
}) {
  const groupRef       = useRef<THREE.Group>(null);
  const [, getKeys]    = useKeyboardControls();
  const speedRef       = useRef(0);
  const steerAccum     = useRef(0);
  const interactLatch  = useRef(false);
  const syncTimer      = useRef(0);

  // Primitive selectors — Object.is works correctly on numbers/booleans/strings
  // (avoids the infinite-loop caused by returning a new {} on every call)
  const px              = useGameStore((s) => s.playerPosition[0]);
  const pz              = useGameStore((s) => s.playerPosition[2]);
  const inVehicle       = useGameStore((s) => s.inVehicle);
  const equippedVehicleId = useGameStore((s) => s.equippedVehicleId);

  // Place vehicle at spawn
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
    const isNear   = dist2 < 30;                                    // √30 ≈ 5.5 units
    const isActive = state.inVehicle && state.equippedVehicleId === def.id;
    const keys     = getKeys();

    /* ── Enter / Exit (edge-triggered) ── */
    if (keys.interact) {
      if (!interactLatch.current) {
        interactLatch.current = true;

        if (isNear && !state.inVehicle) {
          // Enter — single atomic update so Player's useEffect sees consistent state
          const ry = groupRef.current.rotation.y;
          state.setPlayerState({
            inVehicle: true,
            equippedVehicleId: def.id,
            playerPosition: [vp.x, 1, vp.z],
            playerRotationY: ry,
          });
          if (activeVehicleRef.current) {
            activeVehicleRef.current.position.copy(vp);
            activeVehicleRef.current.rotation.y = ry;
          }
        } else if (isActive) {
          // Exit — single atomic update so Player's snap useEffect reads the correct exit position
          const ry    = groupRef.current.rotation.y;
          const exitX = vp.x + Math.cos(ry) * 3.5;
          const exitZ = vp.z - Math.sin(ry) * 3.5;
          state.setPlayerState({
            inVehicle: false,
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
      // Coast friction (frame-rate independent)
      speedRef.current *= Math.pow(0.92, delta * 60);
    }

    // Handbrake / jump key
    if (keys.jump) speedRef.current *= Math.pow(0.75, delta * 60);

    // Steering — accumulates with speed-scaled input, self-centres
    const steerInput  = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    const steerFactor = Math.min(Math.abs(speedRef.current) / maxFwd, 1);
    steerAccum.current += steerInput * 1.8 * steerFactor * delta;
    steerAccum.current *= Math.pow(0.88, delta * 60); // self-centre
    steerAccum.current  = THREE.MathUtils.clamp(steerAccum.current, -0.65, 0.65);

    if (Math.abs(speedRef.current) > 0.05) {
      groupRef.current.rotation.y +=
        steerAccum.current * Math.sign(speedRef.current) * delta * 2.2;
    }

    // Move forward — Three.js default "front" is -Z, so negate both components
    const fwd = new THREE.Vector3(
      -Math.sin(groupRef.current.rotation.y),
      0,
      -Math.cos(groupRef.current.rotation.y),
    );
    groupRef.current.position.addScaledVector(fwd, speedRef.current * delta);

    // World bounds
    groupRef.current.position.x = THREE.MathUtils.clamp(groupRef.current.position.x, -295, 245);
    groupRef.current.position.z = THREE.MathUtils.clamp(groupRef.current.position.z, -145, 245);

    // Update camera anchor every frame
    if (activeVehicleRef.current) {
      activeVehicleRef.current.position.copy(groupRef.current.position);
      activeVehicleRef.current.rotation.y = groupRef.current.rotation.y;
    }

    // Throttled store sync (~10 Hz) — drives MiniMap / socket
    syncTimer.current += delta;
    if (syncTimer.current > 0.1) {
      syncTimer.current = 0;
      state.setPlayerPosition(
        [groupRef.current.position.x, 1, groupRef.current.position.z],
        groupRef.current.rotation.y,
      );
    }
  });

  /* ── Proximity label (uses primitive px/pz selectors — no object creation) ── */
  const vx = groupRef.current?.position.x ?? def.position[0];
  const vz = groupRef.current?.position.z ?? def.position[2];
  const d2 = (vx - px) ** 2 + (vz - pz) ** 2;
  const showEnter = d2 < 30 && !inVehicle;
  const showExit  = inVehicle && equippedVehicleId === def.id;

  /* ── Mesh dimensions by type ── */
  const isTruck = def.type === 'truck';
  const isSUV   = def.type === 'suv';
  const bodyW   = isTruck ? 2.6 : isSUV ? 2.2 : 2.0;
  const bodyL   = isTruck ? 6.0 : isSUV ? 4.8 : 4.5;
  const cabW    = bodyW - 0.35;
  const cabL    = isTruck ? 2.2 : isSUV ? 2.2 : 2.1;
  const cabH    = isTruck ? 0.85 : 0.72;
  const cabZ    = isTruck ? bodyL / 2 - 1.5 : 0;   // truck cab is at front

  const bodyTopY  = 0.65;
  const cabBottomY = bodyTopY;

  return (
    <group ref={groupRef}>
      {/* ── Body ── */}
      <mesh castShadow receiveShadow position={[0, bodyTopY / 2 + 0.08, 0]}>
        <boxGeometry args={[bodyW, bodyTopY, bodyL]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.35} metalness={0.4} />
      </mesh>

      {/* ── Cabin / roof ── */}
      <mesh castShadow position={[0, cabBottomY + cabH / 2 + 0.08, cabZ]}>
        <boxGeometry args={[cabW, cabH, cabL]} />
        <meshStandardMaterial color={def.roofColor} roughness={0.55} metalness={0.1} />
      </mesh>

      {/* ── Wheels ── */}
      {([
        [-bodyW / 2 - 0.06, 0.38, -bodyL / 2 + 1.05],
        [ bodyW / 2 + 0.06, 0.38, -bodyL / 2 + 1.05],
        [-bodyW / 2 - 0.06, 0.38,  bodyL / 2 - 1.05],
        [ bodyW / 2 + 0.06, 0.38,  bodyL / 2 - 1.05],
      ] as [number, number, number][]).map((wp, i) => (
        <mesh key={i} castShadow position={wp} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.26, 10]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Headlights ── */}
      {([-0.58, 0.58] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.44, -bodyL / 2 - 0.05]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshStandardMaterial color="#ffffee" emissive="#ffff99" emissiveIntensity={4} />
        </mesh>
      ))}

      {/* ── Taillights ── */}
      {([-0.58, 0.58] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.44, bodyL / 2 + 0.05]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshStandardMaterial color="#dd1111" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      ))}

      {/* ── Police lightbar ── */}
      {def.type === 'police' && (
        <mesh position={[0, cabBottomY + cabH + 0.15, 0]}>
          <boxGeometry args={[1.1, 0.2, 0.28]} />
          <meshStandardMaterial color="#111133" emissive="#5555ff" emissiveIntensity={1.2} />
        </mesh>
      )}

      {/* ── Taxi sign ── */}
      {def.type === 'taxi' && (
        <mesh position={[0, cabBottomY + cabH + 0.17, 0]}>
          <boxGeometry args={[0.75, 0.22, 0.28]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={1.5} />
        </mesh>
      )}

      {/* ── Interact prompt ── */}
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
            {showEnter ? `[E] Enter ${def.label}` : '[E] Exit Vehicle'}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─── Public export ───────────────────────────────────────────────────────── */
export function Vehicles({ activeVehicleRef }: { activeVehicleRef: React.RefObject<THREE.Group | null> }) {
  return (
    <>
      {SPAWN_VEHICLES.map((def) => (
        <SingleVehicle key={def.id} def={def} activeVehicleRef={activeVehicleRef} />
      ))}
    </>
  );
}
