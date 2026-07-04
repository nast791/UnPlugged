import { runMove } from '../rules/moves.js';
import { getActivePlayer } from '../rules/helpers.js';
import { INVALID_MOVE } from '#boardgame/core';
import { EFFECT_TRIGGERS } from '../../constants/triggers.js';
import { runHeroSkills } from './turnstart.js';

export const turnEnd = {
  next: 'TURN_START',
  turn: {
    onBegin: ({ G, ctx, events }) => {
      return events.endTurn();
    },
    onEnd: ({ G, ctx, events }) => {
      return runMove('END_PHASE', { G, events });
    },
  },
  onBegin: ({ G, ctx, events }) => {
    G.selectedAction = null;
    const player = getActivePlayer(G, ctx);

    player.fighters.forEach(f => {
      f.bonusMovement = 0;
      f.canPassThroughEnemies = false;
    });

    if (runHeroSkills({ G, ctx, events }, EFFECT_TRIGGERS.END_TURN, { pendingOnly: true })) {
      return;
    }

    const minSize = player.hero?.minHandSize || 0;
    if (player.hand.length < minSize) {
      const count = minSize - player.hand.length;
      runMove('LOG', { G, ctx }, { message: `${player.name}: добор до ${minSize} карт.` });
      runMove('MOVE_CARDS', { G, ctx }, { player, count, from: 'deck', fromPosition: 'top', to: 'hand' });
    }

    const maxHand = player.hero?.maxHandSize || 7;
    if (player.hand.length > maxHand) {
      const count = player.hand.length - maxHand;
      G.pendingActions = [
        {
          id: 'hand-limit-discard',
          text: `Сбросить лишние (${count})`,
          action: 'confirmDiscard',
          payload: { count },
        },
      ];
    }
  },
  moves: {
    confirmDiscard: ({ G, ctx, events }, { count }) => {
      const player = getActivePlayer(G, ctx);
      const selected = player.hand.filter(c => c.isSelected);

      if (selected.length !== count) {
        runMove('LOG', { G, ctx }, {
          message: `Не выбрано ${count} карт для сброса`,
          type: 'danger',
          audience: 'private',
        });
        return INVALID_MOVE;
      }
      runMove('MOVE_CARDS', { G, ctx }, { player, from: 'selected', count, to: 'discard' });
      G.pendingActions = [];
    },
  },
};
