---
name: Player rotation convention
description: The correct atan2 formula for rotating the player to face the direction of movement, and why the vehicles use the same convention.
---

## The rule

Player (and NPC) rotation must use:
```ts
Math.atan2(-direction.x, -direction.z)
```

**Do NOT use** `Math.atan2(direction.x, direction.z)` — that produces a rotation π radians off, making the character face opposite to its movement direction and placing the third-person camera in front of the face.

## Why

Three.js uses local **-Z as the forward axis** for meshes at `rotation.y = 0`. The Vehicles code already encodes this correctly:
```ts
fwd.set(-Math.sin(rotY), 0, -Math.cos(rotY))  // moves along local -Z
```

For the player pressing W, `direction.z = -1`. To make the character face -Z (local forward), the rotation must be `atan2(0, 1) = 0`, i.e. `atan2(-direction.x, -direction.z)`.

The camera's `_forward` vector `-sin(rotY), 0, -cos(rotY)` is also consistent with this convention.

## How to apply

Apply to any character, NPC, or agent that computes `targetAngle` from a `direction` vector and calls `rotation.y += (targetAngle - rotation.y) * factor * delta`.
