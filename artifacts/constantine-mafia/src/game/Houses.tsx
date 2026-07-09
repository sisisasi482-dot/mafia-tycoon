/**
 * Standalone purchasable house and garage exteriors.
 * Placed in the suburb zone south-east of Old City (x: 220–420, z: 130–200)
 * — clear of all procedural building districts.
 *
 * Ownership state from useGameStore changes door colour and adds a green point light.
 */
import React from 'react';
import * as THREE from 'three';
import { useGameStore } from './useGameStore';

// ─── House definitions ────────────────────────────────────────────────────────

interface HouseDef {
  id:        string;
  x:         number;
  z:         number;
  rotY:      number;
  w:         number; // footprint width
  d:         number; // footprint depth
  h:         number; // wall height
  wallColor: string;
  roofColor: string;
}

interface GarageDef {
  id:   string;
  x:    number;
  z:    number;
  rotY: number;
}

const HOUSES: HouseDef[] = [
  { id: 'house_1', x: 250, z: 150, rotY: 0,            w: 12, d: 10, h: 6,   wallColor: '#e8d8b8', roofColor: '#8b3a2a' },
  { id: 'house_2', x: 320, z: 170, rotY: Math.PI / 6,  w: 13, d: 10, h: 6.5, wallColor: '#d0c8a0', roofColor: '#5a4a3a' },
  { id: 'house_3', x: 400, z: 140, rotY: -Math.PI / 8, w: 14, d: 11, h: 7,   wallColor: '#c8c0d0', roofColor: '#3a3a4a' },
];

const GARAGES: GarageDef[] = [
  { id: 'garage_1', x: 280, z: 192, rotY: 0 },
  { id: 'garage_2', x: 360, z: 192, rotY: 0 },
];

// ─── House exterior ───────────────────────────────────────────────────────────

function HouseExterior({ def }: { def: HouseDef }) {
  const owned = useGameStore((s) => s.ownedAssetIds.includes(def.id));

  return (
    <group position={[def.x, 0, def.z]} rotation={[0, def.rotY, 0]}>
      {/* ── Main walls ──────────────────────────────────────────────────── */}
      <mesh castShadow receiveShadow position={[0, def.h / 2, 0]}>
        <boxGeometry args={[def.w, def.h, def.d]} />
        <meshStandardMaterial color={def.wallColor} roughness={0.82} />
      </mesh>

      {/* ── Sloped roof (two angled half-planes) ────────────────────────── */}
      <mesh castShadow position={[0, def.h + 0.9, -def.d * 0.2]} rotation={[Math.PI / 5, 0, 0]}>
        <boxGeometry args={[def.w + 1.2, 0.28, def.d * 0.65]} />
        <meshStandardMaterial color={def.roofColor} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, def.h + 0.9,  def.d * 0.2]} rotation={[-Math.PI / 5, 0, 0]}>
        <boxGeometry args={[def.w + 1.2, 0.28, def.d * 0.65]} />
        <meshStandardMaterial color={def.roofColor} roughness={0.72} />
      </mesh>

      {/* ── Windows (front face) ────────────────────────────────────────── */}
      {[-def.w * 0.28, def.w * 0.28].map((wx, i) => (
        <mesh key={i} position={[wx, def.h * 0.55, def.d / 2 + 0.06]}>
          <boxGeometry args={[1.6, 1.6, 0.1]} />
          <meshStandardMaterial
            color="#88ccff"
            emissive="#4499ff"
            emissiveIntensity={owned ? 0.7 : 0.2}
          />
        </mesh>
      ))}

      {/* ── Front door ──────────────────────────────────────────────────── */}
      <mesh position={[0, 1.25, def.d / 2 + 0.06]}>
        <boxGeometry args={[1.4, 2.5, 0.12]} />
        <meshStandardMaterial color={owned ? '#2a8a3a' : '#5a3a2a'} roughness={0.6} />
      </mesh>

      {/* ── Garden fence posts ──────────────────────────────────────────── */}
      {Array.from({ length: 10 }, (_, i) => {
        const t     = i / 9;
        const fenceX = (t - 0.5) * (def.w + 2);
        return (
          <mesh key={i} castShadow position={[fenceX, 0.5, def.d / 2 + 2]}>
            <boxGeometry args={[0.12, 1.0, 0.12]} />
            <meshStandardMaterial color="#5a4a30" />
          </mesh>
        );
      })}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, def.d / 2 + 2]}>
        <planeGeometry args={[def.w + 2, 3]} />
        <meshStandardMaterial color="#3a6b2a" roughness={0.95} />
      </mesh>

      {/* ── Steps ───────────────────────────────────────────────────────── */}
      <mesh castShadow receiveShadow position={[0, 0.2, def.d / 2 + 0.8]}>
        <boxGeometry args={[2.2, 0.4, 1.2]} />
        <meshStandardMaterial color="#b0a890" roughness={0.9} />
      </mesh>

      {/* ── Ownership glow ──────────────────────────────────────────────── */}
      {owned && (
        <pointLight position={[0, def.h + 2.5, 0]} color="#33ff66" intensity={6} distance={18} decay={2} />
      )}
    </group>
  );
}

// ─── Garage exterior ──────────────────────────────────────────────────────────

function GarageExterior({ def }: { def: GarageDef }) {
  const owned = useGameStore((s) => s.ownedAssetIds.includes(def.id));

  return (
    <group position={[def.x, 0, def.z]} rotation={[0, def.rotY, 0]}>
      {/* Shell */}
      <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
        <boxGeometry args={[8.5, 3.2, 7]} />
        <meshStandardMaterial color="#6a6a6a" roughness={0.88} />
      </mesh>

      {/* Roll-up door */}
      <mesh position={[0, 1.4, 3.55]}>
        <boxGeometry args={[5.5, 2.6, 0.12]} />
        <meshStandardMaterial color={owned ? '#3a9a4a' : '#2a2a2a'} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Door slat lines */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.38, 3.62]}>
          <boxGeometry args={[5.5, 0.05, 0.06]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}

      {/* Small window above door */}
      <mesh position={[0, 2.8, 3.56]}>
        <boxGeometry args={[2.5, 0.6, 0.1]} />
        <meshStandardMaterial color="#88ccee" transparent opacity={0.5} />
      </mesh>

      {owned && (
        <pointLight position={[0, 3.8, 0]} color="#33ff66" intensity={4} distance={12} decay={2} />
      )}
    </group>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function Houses() {
  return (
    <>
      {HOUSES.map((h) => <HouseExterior key={h.id} def={h} />)}
      {GARAGES.map((g) => <GarageExterior key={g.id} def={g} />)}
    </>
  );
}
