import { runMove } from '../rules/moves.js';
import { getActivePlayer } from '../rules/helpers.js';
import { EFFECT_TRIGGERS } from '../../constants/triggers.js';
import { getSkillHooks, getHookActions } from '../skills/registry.js';
import { evaluateTrigger, startPipeline } from '../rules/pipeline.js';

export const runHeroSkills = (
  { G, ctx, events },
  trigger,
  { playerId, pendingOnly = false } = {},
) => {
  const ownerId = playerId ?? ctx.currentPlayer;
  const ownerCtx = { ...ctx, currentPlayer: ownerId };

  for (const { skill, hook } of getSkillHooks(G, trigger, ownerId)) {
    if (!evaluateTrigger(trigger, hook, G, ownerCtx)) continue;

    const actions = getHookActions(hook);
    if (actions?.length) {
      startPipeline(G, ownerCtx, events, actions, skill.id);
      return pendingOnly ? G.pipeline !== null : true;
    }
  }
  return false;
};

export const runAllHeroSkills = ({ G, ctx, events }, trigger) => {
  for (let i = 0; i < G.players.length; i++) {
    if (runHeroSkills({ G, ctx, events }, trigger, { playerId: String(i), pendingOnly: true })) {
      return true;
    }
  }
  return false;
};

export const turnStart = {
  next: 'ACTION_SELECTION',
  turn: {
    onBegin: ({ G, ctx, events }) => {
      const player = getActivePlayer(G, ctx);
      const isHeroAlive = player.fighters.some(f => f.type === 'hero' && f.hp > 0);
      if (!isHeroAlive) return events.endTurn();
    },
  },
  onBegin: ({ G, ctx, events }) => {
    const player = getActivePlayer(G, ctx);
    const isHeroAlive = player.fighters.some(f => f.type === 'hero' && f.hp > 0);
    if (!isHeroAlive) return;

    G.turn++;
    player.actionsUsed = 0;
    player.actionsPoints = 2;
    player.fighters.forEach(f => {
      f.startPosition = f.position;
    });
    G.targetSelection = null;

    if (!runHeroSkills({ G, ctx, events }, EFFECT_TRIGGERS.START_TURN)) {
      runMove('END_PHASE', { G, events });
    }
  },
  onEnd: ({ G, ctx }) => {
    const player = getActivePlayer(G, ctx);
    const round = Math.floor(G.turn / G.players.length) + 1;
    runMove('LOG', { G, ctx }, { message: `Ход игрока: ${player.name} (Раунд ${round})` });
  },
};
