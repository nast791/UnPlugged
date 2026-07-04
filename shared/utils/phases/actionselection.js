import { runMove, buildActionSelectionPending } from '../rules/moves.js';
import { refreshCardUI } from '../rules/helpers.js';
import { INVALID_MOVE } from '#boardgame/core';

export const actionSelection = {
  next: ({ G }) => G.selectedAction.toUpperCase(),

  onBegin: ({ G, ctx }) => {
    G.selectedAction = null;
    G.pendingActions = buildActionSelectionPending(G, ctx);
    refreshCardUI(G, ctx);
  },

  moves: {
    selectAction: (playCtx, actionId) => {
      if (runMove('SELECT_ACTION', playCtx, { actionId }) === false) return INVALID_MOVE;
    },
  },
};
