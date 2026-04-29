import { activePlayer, addLog, drawCards, discardSelected } from "#shared/utils/actions/utils";
import { INVALID_MOVE } from 'boardgame.io/core';

export const turnEnd = {
  next: 'TURN_START', 
  onBegin: ({ G, ctx, events }) => {
    const player = activePlayer({ G, ctx });

    player.fighters.forEach(f => {
      f.bonusMovement = 0;
      f.canPassThroughEnemies = false;
    });

    const minSize = player.hero?.minHandSize || 0;
    if (player.hand.length < minSize) {
      const count = minSize - player.hand.length;
      addLog(G, `${player.name}: добор до ${minSize} карт.`);
      drawCards({ G, player, count });
    }

    const maxHand = player.hero?.maxHandSize || 7;
    if (player.hand.length <= maxHand) {
      events.endTurn();
    } else {
      const count = player.hand.length - maxHand;
      G.pendingActions = [{
        id: 'hand-limit-discard',
        text: `Сбросить лишние (${count})`,
        action: 'confirmDiscard',
        payload: { count }
      }];
    }
  },
  moves: {
    confirmDiscard: ({ G, ctx, events }, { count }) => {
      const player = activePlayer({ G, ctx });
      const selected = player.hand.filter(c => c.isSelected);

      if (selected.length !== count) {
        addLog(G, `Не выбрано ${count} карт для сброса`, 'danger');
        return INVALID_MOVE; 
      }
      discardSelected({ G, player });
      events.endTurn();
    }
  }
}