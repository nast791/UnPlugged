import { runFact } from '../rules/facts.js';
import { runMove } from '../rules/moves.js';
import { getAction } from '../../constants/actions.js';

const toPendingAction = id => {
  const action = getAction(id);
  return {
    id: action.id,
    text: action.name,
    desc: action.desc,
    color: action.color,
    action: 'selectAction',
    payload: action.id,
  };
};

export const actionSelection = {
  next: ({ G }) => G.selectedAction.toUpperCase(),
  onBegin: ({ G, ctx }) => {
    G.selectedAction = null;
    const context = { G, ctx };
    const actions = [toPendingAction('movement')];
    if (runFact('CAN_PLAYER_ATTACK', {}, context)) {
      actions.push(toPendingAction('attack'));
    }
    if (runFact('CARDS_IN_HAND', { types: ['effect'], phase: 'EFFECT' }, context).length) {
      actions.push(toPendingAction('effect'));
    }
    G.pendingActions = actions;
  },
  moves: {
    selectAction: (playCtx, actionId) => runMove('SELECT_ACTION', playCtx, { actionId }),
  },
};
