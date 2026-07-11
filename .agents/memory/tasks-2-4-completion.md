---
name: Tasks 2-4 completion
description: What was implemented for asset overhaul, economy/jobs, and crime/AI; key patterns and decisions.
---

## Features implemented

**Task 2 — Asset Overhaul & Population**
- Traffic.tsx: 8 AI vehicles on 8 predefined loop routes covering highway, City A/B boulevards, arterials. Uses simple waypoint lerp, SPEED=13 u/s.
- GLB6 furniture: Added `GlbFurniturePiece` optional field to `InteriorLayout`; `InteriorRoom.tsx` renders them via `FittedGLB` inside `<Suspense fallback={null}>`. House 1/2/3 have bed, chair, desk, bookcase, TV cabinet GLB models.
- police.ts: Added 3 CHECKPOINTS — highway-east (155,0), city-a-south (-310,-80), city-b-south (310,-80).
- ChildNPCs: Added 3 clusters (original park at 50/150, City A at -250/-30, City B at 350/80). Used CHILD_CLUSTERS array + flatMap; refs array sized to totalChildren = clusters × placements.

**Task 3 — Economy, Jobs & Inventory**
- Blur/dizzy: `GameEngine.tsx` reads `dizzyUntil`, uses `useEffect+setTimeout` pattern to toggle `isDizzy`; overlay uses `backdropFilter: blur(6px) saturate(1.6) hue-rotate(15deg)` as a pointer-events-none div with z-index 10.
- Job system: `activeJob`, `jobStartedAt`, `jobEarningsPerHour` in store. `startJob(jobId, rate)` / `endJob() → number` (earnings). Three outdoor NPC talkers: Bus Dispatcher (200,-18), Taxi Dispatcher (340,-18), Farm Manager (-390,-18). DialogueOption kind 'job' + `hourlyRate` field. Job NPC itemId ending '_end' signals collect-and-end; otherwise start shift.
- 'car' redeem code: `items.ts` has 'car' in REDEEM_CODES. In `redeemCode`, special-cased before the Nk match to give `car_key_renault` inventory item.
- Drug dealer: Outdoor NPC at (-355,140) near gang hideout. kind='drug_deal' gives player `reward` DA + triggers `triggerCrime(1)`.

**Task 4 — Housing, Crime & AI**
- House stash: `homeStash: Record<string, Record<string, number>>` in store. `stashItem(interiorId, itemId)` / `unstashItem`. `HomePanel` shows StashSection sub-component for HOME_IDS only; lists cigarettes/stimulants/food with Stash/Take buttons.
- Checkpoint license check: `CheckpointZone` now branches on `state.inVehicle`. In vehicle: checks `driving_license` in ownedAssetIds first (no license → crime 1 star), then contraband (→ crime 2 stars). On foot: original contraband check.
- Gang vehicle boarding: `GangFollowers.tsx` `Follower.useFrame` sets `groupRef.current.position.y = -50` when `state.inVehicle` and returns early. Followers reappear automatically when inVehicle becomes false (lerp resumes toward player).

## Key patterns / decisions
**Why backdropFilter for blur?** Preserves HUD sharpness (the overlay sits below z-index of HUD elements) while blurring the 3D canvas.
**Why `flatMap` for ChildNPCs clusters?** Avoids duplicating the child mesh JSX; refs array must be sized to total children (clusters × placements), not just one cluster's length.
**Why `endJob() → number` return value?** DialogueUI needs to display earnings inline in the response text; Zustand supports action return values just like `redeemCode` already did.
**Why store `hourlyRate` in DialogueOption not store?** Rate is NPC-specific data, not player state. Store only records `jobEarningsPerHour` set at shift start.
