import { useEffect, useRef } from 'react';
import { useGameStore } from './useGameStore';

const SAVE_KEY = 'constantine_mafia_save';

export function useSaveSystem() {
  const store = useGameStore();
  const lastSavedRef = useRef<number>(Date.now());
  
  const saveGame = () => {
    const saveState = {
      playerId: store.playerId,
      username: store.username,
      money: store.money,
      level: store.level,
      xp: store.xp,
      careerPath: store.careerPath,
      ownedAssetIds: store.ownedAssetIds,
      completedMissionIds: store.completedMissionIds,
      equippedVehicleId: store.equippedVehicleId,
      district: store.district,
      language: store.language,
      graphicsQuality: store.graphicsQuality,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
    lastSavedRef.current = Date.now();
    return true;
  };
  
  const loadGame = () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        store.setPlayerState({
          ...parsed,
          screen: 'playing',
          health: 100, // heal on load
          wantedLevel: 0, // clear wanted level on load
          playerPosition: [-125, 1, 0], // respawn point
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to load game', e);
    }
    return false;
  };
  
  const hasSaveGame = () => {
    return localStorage.getItem(SAVE_KEY) !== null;
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (store.screen !== 'playing') return;
    
    const interval = setInterval(() => {
      saveGame();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [store.screen, store.playerId, store.money, store.xp]);
  
  return { saveGame, loadGame, hasSaveGame };
}
