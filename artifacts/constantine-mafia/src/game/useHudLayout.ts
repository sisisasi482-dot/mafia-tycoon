import { useCallback, useEffect, useRef, useState } from 'react';

export interface ElementLayout {
  x: number;    // px from left edge of game container
  y: number;    // px from top edge of game container
  opacity: number;  // 0–1
  width: number;  // px
  height: number; // px
}

export type HudLayoutMap = Record<string, ElementLayout>;

/** Default positions (designed for 390×844 mobile viewport) */
export const DEFAULT_HUD_LAYOUT: HudLayoutMap = {
  // Health bar anchors the top-left corner; wanted stars sit directly beneath it.
  health:   { x: 12,  y: 12,  opacity: 1, width: 180, height: 56  },
  wanted:   { x: 12,  y: 74,  opacity: 1, width: 180, height: 36  },
  money:    { x: 200, y: 12,  opacity: 1, width: 200, height: 80  },
  minimap:  { x: 260, y: 100, opacity: 1, width: 120, height: 120 },
  hints:    { x: 120, y: 740, opacity: 1, width: 160, height: 40  },
  ammo:     { x: 220, y: 700, opacity: 1, width: 160, height: 48  },
};

const LS_KEY = 'constantine-hud-layout';

function loadFromStorage(): HudLayoutMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_HUD_LAYOUT, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_HUD_LAYOUT };
}

function saveToStorage(layout: HudLayoutMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(layout));
  } catch {}
}

export function useHudLayout() {
  const [layout, setLayout] = useState<HudLayoutMap>(loadFromStorage);

  const updateElement = useCallback((id: string, patch: Partial<ElementLayout>) => {
    setLayout((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? DEFAULT_HUD_LAYOUT[id]), ...patch } };
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    const def = { ...DEFAULT_HUD_LAYOUT };
    setLayout(def);
    saveToStorage(def);
  }, []);

  return { layout, updateElement, resetLayout };
}

/**
 * useDraggable — returns pointer-event props for a draggable HUD element.
 * Calls onMove(dx, dy) with delta pixels while dragging.
 * Calls onEnd() when the drag is released.
 */
export function useDraggable(
  editMode: boolean,
  onMove: (dx: number, dy: number) => void,
  onEnd: () => void,
) {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!editMode) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.stopPropagation();
    },
    [editMode],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      onMove(dx, dy);
    },
    [onMove],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      onEnd();
    },
    [onEnd],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
