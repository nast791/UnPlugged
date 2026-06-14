import { runMove } from './moves.js';
import { runEvent } from './events.js';
import { FACTS } from './facts.js';
import { GAME_PHASES } from '../../constants/phases.js';
import {
  matchConditions,
  matchCondition,
  storeReturn,
  resolveReturn,
} from './runtime.js';

const evalFactCondition = (c, context, G) => {
  const def = FACTS[c.fact];
  if (!def) return false;
  const result = def.run(c.params ?? {}, context);
  storeReturn(G, resolveReturn(c.return, def.return), result);
  if (c.check) return matchCondition(c.check, G.vars);
  if (typeof result === 'boolean') return result;
  return true;
};

const evaluateTriggerConditions = (conditions, G, ctx, combatContext = {}) => {
  if (!conditions) return true;
  const context = { G, ctx, combatContext };

  const evalOne = c => {
    if (c.fact) return evalFactCondition(c, context, G);
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

export const advancePipeline = playCtx => {
  const { G } = playCtx;
  if (!G.pipeline) return;
  if (!G.pipeline.done) G.pipeline.done = new Set();
  let loop = true;
  while (loop) {
    loop = false;
    let ran = false;
    for (let i = 0; i < G.pipeline.actions.length; i++) {
      const step = G.pipeline.actions[i];
      const stepKey = step.id ?? i;
      if (G.pipeline.done.has(stepKey)) continue;
      if (!matchConditions(step.conditions, G.vars)) continue;
      const result = runEvent(G, playCtx.ctx, step.type, {
        params: step.params,
        return: step.return,
      });
      if (result.status === 'pending') return;
      ran = true;
      G.pipeline.done.add(stepKey);
      if (step.end) {
        finishPipeline(playCtx);
        return;
      }
      loop = true;
      break;
    }
    if (!ran) finishPipeline(playCtx);
  }
};

export const continueFlow = playCtx => {
  if (playCtx.G.pipeline) advancePipeline(playCtx);
};

export const pickPipelineTarget = (playCtx, fighterId) => {
  const { G, ctx } = playCtx;
  const sel = G.targetSelection;
  if (!sel || sel.kind !== 'effect' || G.outputVar !== sel.returnKey) return false;
  if (sel.picked.length >= sel.selection) return false;

  const id = String(fighterId);
  if (!sel.candidates.map(String).includes(id)) return false;
  if (sel.picked.map(String).includes(id)) return false;

  sel.picked.push(id);
  storeReturn(G, sel.returnKey, [...sel.picked]);

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

export const submitPipelineInput = (playCtx, payload) => {
  if (!runMove('SET_VARIABLES', playCtx, payload)) return false;
  continueFlow(playCtx);
  return true;
};

export const startPipeline = (G, ctx, events, actions, id) => {
  if (!G.vars) G.vars = {};
  G.pipeline = { actions, id, events };
  advancePipeline({ G, ctx, events });
};

export function evaluateTrigger(triggerName, hook, G, ctx, combatContext = {}) {
  if (!hook || hook.trigger !== triggerName) return null;

  runEvent(G, ctx, 'REMOVE_VARIABLES');
  runEvent(G, ctx, 'HIGHLIGHT_TARGETS');
  G.pendingActions = [];
  G.outputVar = null;

  const passed = evaluateTriggerConditions(hook.conditions, G, ctx, combatContext);
  return passed ? hook : null;
}
