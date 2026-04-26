import { placementPhase } from './phases/placement';
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
      timer: 0,
      log: [],
      pendingActions: []
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
      moves: {
        ...moves
      },
    }
  },
};
