/**
 * WorldBoundary — visual void beyond the playable world edges.
 *
 * The playable area is approximately:
 *   x: −460 → 460   (covers both cities + countryside)
 *   z: −210 → 210
 *
 * Beyond this we render a ring of very dark "void" ground + tall dark walls
 * so the player perceives a hard horizon. Fog hides the seam.
 *
 * No physics/collision needed here — Player.tsx clamps position.
 */
import React from 'react';

const VOID_COLOR  = '#05050a';
const WALL_COLOR  = '#030308';

// Outer void ground ring — four large planes surrounding the playable area
const VOID_SLABS = [
  // North
  { x:   0, z: -900, w: 2400, d: 1400 },
  // South
  { x:   0, z:  900, w: 2400, d: 1400 },
  // West
  { x: -900, z: 0,   w: 1400, d: 2400 },
  // East
  { x:  900, z: 0,   w: 1400, d: 2400 },
];

// Tall void walls at the playable boundary — creates a clear horizon line
const VOID_WALLS = [
  // North wall (z = -215)
  { x: 0,    z: -215, w: 940, h: 80, rotY: 0 },
  // South wall (z = 215)
  { x: 0,    z:  215, w: 940, h: 80, rotY: Math.PI },
  // West wall (x = -465)
  { x: -465, z:   0,  w: 440, h: 80, rotY: Math.PI / 2 },
  // East wall (x = 465)
  { x:  465, z:   0,  w: 440, h: 80, rotY: -Math.PI / 2 },
];

export function WorldBoundary() {
  return (
    <group>
      {/* ── Outer void ground ────────────────────────────────────────────── */}
      {VOID_SLABS.map((s, i) => (
        <mesh key={`vs-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[s.x, -0.1, s.z]}>
          <planeGeometry args={[s.w, s.d]} />
          <meshStandardMaterial color={VOID_COLOR} roughness={1} />
        </mesh>
      ))}

      {/* ── Boundary walls — solid dark vertical planes ───────────────────── */}
      {VOID_WALLS.map((w, i) => (
        <mesh key={`vw-${i}`} position={[w.x, w.h / 2, w.z]} rotation={[0, w.rotY, 0]}>
          <planeGeometry args={[w.w, w.h]} />
          <meshBasicMaterial color={WALL_COLOR} side={2 /* THREE.DoubleSide */} />
        </mesh>
      ))}

      {/* ── Overhead void ceiling — hides stars/sky beyond boundary ─────── */}
      <mesh position={[0, 120, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshBasicMaterial color="#04040c" side={2} />
      </mesh>
    </group>
  );
}
