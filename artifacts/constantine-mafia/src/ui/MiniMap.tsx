import React, { memo, useMemo } from 'react';
import { useGameStore } from '../game/useGameStore';
import {
  WORLD_BOUNDS, LANDMARKS, MAP_DISTRICTS, clampDistrictRect,
  HIGHWAY, GORGE, BRIDGE, districtAt,
} from '../game/mapData';

const { x0: WX0, x1: WX1, z0: WZ0, z1: WZ1 } = WORLD_BOUNDS;
const WW = WX1 - WX0;
const WH = WZ1 - WZ0;
const SW = 110; const SH = 110;

function wx(x: number) { return ((x - WX0) / WW) * SW; }
function wz(z: number) { return ((z - WZ0) / WH) * SH; }

/**
 * Static base layer (district zones, gorge, bridge, highway, landmark
 * icons, compass) — none of this depends on the player's position, so it's
 * computed once and memoized. Previously it was rebuilt from scratch on
 * every ~10Hz position sync tick even though only the player arrow moves;
 * splitting it out avoids ~15+ needless SVG element reconciliations per
 * update on a HUD element that's always on screen.
 */
const StaticMapLayer = memo(function StaticMapLayer({ district }: { district: string | null }) {
  return (
    <>
      <rect x={0} y={0} width={SW} height={SH} fill="#06060f" />

      {/* District fill zones — real bounds from game/constants.ts, clamped to the drawable world */}
      {MAP_DISTRICTS.map((d) => {
        const r = clampDistrictRect(d.bounds);
        if (r.x1 <= r.x0 || r.z1 <= r.z0) return null;
        return (
          <rect
            key={d.id}
            x={wx(r.x0)} y={wz(r.z0)}
            width={Math.max(1, wx(r.x1) - wx(r.x0))}
            height={Math.max(1, wz(r.z1) - wz(r.z0))}
            fill={d.color}
            fillOpacity={district === d.id ? 0.22 : 0.06}
            stroke={d.color}
            strokeWidth={district === d.id ? 0.8 : 0.3}
            strokeOpacity={0.6}
          />
        );
      })}

      {/* Gorge */}
      <rect x={wx(GORGE.x0)} y={wz(GORGE.z0)} width={Math.max(1, wx(GORGE.x1) - wx(GORGE.x0))} height={Math.max(1, wz(GORGE.z1) - wz(GORGE.z0))} fill="#020208" />

      {/* Bridge */}
      <line x1={wx(BRIDGE.x0)} y1={wz(BRIDGE.z)} x2={wx(BRIDGE.x1)} y2={wz(BRIDGE.z)} stroke="#888" strokeWidth={1} />

      {/* Highway */}
      <line x1={wx(HIGHWAY.x0)} y1={wz(HIGHWAY.z)} x2={wx(HIGHWAY.x1)} y2={wz(HIGHWAY.z)} stroke="#1a1a2a" strokeWidth={1.5} />

      {/* Landmark icons: Police, Hospital, Shops, and other real-world doors */}
      {LANDMARKS.map((m) => (
        <text key={m.id} x={wx(m.x)} y={wz(m.z) + 1.6} fontSize={5} textAnchor="middle">{m.icon}</text>
      ))}

      {/* Compass N */}
      <text x={SW - 7} y={8} fill="#444" fontSize={5.5} fontFamily="monospace" textAnchor="middle">N</text>
    </>
  );
});

export const MiniMap = memo(function MiniMap() {
  const [px, , pz] = useGameStore((s) => s.playerPosition);
  const rotY       = useGameStore((s) => s.playerRotationY);
  const district   = districtAt(px, pz);

  const mx = wx(px);
  const mz = wz(pz);

  const sin = Math.sin(rotY);
  const cos = Math.cos(rotY);
  const tip = { x: mx - sin * 5,  y: mz - cos * 5  };
  const lr  = { x: mx + cos * 3,  y: mz - sin * 3  };
  const ll  = { x: mx - cos * 3,  y: mz + sin * 3  };

  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
      shapeRendering="crispEdges"
    >
      <StaticMapLayer district={district} />

      {/* Player arrow — the only part that actually needs to re-render on each position sync */}
      <polygon
        points={`${tip.x},${tip.y} ${lr.x},${lr.y} ${ll.x},${ll.y}`}
        fill="#00ff88"
        stroke="#000"
        strokeWidth={0.5}
      />
    </svg>
  );
});
