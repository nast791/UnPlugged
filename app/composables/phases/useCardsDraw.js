import { useGameStore } from '~/store/game.js';
import { storeToRefs } from 'pinia';
import { useLogger } from '~/composables/game/useLogger';

export const useCardsDraw = () => {
  const store = useGameStore();
  const { activePlayer } = storeToRefs(store);
  const { addLog } = useLogger();

  const runCardsDraw = (count = 1, playerObj = null) => {
    const player = playerObj || activePlayer.value;

    for (let i = 0; i < count; i++) {
      if (player.deck.length > 0) {
        const card = player.deck.pop(); 
        player.hand.push(card);
        addLog(`${player.name} добирает карту`, 'info');
      } else {
        return store.goToPhase('EXHAUSTION');
      }
    }
    if (store.selectedAction === 'movement') {
      return store.goToPhase('MOVEMENT');
    }
  }

  return {runCardsDraw};
}