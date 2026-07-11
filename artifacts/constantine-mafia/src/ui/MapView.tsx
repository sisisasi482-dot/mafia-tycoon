import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { t } from '../game/constants';
import {
  WORLD_BOUNDS, LANDMARKS, MAP_DISTRICTS, clampDistrictRect,
  HIGHWAY, GORGE, BRIDGE, districtAt,
} from '../game/mapData';
import type { LandmarkCategory } from '../game/mapData';

const W = 600;
const H = 450;

function worldToSvg(wx: number, wz: number) {
  const sx = ((wx - WORLD_BOUNDS.x0) / (WORLD_BOUNDS.x1 - WORLD_BOUNDS.x0)) * W;
  const sy = ((wz - WORLD_BOUNDS.z0) / (WORLD_BOUNDS.z1 - WORLD_BOUNDS.z0)) * H;
  return { sx, sy };
}

const CATEGORY_LABELS: Record<LandmarkCategory, string> = {
  police:   'Police',
  hospital: 'Hospital',
  shop:     'Shop',
  property: 'Property',
  landmark: 'Landmark',
};

export function MapView() {
  const store = useGameStore();
  const lang = store.language;
  const [px, , pz] = store.playerPosition;
  const playerDistrict = districtAt(px, pz);
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

            {/* Districts — real bounds from game/constants.ts, clamped to the drawable world */}
            {MAP_DISTRICTS.map((d) => {
              const r = clampDistrictRect(d.bounds);
              if (r.x1 <= r.x0 || r.z1 <= r.z0) return null;
              const { sx: x0, sy: y0 } = worldToSvg(r.x0, r.z0);
              const { sx: x1, sy: y1 } = worldToSvg(r.x1, r.z1);
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
                    fillOpacity={playerDistrict === d.id ? 0.32 : 0.12}
                    stroke={d.color}
                    strokeWidth={playerDistrict === d.id ? 2.5 : 1}
                    strokeOpacity={0.8}
                    rx={4}
                  />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={d.color}
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="monospace"
                    style={{ textShadow: '0 0 6px #000' }}
                  >
                    {d.name}
                  </text>
                </g>
              );
            })}

            {/* Highway */}
            <line
              x1={worldToSvg(HIGHWAY.x0, HIGHWAY.z).sx} y1={worldToSvg(HIGHWAY.x0, HIGHWAY.z).sy}
              x2={worldToSvg(HIGHWAY.x1, HIGHWAY.z).sx} y2={worldToSvg(HIGHWAY.x1, HIGHWAY.z).sy}
              stroke="#333" strokeWidth={4}
            />

            {/* Gorge */}
            <rect
              x={worldToSvg(GORGE.x0, GORGE.z0).sx} y={worldToSvg(GORGE.x0, GORGE.z0).sy}
              width={worldToSvg(GORGE.x1, GORGE.z0).sx - worldToSvg(GORGE.x0, GORGE.z0).sx}
              height={worldToSvg(GORGE.x0, GORGE.z1).sy - worldToSvg(GORGE.x0, GORGE.z0).sy}
              fill="#060610"
            />
            {/* Bridge line */}
            <line
              x1={worldToSvg(BRIDGE.x0, BRIDGE.z).sx} y1={worldToSvg(BRIDGE.x0, BRIDGE.z).sy}
              x2={worldToSvg(BRIDGE.x1, BRIDGE.z).sx}  y2={worldToSvg(BRIDGE.x1, BRIDGE.z).sy}
              stroke="#888" strokeWidth={3} strokeDasharray="6 3"
            />
            <text x={worldToSvg((BRIDGE.x0 + BRIDGE.x1) / 2, BRIDGE.z).sx} y={worldToSvg(BRIDGE.x0, BRIDGE.z - 8).sy}
              textAnchor="middle" fill="#aaa" fontSize={8} fontFamily="monospace">
              {BRIDGE.label}
            </text>

            {/* Landmarks: Police Station, Hospital, Shops, and other real-world doors */}
            {LANDMARKS.map((m) => {
              const { sx, sy } = worldToSvg(m.x, m.z);
              return (
                <g key={m.id}>
                  <circle cx={sx} cy={sy} r={9} fill="#000" fillOpacity={0.45} stroke="#fff" strokeWidth={1} strokeOpacity={0.4} />
                  <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize={10}>{m.icon}</text>
                </g>
              );
            })}

            {/* Player marker — live position + heading */}
            <g transform={`translate(${playerX}, ${playerY}) rotate(${(store.playerRotationY * 180) / Math.PI})`}>
              <circle r={10} fill="#00ff88" fillOpacity={0.25} stroke="#00ff88" strokeWidth={2} />
              <polygon points="0,-7 5,5 -5,5" fill="#00ff88" />
            </g>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
        {MAP_DISTRICTS.map((d) => (
          <div key={d.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-xs text-gray-400">{d.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#00ff88]" />
          <span className="text-xs text-gray-400">You</span>
        </div>
        {LANDMARKS.map((m) => (
          <div key={m.id} className="flex items-center gap-1.5" title={CATEGORY_LABELS[m.category]}>
            <span className="text-xs">{m.icon}</span>
            <span className="text-xs text-gray-400">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
