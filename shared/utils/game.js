import { GAME_PHASES } from '../constants/phases.js';
import { placementPhase } from './phases/placement.js';
import { startGame } from './phases/startgame.js';
import { turnStart } from './phases/turnstart.js';
import { actionSelection } from './phases/actionselection.js';
import { movement } from './phases/movement.js';
import { attack } from './phases/attack.js';
import { defense } from './phases/defense.js';
import { effect } from './phases/effect.js';
import { turnEnd } from './phases/turnend.js';
import { TurnOrder, INVALID_MOVE } from '#boardgame/core';
import { runMove } from './rules/moves.js';
import { applyPlayerView } from './rules/logging.js';

const asMove = (name, mapPayload) => (playCtx, payload) => {
  const params = mapPayload ? mapPayload(payload) : payload;
  if (runMove(name, playCtx, params) === false) return INVALID_MOVE;
};

const sharedMoves = {
  clearHighlights: asMove('CLEAR_HIGHLIGHTS'),
  clearOwnSelection: asMove('CLEAR_OWN_SELECTION'),
  selectTarget: asMove('SELECT_TARGET'),
  selectCard: asMove('SELECT_CARD'),
  selectHandCard: asMove('SELECT_CARD'),
  selectRevealedCard: asMove('SELECT_CARD'),
  selectOpponentPlayer: asMove('SELECT_OPPONENT_PLAYER'),
  selectCell: asMove('SELECT_CELL'),
  setVariables: asMove('SUBMIT_PIPELINE_INPUT'),
  confirmZoneView: asMove('DISMISS_ZONE_VIEW'),
  cancelAction: asMove('CANCEL_ACTION'),
};

const createPhase = config => ({
  ...config,
  turn: {
    order: TurnOrder.CONTINUE,
    ...(config.turn || {}),
  },
  moves: {
    ...sharedMoves,
    ...(config.moves || {}),
  },
});

export const game = {
  setup: (ctx, setupData) => {
    return {
      id: setupData.id,
      players: setupData.players ?? [],
      map: setupData.map,
      selectedAction: null,
      selectedUnitId: null,
      selectedCardId: null,
      bonus: 0,
      bonusCards: [],
      turn: 0,
      log: [],
      privateLog: [],
      logSeq: 0,
      pendingActions: [],
      winner: false,
      highlightCells: [],
      highlightFighters: [],
      recentDamage: [],
      targetSelection: null,
      vars: {},
      outputVar: null,
      pipeline: null,
      zoneVisibilityGrants: [],
      cardZoneUI: {},
      cardZoneCounts: {},
      handCardUI: { selectableIds: null, disabledIds: [] },
    };
  },
  endIf: ({ G, ctx }) => {
    if (G.winner) {
      return { winner: G.winner };
    }
  },
  playerView: ({ G, ctx, playerID }) => applyPlayerView(G, ctx, playerID),
  phases: {
    [GAME_PHASES.UNIT_PLACEMENT]: {
      ...createPhase(placementPhase),
      start: true,
    },
    [GAME_PHASES.START_GAME]: createPhase(startGame),
    [GAME_PHASES.TURN_START]: createPhase(turnStart),
    [GAME_PHASES.ACTION_SELECTION]: createPhase(actionSelection),
    [GAME_PHASES.MOVEMENT]: createPhase(movement),
    [GAME_PHASES.ATTACK]: createPhase(attack),
    [GAME_PHASES.DEFENSE]: createPhase(defense),
    [GAME_PHASES.EFFECT]: createPhase(effect),
    [GAME_PHASES.TURN_END]: createPhase(turnEnd),
  },
};
