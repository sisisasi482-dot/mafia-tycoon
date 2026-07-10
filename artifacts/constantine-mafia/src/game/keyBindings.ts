/**
 * Default keyboard bindings — the single source of truth shared by
 * `Player.tsx` (builds the live `ControlsMap`) and `/config/platforms/pc.config.ts`
 * (documents/exposes the PC input scheme). Kept in its own module so the
 * platform-config layer can read it without importing R3F/game code.
 */
export const DEFAULT_BINDINGS: Record<string, string[]> = {
  forward:  ['ArrowUp',    'KeyW'],
  back:     ['ArrowDown',  'KeyS'],
  left:     ['ArrowLeft',  'KeyA'],
  right:    ['ArrowRight', 'KeyD'],
  jump:     ['Space'],
  sprint:   ['ShiftLeft'],
  interact: ['KeyE'],
  attack:   ['KeyF'],
  map:      ['KeyM'],
  escape:   ['Escape'],
};
