---
name: Gang/Bank heist integration
description: Where gang follower spawn data lives and how it must stay in sync; how heist payout ties to crew size.
---

- Gang hideout spawn coordinates are duplicated in two places that must be kept in sync manually: `NPCs.tsx` `SPAWNS` (type: 'gang') and `GangFollowers.tsx` `GANG_SPAWNS`. There is no shared constant — if you move one, move the other.
- **Why this matters:** the hideout was previously placed outside the player movement clamp (`Player.tsx` clamps x:[-455,455] z:[-205,205]), making the recruit feature unreachable. Always check new/edited spawn coordinates against that clamp (and against `cityLayout.ts` City A/B bounds for terrain) before trusting a spawn position is reachable.
- Bank heist payout (`useGameStore.startHeist`) scales with `gangMemberIds.length` (+15,000 DA per recruited member) as the intended gang↔heist synergy; gang cover-fire during the resulting pursuit already works for free via the shared `pursuitActive && wantedLevel > 0` condition in `GangFollowers.tsx`.
