import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { DISTRICTS, t } from '../game/constants';

// World bounds: X -300..250, Z -150..250
const WORLD = { x0: -300, x1: 250, z0: -150, z1: 250 };
const W = 600;
const H = 450;

function worldToSvg(wx: number, wz: number) {
  const sx = ((wx - WORLD.x0) / (WORLD.x1 - WORLD.x0)) * W;
  const sy = ((wz - WORLD.z0) / (WORLD.z1 - WORLD.z0)) * H;
  return { sx, sy };
}

const DISTRICT_SHAPES = [
  {
    id: 'ain_mlila',
    name: "Ain M'lila",
    color: '#808080',
    wx0: -300, wx1: -200, wz0: -100, wz1: 100,
  },
  {
    id: 'ali_mendjeli',
    name: 'Ali Mendjeli',
    color: '#ff8c00',
    wx0: -200, wx1: -50, wz0: -100, wz1: 100,
  },
  {
    id: 'airport',
    name: 'Airport',
    color: '#4169e1',
    wx0: -200, wx1: -100, wz0: 100, wz1: 250,
  },
  {
    id: 'centre_ville',
    name: 'Centre-Ville',
    color: '#ffd700',
    wx0: -50, wx1: 100, wz0: -100, wz1: 100,
  },
  {
    id: 'old_city',
    name: 'Old City',
    color: '#dc143c',
    wx0: 100, wx1: 250, wz0: -50, wz1: 50,
  },
];

// Static mission blips
const MISSION_BLIPS = [
  { wx: -120, wz: 20, label: 'M', color: '#ff0' },
  { wx: 30,   wz: -30, label: 'M', color: '#ff0' },
  { wx: 150,  wz: 10,  label: 'M', color: '#ff0' },
];

export function MapView() {
  const store = useGameStore();
  const lang = store.language;
  const [px, , pz] = store.playerPosition;
  const { sx: playerX, sy: playerY } = worldToSvg(px, pz);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <h3 className="text-2xl font-bold text-white border-b border-white/10 pb-3">
        {t('map', lang)} — Constantine
      </h3>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative bg-[#0a0a12] border border-white/10 rounded-xl overflow-hidden shadow-2xl" style={{ width: W, maxWidth: '100%' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            {/* Background */}
            <rect x={0} y={0} width={W} height={H} fill="#0d0d18" />

            {/* Districts */}
            {DISTRICT_SHAPES.map((d) => {
              const { sx: x0, sy: y0 } = worldToSvg(d.wx0, d.wz0);
              const { sx: x1, sy: y1 } = worldToSvg(d.wx1, d.wz1);
              const rx = Math.min(x0, x1);
              const ry = Math.min(y0, y1);
              const rw = Math.abs(x1 - x0);
              const rh = Math.abs(y1 - y0);
              const cx = rx + rw / 2;
              const cy = ry + rh / 2;
              return (
                <g key={d.id}>
                  <rect
                    x={rx} y={ry} width={rw} height={rh}
                    fill={d.color}
                    fillOpacity={store.district === d.id ? 0.35 : 0.18}
                    stroke={d.color}
                    strokeWidth={store.district === d.id ? 2.5 : 1}
                    strokeOpacity={0.8}
                    rx={4}
                  />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={d.color}
                    fontSize={d.id === 'old_city' ? 10 : 12}
                    fontWeight="bold"
                    fontFamily="monospace"
                    style={{ textShadow: '0 0 6px #000' }}
                  >
                    {d.name}
                  </text>
                </g>
              );
            })}

            {/* Roads */}
            {/* Main highway */}
            <line
              x1={worldToSvg(-290, 0).sx} y1={worldToSvg(-290, 0).sy}
              x2={worldToSvg(240, 0).sx}  y2={worldToSvg(240, 0).sy}
              stroke="#333" strokeWidth={4}
            />
            {/* North avenue */}
            <line
              x1={worldToSvg(0, -100).sx} y1={worldToSvg(0, -100).sy}
              x2={worldToSvg(0, 100).sx}  y2={worldToSvg(0, 100).sy}
              stroke="#333" strokeWidth={3}
            />
            {/* Airport road */}
            <line
              x1={worldToSvg(-150, 100).sx} y1={worldToSvg(-150, 100).sy}
              x2={worldToSvg(-150, 250).sx}  y2={worldToSvg(-150, 250).sy}
              stroke="#334" strokeWidth={3}
            />
            {/* Gorge */}
            <rect
              x={worldToSvg(138, -50).sx} y={worldToSvg(138, -50).sy}
              width={worldToSvg(182, -50).sx - worldToSvg(138, -50).sx}
              height={worldToSvg(138, 50).sy - worldToSvg(138, -50).sy}
              fill="#060610"
            />
            {/* Bridge line */}
            <line
              x1={worldToSvg(138, 0).sx} y1={worldToSvg(138, 0).sy}
              x2={worldToSvg(182, 0).sx}  y2={worldToSvg(182, 0).sy}
              stroke="#888" strokeWidth={3} strokeDasharray="6 3"
            />
            <text x={worldToSvg(160, 0).sx} y={worldToSvg(160, -8).sy}
              textAnchor="middle" fill="#aaa" fontSize={8} fontFamily="monospace">
              Sidi M'Cid
            </text>

            {/* Mission blips */}
            {MISSION_BLIPS.map((b, i) => {
              const { sx, sy } = worldToSvg(b.wx, b.wz);
              return (
                <g key={`blip-${i}`}>
                  <circle cx={sx} cy={sy} r={8} fill={b.color} fillOpacity={0.25} stroke={b.color} strokeWidth={1.5} />
                  <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fill={b.color} fontSize={8} fontWeight="bold" fontFamily="monospace">
                    {b.label}
                  </text>
                </g>
              );
            })}

            {/* Player marker */}
            <g transform={`translate(${playerX}, ${playerY})`}>
              <circle r={10} fill="#00ff88" fillOpacity={0.25} stroke="#00ff88" strokeWidth={2} />
              <polygon points="0,-7 5,5 -5,5" fill="#00ff88" />
            </g>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
        {DISTRICT_SHAPES.map((d) => (
          <div key={d.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-xs text-gray-400">{d.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#00ff88]" />
          <span className="text-xs text-gray-400">You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-400" />
          <span className="text-xs text-gray-400">Mission</span>
        </div>
      </div>
    </div>
  );
}
