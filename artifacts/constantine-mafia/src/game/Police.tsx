/**
 * Police system:
 *  - Checkpoint barriers at key road choke-points (visual + contraband detection)
 *  - Pursuit vehicles that chase the player when wantedLevel > 0
 *  - Wanted-level decay ticker (~1 s intervals)
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';
import { CHECKPOINTS, DYNAMIC_CHECKPOINT_ROADS, type Checkpoint, type RoadSegment } from './police';
import { audioManager } from './audio/AudioManager';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Contraband check at checkpoint:
 *  - Driving a stolen vehicle (world-spawn vehicle entered without ownership)
 *  - Any active wanted level (prior crime on record)
 * Weapons purchased from the shop are considered registered and do NOT
 * flag checkpoints — only stolen vehicles and prior wanted status do.
 */
function playerHasContraband(): boolean {
  const s = useGameStore.getState();
  const drivingStolenCar =
    s.inVehicle && !!s.equippedVehicleId && s.stolenVehicleIds.includes(s.equippedVehicleId);
  return drivingStolenCar || s.wantedLevel > 0;
}

// ─── Flashing siren light ─────────────────────────────────────────────────────

function FlashingLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef  = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const phase = Math.sin(clock.elapsedTime * 8);
    const blueOn = phase > 0;
    if (lightRef.current) lightRef.current.intensity = blueOn ? 10 : 6;
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).color.set(blueOn ? '#3355ff' : '#ff2222');
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial color="#3355ff" />
      </mesh>
      <pointLight ref={lightRef} color="#3355ff" distance={22} decay={2} intensity={10} />
    </group>
  );
}

// ─── Single checkpoint barrier + trigger ──────────────────────────────────────

/**
 * Barrier arm pivot is at the left post (x = -bw/2).
 * angle = 0         → arm is horizontal (road blocked / closed)
 * angle = Math.PI/2 → arm is vertical   (road open / raised)
 */
function CheckpointZone({ cp }: { cp: Checkpoint }) {
  const wasInside   = useRef(false);
  const armRef      = useRef<THREE.Group>(null);
  // Start raised (open)
  const barrierAngle = useRef(Math.PI / 2);
  // true while player is inside with contraband — arm stays closed
  const blocked     = useRef(false);

  const bw = 10; // barrier arm width

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || state.indoors) return;

    const [px, , pz] = state.playerPosition;
    const inside = Math.hypot(px - cp.worldX, pz - cp.worldZ) < cp.radius;

    // ── Trigger on enter ────────────────────────────────────────────────────
    if (inside && !wasInside.current) {
      if (playerHasContraband()) {
        blocked.current = true;
        state.triggerCrime(1);
        state.setInteractionHint(`🚨 ${cp.label}: Contraband detected! Pull over!`);
      } else {
        blocked.current = false;
        state.setInteractionHint(`✅ ${cp.label}: All clear — proceed`);
      }
      setTimeout(() => {
        const curr = useGameStore.getState().interactionHint ?? '';
        if (curr.includes(cp.label)) useGameStore.getState().setInteractionHint(null);
      }, 3000);
    }

    // Clear blocked flag when player leaves the zone
    if (!inside && wasInside.current) {
      blocked.current = false;
    }

    wasInside.current = inside;

    // ── Animate arm ─────────────────────────────────────────────────────────
    const targetAngle = blocked.current ? 0 : Math.PI / 2;
    barrierAngle.current = THREE.MathUtils.lerp(barrierAngle.current, targetAngle, delta * 3.5);
    if (armRef.current) {
      armRef.current.rotation.z = barrierAngle.current;
    }
  });

  return (
    <group position={[cp.worldX, 0, cp.worldZ]} rotation={[0, cp.rotY, 0]}>
      {/* Support posts */}
      {([-bw / 2, bw / 2] as number[]).map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.6, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 1.2, 8]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      ))}

      {/* Pivot hinge box on left post */}
      <mesh position={[-bw / 2, 1.2, 0]}>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.5} />
      </mesh>

      {/* Animated barrier arm — pivots from the left post */}
      <group ref={armRef} position={[-bw / 2, 1.2, 0]}>
        {/* Red base arm */}
        <mesh castShadow position={[bw / 2, 0, 0]}>
          <boxGeometry args={[bw, 0.18, 0.18]} />
          <meshStandardMaterial color="#cc1111" />
        </mesh>
        {/* White stripe bands */}
        {[1.5, 3.5, 5.5, 7.5].map((x, i) => (
          <mesh key={i} castShadow position={[x, 0, 0]}>
            <boxGeometry args={[1.4, 0.19, 0.19]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
        {/* Counterweight block on the short side */}
        <mesh castShadow position={[-0.6, 0, 0]}>
          <boxGeometry args={[0.8, 0.35, 0.35]} />
          <meshStandardMaterial color="#888888" metalness={0.4} />
        </mesh>
      </group>

      {/* Traffic cones */}
      {[-3.5, -1.5, 1.5, 3.5].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.3, 2.2]}>
          <coneGeometry args={[0.28, 0.6, 8]} />
          <meshStandardMaterial color="#ff6600" />
        </mesh>
      ))}

      {/* Guard booth */}
      <mesh castShadow receiveShadow position={[-5.8, 1.3, 2.8]}>
        <boxGeometry args={[2.2, 2.6, 2.2]} />
        <meshStandardMaterial color="#334477" roughness={0.8} />
      </mesh>
      {/* Booth window */}
      <mesh position={[-5.8, 1.5, 1.68]}>
        <boxGeometry args={[1.4, 0.9, 0.08]} />
        <meshStandardMaterial color="#88ccee" transparent opacity={0.5} />
      </mesh>

      <FlashingLight position={[-5.8, 2.75, 2.8]} />

      {/* Parked police cruiser */}
      <group position={[5.5, 0, -2.8]}>
        <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[2, 0.65, 4.5]} />
          <meshStandardMaterial color="#1a3aee" roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 0.85, 0.3]}>
          <boxGeometry args={[1.7, 0.5, 2]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
        </mesh>
        <FlashingLight position={[0, 1.1, 0.3]} />
      </group>
    </group>
  );
}

// ─── Pursuit vehicle ──────────────────────────────────────────────────────────

const PURSUIT_COUNT = 3;

// Reusable vector — avoids allocating a new THREE.Vector3 inside useFrame each tick
const _pursuitFwd = new THREE.Vector3();

function PursuitCar({ index, positions }: { index: number; positions: React.RefObject<THREE.Vector3[]> }) {
  const groupRef    = useRef<THREE.Group>(null);
  const active      = useRef(false);
  const spawnAngle  = useRef((index / PURSUIT_COUNT) * Math.PI * 2);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || !groupRef.current) return;

    const wanted = state.wantedLevel > 0 && state.pursuitActive;

    // Bank-heist escalation: a heist in progress means every active pursuit
    // car chases harder — a "high-level" response layered on top of the
    // normal wanted-level pursuit, without altering the base chase logic.
    const heistBoost = state.heistActive ? 1.35 : 1;

    if (!wanted) {
      if (active.current) {
        groupRef.current.position.y = -50; // hide below ground
        active.current = false;
        positions.current[index]?.set(0, -50, 0);
      }
      return;
    }

    const [px, , pz] = state.playerPosition;

    if (!active.current) {
      const a = spawnAngle.current;
      groupRef.current.position.set(px + Math.cos(a) * 35, 0.5, pz + Math.sin(a) * 35);
      active.current = true;
    }

    const pos  = groupRef.current.position;
    const dx   = px - pos.x;
    const dz   = pz - pos.z;
    const dist = Math.hypot(dx, dz);

    // Steering
    const tgtAngle = Math.atan2(-dx, -dz);
    let diff = tgtAngle - groupRef.current.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * 2.8 * delta;

    // Throttle — reuse module-level vector to avoid GC allocation per frame
    const chaseSpeed = Math.min(24 * heistBoost, dist * 1.6 * heistBoost) * delta;
    if (dist > 5) {
      const ry = groupRef.current.rotation.y;
      _pursuitFwd.set(-Math.sin(ry), 0, -Math.cos(ry));
      groupRef.current.position.addScaledVector(_pursuitFwd, chaseSpeed);
    }
    groupRef.current.position.y = 0.5;
    positions.current[index]?.copy(groupRef.current.position);
  });

  return (
    <group ref={groupRef} position={[0, -50, 0]}>
      {/* Car body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.65, 4.5]} />
        <meshStandardMaterial color="#1a3aee" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Roof cab */}
      <mesh castShadow position={[0, 0.57, 0.3]}>
        <boxGeometry args={[1.7, 0.5, 2]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>
      <FlashingLight position={[0, 1.05, 0.3]} />
    </group>
  );
}

// ─── Weapon/bomb-proximity aggression ─────────────────────────────────────────
// If the player brandishes a weapon (or carries an explosive-type item) near a
// police presence (checkpoint or pursuit car), officers immediately react —
// raising the wanted level and starting a pursuit, rather than waiting for the
// player to fire.

function playerIsArmed(): boolean {
  const s = useGameStore.getState();
  return !!s.equippedWeaponId && s.equippedWeaponId !== 'knife';
}

/**
 * Weapon aggression watcher.
 *
 * Brandishing a firearm or explosive in public immediately draws police
 * attention — regardless of whether the player is near a fixed checkpoint.
 * A 6-second cooldown prevents the wanted level from escalating every frame;
 * once a pursuit is already active we still let it escalate slowly so the
 * player can't simply hold a gun and stay at wantedLevel 1 indefinitely.
 */
function WeaponAggressionWatcher() {
  const cooldown = useRef(0);
  useFrame((_, delta) => {
    cooldown.current -= delta;
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || state.indoors || state.isArrested) return;
    if (!playerIsArmed() || cooldown.current > 0) return;

    cooldown.current = 6; // seconds before the next escalation tick
    state.triggerCrime(2);
    state.setInteractionHint('🚨 Weapon spotted! Police are moving in!');
    setTimeout(() => {
      if (useGameStore.getState().interactionHint?.includes('Weapon spotted')) {
        useGameStore.getState().setInteractionHint(null);
      }
    }, 3000);
  });
  return null;
}

// ─── 5-second continuous-proximity arrest ─────────────────────────────────────
// While wanted and a pursuit car stays within arrest range continuously for
// 5 seconds, the player is arrested: black screen, respawn at the police
// station, contraband (ammo/mags) cleared, wanted level reset.

const ARREST_RADIUS = 4.5;
const ARREST_HOLD_SECONDS = 5;
const POLICE_STATION_RESPAWN: [number, number, number] = [60, 1, 100];

function ArrestWatcher({ pursuitPositions }: { pursuitPositions: React.RefObject<THREE.Vector3[]> }) {
  const proximityTimer = useRef(0);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.isPaused || state.indoors || state.isArrested) {
      proximityTimer.current = 0;
      return;
    }
    if (!(state.wantedLevel > 0 && state.pursuitActive)) {
      proximityTimer.current = 0;
      return;
    }

    // Gang cover fire: while a recruited follower is suppressing (recent
    // cover-fire burst), officers are pinned down and can't close in for the
    // arrest — the hold timer bleeds off instead of accumulating.
    if (Date.now() < state.gangSuppressionUntil) {
      proximityTimer.current = Math.max(0, proximityTimer.current - delta * 3);
      return;
    }

    const [px, , pz] = state.playerPosition;
    const positions = pursuitPositions.current ?? [];
    const anyClose = positions.some((p) => Math.hypot(px - p.x, pz - p.z) < ARREST_RADIUS);

    if (anyClose) {
      proximityTimer.current += delta;
      if (proximityTimer.current >= ARREST_HOLD_SECONDS) {
        proximityTimer.current = 0;
        useGameStore.getState().arrestPlayer();
        useGameStore.getState().setPlayerPosition(POLICE_STATION_RESPAWN, 0);
        audioManager.playOneShot('siren', 'arrest', POLICE_STATION_RESPAWN);
      }
    } else {
      proximityTimer.current = Math.max(0, proximityTimer.current - delta * 2);
    }
  });

  return null;
}

// ─── Dynamic checkpoint (2 cars + 8 officers, full road-width block) ──────────
// Periodically relocates to a random point along a random road segment,
// blocking the FULL road width (not just one lane like the fixed barrier
// checkpoints above). Searches the player on approach; contraband → arrest
// flow, clean → waved through.

const DYNAMIC_LIFETIME = 50;   // seconds a checkpoint stays up
const DYNAMIC_INTERVAL = 90;   // seconds between relocations
const DYNAMIC_SEARCH_RADIUS = 14;
const OFFICER_COUNT = 8;

function officerOffsets(roadWidth: number): [number, number][] {
  // 8 officers spread across the full road width in two staggered rows
  const offs: [number, number][] = [];
  const step = roadWidth / 5;
  for (let i = 0; i < 4; i++) {
    const across = -roadWidth / 2 + step * (i + 1);
    offs.push([across, -1.6]);
    offs.push([across, 1.6]);
  }
  return offs;
}

function Officer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.28, 1.0, 4, 8]} />
        <meshStandardMaterial color="#16213e" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#e0b090" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[0.42, 0.12, 0.42]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

function DynamicCheckpoint() {
  const groupRef  = useRef<THREE.Group>(null);
  const active    = useRef(false);
  const lifeTimer = useRef(0);
  const idleTimer = useRef(DYNAMIC_INTERVAL * 0.4); // first spawn sooner than a full interval
  const wasSearching = useRef(false);
  const searchTimer  = useRef(0);
  const [, force] = React.useReducer((x: number) => x + 1, 0);

  const currentSeg  = useRef<RoadSegment | null>(null);
  const currentPos  = useRef<[number, number, number]>([0, 0, 0]);
  const currentRotY = useRef(0);
  const heistSpawned = useRef(false);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.screen !== 'playing' || state.indoors) return;

    if (!state.heistActive) heistSpawned.current = false;
    else if (active.current) heistSpawned.current = true; // already responding — heist is satisfied

    if (!active.current) {
      // Bank-heist high-level response: force an immediate roadblock instead
      // of waiting for the normal idle interval, once per heist. If a
      // checkpoint is already active when the heist starts, mark the heist
      // as "satisfied" so we don't force a second one right after it clears.
      const heistForce = state.heistActive && !heistSpawned.current;
      if (heistForce) idleTimer.current = 0;
      idleTimer.current -= delta;
      if (idleTimer.current <= 0) {
        if (state.heistActive) heistSpawned.current = true;
        const seg = DYNAMIC_CHECKPOINT_ROADS[Math.floor(Math.random() * DYNAMIC_CHECKPOINT_ROADS.length)];
        const t = 0.15 + Math.random() * 0.7;
        const x = seg.x0 + (seg.x1 - seg.x0) * t;
        const z = seg.z0 + (seg.z1 - seg.z0) * t;
        currentSeg.current  = seg;
        currentPos.current  = [x, 0, z];
        currentRotY.current = seg.horizontal ? Math.PI / 2 : 0;
        active.current   = true;
        lifeTimer.current = DYNAMIC_LIFETIME;
        wasSearching.current = false;
        force();
      }
      return;
    }

    lifeTimer.current -= delta;
    if (lifeTimer.current <= 0) {
      active.current = false;
      idleTimer.current = DYNAMIC_INTERVAL;
      currentSeg.current = null;
      force();
      return;
    }

    if (!isPaused(state) && currentSeg.current) {
      const [px, , pz] = state.playerPosition;
      const [cx, , cz] = currentPos.current;
      const dist = Math.hypot(px - cx, pz - cz);
      const inside = dist < DYNAMIC_SEARCH_RADIUS;

      if (inside && !wasSearching.current) {
        wasSearching.current = true;
        searchTimer.current = 0;
        state.setInteractionHint('👮 Checkpoint ahead — hold position, searching vehicle...');
      }

      if (inside && wasSearching.current) {
        searchTimer.current += delta;
        if (searchTimer.current > 3) {
          wasSearching.current = false; // resolve once
          if (playerHasContraband() || playerIsArmed()) {
            state.setInteractionHint('🚨 Contraband found! You\'re under arrest!');
            state.arrestPlayer();
            state.setPlayerPosition(POLICE_STATION_RESPAWN, 0);
          } else {
            state.setInteractionHint('✅ Checkpoint clear — move along');
            setTimeout(() => {
              if (useGameStore.getState().interactionHint?.includes('move along')) {
                useGameStore.getState().setInteractionHint(null);
              }
            }, 2500);
          }
        }
      }

      if (!inside) {
        wasSearching.current = false;
      }
    }
  });

  if (!active.current || !currentSeg.current) return null;

  const seg = currentSeg.current;
  const offsets = officerOffsets(seg.width);

  return (
    <group position={currentPos.current} rotation={[0, currentRotY.current, 0]}>
      {/* Two cruisers blocking the full width, nose-to-nose */}
      {[-seg.width / 2 + 6, seg.width / 2 - 6].map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
            <boxGeometry args={[2, 0.65, 4.5]} />
            <meshStandardMaterial color="#1a3aee" roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.85, 0.3]}>
            <boxGeometry args={[1.7, 0.5, 2]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
          </mesh>
          <FlashingLight position={[0, 1.1, 0.3]} />
        </group>
      ))}
      {/* 8 officers spread across the road */}
      {offsets.slice(0, OFFICER_COUNT).map(([across, fwd], i) => (
        <Officer key={i} position={[across, 0, fwd]} />
      ))}
      {/* Barrier strip visual across the full width */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[seg.width - 4, 0.15, 0.4]} />
        <meshStandardMaterial color="#cc1111" />
      </mesh>
    </group>
  );
}

function isPaused(state: ReturnType<typeof useGameStore.getState>) { return state.isPaused; }

// ─── Wanted-level decay (runs every ~1 s) ─────────────────────────────────────

function WantedDecay() {
  const tickRef = useRef(0);
  useFrame((_, delta) => {
    tickRef.current += delta;
    if (tickRef.current >= 1) {
      tickRef.current = 0;
      useGameStore.getState().decayWanted();
    }
  });
  return null;
}

// ─── Public export ────────────────────────────────────────────────────────────

export function Police() {
  const pursuitPositions = useRef<THREE.Vector3[]>(
    Array.from({ length: PURSUIT_COUNT }, () => new THREE.Vector3(0, -50, 0)),
  );

  return (
    <>
      {CHECKPOINTS.map((cp) => <CheckpointZone key={cp.id} cp={cp} />)}
      {Array.from({ length: PURSUIT_COUNT }, (_, i) => (
        <PursuitCar key={i} index={i} positions={pursuitPositions} />
      ))}
      <WantedDecay />
      <WeaponAggressionWatcher />
      <ArrestWatcher pursuitPositions={pursuitPositions} />
      <DynamicCheckpoint />
    </>
  );
}
