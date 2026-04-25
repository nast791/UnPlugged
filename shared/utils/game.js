import { placementPhase } from './phases/placement';

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
    setFighterActive: (G, ctx, { fighterId, active }) => {
      const player = G.players[ctx.currentPlayer];
      const fighter = player.fighters.find(f => f.id === fighterId);
      if (fighter) {
        fighter.active = active;
      }
    },
    resetAllFighters: (G, ctx) => {
      G.players[ctx.currentPlayer].fighters.forEach(f => (f.active = false));
    },
  },
  phases: {
    UNIT_PLACEMENT: {
      ...placementPhase,
      start: true,
    },
  },
};
