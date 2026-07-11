/**
 * InteriorRoom — renders the active interior when the player is indoors.
 * Placed far east (centerX ≥ 700) so it never overlaps with the city.
 * Supports both box-primitive furniture and optional GLB6 furniture pieces.
 */
import React, { Suspense } from 'react';
import { INTERIORS } from './interiors';
import { useGameStore } from './useGameStore';
import { FittedGLB, glbUrl } from './glbModels';

const WALL_THICK = 0.25;

export function InteriorRoom() {
  const interiorId = useGameStore((s) => s.interiorId);
  if (!interiorId) return null;

  const layout = INTERIORS[interiorId];
  if (!layout) return null;

  const { centerX, centerZ, roomW, roomH, roomD,
          furniture, lightColor, lightIntensity,
          floorColor, wallColor,
          exitOffsetX, exitOffsetZ } = layout;

  const hw = roomW / 2;
  const hd = roomD / 2;

  return (
    <group position={[centerX, 0, centerZ]}>

      {/* ── Lighting ───────────────────────────────────────────────── */}
      <ambientLight intensity={0.55} color={lightColor} />
      <pointLight
        color={lightColor}
        intensity={lightIntensity * 18}
        distance={Math.max(roomW, roomD) * 2.5}
        decay={2}
        position={[0, roomH - 0.4, 0]}
        castShadow
      />

      {/* ── Floor ──────────────────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[roomW, roomD]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      {/* ── Ceiling ────────────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, roomH, 0]}>
        <planeGeometry args={[roomW, roomD]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* ── Back wall ──────────────────────────────────────────────── */}
      <mesh castShadow receiveShadow position={[0, roomH / 2, -hd]}>
        <boxGeometry args={[roomW + WALL_THICK * 2, roomH, WALL_THICK]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* ── Left wall ──────────────────────────────────────────────── */}
      <mesh castShadow receiveShadow position={[-hw, roomH / 2, 0]}>
        <boxGeometry args={[WALL_THICK, roomH, roomD]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* ── Right wall ─────────────────────────────────────────────── */}
      <mesh castShadow receiveShadow position={[hw, roomH / 2, 0]}>
        <boxGeometry args={[WALL_THICK, roomH, roomD]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* ── Front wall — two segments framing the exit door ─────────── */}
      {/* Left segment */}
      <mesh castShadow receiveShadow position={[exitOffsetX - roomW / 4 - 0.5, roomH / 2, hd]}>
        <boxGeometry args={[roomW / 2 - 1, roomH, WALL_THICK]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Right segment */}
      <mesh castShadow receiveShadow position={[exitOffsetX + roomW / 4 + 0.5, roomH / 2, hd]}>
        <boxGeometry args={[roomW / 2 - 1, roomH, WALL_THICK]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Lintel above door */}
      <mesh castShadow receiveShadow position={[exitOffsetX, roomH - 0.5, hd]}>
        <boxGeometry args={[2.2, 1, WALL_THICK]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* ── Box-primitive furniture ─────────────────────────────────── */}
      {furniture.map((f, i) => (
        <mesh key={i} castShadow receiveShadow position={f.pos}>
          <boxGeometry args={f.size} />
          <meshStandardMaterial
            color={f.color}
            roughness={f.roughness ?? 0.8}
            metalness={f.metalness ?? 0}
            emissive={f.emissive ?? '#000000'}
            emissiveIntensity={f.emissiveIntensity ?? 0}
          />
        </mesh>
      ))}

      {/* ── GLB6 furniture models ────────────────────────────────────── */}
      {layout.glbFurniture?.map((gf, i) => (
        <group key={`glb-${i}`} position={gf.pos} rotation={[0, gf.rotY ?? 0, 0]}>
          <Suspense fallback={null}>
            <FittedGLB url={glbUrl('glb6', gf.model)} targetSize={gf.scale ?? 1.4} />
          </Suspense>
        </group>
      ))}

      {/* ── Exit door glow marker ───────────────────────────────────── */}
      <group position={[exitOffsetX, 0, exitOffsetZ]}>
        {/* Door frame glow */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[1.8, 3, 0.08]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.35} />
        </mesh>
        {/* Side pillars */}
        <mesh position={[-0.95, 1.5, 0]}>
          <boxGeometry args={[0.1, 3.2, 0.1]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.95, 1.5, 0]}>
          <boxGeometry args={[0.1, 3.2, 0.1]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
        </mesh>
        <pointLight color="#00ff88" intensity={6} distance={5} decay={2} position={[0, 2, 0]} />
      </group>
    </group>
  );
}
