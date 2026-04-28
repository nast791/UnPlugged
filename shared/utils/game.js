import { placementPhase } from './phases/placement';
import { turnStart } from './phases/turnstart';
import { actionSelection } from './phases/actionselection';
import { moves } from '#shared/utils/moves';

export const game = {
  setup: (ctx, setupData) => {
    return {
      id: setupData.id,
      players: setupData.players,
      map: setupData.map,
      selectedAction: null,
      selectedUnitId: null,
      selectedCardId: null,
      bonusMovement: 0,
      bonusMovementCardId: null,
      turn: 0,
      log: [],
      pendingActions: [],
      isPhaseEnd: false,
    };
  },
  moves: {
    ...moves,
  },
  phases: {
    UNIT_PLACEMENT: {
      ...placementPhase,
      moves: {
        ...placementPhase.moves, ...moves
      },
      start: true,
    },
    TURN_START: {
      ...turnStart,
      moves: {
        ...turnStart.moves, ...moves
      },
    },
    ACTION_SELECTION: {
      ...actionSelection,
      moves: {
        ...actionSelection.moves, ...moves
      },
    }
  },
};
