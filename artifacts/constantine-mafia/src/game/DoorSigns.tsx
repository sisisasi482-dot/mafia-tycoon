/**
 * DoorSigns — floating labels above every DOOR_TRIGGERS entry.
 *
 * DOOR_TRIGGERS previously had no physical/visual representation at all —
 * the "[E] Enter ..." hint only appeared once the player was already inside
 * the trigger radius, so buildings had no signage telling the player what
 * they even are from a distance. Reuses the same Html-label pattern already
 * used for shopkeeper name-tags (see NPCs.tsx ShopSign).
 */
import React from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from './useGameStore';
import { DOOR_TRIGGERS } from './interiors';

/** Signs only render for doors within this distance — keeps DOM/Html node count low. */
const SIGN_VISIBLE_RADIUS = 30;

function DoorSign({ label, color }: { label: string; color: string }) {
  return (
    <Html position={[0, 3.4, 0]} center distanceFactor={14} occlude={false}>
      <div
        style={{
          background: 'rgba(10,10,10,0.85)',
          border: `1px solid ${color}`,
          borderRadius: 6,
          padding: '4px 10px',
          color: '#fff',
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          letterSpacing: 0.3,
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        🚪 {label}
      </div>
    </Html>
  );
}

export function DoorSigns() {
  const screen  = useGameStore((s) => s.screen);
  const indoors = useGameStore((s) => s.indoors);
  const playerPosition = useGameStore((s) => s.playerPosition);

  if (screen !== 'playing' || indoors) return null;

  const [px, , pz] = playerPosition;
  const visible = DOOR_TRIGGERS.filter(
    (dt) => Math.hypot(dt.worldX - px, dt.worldZ - pz) < SIGN_VISIBLE_RADIUS,
  );

  return (
    <>
      {visible.map((dt) => (
        <group key={dt.id} position={[dt.worldX, 0, dt.worldZ]}>
          <DoorSign label={dt.label} color={dt.color} />
        </group>
      ))}
    </>
  );
}
