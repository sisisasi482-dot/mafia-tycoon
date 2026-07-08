---
name: Vehicle system design
description: Key decisions and gotchas for the Constantine Mafia vehicle enter/exit + camera handoff system
---

## Forward-vector convention
Three.js objects face **-Z** by default. The vehicle body mesh has headlights at negative local Z (the "front"). The driving forward vector must therefore be:

```ts
new THREE.Vector3(-Math.sin(rotY), 0, -Math.cos(rotY))
```

Using `+sin/+cos` drives the car *backward* relative to its visual front. This is a non-obvious gotcha.

**Why:** Three.js camera and object default forward is -Z, but `Math.sin/cos` of rotY gives a +Z-biased vector at rotY=0.

## Camera handoff (player ↔ vehicle)
- `GameEngine` holds two refs: `targetRef` (Player's group) and `vehicleRef` (an invisible `<group ref={vehicleRef} />` anchor).
- `Camera` receives `inVehicle ? vehicleRef : targetRef`.
- When a vehicle is active, its `useFrame` copies `groupRef.current.position` into `activeVehicleRef.current` every frame.

**Why:** Swapping which ref the Camera follows is simpler than updating a shared mutable position object from two sources.

## Atomic enter/exit state
Vehicle enter and exit **must** use a single `setPlayerState({ inVehicle, equippedVehicleId, playerPosition, playerRotationY })` call. Two separate calls (`setPlayerState` then `setPlayerPosition`) risk the Player snap `useEffect` (which fires on `inVehicle` change) reading a stale `playerPosition` before the second update lands.

**How to apply:** Any future code that transitions inVehicle must include the new player position in the same store update.

## Touch controls EXIT button
The in-vehicle EXIT button in `TouchControls.tsx` must dispatch `KeyE` (interact), not `KeyF` (attack). The vehicle logic in `Vehicles.tsx` only listens to `keys.interact`.

## Store sync throttling in vehicles
`setPlayerPosition` is called at ~10 Hz from `Vehicles.tsx` (via a `syncTimer` ref), not every frame, to avoid 60 re-renders/second across all subscribers (MiniMap, socket, etc.).
