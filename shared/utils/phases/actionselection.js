import { activePlayer, addLog } from '#shared/utils/actions/utils';
import { updateAvailableActions, selectAction } from '#shared/utils/actions/actionselection';

export const actionSelection = {
  onBegin: ({ G, ctx }) => {
    G.selectedAction = null;
    updateAvailableActions({ G, ctx });
  },
  moves: {
    selectAction: ({ G, ctx, events }, actionId) => {
      return selectAction({ G, ctx, events }, actionId);
    },
  },
  turn: {
    onEnd: ({ G }) => {
      G.pendingActions = [];
    },
  },
};
