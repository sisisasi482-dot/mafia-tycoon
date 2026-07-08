---
name: Camera-relative movement yaw source
description: Which yaw to use for WASD movement depending on camera mode.
---

## Rule
Derive WASD movement forward/right vectors from `cameraDrag.yaw` **only in third-person** mode. In first- and second-person modes, use `innerRef.current.rotation.y` (the player's own facing direction) instead.

**Why:** In third-person the camera orbits independently of the player, so movement must follow the orbit yaw. In first/second-person the camera tracks the player's own heading (`rotation.y`), and `cameraDrag.yaw` is not updated to stay in sync — using it causes the movement direction to misalign with what the player sees.

**How to apply:**
```ts
const moveYaw = (cameraMode === 'third')
  ? cameraDrag.yaw
  : innerRef.current.rotation.y;
```
Also: normalize `cameraDrag.yaw` to `[-π, π]` after each update (e.g., in Camera.tsx mouse drag handler) to prevent long-session floating-point drift.
