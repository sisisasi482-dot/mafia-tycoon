import { useEffect, useState } from 'react';
import { useGameStore } from './useGameStore';

function bucket(pos: readonly [number, number, number], cellSize: number): [number, number] {
  return [Math.round(pos[0] / cellSize) * cellSize, Math.round(pos[2] / cellSize) * cellSize];
}

/**
 * Returns the player's [x, z] position snapped to a grid cell.
 * Components that only care about "is the player roughly near here"
 * (for culling far-away buildings/lights) should use this instead of
 * subscribing to raw `playerPosition`, so they only re-render a few
 * times a second (when the player crosses into a new cell) instead of
 * on every position sync tick (~10/sec) regardless of movement.
 *
 * Implemented via manual store subscription (rather than the
 * `useStore(selector, equalityFn)` overload) so it behaves the same
 * across zustand v4/v5 without depending on a specific API shape.
 */
export function useBucketedPlayerPos(cellSize = 50): [number, number] {
  const [cell, setCell] = useState<[number, number]>(() =>
    bucket(useGameStore.getState().playerPosition, cellSize),
  );

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const next = bucket(s.playerPosition, cellSize);
      setCell((prev) => (prev[0] === next[0] && prev[1] === next[1] ? prev : next));
    });
    return unsub;
  }, [cellSize]);

  return cell;
}
