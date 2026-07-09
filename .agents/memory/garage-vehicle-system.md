---
name: Garage vehicle storage system
description: How the garage park/retrieve system works and the known vehicle ID split between world spawns and shop purchases.
---

# Garage Vehicle Storage

## State shape
`garageStoredVehicles: Record<string, string[]>` in `useGameStore` maps `garageId → vehicleId[]`.
Actions: `storeVehicleInGarage(garageId, vehicleId)`, `retrieveVehicleFromGarage(garageId, vehicleId)`.

## UI location
`artifacts/constantine-mafia/src/ui/HomePanel.tsx` — renders a second row when `interiorId` is in `GARAGE_IDS`.
`canStore` = has equipped vehicle AND it's not already in this garage's stored list.

## Known vehicle ID split (root cause of follow-up tasks #2–#4)
- World vehicles use instance IDs `v1`–`v5`; NOT in `ownedAssetIds`; added to `stolenVehicleIds` on entry.
- Shop vehicles use product IDs `renault`/`kangoo`/`bmw`/`moto`/`police_car`; added to `ownedAssetIds` on purchase.
- There is NO shared canonical definition. Ownership checks using `ownedAssetIds.includes(equippedVehicleId)` fail for world vehicles.
- Current garage: allows parking ANY equipped vehicle (including stolen). This is intentional for gameplay but lacks police consequences.

**Why:** The two systems were built independently; unifying them requires a shared vehicle definition list and a spawning system for purchased vehicles.

**How to apply:** Any feature touching vehicle ownership, parking, or police contraband detection must account for both ID spaces until the unification task is done.
