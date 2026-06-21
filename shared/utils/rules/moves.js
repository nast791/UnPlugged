import { runEvent } from './events.js';
import { findFighter, findHandCard, findPlayerCard, getActivePlayer, getOwnPickedId, resolvePlayer } from './helpers.js';
import { runFact } from './facts.js';
import { pickPipelineCard, pickPipelineCell, pickPipelineOpponentPlayer, pickPipelineTarget, submitPipelineInput } from './pipeline.js';
import { ACTION_LABELS } from '../../constants/actions.js';

export const applyOwnFighterPhaseCells = ({ G, ctx }) => {
  const pickedId = getOwnPickedId(G);
  if (!pickedId) {
    G.highlightCells = [];
    return;
  }
  if (ctx.phase === 'UNIT_PLACEMENT') {
    G.highlightCells = runFact('PLACEMENT_CELLS', { fighterId: pickedId }, { G, ctx });
  } else if (ctx.phase === 'MOVEMENT') {
    G.highlightCells = runFact('MOVEMENT_CELLS', { fighterId: pickedId }, { G, ctx });
  }
};

export const runMove = (name, playCtx, params) => {
  const def = MOVES[name];
  if (!def) return null;
  return def.run(playCtx, params);
};

export const MOVES = {
  LOG: {
    run: (playCtx, params = {}) => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'LOG', { message: params.message, type: params.type || 'info' });
    },
  },
  END_PHASE: {
    run: playCtx => {
      const { G, events } = playCtx;
      G.pendingActions = [];
      events.endPhase();
    },
  },
  SELECT_ACTION: {
    run: (playCtx, params) => {
      const { G, ctx } = playCtx;
      const player = getActivePlayer(G, ctx);
      runMove('LOG', playCtx, {
        message: `${player.name} выбирает действие ${ACTION_LABELS[params.actionId]}`,
      });
      G.selectedAction = params.actionId;
      runMove('END_PHASE', playCtx);
    },
  },
  SET_VARIABLES: {
    run: (playCtx, params) => {
      const { G, ctx } = playCtx;
      const eventParams = params.vars
        ? params
        : { vars: [{ var: params.var, value: params.value }] };
      if (!eventParams.vars?.length || eventParams.vars.some(v => !v.var)) return false;
      runEvent(G, ctx, 'SET_VARIABLES', eventParams);
      G.pendingActions = [];
      G.outputVar = null;
      return true;
    },
  },
  CLEAR_HIGHLIGHTS: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'HIGHLIGHT_TARGETS');
    },
  },
  CLEAR_OWN_SELECTION: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'SELECT_TARGET', { clear: true });
      return true;
    },
  },
  SELECT_TARGET: {
    run: (playCtx, params = {}) => {
      const { G, ctx } = playCtx;
      const fighterId = params.fighterId ?? params;
      if (G.outputVar && G.targetSelection?.kind === 'target') {
        const fighter = findFighter(G, fighterId);
        if (!fighter || (fighter.currentHp ?? 0) <= 0) return false;
        if (!pickPipelineTarget(playCtx, fighterId)) return false;
        runMove('LOG', playCtx, { message: `Выбрана цель: ${fighter.name}` });
        return true;
      }
      const player = getActivePlayer(G, ctx);
      const fighter = player.fighters.find(f => String(f.id) === String(fighterId));
      if (!fighter || (fighter.currentHp ?? 0) <= 0) return false;
      runEvent(G, ctx, 'SELECT_TARGET', { fighterId });
      applyOwnFighterPhaseCells(playCtx);
      return true;
    },
  },
  SELECT_CARD: {
    run: (playCtx, params) => {
      const cardId = typeof params === 'object' ? params?.cardId : params;
      const { G, ctx } = playCtx;
      const ownerId = G.targetSelection?.playerId;
      if (!pickPipelineCard(playCtx, cardId)) return false;
      const player =
        ownerId != null
          ? resolvePlayer(G, ctx, { playerId: ownerId })
          : getActivePlayer(G, ctx);
      const found = findPlayerCard(player, G, cardId, ['hand', 'deck', 'revealed', 'discard']);
      if (found?.card) {
        runMove('LOG', playCtx, {
          message: `Выбрана карта: ${found.card.title || found.card.name}`,
        });
      }
      return true;
    },
  },
  SELECT_OPPONENT_PLAYER: {
    run: (playCtx, params) => {
      const playerId = typeof params === 'object' ? params?.playerId : params;
      const { G, ctx } = playCtx;
      if (!pickPipelineOpponentPlayer(playCtx, playerId)) return false;
      const player = resolvePlayer(G, ctx, { playerId });
      if (player) {
        runMove('LOG', playCtx, { message: `Выбран оппонент: ${player.name}` });
      }
      return true;
    },
  },
  SELECT_CELL: {
    run: (playCtx, params) => {
      const cellId = typeof params === 'object' ? params?.cellId ?? params?.targetId : params;
      return pickPipelineCell(playCtx, cellId);
    },
  },
  SUBMIT_PIPELINE_INPUT: {
    run: (playCtx, params) => submitPipelineInput(playCtx, params),
  },
  MOVE_CARDS: {
    run: (playCtx, params = {}) => {
      const { G, ctx } = playCtx;
      const { player, ...rest } = params;
      const eventParams = {
        ...rest,
        playerId: rest.playerId ?? player?.id,
      };
      return runEvent(G, ctx, 'MOVE_CARDS', { params: eventParams, raw: true }) ?? 0;
    },
  },
  CHECK_GAME_OVER: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'CHECK_GAME_OVER');
      return !!G.winner;
    },
  },
  REFRESH_MOVEMENT_UI: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      const player = getActivePlayer(G, ctx);
      const hasMoved = player.fighters.some(f => f.position !== f.startPosition);
      const actions = [];

      if (G.bonusCards?.length) {
        actions.push({ id: 'cancel-bonus', text: 'Отменить усиление', action: 'cancelBonus' });
      }
      if (hasMoved) {
        actions.push({ id: 'reset', text: 'Вернуть всех назад', action: 'resetPositions' });
      }
      actions.push({ id: 'confirm', text: 'Завершить движение', action: 'confirmMovement' });
      G.pendingActions = actions;
    },
  },
  APPLY_MOVEMENT_BONUS: {
    run: (playCtx, params) => {
      const { G, ctx } = playCtx;
      const player = getActivePlayer(G, ctx);
      const card = player.hand.find(c => c.id === params.cardId);
      if (!card || G.bonusCards?.length) return false;

      if (
        !runEvent(G, ctx, 'MOVE_CARDS', {
          params: {
            playerId: player.id,
            from: 'hand',
            targets: params.cardId,
            count: 1,
            to: 'discard',
            log: false,
          },
          raw: true,
        })
      ) {
        return false;
      }
      runEvent(G, ctx, 'ADD_BONUS', {
        params: { scope: 'movement', value: card.bonus || 0, cardId: params.cardId },
        raw: true,
      });
      runMove('LOG', playCtx, {
        message: `${player.name} сбрасывает карту и выбирает бонус движения +${G.bonus}`,
      });
      runMove('REFRESH_MOVEMENT_UI', playCtx);
      return true;
    },
  },
  CANCEL_MOVEMENT_BONUS: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      if (!G.bonusCards?.length) return false;

      const player = getActivePlayer(G, ctx);
      const lastBonusCardId = G.bonusCards[G.bonusCards.length - 1];
      const topDiscardCard = player.discard?.[player.discard.length - 1];
      if (!topDiscardCard || topDiscardCard.id !== lastBonusCardId) return false;

      if (
        !runEvent(G, ctx, 'MOVE_CARDS', {
          params: {
            playerId: player.id,
            from: 'discard',
            targets: lastBonusCardId,
            count: 1,
            to: 'hand',
            log: false,
          },
          raw: true,
        })
      ) {
        return false;
      }
      runEvent(G, ctx, 'ADD_BONUS', { params: { scope: 'movement', clear: true }, raw: true });
      runMove('CLEAR_HIGHLIGHTS', playCtx);
      runEvent(G, ctx, 'SELECT_TARGET', { clear: true });
      runEvent(G, ctx, 'RESET_FIGHTERS_POSITIONS', {
        params: { playerId: player.id, log: false },
        raw: true,
      });
      runMove('LOG', playCtx, {
        message: `${player.name} отменил бонус к движению. Карта вернулась в руку, позиции сброшены.`,
      });
      runMove('REFRESH_MOVEMENT_UI', playCtx);
      return true;
    },
  },
  RESET_MOVEMENT_POSITIONS: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      const player = getActivePlayer(G, ctx);
      runEvent(G, ctx, 'RESET_FIGHTERS_POSITIONS', { params: { playerId: player.id }, raw: true });
      runMove('REFRESH_MOVEMENT_UI', playCtx);
      return true;
    },
  },
  MOVE_FIGHTER: {
    run: (playCtx, params) => {
      const { G, ctx } = playCtx;
      const cellId = params.cellId ?? params.targetId;
      if (
        !runEvent(G, ctx, 'MOVE_FIGHTER', {
          params: { fighterId: params.fighterId, cellId, validate: true },
          raw: true,
        })
      ) {
        return false;
      }
      runMove('REFRESH_MOVEMENT_UI', playCtx);
      return true;
    },
  },
  CONFIRM_MOVEMENT: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'ADD_BONUS', { params: { scope: 'movement', clear: true }, raw: true });
      runMove('END_PHASE', playCtx);
      return true;
    },
  },
  REFRESH_PLACEMENT_UI: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      const player = getActivePlayer(G, ctx);
      const isDone = player.fighters.every(f => f.position !== null);
      if (isDone && player.type === 'human') {
        G.pendingActions = [
          {
            id: 'placement-finish',
            text: 'Завершить расстановку',
            action: 'finishUnitPlacement',
          },
        ];
      } else {
        G.pendingActions = [];
      }
    },
  },
  PLACE_FIGHTER: {
    run: (playCtx, params) => {
      const { G, ctx } = playCtx;
      const fighterId = params.fighterId ?? params.unitId;
      const cellId = params.cellId ?? params.circleId;
      if (!runFact('CAN_PLACE_FIGHTER', { fighterId, cellId }, { G, ctx })) return false;
      if (
        !runEvent(G, ctx, 'SET_FIGHTER_POSITION', {
          params: { fighterId, cellId, setStartPosition: true },
          raw: true,
        })
      ) {
        return false;
      }
      runMove('REFRESH_PLACEMENT_UI', playCtx);
      return true;
    },
  },
  FINISH_PLACEMENT: {
    run: playCtx => {
      const { G, ctx, events } = playCtx;
      const player = getActivePlayer(G, ctx);
      G.pendingActions = [];
      runMove('LOG', playCtx, { message: `Игрок ${player.name} завершил расстановку` });
      events.endTurn();
      return true;
    },
  },
  AUTO_PLACE_AI: {
    run: playCtx => {
      const { G, ctx, events } = playCtx;
      const player = getActivePlayer(G, ctx);
      const context = { G, ctx };

      const hero = player.fighters.find(f => f.type === 'hero');
      if (hero) {
        const points = runFact('PLACEMENT_CELLS', { fighterId: hero.id }, context);
        if (points.hero?.length > 0) {
          runEvent(G, ctx, 'SET_FIGHTER_POSITION', {
            params: {
              fighterId: hero.id,
              cellId: points.hero[0],
              setStartPosition: true,
              log: false,
            },
            raw: true,
          });
        }
      }

      player.fighters
        .filter(f => f.type === 'assistant')
        .forEach(assistant => {
          const points = runFact('PLACEMENT_CELLS', { fighterId: assistant.id }, context);
          if (points.assistant?.length > 0) {
            const cellId = points.assistant[Math.floor(Math.random() * points.assistant.length)];
            runEvent(G, ctx, 'SET_FIGHTER_POSITION', {
              params: {
                fighterId: assistant.id,
                cellId,
                setStartPosition: true,
                log: false,
              },
              raw: true,
            });
          }
        });

      runMove('LOG', playCtx, { message: `Игрок ${player.name} завершил расстановку` });
      events.endTurn();
      return true;
    },
  },
};
