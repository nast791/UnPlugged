import { placementPhase } from './phases/placement';
import { turnStart } from './phases/turnstart';
import { actionSelection } from './phases/actionselection';
import { movement } from './phases/movement';
import { attack } from './phases/attack';
import { effect } from './phases/effect';
import { turnEnd } from './phases/turnend';
import { setFighterActive, resetAllFighters } from '#shared/utils/actions/utils';
import { TurnOrder } from 'boardgame.io/core';

const createPhase = (config) => ({
  ...config,
  turn: {
    order: TurnOrder.CONTINUE, 
    ...(config.turn || {})
  },
  moves: {
    setFighterActive,
    resetAllFighters,
    ...(config.moves || {})
  }
});

export const game = {
  setup: (ctx, setupData) => {
    return {
      id: setupData.id,
      players: setupData.players,
      map: setupData.map,
      selectedAction: null,
      selectedUnitId: null,
      selectedCardId: null,
      bonusValue: 0,
      bonusCardId: null,
      turn: 0,
      log: [],
      pendingActions: [],
      winner: false
    };
  },
  endIf: ({ G, ctx }) => {
    if (G.winner) {
      return { winner: G.winner };
    }
  },
  phases: {
    UNIT_PLACEMENT: {
      ...createPhase(placementPhase),
      start: true,
    },
    TURN_START: createPhase(turnStart),
    ACTION_SELECTION: createPhase(actionSelection),
    MOVEMENT: createPhase(movement),
    ATTACK: createPhase(attack),
    EFFECT: createPhase(effect),
    TURN_END: createPhase(turnEnd),
  },
};
