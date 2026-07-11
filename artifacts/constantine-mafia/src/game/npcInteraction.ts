/**
 * Shared NPC-talker interaction logic — used by both the proximity [E] key
 * flow (Player.tsx) and click-to-interact (NPCs.tsx ShopkeeperNPCs). Keeping
 * this in one place avoids re-implementing the shop/heal/dialogue/quiz
 * branches twice.
 */
import { useGameStore } from './useGameStore';
import { NPC_TALKERS } from './interiors';
import { DRIVING_LICENSE_ID } from './items';

type NpcTalkerT = typeof NPC_TALKERS[number];

/** Runs the NPC's action immediately (open shop panel, heal, dialogue, or quiz). */
export function triggerNpcInteraction(npc: NpcTalkerT): void {
  const gs = useGameStore.getState();

  if (npc.shopType === 'hospital') {
    if (gs.health < 100) gs.healPlayer(100);
    return;
  }
  if (npc.shopType) {
    // Cast: shopNpcTab's type predates the 'hotel' shopType (see Player.tsx's
    // equivalent (nearNpc as any).shopType usage) — ShopPanel handles it fine.
    gs.setPlayerState({ isPaused: true, activePanel: 'shop', shopNpcTab: npc.shopType as any });
    return;
  }
  if (npc.options && npc.options.length > 0) {
    gs.setDialogueNpc(npc.id);
    return;
  }
  if (npc.quiz) {
    if (!gs.ownedAssetIds.includes(DRIVING_LICENSE_ID)) {
      gs.setPlayerState({ isPaused: true, activePanel: 'license_quiz' });
    }
    return;
  }
  // Fallback — no shop/options/quiz configured, nothing to open.
}
