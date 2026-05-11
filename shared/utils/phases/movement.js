import { activePlayer, addLog, drawCards } from "#shared/utils/actions/utils";
import {applyBonus, moveFighter, resetPositions, updateMovementUI, confirmMovement, cancelBonus, getAvailableCells} from '#shared/utils/actions/movement';

export const movement = {
  onBegin: ({ G, ctx }) => {
    const player = activePlayer({ G, ctx });
    drawCards({ G, player, count: 1 });
    player.fighters.forEach(f => f.startPosition = f.position);
    G.bonusValue = 0;
    G.bonusCardId = null;
    updateMovementUI({G, ctx});
  },
  moves: {
    getAvailableCells: ({ G, ctx }, { fighterId }) => {
      return getAvailableCells({ G, ctx, fighterId });
    },
    applyBonus: ({ G, ctx }, cardId) => {
      return applyBonus({ G, ctx, cardId });
    },
    cancelBonus: ({ G, ctx }) => {
      return cancelBonus({ G, ctx });
    },
    moveFighter: ({ G, ctx }, { fighterId, targetId }) => {
      return moveFighter({ G, ctx, fighterId, targetId });
    },
    resetPositions: ({ G, ctx }) => {
      return resetPositions({G, ctx});
    },
    confirmMovement: ({ G, ctx, events }) => {
      return confirmMovement({ G, ctx, events });
    }
  },
  onEnd: ({ G, ctx, events }) => {
    const player = activePlayer({ G, ctx });
    player.actionsUsed++;

    if (player.actionsUsed >= player.actionsPoints) {
      addLog(G, `Действия игрока ${player.name} исчерпаны.`);
      events.setPhase('TURN_END');
    } else {
      events.setPhase('ACTION_SELECTION');
    }
  }
}