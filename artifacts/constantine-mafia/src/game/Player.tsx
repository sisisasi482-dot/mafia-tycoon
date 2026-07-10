import React, { forwardRef, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { BUILDING_AABBS } from './buildings';
import { activeMask } from './buildingPool';
import { DOOR_TRIGGERS, NPC_TALKERS, INTERIORS } from './interiors';
import { cameraDrag } from './cameraState';
import { WEAPON_AMMO } from './items';
import { audioManager } from './audio/AudioManager';
import { DEFAULT_BINDINGS } from './keyBindings';

// ─── Default key bindings (loaded from localStorage at module init) ──────────
export { DEFAULT_BINDINGS };

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

/** Simple weapon silhouette held in the right hand — switches by equipped id + aim pose. */
function WeaponModel({ weaponId, aiming }: { weaponId: string; aiming: boolean }) {
  const DIMS: Record<string, { size: [number, number, number]; color: string }> = {
    knife:   { size: [0.05, 0.30, 0.05], color: '#d8d8d8' },
    pistol:  { size: [0.09, 0.16, 0.24], color: '#222222' },
    shotgun: { size: [0.10, 0.14, 0.78], color: '#3a2a18' },
    smg:     { size: [0.09, 0.14, 0.50], color: '#1a1a1a' },
    rifle:   { size: [0.09, 0.14, 0.72], color: '#2a2a18' },
  };
  const cfg = DIMS[weaponId] ?? DIMS.pistol;
  return (
    <group position={[0, -0.55, aiming ? -0.42 : -0.14]} rotation={[aiming ? -0.18 : 0.2, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={cfg.size} />
        <meshStandardMaterial color={cfg.color} metalness={0.55} roughness={0.5} />
      </mesh>
    </group>
  );
}

export const Player = forwardRef<THREE.Group, {}>((_, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();

  const {
    playerPosition, playerRotationY,
    setPlayerPosition, inVehicle, careerPath, cameraMode,
    indoors, interiorId, currentOutfitId,
    enterInterior, exitInterior, setInteractionHint,
    equippedWeaponId, aimMode,
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

  /* ── Combat controls: Right-click = aim (held), Left-click = fire/attack ── */
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Ignore clicks that originate on any DOM overlay (inventory, dialogue,
      // pause menu, HUD widgets, etc.) — only bare canvas clicks count as
      // combat input.
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-ui-overlay], button, a, input, textarea, select')) return;

      const gs = useGameStore.getState();
      if (gs.screen !== 'playing' || gs.isPaused || gs.indoors || gs.inVehicle) return;

      if (e.button === 2) {
        gs.setPlayerState({ aimMode: true });
        return;
      }
      if (e.button === 0) {
        const weaponId = gs.equippedWeaponId;
        if (!weaponId) return;
        const pos: [number, number, number] = innerRef.current
          ? [innerRef.current.position.x, innerRef.current.position.y + 1.2, innerRef.current.position.z]
          : [gs.playerPosition[0], gs.playerPosition[1] + 1.2, gs.playerPosition[2]];
        const cfg = WEAPON_AMMO[weaponId];
        if (!cfg) {
          // Melee (knife) — infinite, no ammo gate.
          audioManager.playOneShot('combat', 'melee_swing', pos);
          return;
        }
        const fired = gs.fireWeapon(weaponId, cfg.magSize);
        if (fired) {
          audioManager.playOneShot('combat', `gunshot_${weaponId}`, pos);
        } else {
          gs.setInteractionHint('🔫 Out of ammo — visit a shop to restock');
          setTimeout(() => {
            if (useGameStore.getState().interactionHint?.includes('Out of ammo')) {
              useGameStore.getState().setInteractionHint(null);
            }
          }, 1500);
        }
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) useGameStore.getState().setPlayerState({ aimMode: false });
    };
    // Suppress the native context menu while playing so right-click reliably means "aim".
    const handleContextMenu = (e: MouseEvent) => {
      if (useGameStore.getState().screen === 'playing') e.preventDefault();
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

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

    const keys = getKeys();
    const speed = keys.sprint ? 16 : 8;

    const moveYaw = (cameraMode === 'third') ? cameraDrag.yaw : innerRef.current.rotation.y;
    const camFwdX = -Math.sin(moveYaw);
    const camFwdZ = -Math.cos(moveYaw);
    const camRightX = Math.cos(moveYaw);
    const camRightZ = -Math.sin(moveYaw);

    direction.current.set(0, 0, 0);
    if (keys.forward) { direction.current.x += camFwdX; direction.current.z += camFwdZ; }
    if (keys.back) { direction.current.x -= camFwdX; direction.current.z -= camFwdZ; }
    if (keys.left) { direction.current.x -= camRightX; direction.current.z -= camRightZ; }
    if (keys.right) { direction.current.x += camRightX; direction.current.z += camRightZ; }

    if (direction.current.lengthSq() > 0) {
      direction.current.normalize();
      const targetAngle = Math.atan2(-direction.current.x, -direction.current.z);
      let diff = targetAngle - innerRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      innerRef.current.rotation.y += diff * 10 * delta;
    }

    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, direction.current.x * speed, 10 * delta);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, direction.current.z * speed, 10 * delta);

    if (innerRef.current.position.y > 1) {
      velocity.current.y -= 30 * delta;
    } else {
      velocity.current.y = 0;
      innerRef.current.position.y = 1;
      if (keys.jump) velocity.current.y = 10;
    }

    innerRef.current.position.addScaledVector(velocity.current, delta);

    const pos = innerRef.current.position;
    if (indoors && interiorId) {
      const layout = INTERIORS[interiorId];
      if (layout) {
        pos.x = THREE.MathUtils.clamp(pos.x, layout.centerX - layout.roomW / 2 + INTERIOR_MARGIN, layout.centerX + layout.roomW / 2 - INTERIOR_MARGIN);
        pos.z = THREE.MathUtils.clamp(pos.z, layout.centerZ - layout.roomD / 2 + INTERIOR_MARGIN, layout.centerZ + layout.roomD / 2 - INTERIOR_MARGIN);
      }
    } else {
      pos.x = THREE.MathUtils.clamp(pos.x, -620, 500);
      pos.z = THREE.MathUtils.clamp(pos.z, -210, 460);
    }

    if (!indoors) {
      for (let i = 0; i < BUILDING_AABBS.length; i++) {
        if (!activeMask[i]) continue;
        const aabb = BUILDING_AABBS[i];
        const dx = pos.x - aabb.cx;
        const dz = pos.z - aabb.cz;
        const penX = aabb.hw + PLAYER_RADIUS - Math.abs(dx);
        const penZ = aabb.hd + PLAYER_RADIUS - Math.abs(dz);
        if (penX > 0 && penZ > 0) {
          if (penX < penZ) {
            pos.x += penX * Math.sign(dx || 1);
            velocity.current.x = 0;
          } else {
            pos.z += penZ * Math.sign(dz || 1);
            velocity.current.z = 0;
          }
        }
      }
    }

    const horizSpeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
    walkCycle.current += horizSpeed * delta * 2.2;
    const swing = Math.sin(walkCycle.current) * 0.55;
    const bob = Math.abs(Math.sin(walkCycle.current)) * 0.03;

    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * 0.65;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * 0.65;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.45;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.45;
    if (torsoRef.current) torsoRef.current.position.y = bob;

    syncTimer.current += delta;
    if (syncTimer.current > 0.3) {
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
          {equippedWeaponId && <WeaponModel weaponId={equippedWeaponId} aiming={aimMode} />}
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
