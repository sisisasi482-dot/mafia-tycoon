/**
 * Module-level shared camera drag state.
 * Written every frame by Camera.tsx; read every frame by Player.tsx.
 * Kept outside React/Zustand to avoid per-frame re-renders.
 */
export const cameraDrag = {
  /** Horizontal orbit angle in radians.  0 = camera sits at +Z offset (behind player when player faces -Z) */
  yaw: 0,
  /** Vertical pitch in radians.  0.25 ≈ slight downward look. Clamped 0..1.1 in Camera.tsx */
  pitch: 0.25,
};
