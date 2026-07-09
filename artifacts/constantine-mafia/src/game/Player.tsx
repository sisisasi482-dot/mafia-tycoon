import React, { forwardRef, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { BUILDING_AABBS } from './buildings';
import { activeMask } from './buildingPool';
import { DOOR_TRIGGERS, NPC_TALKERS, INTERIORS } from './interiors';
import { cameraDrag } from './cameraState';

// ─── Default key bindings (loaded from localStorage at module init) ──────────

export const DEFAULT_BINDINGS: Record<string, string[]> = {
  forward:  ['ArrowUp',    'KeyW'],
  back:     ['ArrowDown',  'KeyS'],
  left:     ['ArrowLeft',  'KeyA'],
  right:    ['ArrowRight', 'KeyD'],
  jump:     ['Space'],
  sprint:   ['ShiftLeft'],
  interact: ['KeyE'],
  attack:   ['KeyF'],
  map:      ['KeyM'],
  escape:   ['Escape'],
};

/** Load per-action overrides from localStorage and merge with defaults */
function loadKeyBindings(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem('cm_keybindings');
    if (raw) {
      const overrides = JSON.parse(raw) as Record<string, string>;
      return Object.fromEntries(
        Object.entries(DEFAULT_BINDINGS).map(([action, def]) =>
          [action, overrides[action] ? [overrides[action], ...def] : def],
        ),
      );
    }
  } catch { /* ignore */ }
  return DEFAULT_BINDINGS;
}

/** Built once at module load — reflects whatever is in localStorage at startup */
export const ControlsMap = Object.entries(loadKeyBindings()).map(([name, keys]) => ({ name, keys }));

/* ── Player physics constants ─────────────────────────────────────────────── */
const PLAYER_RADIUS = 0.55;

/** Interior wall clamp margin = player radius + half wall thickness + epsilon */
const WALL_THICK_HALF = 0.125;
const INTERIOR_MARGIN = PLAYER_RADIUS + WALL_THICK_HALF + 0.05; // ≈ 0.725

/* ── Outfit colours per career path ─────────────────────────────────────── */
const OUTFIT: Record<string, { body: string; legs: string; hair: string }> = {
  street_thug:    { body: '#2a2a2a', legs: '#1a1a2e', hair: '#111111' },
  gangster:       { body: '#1a1a1a', legs: '#0d0d1a', hair: '#0a0a0a' },
  crime_boss:     { body: '#1c1c30', legs: '#111120', hair: '#080810' },
  business_tycoon:{ body: '#2c2040', legs: '#1a1428', hair: '#050508' },
};

/* ── Wardrobe overrides (by outfitId) ────────────────────────────────────── */
const OUTFIT_OVERRIDES: Record<string, { body: string; legs: string; hair: string }> = {
  formal:    { body: '#1a1a1a', legs: '#0a0a0a', hair: '#111111' },
  tracksuit: { body: '#1a4a8a', legs: '#0a2a5a', hair: '#111111' },
  tactical:  { body: '#2a3a2a', legs: '#1a2a1a', hair: '#111111' },
  djellaba:  { body: '#c8a860', legs: '#1a1a2e', hair: '#111111' },
  police:    { body: '#1a3aee', legs: '#0a1a5a', hair: '#0a0a0a' },
};

export const Player = forwardRef<THREE.Group, {}>((_, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();

  const {
    playerPosition, playerRotationY,
    setPlayerPosition, inVehicle, careerPath, cameraMode,
    indoors, interiorId, currentOutfitId,
    enterInterior, exitInterior, setInteractionHint,
  } = useGameStore();

  const velocity        = useRef(new THREE.Vector3());
  const direction       = useRef(new THREE.Vector3());
  const syncTimer       = useRef(0);
  const prevInVehicle   = useRef(inVehicle);

  // Interaction debounce
  const interactWasDown = useRef(false);
  const currentHint     = useRef<string | null>(null);
  const npcDialogTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showingDialogue = useRef(false);

  // ── Procedural walk animation refs ───────────────────────────────────────
  const leftLegRef  = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef    = useRef<THREE.Group>(null);
  const walkCycle   = useRef(0);

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

  /* ── Snap position when exiting an interior (e.g. via HomePanel) ───────── */
  const prevIndoors = useRef(indoors);
  useEffect(() => {
    if (prevIndoors.current && !indoors && innerRef.current) {
      const exitPos = useGameStore.getState().interiorExitPos;
      innerRef.current.position.set(exitPos[0], exitPos[1], exitPos[2]);
      velocity.current.set(0, 0, 0);
      // Auto-clear home overlays so they don't persist outside the interior
      useGameStore.getState().setPlayerState({ showTv: false, showWardrobe: false });
    }
    prevIndoors.current = indoors;
  }, [indoors]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helper: update hint only when value changes ───────────────────────── */
  function pushHint(hint: string | null) {
    if (hint !== currentHint.current) {
      currentHint.current = hint;
      setInteractionHint(hint);
    }
  }

  useFrame((_, delta) => {
    if (!innerRef.current || inVehicle || useGameStore.getState().isPaused) return;

    /* ── Camera-relative movement ─────────────────────────────────────────── */
    const keys  = getKeys();
    const speed = keys.sprint ? 16 : 8;

    // In third-person, movement is relative to the mouse-dragged camera orbit angle.
    // In first/second-person the camera tracks the player's own facing direction,
    // so use the player's current rotation.y as the movement basis instead.
    const moveYaw = (cameraMode === 'third')
      ? cameraDrag.yaw
      : innerRef.current.rotation.y;

    const camFwdX   = -Math.sin(moveYaw);
    const camFwdZ   = -Math.cos(moveYaw);
    const camRightX =  Math.cos(moveYaw);
    const camRightZ = -Math.sin(moveYaw);

    direction.current.set(0, 0, 0);
    if (keys.forward) { direction.current.x += camFwdX;   direction.current.z += camFwdZ; }
    if (keys.back)    { direction.current.x -= camFwdX;   direction.current.z -= camFwdZ; }
    if (keys.left)    { direction.current.x -= camRightX; direction.current.z -= camRightZ; }
    if (keys.right)   { direction.current.x += camRightX; direction.current.z += camRightZ; }
    direction.current.normalize();

    // Rotate player model to face movement direction
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

    /* ── World bounds (2× scaled city) ───────────────────────────────────── */
    const pos = innerRef.current.position;
    if (indoors && interiorId) {
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
      pos.x = THREE.MathUtils.clamp(pos.x, -620, 500);
      pos.z = THREE.MathUtils.clamp(pos.z, -210, 460);
    }

    /* ── Building AABB collision (outdoors only) ─────────────────────────── */
    if (!indoors) {
      for (let i = 0; i < BUILDING_AABBS.length; i++) {
        if (!activeMask[i]) continue; // pooled collider disabled outside proximity range
        const aabb = BUILDING_AABBS[i];
        const dx   = pos.x - aabb.cx;
        const dz   = pos.z - aabb.cz;
        const penX = aabb.hw + PLAYER_RADIUS - Math.abs(dx);
        const penZ = aabb.hd + PLAYER_RADIUS - Math.abs(dz);
        if (penX > 0 && penZ > 0) {
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

    /* ── Procedural walk animation ────────────────────────────────────────── */
    const horizSpeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
    walkCycle.current += horizSpeed * delta * 2.2;
    const swing = Math.sin(walkCycle.current) * 0.55;
    const bob   = Math.abs(Math.sin(walkCycle.current)) * 0.03;

    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing * 0.65;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.65;
    if (leftArmRef.current)  leftArmRef.current.rotation.x  = -swing * 0.45;
    if (rightArmRef.current) rightArmRef.current.rotation.x =  swing * 0.45;
    if (torsoRef.current)    torsoRef.current.position.y    =  bob;

    /* ── Interaction system ───────────────────────────────────────────────── */
    const interactDown = keys.interact;
    const justPressed  = interactDown && !interactWasDown.current;
    interactWasDown.current = interactDown;

    if (indoors && interiorId) {
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
      let nearDoor: typeof DOOR_TRIGGERS[0] | null = null;
      let nearNpc:  typeof NPC_TALKERS[0]  | null = null;
      let minDist = Infinity;

      for (const dt of DOOR_TRIGGERS) {
        const d = Math.hypot(pos.x - dt.worldX, pos.z - dt.worldZ);
        if (d < dt.radius && d < minDist) { nearDoor = dt; minDist = d; }
      }

      if (!nearDoor) {
        let minNpcDist = Infinity;
        for (const npc of NPC_TALKERS) {
          const d = Math.hypot(pos.x - npc.worldX, pos.z - npc.worldZ);
          if (d < npc.radius && d < minNpcDist) { nearNpc = npc; minNpcDist = d; }
        }
      }

      if (nearDoor) {
        const propId  = nearDoor.propertyId;
        const gs      = useGameStore.getState();
        const owned   = !propId || gs.ownedAssetIds.includes(propId);
        const locked  = !!propId && gs.lockedPropertyIds.includes(propId);

        if (propId && !owned) {
          pushHint(`🔒 ${nearDoor.label} — Buy in Shop`);
        } else if (propId && locked) {
          pushHint(`[E] Unlock ${nearDoor.label}`);
          if (justPressed) {
            gs.togglePropertyLock(propId);
            pushHint(`🔓 ${nearDoor.label} unlocked`);
          }
        } else {
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
        }
      } else if (nearNpc) {
        if ((nearNpc as any).shopType) {
          // Shop NPC — open the Shop panel at the relevant tab
          if (!showingDialogue.current) pushHint(`[E] Shop · ${nearNpc.label}`);
          if (justPressed) {
            useGameStore.getState().setPlayerState({
              isPaused:    true,
              activePanel: 'shop',
              shopNpcTab:  (nearNpc as any).shopType,
            });
            pushHint(null);
          }
        } else if (nearNpc.options && nearNpc.options.length > 0) {
          // Multi-option dialogue — open DialogueUI overlay
          if (!showingDialogue.current) pushHint(`[E] Talk · ${nearNpc.label}`);
          if (justPressed && !showingDialogue.current) {
            useGameStore.getState().setDialogueNpc(nearNpc.id);
            pushHint(null);
          }
        } else {
          // Legacy single-line dialogue
          if (!showingDialogue.current) pushHint(`[E] Talk · ${nearNpc.label}`);
          if (justPressed && !showingDialogue.current) {
            showingDialogue.current = true;
            pushHint(nearNpc.dialogue);
            if (npcDialogTimer.current) clearTimeout(npcDialogTimer.current);
            npcDialogTimer.current = setTimeout(() => {
              showingDialogue.current = false;
              currentHint.current = null;
            }, 3500);
          }
        }
      } else {
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
      setPlayerPosition([pos.x, pos.y, pos.z], innerRef.current.rotation.y);
    }
  });

  const outfit = (currentOutfitId !== 'default' && OUTFIT_OVERRIDES[currentOutfitId])
    ? OUTFIT_OVERRIDES[currentOutfitId]
    : (OUTFIT[careerPath] ?? OUTFIT.street_thug);

  if (inVehicle || cameraMode === 'first') {
    return <group ref={innerRef} />;
  }

  // Pivot heights for joint rotation:
  //   leg hip   = 0.755  (center 0.38 + half-height 0.375)
  //   arm shoulder = 1.28 (center 0.98 + half-height 0.30)
  return (
    <group ref={innerRef}>
      {/* ── Legs (pivot at hip) ── */}
      <group ref={leftLegRef} position={[-0.18, 0.755, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.375, 0]}>
          <boxGeometry args={[0.22, 0.75, 0.22]} />
          <meshStandardMaterial color={outfit.legs} roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.18, 0.755, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.375, 0]}>
          <boxGeometry args={[0.22, 0.75, 0.22]} />
          <meshStandardMaterial color={outfit.legs} roughness={0.9} />
        </mesh>
      </group>

      {/* ── Torso + head (animated bob) ── */}
      <group ref={torsoRef}>
        {/* Torso */}
        <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
          <boxGeometry args={[0.72, 0.72, 0.38]} />
          <meshStandardMaterial color={outfit.body} roughness={0.85} />
        </mesh>

        {/* Arms (pivot at shoulder) */}
        <group ref={leftArmRef} position={[-0.48, 1.28, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.22, 0.6, 0.22]} />
            <meshStandardMaterial color={outfit.body} roughness={0.85} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.48, 1.28, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <boxGeometry args={[0.22, 0.6, 0.22]} />
            <meshStandardMaterial color={outfit.body} roughness={0.85} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh castShadow position={[0, 1.54, 0]}>
          <boxGeometry args={[0.2, 0.18, 0.2]} />
          <meshStandardMaterial color="#c8855a" roughness={0.8} />
        </mesh>

        {/* Head */}
        <mesh castShadow position={[0, 1.88, 0]}>
          <boxGeometry args={[0.52, 0.52, 0.52]} />
          <meshStandardMaterial color="#c8855a" roughness={0.75} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 2.16, 0]}>
          <boxGeometry args={[0.54, 0.14, 0.54]} />
          <meshStandardMaterial color={outfit.hair} roughness={0.9} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.13, 1.9, -0.27]}>
          <boxGeometry args={[0.1, 0.08, 0.02]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.13, 1.9, -0.27]}>
          <boxGeometry args={[0.1, 0.08, 0.02]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>
    </group>
  );
});
