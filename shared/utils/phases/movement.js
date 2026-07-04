import { runMove } from '../rules/moves.js';
import { runFact } from '../rules/facts.js';
import { getActivePlayer } from '../rules/helpers.js';
import { INVALID_MOVE } from '#boardgame/core';

export const movement = {
  onBegin: ({ G, ctx }) => {
    const player = getActivePlayer(G, ctx);
    runMove('MOVE_CARDS', { G, ctx }, { player, count: 1, from: 'deck', fromPosition: 'top', to: 'hand' });
    player.fighters.forEach(f => (f.startPosition = f.position));
    G.bonus = 0;
    G.bonusCards = [];
    runMove('LOG', { G, ctx }, {
      message: 'Выберите карту для усиления или перемещайте бойцов',
      audience: 'private',
    });
    runMove('REFRESH_CARD_UI', { G, ctx });
  },
  moves: {
    getAvailableCells: ({ G, ctx }, { fighterId }) => {
      G.highlightCells = runFact('MOVEMENT_CELLS', { fighterId }, { G, ctx });
    },
    applyBonus: (playCtx, cardId) => {
      if (runMove('APPLY_MOVEMENT_BONUS', playCtx, { cardId }) === false) return INVALID_MOVE;
    },
    cancelBonus: playCtx => {
      if (runMove('CANCEL_MOVEMENT_BONUS', playCtx) === false) return INVALID_MOVE;
    },
    moveFighter: (playCtx, { fighterId, targetId }) => {
      if (runMove('MOVE_FIGHTER', playCtx, { fighterId, targetId }) === false) return INVALID_MOVE;
    },
    resetPositions: playCtx => {
      runMove('RESET_MOVEMENT_POSITIONS', playCtx);
    },
    confirmMovement: playCtx => {
      if (runMove('CONFIRM_MOVEMENT', playCtx) === false) return INVALID_MOVE;
    },
  },
  onEnd: ({ G, ctx }) => {
    const player = getActivePlayer(G, ctx);
    player.actionsUsed++;
    if (player.actionsUsed >= player.actionsPoints) {
      runMove('LOG', { G, ctx }, { message: `Действия игрока ${player.name} исчерпаны.` });
    }
  },
  next: ({ G, ctx }) => {
    const player = getActivePlayer(G, ctx);
    if (player.actionsUsed >= player.actionsPoints) {
      return 'TURN_END';
    }
    return 'ACTION_SELECTION';
  },
};
