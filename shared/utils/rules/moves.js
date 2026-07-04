import { runEvent } from './events.js';
import {
  findFighter,
  findHandCard,
  findPlayerCard,
  getActivePlayer,
  getHandCardId,
  getCardPlayableFighters,
  getOwnPickedId,
  resolvePlayer,
} from './helpers.js';
import { runFact } from './facts.js';
import {
  evaluateTrigger,
  getPlayableEffectCardIds,
  pickPipelineCard,
  pickPipelineCell,
  pickPipelineOpponentPlayer,
  pickPipelineTarget,
  startPipeline,
  submitPipelineInput,
} from './pipeline.js';
import { ACTION_LABELS } from '../../constants/actions.js';
import { EFFECT_TRIGGERS } from '../../constants/triggers.js';
import { GAME_PHASES } from '../../constants/phases.js';
import { getAction } from '../../constants/actions.js';
import { revokeZoneVisibility } from './events.js';
import {
  refreshCardUI,
  mergePendingActions,
  getPendingZoneConfirmActions,
  canCancelAction,
  resetActionSelectionState,
} from './helpers.js';

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

export const buildActionSelectionPending = (G, ctx) => {
  const context = { G, ctx };
  const actions = [toPendingAction('movement')];
  if (runFact('CAN_PLAYER_ATTACK', {}, context)) {
    actions.push(toPendingAction('attack'));
  }
  if (getPlayableEffectCardIds(G, ctx).length) {
    actions.push(toPendingAction('effect'));
  }
  return actions;
};

const buildMovementPendingActions = (G, ctx) => {
  const player = getActivePlayer(G, ctx);
  const hasMoved = player.fighters.some(f => f.position !== f.startPosition);
  const actions = [];

  if (G.bonusCards?.length) {
    actions.push({ id: 'cancel-bonus', text: 'Отменить усиление', action: 'cancelBonus' });
  }
  if (hasMoved) {
    actions.push({ id: 'reset', text: 'Вернуть всех назад', action: 'resetPositions' });
  }
  if (canCancelAction(G, ctx)) {
    actions.push({ id: 'cancel-action', text: 'Отмена', action: 'cancelAction' });
  }
  actions.push({ id: 'confirm', text: 'Завершить движение', action: 'confirmMovement' });
  return actions;
};

const buildEffectPendingActions = (G, ctx) => {
  if (G.pipeline || G.combat?.cardId) return [];
  const actions = [];
  if (canCancelAction(G, ctx)) {
    actions.push({ id: 'cancel-action', text: 'Отмена', action: 'cancelAction' });
  }
  return actions;
};

const buildPlacementPendingActions = (G, ctx) => {
  const player = getActivePlayer(G, ctx);
  const isDone = player.fighters.every(f => f.position !== null);
  if (isDone && player.type === 'human') {
    return [
      {
        id: 'placement-finish',
        text: 'Завершить расстановку',
        action: 'finishUnitPlacement',
      },
    ];
  }
  return [];
};

const refreshPhasePending = playCtx => {
  const { G, ctx } = playCtx;
  let phaseActions = [];

  if (ctx.phase === GAME_PHASES.MOVEMENT) {
    phaseActions = buildMovementPendingActions(G, ctx);
  } else if (ctx.phase === GAME_PHASES.EFFECT) {
    phaseActions = buildEffectPendingActions(G, ctx);
  } else if (ctx.phase === GAME_PHASES.UNIT_PLACEMENT) {
    phaseActions = buildPlacementPendingActions(G, ctx);
  }

  mergePendingActions(G, phaseActions, getPendingZoneConfirmActions(G));
};

export const MOVES = {
  LOG: {
    run: (playCtx, params = {}) => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'LOG', {
        message: params.message,
        type: params.type || 'info',
        audience: params.audience,
        playerId: params.playerId,
      });
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
        audience: 'private',
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
    },
  },
  SELECT_TARGET: {
    run: (playCtx, params = {}) => {
      const { G, ctx } = playCtx;
      const fighterId = params.fighterId ?? params;
      const sel = G.targetSelection;

      if (sel?.kind === 'target' && sel.returnKey) {
        const id = String(fighterId);
        if (!sel.candidates.map(String).includes(id)) return false;

        const fighter = findFighter(G, fighterId);
        if (!fighter || (fighter.currentHp ?? 0) <= 0) return false;

        if (!G.outputVar) G.outputVar = sel.returnKey;
        if (G.outputVar !== sel.returnKey) return false;
        if (!pickPipelineTarget(playCtx, fighterId)) return false;

        runMove('LOG', playCtx, { message: `Выбрана цель: ${fighter.name}`, audience: 'private' });
        return;
      }

      if (G.pipeline && sel?.kind && sel.kind !== 'own') return false;

      const player = getActivePlayer(G, ctx);
      const fighter = player.fighters.find(f => String(f.id) === String(fighterId));
      if (!fighter || (fighter.currentHp ?? 0) <= 0) return false;
      runEvent(G, ctx, 'SELECT_TARGET', { fighterId });
      applyOwnFighterPhaseCells(playCtx);
    },
  },
  SELECT_CARD: {
    run: (playCtx, params) => {
      const cardId = typeof params === 'object' ? params?.cardId : params;
      const { G, ctx } = playCtx;
      const ownerId = G.targetSelection?.playerId;
      const isEffectPhasePick =
        ctx.phase === GAME_PHASES.EFFECT && !G.pipeline && G.targetSelection?.kind === 'card';

      if (!pickPipelineCard(playCtx, cardId)) return false;

      if (isEffectPhasePick) {
        if (runMove('PLAY_EFFECT_CARD', playCtx, { cardId }) === false) return false;
        return;
      }

      runMove('REFRESH_CARD_UI', playCtx);

      const player =
        ownerId != null
          ? resolvePlayer(G, ctx, { playerId: ownerId })
          : getActivePlayer(G, ctx);
      const found = findPlayerCard(player, G, cardId, ['hand', 'deck', 'revealed', 'discard']);
      if (found?.card) {
        runMove('LOG', playCtx, {
          message: `Выбрана карта: ${found.card.title || found.card.name}`,
          audience: 'private',
        });
      }
    },
  },
  PLAY_EFFECT_CARD: {
    run: (playCtx, params) => {
      const { G, ctx, events } = playCtx;
      const cardId = String(params?.cardId ?? params);
      const player = getActivePlayer(G, ctx);

      const candidates = getPlayableEffectCardIds(G, ctx);
      if (!candidates.map(String).includes(cardId)) return false;

      const card = findHandCard(player, cardId);
      if (!card) return false;

      const hook =
        (card.triggers ?? []).find(t => t.trigger === EFFECT_TRIGGERS.INSTANT) ?? card.triggers?.[0];
      if (!hook) return false;

      const declared = card.role ?? card.fighter;
      const playableFighters = getCardPlayableFighters(card, G, ctx);
      const fighterId =
        declared && declared !== 'any'
          ? String(declared)
          : playableFighters[0]?.id != null
            ? String(playableFighters[0].id)
            : null;
      if (!fighterId) return false;

      const cardRef = getHandCardId(card);
      G.selectedCardId = cardRef;
      G.combat = {
        attackerPlayerId: String(player.id),
        attackerId: fighterId,
        cardId: cardRef,
        card: {
          id: card.id,
          type: card.type,
          fighter: card.fighter ?? card.role,
          bonus: card.bonus,
          phase: card.phase,
          value: card.value,
        },
      };

      if (
        !runEvent(G, ctx, 'MOVE_CARDS', {
          params: {
            playerId: player.id,
            from: 'hand',
            targets: cardRef,
            count: 1,
            to: 'discard',
            log: false,
          },
          raw: true,
        })
      ) {
        G.combat = null;
        G.selectedCardId = null;
        return false;
      }

      runMove('LOG', playCtx, {
        message: `${player.name} разыгрывает карту: ${card.title || card.name || card.id}`,
      });

      if (!evaluateTrigger(EFFECT_TRIGGERS.INSTANT, hook, G, ctx)) {
        runMove('END_PHASE', playCtx);
        return;
      }

      const actions = hook.actions ?? hook.event?.params?.actions ?? [];
      if (actions.length) {
        startPipeline(G, ctx, events, actions, card.id);
      } else {
        runMove('END_PHASE', playCtx);
      }
    },
  },
  SELECT_OPPONENT_PLAYER: {
    run: (playCtx, params) => {
      const playerId = typeof params === 'object' ? params?.playerId : params;
      const { G, ctx } = playCtx;
      if (!pickPipelineOpponentPlayer(playCtx, playerId)) return false;
      const player = resolvePlayer(G, ctx, { playerId });
      if (player) {
        runMove('LOG', playCtx, { message: `Выбран оппонент: ${player.name}`, audience: 'private' });
      }
    },
  },
  SELECT_CELL: {
    run: (playCtx, params) => {
      const { G } = playCtx;
      const cellId = typeof params === 'object' ? params?.cellId ?? params?.targetId : params;
      const sel = G.targetSelection;
      if (!sel || sel.kind !== 'cell' || !sel.returnKey) return false;

      if (!G.outputVar) G.outputVar = sel.returnKey;
      if (G.outputVar !== sel.returnKey) return false;
      if (pickPipelineCell(playCtx, cellId) === false) return false;
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
      runEvent(G, ctx, 'MOVE_CARDS', { params: eventParams, raw: true });
    },
  },
  CHECK_GAME_OVER: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'CHECK_GAME_OVER');
    },
  },
  REFRESH_CARD_UI: {
    run: (playCtx, params = {}) => {
      const { G, ctx } = playCtx;
      refreshCardUI(G, ctx, {
        zones: params.zones !== false,
        hand: params.hand !== false,
      });
      if (params.pending !== false) refreshPhasePending(playCtx);
    },
  },
  DISMISS_ZONE_VIEW: {
    run: (playCtx, params) => {
      const { G, ctx } = playCtx;
      const grantId = params?.grantId ?? params?.payload?.grantId ?? params;
      if (!grantId) return false;

      revokeZoneVisibility(G, ctx, { grantId });
      runMove('REFRESH_CARD_UI', playCtx);
    },
  },
  CANCEL_ACTION: {
    run: playCtx => {
      const { G, ctx, events } = playCtx;
      if (!canCancelAction(G, ctx)) return false;

      resetActionSelectionState(G, ctx);
      events.setPhase(GAME_PHASES.ACTION_SELECTION);
      G.pendingActions = buildActionSelectionPending(G, ctx);
      runMove('REFRESH_CARD_UI', playCtx, { pending: false });
    },
  },
  REFRESH_MOVEMENT_UI: {
    run: playCtx => runMove('REFRESH_CARD_UI', playCtx),
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
      runMove('REFRESH_CARD_UI', playCtx);
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
      runMove('REFRESH_CARD_UI', playCtx);
    },
  },
  RESET_MOVEMENT_POSITIONS: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      const player = getActivePlayer(G, ctx);
      runEvent(G, ctx, 'RESET_FIGHTERS_POSITIONS', { params: { playerId: player.id }, raw: true });
      runMove('REFRESH_CARD_UI', playCtx);
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
      runMove('REFRESH_CARD_UI', playCtx);
    },
  },
  CONFIRM_MOVEMENT: {
    run: playCtx => {
      const { G, ctx } = playCtx;
      runEvent(G, ctx, 'ADD_BONUS', { params: { scope: 'movement', clear: true }, raw: true });
      runMove('END_PHASE', playCtx);
    },
  },
  REFRESH_PLACEMENT_UI: {
    run: playCtx => runMove('REFRESH_CARD_UI', playCtx),
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
    },
  },
  FINISH_PLACEMENT: {
    run: playCtx => {
      const { G, ctx, events } = playCtx;
      const player = getActivePlayer(G, ctx);
      G.pendingActions = [];
      runMove('LOG', playCtx, { message: `Игрок ${player.name} завершил расстановку` });
      events.endTurn();
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
    },
  },
};
