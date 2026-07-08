---
name: NPC ref pattern (R3F / Babel)
description: How to correctly pass callback refs to R3F components, and how to ensure NPCs appear at their spawn positions on the first frame.
---

## Callback ref in JSX — avoid casts

The Babel JSX parser chokes on `as` type casts inside JSX attribute expressions:
```tsx
// BROKEN — Babel parse error inside JSX
groupRef={(el) => { refs.current[i] = el; } as unknown as React.RefObject<...>}
```

Instead, accept a plain callback prop:
```tsx
interface Props { onRef: (el: THREE.Group | null) => void; }
function NpcMesh({ onRef }: Props) { return <group ref={onRef} .../>; }
// caller:
<NpcMesh onRef={(el) => { refs.current[i] = el; }} />
```

## Always write transforms every frame (including wait phase)

NPC state starts with `waitTimer = 0` and `dist < 0.3`, so on the first frames the code picks a waypoint and returns **before** writing `group.position`. This leaves NPCs at world origin.

Fix: always call `group.position.set(s.x, 1, s.z)` and `group.rotation.y = s.rotY` before returning, even in the wait branch.

## THREE.AudioContext.getContext() type cast

`THREE.AudioContext.getContext()` returns a Three.js internal type, not the Web Audio `AudioContext`. Cast it:
```ts
const ctx = THREE.AudioContext.getContext() as unknown as AudioContext;
```
