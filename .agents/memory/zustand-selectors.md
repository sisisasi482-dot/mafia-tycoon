---
name: Zustand selector rules
description: How to correctly subscribe to the Zustand store — and the infinite loop caused by wrong selector patterns
---

## The rule
Never return a new object from a `useGameStore` selector. It causes an infinite render loop.

**BAD — always triggers re-render (new {} !== {}):**
```ts
const { a, b } = useGameStore((s) => ({ a: s.a, b: s.b }));
```

**GOOD — primitives compare by value:**
```ts
const a = useGameStore((s) => s.a);
const b = useGameStore((s) => s.b);
```

**GOOD — non-reactive reads inside useFrame / event handlers:**
```ts
const state = useGameStore.getState();
```

**Why:** Zustand uses `Object.is` to compare selector results. A selector returning `{}` always creates a new reference, so the comparison always fails → re-render → new object → re-render → React hits its 50-update limit and throws "Maximum update depth exceeded".

**How to apply:**
- Any component with `useGameStore((s) => ({...}))` must be rewritten to individual primitive selectors.
- Hooks that only need to *read* inside a callback (saveGame, socket emit) should use `useGameStore.getState()` instead of subscribing at all.
- The broad `const store = useGameStore()` (no selector) subscribes to every store change — fine for small components, but should be avoided in components that mount many instances (like per-vehicle components).

## Files fixed
- `Vehicles.tsx` SingleVehicle — was the crash source; replaced with individual primitive selectors for `px`, `pz`, `inVehicle`, `equippedVehicleId`.
- `useSaveSystem.ts` — replaced full subscription with `screen`-only selector + `getState()` in saveGame/loadGame.
- `GameEngine.tsx` — replaced full subscription with specific selectors.
- `useSocket.ts` — replaced full subscription with `screen`/`username` selectors + `getState()` in connect handler.
