---
name: Staged/proximity-based object loading in R3F
description: Pattern for streaming world objects in/out by distance without disposing meshes, and pitfalls with module-singleton pools across remounts.
---

Pattern: never mount all world objects upfront. Mount only those within a shared radius of spawn; stream in new ones (capped per frame) as the player approaches; once mounted, never unmount — only toggle `.visible`. Keeps collision-critical systems (e.g. building AABBs) and generic decorative props (trees/signs/benches/houses) on the same rule via one shared radius/batch-size constant.

**Why:** avoids full-map mount cost, keeps memory bounded, and per-frame batch caps prevent freezes when crossing into a dense area.

**Gotcha — module-singleton pools + remount race:** if the unlock/active state lives in module-level arrays (not React state) and a component reads them directly during render, a remount (e.g. re-entering an outdoor scene after an interior) can render one frame off *stale* data from the previous mount before the reset-effect runs (effects run after render). Fix: gate the render on a local `initialized` state flag that only flips true once the reset+seed effect has actually executed, not just on the raw mask array.

**Gotcha — reset points:** any store transition that remounts the streamed scene (new game, load game, respawn after game-over, retry) must reset the "loading complete" flag alongside position/health resets, or a loading overlay tied to that flag will be skipped on second entry.
