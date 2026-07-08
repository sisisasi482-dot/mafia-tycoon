import React, { forwardRef, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { BUILDING_AABBS } from './buildings';
import { DOOR_TRIGGERS, NPC_TALKERS, INTERIORS } from './interiors';

export const ControlsMap = [
  { name: 'forward',  keys: ['ArrowUp',    'KeyW'] },
  { name: 'back',     keys: ['ArrowDown',  'KeyS'] },
  { name: 'left',     keys: ['ArrowLeft',  'KeyA'] },
  { name: 'right',    keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump',     keys: ['Space'] },
  { name: 'sprint',   keys: ['ShiftLeft'] },
  { name: 'interact', keys: ['KeyE'] },
  { name: 'attack',   keys: ['KeyF'] },
  { name: 'map',      keys: ['KeyM'] },
  { name: 'escape',   keys: ['Escape'] },
];

/* ── Player radius for AABB collision ─────────────────────────────────────── */
const PLAYER_RADIUS = 0.55;

/**
 * Interior wall clamp margin = player radius + half wall thickness (0.125) + epsilon.
 * Keeps the player origin far enough from wall planes to prevent camera/mesh clipping.
 */
const WALL_THICK_HALF = 0.125; // matches InteriorRoom WALL_THICK = 0.25
const INTERIOR_MARGIN = PLAYER_RADIUS + WALL_THICK_HALF + 0.05; // ≈ 0.725

/* ── Outfit colours per career path ─────────────────────────────────────── */
const OUTFIT: Record<string, { body: string; legs: string; hair: string }> = {
  street_thug:    { body: '#2a2a2a', legs: '#1a1a2e', hair: '#111111' },
  gangster:       { body: '#1a1a1a', legs: '#0d0d1a', hair: '#0a0a0a' },
  crime_boss:     { body: '#1c1c30', legs: '#111120', hair: '#080810' },
  business_tycoon:{ body: '#2c2040', legs: '#1a1428', hair: '#050508' },
};

export const Player = forwardRef<THREE.Group, {}>((_, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();

  const {
    playerPosition, playerRotationY,
    setPlayerPosition, inVehicle, careerPath, cameraMode,
    indoors, interiorId,
    enterInterior, exitInterior, setInteractionHint,
  } = useGameStore();

  const velocity        = useRef(new THREE.Vector3());
  const direction       = useRef(new THREE.Vector3());
  const syncTimer       = useRef(0);
  const prevInVehicle   = useRef(inVehicle);

  // Interaction debounce — only fire once per key press
  const interactWasDown = useRef(false);
  // Track current hint text to avoid calling setInteractionHint every frame
  const currentHint     = useRef<string | null>(null);
  // NPC dialogue timer so the text auto-clears
  const npcDialogTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showingDialogue = useRef(false);

  /* ── Forwarded ref ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof ref === 'function') ref(innerRef.current);
    else if (ref) (ref as React.MutableRefObject<THREE.Group | null>).current = innerRef.current;
  }, [ref]);

  /* ── Spawn position ────────────────────────────────────────────────────── */
  useEffect(() => { innerRef.current?.position.set(...playerPosition); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Snap position when exiting a vehicle ──────────────────────────────── */
  useEffect(() => {
    if (prevInVehicle.current && !inVehicle && innerRef.current) {
      innerRef.current.position.set(...playerPosition);
      innerRef.current.rotation.y = playerRotationY;
      velocity.current.set(0, 0, 0);
    }
    prevInVehicle.current = inVehicle;
  }, [inVehicle]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helper: update hint only when value changes ───────────────────────── */
  function pushHint(hint: string | null) {
    if (hint !== currentHint.current) {
      currentHint.current = hint;
      setInteractionHint(hint);
    }
  }

  useFrame((_, delta) => {
    if (!innerRef.current || inVehicle || useGameStore.getState().isPaused) return;

    /* ── Movement ─────────────────────────────────────────────────────────── */
    const keys  = getKeys();
    const speed = keys.sprint ? 16 : 8;

    direction.current.set(0, 0, 0);
    if (keys.forward) direction.current.z -= 1;
    if (keys.back)    direction.current.z += 1;
    if (keys.left)    direction.current.x -= 1;
    if (keys.right)   direction.current.x += 1;
    direction.current.normalize();

    if (direction.current.lengthSq() > 0) {
      const targetAngle = Math.atan2(-direction.current.x, -direction.current.z);
      let diff = targetAngle - innerRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      innerRef.current.rotation.y += diff * 10 * delta;
    }

    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, direction.current.x * speed, 10 * delta);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, direction.current.z * speed, 10 * delta);

    // Gravity / jump
    if (innerRef.current.position.y > 1) {
      velocity.current.y -= 30 * delta;
    } else {
      velocity.current.y = 0;
      innerRef.current.position.y = 1;
      if (keys.jump) velocity.current.y = 10;
    }

    innerRef.current.position.addScaledVector(velocity.current, delta);

    /* ── World bounds ─────────────────────────────────────────────────────── */
    const pos = innerRef.current.position;
    if (indoors && interiorId) {
      // Clamp inside room bounds
      const layout = INTERIORS[interiorId];
      if (layout) {
        pos.x = THREE.MathUtils.clamp(
          pos.x,
          layout.centerX - layout.roomW / 2 + INTERIOR_MARGIN,
          layout.centerX + layout.roomW / 2 - INTERIOR_MARGIN,
        );
        pos.z = THREE.MathUtils.clamp(
          pos.z,
          layout.centerZ - layout.roomD / 2 + INTERIOR_MARGIN,
          layout.centerZ + layout.roomD / 2 - INTERIOR_MARGIN,
        );
      }
    } else {
      pos.x = THREE.MathUtils.clamp(pos.x, -300, 250);
      pos.z = THREE.MathUtils.clamp(pos.z, -150, 250);
    }

    /* ── Building AABB collision (outdoors only) ─────────────────────────── */
    if (!indoors) {
      for (const aabb of BUILDING_AABBS) {
        const dx   = pos.x - aabb.cx;
        const dz   = pos.z - aabb.cz;
        const penX = aabb.hw + PLAYER_RADIUS - Math.abs(dx);
        const penZ = aabb.hd + PLAYER_RADIUS - Math.abs(dz);
        if (penX > 0 && penZ > 0) {
          // Push out on the axis of least penetration.
          // Fallback normal when player is exactly on a centre-line (sign = 0):
          // use the velocity direction so penetration always resolves.
          if (penX < penZ) {
            const nx = Math.sign(dx) || (velocity.current.x >= 0 ? 1 : -1);
            pos.x += penX * nx;
            velocity.current.x = 0;
          } else {
            const nz = Math.sign(dz) || (velocity.current.z >= 0 ? 1 : -1);
            pos.z += penZ * nz;
            velocity.current.z = 0;
          }
        }
      }
    }

    /* ── Interaction system ───────────────────────────────────────────────── */
    const interactDown = keys.interact;
    const justPressed  = interactDown && !interactWasDown.current;
    interactWasDown.current = interactDown;

    if (indoors && interiorId) {
      /* ── Interior: look for exit trigger ───────────────────────────── */
      const layout = INTERIORS[interiorId];
      if (layout) {
        const exitX = layout.centerX + layout.exitOffsetX;
        const exitZ = layout.centerZ + layout.exitOffsetZ;
        const dist  = Math.hypot(pos.x - exitX, pos.z - exitZ);

        if (dist < 3.0) {
          pushHint(`[E] Exit ${layout.label}`);
          if (justPressed) {
            const exitPos = useGameStore.getState().interiorExitPos;
            exitInterior();
            innerRef.current.position.set(exitPos[0], exitPos[1], exitPos[2]);
            velocity.current.set(0, 0, 0);
          }
        } else {
          pushHint(null);
        }
      }
    } else {
      /* ── Outdoors: door triggers + NPC talkers ──────────────────────── */
      let nearDoor: typeof DOOR_TRIGGERS[0] | null = null;
      let nearNpc:  typeof NPC_TALKERS[0]  | null = null;
      let minDist = Infinity;

      // Nearest door trigger within radius
      for (const dt of DOOR_TRIGGERS) {
        const d = Math.hypot(pos.x - dt.worldX, pos.z - dt.worldZ);
        if (d < dt.radius && d < minDist) { nearDoor = dt; minDist = d; }
      }

      // Nearest NPC talker (only if no door is nearby)
      if (!nearDoor) {
        for (const npc of NPC_TALKERS) {
          const d = Math.hypot(pos.x - npc.worldX, pos.z - npc.worldZ);
          if (d < npc.radius) { nearNpc = npc; break; }
        }
      }

      if (nearDoor) {
        if (!showingDialogue.current) pushHint(`[E] Enter ${nearDoor.label}`);
        if (justPressed) {
          const layout = INTERIORS[nearDoor.interiorId];
          if (layout) {
            enterInterior(nearDoor.interiorId, [pos.x, pos.y, pos.z]);
            innerRef.current.position.set(layout.centerX, 1, layout.centerZ);
            velocity.current.set(0, 0, 0);
            pushHint(null);
          }
        }
      } else if (nearNpc) {
        if (!showingDialogue.current) pushHint(`[E] Talk · ${nearNpc.label}`);
        if (justPressed && !showingDialogue.current) {
          showingDialogue.current = true;
          pushHint(nearNpc.dialogue);
          if (npcDialogTimer.current) clearTimeout(npcDialogTimer.current);
          npcDialogTimer.current = setTimeout(() => {
            showingDialogue.current = false;
            currentHint.current = null; // force re-push next frame
          }, 3500);
        }
      } else {
        // Nothing nearby — clear dialogue flag and hint
        if (!showingDialogue.current) pushHint(null);
        if (npcDialogTimer.current && !showingDialogue.current) {
          clearTimeout(npcDialogTimer.current);
          npcDialogTimer.current = null;
        }
      }
    }

    /* ── Sync position + rotationY to store (throttled ~10 Hz) ──────────── */
    syncTimer.current += delta;
    if (syncTimer.current > 0.1) {
      syncTimer.current = 0;
      setPlayerPosition(
        [pos.x, pos.y, pos.z],
        innerRef.current.rotation.y,
      );
    }
  });

  const outfit = OUTFIT[careerPath] ?? OUTFIT.street_thug;

  // In a vehicle or first-person: hide body mesh
  if (inVehicle || cameraMode === 'first') {
    return <group ref={innerRef} />;
  }

  return (
    <group ref={innerRef}>
      {/* ── Legs ── */}
      <mesh castShadow receiveShadow position={[-0.18, 0.38, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <meshStandardMaterial color={outfit.legs} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.18, 0.38, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <meshStandardMaterial color={outfit.legs} roughness={0.9} />
      </mesh>

      {/* ── Torso ── */}
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.72, 0.72, 0.38]} />
        <meshStandardMaterial color={outfit.body} roughness={0.85} />
      </mesh>

      {/* ── Arms ── */}
      <mesh castShadow position={[-0.48, 0.98, 0]}>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color={outfit.body} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.48, 0.98, 0]}>
        <boxGeometry args={[0.22, 0.6, 0.22]} />
        <meshStandardMaterial color={outfit.body} roughness={0.85} />
      </mesh>

      {/* ── Neck ── */}
      <mesh castShadow position={[0, 1.54, 0]}>
        <boxGeometry args={[0.2, 0.18, 0.2]} />
        <meshStandardMaterial color="#c8855a" roughness={0.8} />
      </mesh>

      {/* ── Head ── */}
      <mesh castShadow position={[0, 1.88, 0]}>
        <boxGeometry args={[0.52, 0.52, 0.52]} />
        <meshStandardMaterial color="#c8855a" roughness={0.75} />
      </mesh>

      {/* ── Hair ── */}
      <mesh position={[0, 2.16, 0]}>
        <boxGeometry args={[0.54, 0.14, 0.54]} />
        <meshStandardMaterial color={outfit.hair} roughness={0.9} />
      </mesh>

      {/* ── Eyes ── */}
      <mesh position={[-0.13, 1.9, -0.27]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.13, 1.9, -0.27]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  );
});
