/**
 * City — renders the open-world city geometry.
 *
 * Buildings are sourced from the shared BUILDINGS array in buildings.ts so that
 * City.tsx visuals and Player.tsx AABB collision boxes are always in sync.
 * Door-trigger markers are rendered from DOOR_TRIGGERS in interiors.ts.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from './buildings';
import { DOOR_TRIGGERS } from './interiors';
import { generateBuildingTextures, disposeBuildingTextures } from './buildingTextures';

export function City() {
  // ── Texture pool ─────────────────────────────────────────────────────────────
  const texPool = useMemo(() => generateBuildingTextures(), []);
  useEffect(() => () => disposeBuildingTextures(texPool), [texPool]);

  // ── Roads ────────────────────────────────────────────────────────────────────
  const roads = useMemo(() => [
    { x: -30,  y: 0.02, z: 0,   w: 560, d: 24  },
    { x: 0,    y: 0.02, z: 50,  w: 24,  d: 400 },
    { x: 50,   y: 0.02, z: 0,   w: 24,  d: 200 },
    { x: -150, y: 0.02, z: 120, w: 24,  d: 240 },
    { x: -230, y: 0.02, z: 0,   w: 24,  d: 200 },
  ], []);

  // ── Street lights ────────────────────────────────────────────────────────────
  const streetLights = useMemo(() => {
    const lights: { x: number; z: number }[] = [];
    for (let x = -290; x < 240; x += 25) {
      lights.push({ x, z: -12 });
      lights.push({ x, z: 12 });
    }
    for (let z = -90; z < 90; z += 25) {
      lights.push({ x: 0, z });
      lights.push({ x: 50, z });
    }
    return lights;
  }, []);

  return (
    <group>
      {/* ── Ground ───────────────────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#1e1e22" roughness={0.95} />
      </mesh>

      {/* ── Roads ────────────────────────────────────────────────────── */}
      {roads.map((r, i) => (
        <mesh key={`road-${i}`} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[r.x, r.y, r.z]}>
          <planeGeometry args={[r.w, r.d]} />
          <meshStandardMaterial color="#111118" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Runway ───────────────────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-150, 0.03, 200]}>
        <planeGeometry args={[30, 300]} />
        <meshStandardMaterial color="#0a0a10" roughness={0.8} />
      </mesh>

      {/* ── Gorge ────────────────────────────────────────────────────── */}
      <mesh position={[160, -10, 0]}>
        <boxGeometry args={[44, 22, 200]} />
        <meshStandardMaterial color="#050508" />
      </mesh>

      {/* ── Sidi M'Cid Bridge deck ───────────────────────────────────── */}
      <mesh castShadow receiveShadow position={[160, 5.5, 0]}>
        <boxGeometry args={[44, 1.2, 9]} />
        <meshStandardMaterial color="#555555" roughness={0.7} />
      </mesh>
      {[-12, -6, 0, 6, 12].map((zOff, i) => (
        <mesh key={`cable-${i}`} position={[160, 15, zOff]}>
          <boxGeometry args={[44, 0.3, 0.3]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      ))}

      {/* ── Airport structures ───────────────────────────────────────── */}
      <mesh castShadow receiveShadow position={[-150, 5, 155]}>
        <boxGeometry args={[80, 10, 30]} />
        <meshStandardMaterial color="#d0d8e0" emissive="#a0d0ff" emissiveIntensity={0.3} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[-150, 8, 140]}>
        <boxGeometry args={[30, 16, 20]} />
        <meshStandardMaterial color="#c0c8d0" emissive="#80b0ff" emissiveIntensity={0.4} roughness={0.7} />
      </mesh>
      {/* ATC Tower */}
      <mesh castShadow position={[-110, 15, 160]}>
        <boxGeometry args={[6, 30, 6]} />
        <meshStandardMaterial color="#888888" emissive="#00ffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-110, 32, 160]}>
        <boxGeometry args={[10, 4, 10]} />
        <meshStandardMaterial color="#aaaaaa" emissive="#00ffff" emissiveIntensity={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`hangar-${i}`} castShadow position={[-190 + i * 25, 7, 175]}>
          <boxGeometry args={[20, 14, 35]} />
          <meshStandardMaterial color="#606870" emissive="#ffffff" emissiveIntensity={0.1} roughness={0.8} />
        </mesh>
      ))}

      {/* Bridge pylons */}
      <mesh castShadow position={[145, 20, 0]}>
        <boxGeometry args={[5, 50, 7]} />
        <meshStandardMaterial color="#444444" emissive="#ffffff" emissiveIntensity={0.05} />
      </mesh>
      <mesh castShadow position={[175, 20, 0]}>
        <boxGeometry args={[5, 50, 7]} />
        <meshStandardMaterial color="#444444" emissive="#ffffff" emissiveIntensity={0.05} />
      </mesh>

      {/* ── Buildings (from shared BUILDINGS — aligned with collision AABBs) ── */}
      {BUILDINGS.map((b, i) => {
        const tex = b.texKey ? texPool[b.texKey]?.[b.texIdx] : undefined;
        return (
          <mesh key={`b-${i}`} castShadow receiveShadow position={[b.x, b.h / 2, b.z]}>
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

      {/* ── Door trigger markers ─────────────────────────────────────── */}
      {DOOR_TRIGGERS.map((dt) => (
        <group key={dt.id} position={[dt.worldX, 0, dt.worldZ]}>
          {/* Glowing door arch */}
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[1.6, 3, 0.12]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.55} />
          </mesh>
          {/* Left pillar */}
          <mesh position={[-0.85, 1.5, 0]}>
            <boxGeometry args={[0.12, 3.2, 0.12]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.8} />
          </mesh>
          {/* Right pillar */}
          <mesh position={[0.85, 1.5, 0]}>
            <boxGeometry args={[0.12, 3.2, 0.12]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.8} />
          </mesh>
          {/* Ground ring pulse — tiny disc */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[dt.radius * 0.4, 16]} />
            <meshBasicMaterial color={dt.color} transparent opacity={0.18} />
          </mesh>
          <pointLight color={dt.color} intensity={4} distance={8} decay={2} position={[0, 2.5, 0]} />
        </group>
      ))}

      {/* ── District boundary markers ─────────────────────────────────── */}
      {[
        { x: -125, z: 0,   color: '#ff8c00' },
        { x:   25, z: 0,   color: '#ffd700' },
        { x:  160, z: 0,   color: '#dc143c' },
        { x: -250, z: 0,   color: '#808080' },
        { x: -150, z: 175, color: '#4169e1' },
      ].map((m, i) => (
        <mesh key={`marker-${i}`} position={[m.x, 0.1, m.z]}>
          <boxGeometry args={[2, 0.2, 2]} />
          <meshBasicMaterial color={m.color} />
        </mesh>
      ))}

      {/* ── Street lights ────────────────────────────────────────────── */}
      {streetLights.map((sl, i) => (
        <group key={`sl-${i}`} position={[sl.x, 0, sl.z]}>
          <mesh castShadow position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 7, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 7.2, 0]}>
            <boxGeometry args={[2, 0.2, 0.2]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[1, 7, 0]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshBasicMaterial color="#ff9240" />
          </mesh>
          <pointLight position={[1, 6.5, 0]} color="#ff9240" intensity={8} distance={35} decay={2} />
        </group>
      ))}

      {/* ── Airport runway lights ─────────────────────────────────────── */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={`rl-${i}`} position={[-150, 0.05, 80 + i * 14]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}
