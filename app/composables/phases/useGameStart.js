import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';

export const useGameStart = () => {
  const store = useGameStore();
  const { addLog } = useLogger();

  const runGameStart = () => {
    addLog('Все бойцы на позициях. Битва начинается!', 'info');
    store.turn = 0;
    store.round = 1;
    store.activePlayerIndex = 0;
    store.goToPhase('TURN_START');
  };

  return { runGameStart };
};