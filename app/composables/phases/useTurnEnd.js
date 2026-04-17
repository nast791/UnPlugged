import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';
import { useDeck } from '~/composables/game/useDeck';

export const useTurnEnd = () => {
  const store = useGameStore();
  const { activePlayer } = storeToRefs(store);
  const { drawCards, confirmDiscard } = useDeck();
  const { addLog, addActions } = useLogger();

  const runTurnEnd = () => {
    if (!activePlayer.value) return;

    checkMinimumHand();

    activePlayer.value.fighters.forEach(f => {
      f.bonusMovement = 0; 
      f.canPassThroughEnemies = false;
    });

    checkMaximumHand();
  };

  const checkMinimumHand = () => {
    const player = activePlayer.value;
    const minSize = player.hero?.minHandSize || 0;
    
    if (player.hand.length < minSize) {
      const count = minSize - player.hand.length;
      addLog(`${player.name}: добор до ${minSize} карт.`, 'info');
      drawCards(count); 
    }
  };

  const checkMaximumHand = () => {
    const player = activePlayer.value;
    const maxHand = player.hero?.maxHandSize || 7;

    if (player.hand.length > maxHand) {
      const count = player.hand.length - maxHand;
      addActions(
        'hand-limit-discard', 
        `Превышен лимит карт! Выберите и сбросьте лишние: ${count}`, 
        [
          { 
            text: 'Подтвердить сброс', 
            action: () => {
              const selectedCount = player.hand.filter(c => c.isReversed).length;
              if (selectedCount === count) {
                confirmDiscard('TURN_START');
              } else {
                addLog(`Нужно выбрать ровно ${count} карт(ы)!`, 'danger');
              }
            } 
          }
        ]
      );
    } else {
      store.goToPhase('TURN_START');
    }
  };

  return { runTurnEnd };
}