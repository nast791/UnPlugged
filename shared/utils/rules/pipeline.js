import { runMove } from './moves.js';
import { runEvent } from './events.js';
import { FACTS } from './facts.js';
import {
  isOpponentCardEffectSuppressed,
  getActivePlayer,
  filterHandCards,
  getCardPlayableFighters,
  getHandCardId,
  cardMatchesPhase,
} from './helpers.js';
import { EFFECT_TRIGGERS } from '../../constants/triggers.js';
import { GAME_PHASES } from '../../constants/phases.js';
import { isEmpty } from '../../constants/operators.js';
import {
  matchCondition,
  storeReturn,
  resolveReturn,
  resolveVariables,
} from './runtime.js';

const evalFactCondition = (c, context, G) => {
  const def = FACTS[c.fact];
  if (!def) return false;
  const result = def.run(resolveVariables(c.params ?? {}, G.vars), context);
  const returnKey = resolveReturn(c.return, def.return);
  if (returnKey != null && result !== undefined) {
    storeReturn(G, returnKey, result);
  }
  if (c.check) return matchCondition(c.check, G.vars);
  if (result == null) return false;
  if (typeof result === 'boolean') return c.return ? true : result;
  return true;
};

const evaluateConditions = (conditions, G, ctx, combatContext = {}) => {
  if (!conditions) return true;
  const context = { G, ctx, combatContext };

  const evalOne = c => {
    if (c.fact) return evalFactCondition(c, context, G);
    if (c.all) return c.all.every(evalOne);
    if (c.or) return c.or.some(evalOne);
    return matchCondition(c, G.vars);
  };

  if (conditions.all) {
    for (const c of conditions.all) {
      if (!evalOne(c)) return false;
    }
    return true;
  }
  if (conditions.or) {
    for (const c of conditions.or) {
      if (evalOne(c)) return true;
    }
    return false;
  }
  return true;
};

const clearPipelineState = playCtx => {
  const { G, ctx } = playCtx;
  runEvent(G, ctx, 'REMOVE_VARIABLES');
  G.pendingActions = [];
  G.outputVar = null;
  G.targetSelection = null;
  runEvent(G, ctx, 'HIGHLIGHT_TARGETS');
};

export const finishPipeline = playCtx => {
  clearPipelineState(playCtx);
  playCtx.G.pipeline = null;
  if (playCtx.ctx?.phase !== GAME_PHASES.TURN_END) {
    runMove('END_PHASE', playCtx);
  }
};

const INPUT_TYPES = new Set([
  'PROMPT',
  'SELECT_TARGET',
  'SELECT_CELL',
  'SELECT_CARDS',
  'SELECT_OPPONENT_PLAYER',
]);

/** Меньше = раньше среди шагов с одинаковой «готовностью». */
const TYPE_PRIORITY = {
  SET_VARIABLES: 10,
  TOGGLE_STATE_ITEMS: 20,
  DAMAGE_FIGHTERS: 25,
  HEAL_FIGHTERS: 25,
  MOVE_FIGHTER: 25,
  RESURRECT_FIGHTERS: 25,
  GRANT_ACTIONS: 30,
  ADD_BONUS: 30,
  SELECT_CARDS: 32,
  SELECT_OPPONENT_PLAYER: 31,
  MOVE_CARDS: 38,
  PUSH_FIGHTERS: 40,
  RELOOP_PIPELINE: 50,
  IGNORE_CARD_TEXT: 50,
  LOG: 100,
};

const countConditions = conditions => {
  if (!conditions) return 0;
  if (conditions.all) return conditions.all.reduce((n, c) => n + countConditions(c), 0);
  if (conditions.or) return 1;
  if (conditions.fact || conditions.var) return 1;
  return 0;
};

/** Шаг ждёт ввод игрока (return-переменная ещё пуста). */
const isAwaitingInput = step => {
  if (!step.return) return false;
  const returnVar = step.return;
  const walk = conds => {
    if (!conds) return false;
    if (conds.all) return conds.all.some(walk);
    if (conds.or) return conds.or.some(walk);
    return conds.var === returnVar && conds.operator === 'isEmpty';
  };
  return walk(step.conditions);
};

const getStepTier = step => {
  if (INPUT_TYPES.has(step.type) && isAwaitingInput(step)) return 0;
  return 1;
};

export const getStepKey = (step, index) => step.id ?? index;

const normalizeDone = done => {
  if (!done) return [];
  if (Array.isArray(done)) return done;
  return [...done];
};

export const listEligibleSteps = (actions, done, G, ctx, requireStart) =>
  actions
    .map((step, index) => ({ step, index, key: getStepKey(step, index) }))
    .filter(({ step, key }) => {
      if (normalizeDone(done).includes(key)) return false;
      if (requireStart && !step.start) return false;
      return evaluateConditions(step.conditions, G, ctx);
    });

/** Следующий шаг pipeline: порядок из условий, не из JSON. */
export const pickNextPipelineStep = (actions, done, G, ctx, requireStart) => {
  const eligible = listEligibleSteps(actions, done, G, ctx, requireStart);
  if (!eligible.length) return null;

  const nonEnd = eligible.filter(e => !e.step.end);
  const pool = nonEnd.length ? nonEnd : eligible;

  return [...pool].sort((a, b) => {
    const tierA = getStepTier(a.step);
    const tierB = getStepTier(b.step);
    if (tierA !== tierB) return tierA - tierB;

    const condA = countConditions(a.step.conditions);
    const condB = countConditions(b.step.conditions);
    if (condA !== condB) return condB - condA;

    const priA = TYPE_PRIORITY[a.step.type] ?? 50;
    const priB = TYPE_PRIORITY[b.step.type] ?? 50;
    if (priA !== priB) return priA - priB;

    return a.index - b.index;
  })[0];
};

/** До первого шага pipeline начинается только с action.start === true. */
export const shouldRequireStartStep = (actions, pipeline) => {
  if (pipeline.started) return false;
  return actions.some(step => step.start);
};

export const advancePipeline = playCtx => {
  const { G } = playCtx;
  if (!G.pipeline) return;
  if (!G.pipeline.done) G.pipeline.done = [];
  else if (!Array.isArray(G.pipeline.done)) G.pipeline.done = [...G.pipeline.done];
  if (G.pipeline.started == null) G.pipeline.started = false;
  const { actions, done } = G.pipeline;
  let loop = true;
  while (loop) {
    loop = false;
    const requireStart = shouldRequireStartStep(actions, G.pipeline);
    const next = pickNextPipelineStep(actions, done, G, playCtx.ctx, requireStart);
    if (!next) {
      finishPipeline(playCtx);
      return;
    }

    const { step, key: stepKey } = next;
    const result = runEvent(G, playCtx.ctx, step.type, {
      params:
        step.type === 'LOG' ? { audience: 'private', ...step.params } : step.params,
      return: step.return,
    });
    G.pipeline.started = true;
    if (result.status === 'pending') return;

    done.push(stepKey);
    if (step.end) {
      finishPipeline(playCtx);
      return;
    }
    loop = true;
  }
};

export const continueFlow = playCtx => {
  if (playCtx.G.pipeline) advancePipeline(playCtx);
};

export const pickPipelineTarget = (playCtx, fighterId) => {
  const { G, ctx } = playCtx;
  const sel = G.targetSelection;
  if (!sel || sel.kind !== 'target' || G.outputVar !== sel.returnKey) return false;
  if (sel.picked.length >= sel.selection) return false;

  const id = String(fighterId);
  if (!sel.candidates.map(String).includes(id)) return false;
  if (sel.picked.map(String).includes(id)) return false;

  sel.picked.push(id);
  storeReturn(G, sel.returnKey, sel.selection === 1 ? id : [...sel.picked]);

  if (sel.picked.length >= sel.selection) {
    runEvent(G, ctx, 'HIGHLIGHT_TARGETS');
    G.targetSelection = null;
    G.outputVar = null;
    continueFlow(playCtx);
    return true;
  }

  const picked = new Set(sel.picked.map(String));
  const remaining = sel.candidates.filter(cid => !picked.has(String(cid)));
  runEvent(G, ctx, 'HIGHLIGHT_TARGETS', { targets: remaining });
  return true;
};

export const pickPipelineCell = (playCtx, cellId) => {
  const { G, ctx } = playCtx;
  const sel = G.targetSelection;
  if (!sel || sel.kind !== 'cell' || G.outputVar !== sel.returnKey) return false;

  const id = String(cellId);
  if (!sel.candidates.map(String).includes(id)) return false;
  if (!isEmpty(G.vars?.[sel.returnKey])) return false;

  storeReturn(G, sel.returnKey, id);

  G.targetSelection = null;
  G.outputVar = null;
  G.highlightCells = [];
  continueFlow(playCtx);
  return true;
};

export const pickPipelineCard = (playCtx, cardId) => {
  const { G, ctx } = playCtx;
  const sel = G.targetSelection;
  if (
    !sel ||
    (sel.kind !== 'card' && sel.kind !== 'hand' && sel.kind !== 'revealed') ||
    G.outputVar !== sel.returnKey
  ) {
    return false;
  }

  const id = String(cardId);
  if (!sel.candidates.map(String).includes(id)) return false;

  if (sel.selection === 1) {
    if (!isEmpty(G.vars?.[sel.returnKey])) return false;
    storeReturn(G, sel.returnKey, id);
  } else {
    if (sel.picked.length >= sel.selection) return false;
    if (sel.picked.map(String).includes(id)) return false;
    sel.picked.push(id);
    storeReturn(G, sel.returnKey, [...sel.picked]);
  }

  const val = G.vars[sel.returnKey];
  const done =
    sel.selection === 1
      ? !isEmpty(val)
      : (Array.isArray(val) ? val.length : 0) >= sel.selection;

  if (done) {
    G.targetSelection = null;
    G.outputVar = null;
    continueFlow(playCtx);
    runMove('REFRESH_CARD_UI', playCtx);
  }
  return true;
};

export const pickPipelineOpponentPlayer = (playCtx, playerId) => {
  const { G, ctx } = playCtx;
  const sel = G.targetSelection;
  if (!sel || sel.kind !== 'opponent' || G.outputVar !== sel.returnKey) return false;

  const id = String(playerId);
  if (!sel.candidates.map(String).includes(id)) return false;
  if (!isEmpty(G.vars?.[sel.returnKey])) return false;

  storeReturn(G, sel.returnKey, id);
  G.targetSelection = null;
  G.outputVar = null;
  continueFlow(playCtx);
  return true;
};

export const submitPipelineInput = (playCtx, payload) => {
  if (runMove('SET_VARIABLES', playCtx, payload) === false) return false;
  continueFlow(playCtx);
};

export const startPipeline = (G, ctx, events, actions, id) => {
  if (!G.vars) G.vars = {};
  G.pipeline = { actions, id, started: false };
  G.selectedUnitId = null;
  if (G.targetSelection?.kind === 'own') {
    G.targetSelection = null;
    G.highlightCells = [];
  }
  advancePipeline({ G, ctx, events });
};

/** Проверка conditions триггера без сброса pipeline / pendingActions. */
export const checkTriggerConditions = (hook, G, ctx, combatContext = {}) => {
  if (!hook) return false;
  if (!hook.conditions) return true;
  return evaluateConditions(hook.conditions, G, ctx, combatContext);
};

/** Можно ли сыграть карту эффекта с учётом бойца на поле и conditions instant-триггера. */
export const canPlayEffectCard = (card, G, ctx) => {
  const player = getActivePlayer(G, ctx);
  if (!player || !card || card.type !== 'effect') return false;
  if (!cardMatchesPhase(card, 'EFFECT')) return false;
  if (isOpponentCardEffectSuppressed(G, ctx, player.id)) return false;

  const playableFighters = getCardPlayableFighters(card, G, ctx);
  if (!playableFighters.length) return false;

  const hook = (card.triggers ?? []).find(t => t.trigger === EFFECT_TRIGGERS.INSTANT);
  if (!hook) return false;

  const declared = card.role ?? card.fighter;
  const fighterId =
    declared && declared !== 'any'
      ? String(declared)
      : String(playableFighters[0].id);

  const savedCombat = G.combat;
  const savedVars = G.vars;
  G.combat = {
    attackerPlayerId: String(player.id),
    attackerId: fighterId,
    cardId: getHandCardId(card),
    card: {
      id: card.id,
      type: card.type,
      fighter: card.fighter ?? card.role,
      bonus: card.bonus,
      phase: card.phase,
      value: card.value,
    },
  };
  G.vars = { ...(savedVars ?? {}) };

  const ok = checkTriggerConditions(hook, G, ctx, { trigger: EFFECT_TRIGGERS.INSTANT });

  G.combat = savedCombat;
  G.vars = savedVars;
  return ok;
};

export const getPlayableEffectCardIds = (G, ctx) => {
  const player = getActivePlayer(G, ctx);
  if (!player?.hand?.length) return [];
  return filterHandCards(player, { types: ['effect'], phase: 'EFFECT' }, { G, ctx })
    .filter(card => canPlayEffectCard(card, G, ctx))
    .map(getHandCardId);
};

export function evaluateTrigger(triggerName, hook, G, ctx, combatContext = {}) {
  if (!hook || hook.trigger !== triggerName) return null;

  runEvent(G, ctx, 'REMOVE_VARIABLES');
  runEvent(G, ctx, 'HIGHLIGHT_TARGETS');
  G.pendingActions = [];
  G.outputVar = null;

  const passed = evaluateConditions(hook.conditions, G, ctx, {
    ...combatContext,
    trigger: triggerName,
  });
  return passed ? hook : null;
}

/** Триггер карты; учитывает подавление текстовых эффектов оппонента. */
export function evaluateCardTrigger(triggerName, hook, G, ctx, cardOwnerId, combatContext = {}) {
  if (isOpponentCardEffectSuppressed(G, ctx, cardOwnerId)) return null;
  return evaluateTrigger(triggerName, hook, G, ctx, combatContext);
}
