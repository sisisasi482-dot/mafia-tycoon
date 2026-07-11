---
name: Interiors data layout
description: What's in interiors.ts — room IDs, door trigger positions, NPC vendor positions, and field contracts.
---

# interiors.ts data layout

## Interior rooms (INTERIORS)
All rooms placed at centerX ≥ 800 (far east, never visible from cities).

| id             | centerX | label                     | exitOffsetZ |
|----------------|---------|---------------------------|-------------|
| weapons_shop   | 800     | Black Market Armory       | 6           |
| convenience    | 820     | Corner Store              | 5           |
| safehouse_cv   | 840     | Centre-Ville Safehouse    | 5           |
| garage_am      | 860     | Ali Mendjeli Garage       | 8           |
| bar_old_city   | 880     | Café Constantine          | 5.5         |
| hospital       | 900     | City Hospital             | 7           |

## Door triggers (DOOR_TRIGGERS)
All placed in boulevard zone (z ∈ [−35, 35]):

| id                | worldX | worldZ | interiorId      |
|-------------------|--------|--------|-----------------|
| door-weapons-shop | 240    | 28     | weapons_shop    |
| door-safehouse-cv | 270    | −26    | safehouse_cv    |
| door-hospital     | 360    | 26     | hospital        |
| door-convenience  | 60     | −24    | convenience     |
| door-garage-am    | −220   | 26     | garage_am       |
| door-bar          | −300   | −25    | bar_old_city    |

## NPC vendors (NPC_TALKERS)
Placed 4–5 units in front of corresponding door (toward z=0):

| id                   | worldX | worldZ | shopType    |
|----------------------|--------|--------|-------------|
| npc-weapons-dealer   | 240    | 23     | weapons     |
| npc-ammo-vendor      | 325    | −26    | ammo        |
| npc-store-clerk      | 60     | −20    | consumables |
| npc-car-dealer       | −220   | 21     | vehicles    |
| npc-doctor           | 360    | 21     | hospital    |
| npc-bar-owner        | −300   | −20    | (dialogue)  |

## Field contracts
- InteriorLayout: `id, label, centerX, centerZ, roomW, roomH, roomD, furniture[], lightColor, lightIntensity, floorColor, wallColor, exitOffsetX, exitOffsetZ`
- DoorTrigger: `id, label, worldX, worldZ, radius, interiorId, color, propertyId?, propertyType?`
- NpcTalker: `id, label, worldX, worldZ, radius, dialogue, options?, shopType?`
- FurniturePiece: `pos, size, color, roughness?, metalness?, emissive?, emissiveIntensity?`

**Why:** exitOffsetZ must equal roomD/2 for the exit marker to align with the front-wall door gap in InteriorRoom.tsx.
