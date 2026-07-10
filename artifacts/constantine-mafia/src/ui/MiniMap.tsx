import React, { memo } from 'react';
import { useGameStore } from '../game/useGameStore';
import { BUILDINGS } from '../game/buildings';

const WX0 = -300; const WX1 = 250;
const WZ0 = -150; const WZ1 = 250;
const WW = WX1 - WX0;
const WH = WZ1 - WZ0;
const SW = 110; const SH = 110;

function wx(x: number) { return ((x - WX0) / WW) * SW; }
function wz(z: number) { return ((z - WZ0) / WH) * SH; }

const DISTRICT_COLORS: Record<string, string> = {
  ali_mendjeli: '#ff8c00',
  centre_ville: '#ffd700',
  old_city:     '#dc143c',
  ain_mlila:    '#808080',
  airport:      '#4169e1',
};

const DISTRICTS = [
  { id: 'ain_mlila',    x0: -300, x1: -200, z0: -100, z1:  100 },
  { id: 'ali_mendjeli', x0: -200, x1:  -50, z0: -100, z1:  100 },
  { id: 'airport',      x0: -200, x1: -100, z0:  100, z1:  250 },
  { id: 'centre_ville', x0:  -50, x1:  100, z0: -100, z1:  100 },
  { id: 'old_city',     x0:  100, x1:  250, z0:  -50, z1:   50 },
];

/** Physical store icons shown on the minimap (mirrors interiors.ts NPC/door positions). */
const STORE_MARKERS = [
  { icon: '🔫', x: -160, z:  40 },
  { icon: '🚗', x:  140, z:  40 },
  { icon: '⚕', x:  -90, z: -50 },
  { icon: '👮', x:   60, z: 108 },
];

export const MiniMap = memo(function MiniMap() {
  const [px, , pz] = useGameStore((s) => s.playerPosition);
  const rotY       = useGameStore((s) => s.playerRotationY);
  const district   = useGameStore((s) => s.district);

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
      <rect x={0} y={0} width={SW} height={SH} fill="#06060f" />

      {/* District fill zones */}
      {DISTRICTS.map((d) => (
        <rect
          key={d.id}
          x={wx(d.x0)} y={wz(d.z0)}
          width={Math.max(1, wx(d.x1) - wx(d.x0))}
          height={Math.max(1, wz(d.z1) - wz(d.z0))}
          fill={DISTRICT_COLORS[d.id]}
          fillOpacity={district === d.id ? 0.22 : 0.08}
          stroke={DISTRICT_COLORS[d.id]}
          strokeWidth={district === d.id ? 0.8 : 0.3}
          strokeOpacity={0.6}
        />
      ))}

      {/* Building footprints */}
      {BUILDINGS.map((b, i) => (
        <rect
          key={i}
          x={wx(b.x - b.w / 2)}
          y={wz(b.z - b.d / 2)}
          width={Math.max(0.6, (b.w / WW) * SW)}
          height={Math.max(0.6, (b.d / WH) * SH)}
          fill={DISTRICT_COLORS[b.district]}
          fillOpacity={0.55}
        />
      ))}

      {/* Airport terminal */}
      <rect x={wx(-190)} y={wz(140)} width={wx(-110) - wx(-190)} height={wz(170) - wz(140)} fill="#4169e1" fillOpacity={0.6} />

      {/* Gorge */}
      <rect x={wx(138)} y={wz(-50)} width={Math.max(1, wx(182) - wx(138))} height={Math.max(1, wz(50) - wz(-50))} fill="#020208" />

      {/* Bridge */}
      <line x1={wx(138)} y1={wz(0)} x2={wx(182)} y2={wz(0)} stroke="#888" strokeWidth={1} />

      {/* Main road */}
      <line x1={wx(-290)} y1={wz(0)} x2={wx(240)} y2={wz(0)} stroke="#1a1a2a" strokeWidth={1.5} />

      {/* Store icons */}
      {STORE_MARKERS.map((m, i) => (
        <text key={i} x={wx(m.x)} y={wz(m.z) + 1.6} fontSize={5} textAnchor="middle">{m.icon}</text>
      ))}

      {/* Player arrow */}
      <polygon
        points={`${tip.x},${tip.y} ${lr.x},${lr.y} ${ll.x},${ll.y}`}
        fill="#00ff88"
        stroke="#000"
        strokeWidth={0.5}
      />

      {/* Compass N */}
      <text x={SW - 7} y={8} fill="#444" fontSize={5.5} fontFamily="monospace" textAnchor="middle">N</text>
    </svg>
  );
});
