import { GAME_PHASES } from '../constants/phases.js';
import { placementPhase } from './phases/placement.js';
import { startGame } from './phases/startgame.js';
import { turnStart } from './phases/turnstart.js';
import { actionSelection } from './phases/actionselection.js';
import { movement } from './phases/movement.js';
import { attack } from './phases/attack.js';
import { effect } from './phases/effect.js';
import { turnEnd } from './phases/turnend.js';
import { applyOwnFighterPhaseCells, findFighter, getActivePlayer } from './rules/helpers.js';
import { TurnOrder } from '#boardgame/core';
import { pickPipelineTarget, submitPipelineInput } from './rules/pipeline.js';
import { runEvent } from './rules/events.js';
import { runMove } from './rules/moves.js';

const sharedMoves = {
  clearHighlights: playCtx => runMove('CLEAR_HIGHLIGHTS', playCtx),
  clearOwnSelection: playCtx => {
    const { G, ctx } = playCtx;
    runEvent(G, ctx, 'SELECT_OWN_FIGHTER', { clear: true });
  },
  selectOwnFighter: (playCtx, payload) => {
    const { G, ctx } = playCtx;
    if (G.outputVar && G.targetSelection?.kind === 'effect') {
      const fighter = findFighter(G, payload.fighterId);
      if (!fighter || fighter.hp <= 0) return 'INVALID_MOVE';
      if (!pickPipelineTarget(playCtx, payload.fighterId)) return 'INVALID_MOVE';
      runMove('LOG', { G, ctx }, { message: `Выбрана цель: ${fighter.name}` });
      return;
    }
    const player = getActivePlayer(G, ctx);
    const fighter = player.fighters.find(f => String(f.id) === String(payload.fighterId));
    if (!fighter || fighter.hp <= 0) return 'INVALID_MOVE';
    runEvent(G, ctx, 'SELECT_OWN_FIGHTER', { fighterId: payload.fighterId });
    applyOwnFighterPhaseCells(playCtx);
  },
  toggleActiveFighter: (playCtx, payload) => sharedMoves.selectOwnFighter(playCtx, payload),
  setVariables: (playCtx, payload) => submitPipelineInput(playCtx, payload) || 'INVALID_MOVE',
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
      pendingActions: [],
      winner: false,
      highlightCells: [],
      highlightFighters: [],
      targetSelection: null,
      vars: {},
      outputVar: null,
      pipeline: null,
    };
  },
  endIf: ({ G, ctx }) => {
    if (G.winner) {
      return { winner: G.winner };
    }
  },
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
    [GAME_PHASES.EFFECT]: createPhase(effect),
    [GAME_PHASES.TURN_END]: createPhase(turnEnd),
  },
};
