/**
 * DialogueUI — shown when an NPC talker with multiple dialogue options is approached.
 * Handles buy / info / conflict / shop / job / drug_deal interactions.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/useGameStore';
import { NPC_TALKERS, type DialogueOption } from '../game/interiors';

const WEAPON_IDS = new Set(['knife', 'pistol', 'shotgun', 'smg', 'rifle']);

/** Job base IDs (without _end suffix) */
const JOB_NAMES: Record<string, string> = {
  bus_driver:  'Bus Driver',
  taxi_driver: 'Taxi Driver',
  farmer:      'Farmer',
};

export function DialogueUI() {
  const store  = useGameStore();
  const npcId  = store.dialogueNpcId;
  const npc    = npcId ? NPC_TALKERS.find((n) => n.id === npcId) : null;

  const [response, setResponse] = useState<string | null>(null);

  if (!npc) return null;

  const handleOption = (opt: DialogueOption) => {
    if (opt.kind === 'buy') {
      if (opt.cost && store.money < opt.cost) {
        setResponse("You don't have enough money for that.");
        return;
      }
      const newOwnedAssets = opt.itemId && !store.ownedAssetIds.includes(opt.itemId)
        ? [...store.ownedAssetIds, opt.itemId]
        : store.ownedAssetIds;
      const newWeapon = opt.itemId && WEAPON_IDS.has(opt.itemId)
        ? opt.itemId
        : store.equippedWeaponId;
      store.setPlayerState({
        money:           opt.cost ? store.money - opt.cost : store.money,
        ownedAssetIds:   newOwnedAssets,
        equippedWeaponId: newWeapon,
      });
      setResponse(opt.responseText);

    } else if (opt.kind === 'conflict') {
      store.triggerCrime(1);
      store.damagePlayer(5);
      setResponse(opt.responseText);

    } else if (opt.kind === 'drug_deal') {
      // Give player the reward money and trigger wanted level
      if (opt.reward) {
        store.setPlayerState({ money: store.money + opt.reward });
      }
      store.triggerCrime(1);
      setResponse(opt.responseText);

    } else if (opt.kind === 'job') {
      // itemId ending in '_end' means "collect pay and end shift"
      const isEndAction = opt.itemId?.endsWith('_end');
      const baseJobId   = isEndAction ? opt.itemId!.slice(0, -4) : (opt.itemId ?? '');

      if (isEndAction) {
        // Collect pay and end job
        const earnings = store.endJob();
        if (earnings > 0) {
          setResponse(`${opt.responseText} You earned ${earnings.toLocaleString()} DA!`);
        } else {
          setResponse("You haven't started a shift yet — talk to me to begin working.");
        }
      } else {
        // Start a new shift
        if (store.activeJob && store.activeJob !== baseJobId) {
          setResponse(`You're already working as a ${JOB_NAMES[store.activeJob] ?? store.activeJob}. End that shift first.`);
        } else if (store.activeJob === baseJobId) {
          // Already on this job — collect early
          const earnings = store.endJob();
          setResponse(`Shift ended early. You earned ${earnings.toLocaleString()} DA.`);
        } else {
          store.startJob(baseJobId, opt.hourlyRate ?? 1000);
          setResponse(opt.responseText);
        }
      }

    } else {
      // info / shop — just display response
      setResponse(opt.responseText);
    }
  };

  const close = () => {
    setResponse(null);
    store.setDialogueNpc(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="dialogue"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.18 }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[min(92vw,440px)] z-40"
        style={{ pointerEvents: 'all' }}
      >
        <div className="bg-black/92 backdrop-blur-md border border-white/12 rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-primary font-black text-xs uppercase tracking-[0.15em]">
              {npc.label}
            </h4>
            <button
              onClick={close}
              className="text-gray-500 hover:text-white transition text-sm leading-none"
            >
              ✕
            </button>
          </div>

          {/* Dialogue text */}
          <p className="text-white/90 text-sm italic leading-relaxed">
            {response ?? npc.dialogue}
          </p>

          {/* Option buttons (before selection) */}
          {!response && npc.options && (
            <div className="flex flex-col gap-2 pt-1">
              {npc.options.map((opt) => {
                const canAfford = !opt.cost || store.money >= opt.cost;
                const btnClass =
                  opt.kind === 'conflict'
                    ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                    : opt.kind === 'buy'
                    ? canAfford
                      ? 'border-primary/40 text-primary hover:bg-primary/10'
                      : 'border-gray-700 text-gray-600 cursor-not-allowed'
                    : 'border-white/12 text-gray-300 hover:bg-white/5';

                return (
                  <button
                    key={opt.id}
                    disabled={opt.kind === 'buy' && !canAfford}
                    onClick={() => handleOption(opt)}
                    className={`text-left text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${btnClass}`}
                  >
                    {opt.label}
                    {opt.cost ? (
                      <span className="ml-2 opacity-70 font-mono">
                        {opt.cost.toLocaleString()} DA
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {/* Close button (after selection) */}
          {response && (
            <button
              onClick={close}
              className="w-full py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
